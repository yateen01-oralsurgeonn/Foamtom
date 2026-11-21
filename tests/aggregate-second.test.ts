import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { aggregateSecond } from '../src/tracking/aggregate-second';
import { MIN_FRAMES_PER_SECOND, MOVE_JITTER_STEP, MOVING_MIN_TRAVEL } from '../src/tracking/thresholds';
import type { FrameResult } from '../src/tracking/types';

// ---------- helpers (hand-written, local to this file) ----------

const SIDES = ['left', 'right', 'unknown'] as const;
const LEVELS = ['upper', 'lower', 'unknown'] as const;

const noFace: FrameResult = { faceSeen: false, handNearMouth: false, side: 'unknown', level: 'unknown', handRel: null };
const away: FrameResult = { faceSeen: true, handNearMouth: false, side: 'unknown', level: 'unknown', handRel: null };

function near(
  side: FrameResult['side'],
  level: FrameResult['level'],
  handRel: { x: number; y: number } | null = { x: 0.3, y: 0.3 },
): FrameResult {
  return { faceSeen: true, handNearMouth: true, side, level, handRel };
}

function repeat<T>(item: T, count: number): T[] {
  return Array.from({ length: count }, () => item);
}

const frameArb: fc.Arbitrary<FrameResult> = fc
  .record({
    faceSeen: fc.boolean(),
    handNearMouth: fc.boolean(),
    side: fc.constantFrom(...SIDES),
    level: fc.constantFrom(...LEVELS),
    x: fc.double({ min: -1, max: 1, noNaN: true }),
    y: fc.double({ min: -1, max: 1, noNaN: true }),
  })
  .map(({ faceSeen, handNearMouth, side, level, x, y }) =>
    handNearMouth
      ? { faceSeen, handNearMouth, side, level, handRel: { x, y } }
      : { faceSeen, handNearMouth, side: 'unknown' as const, level: 'unknown' as const, handRel: null },
  );

const framesArb = fc.array(frameArb, { minLength: 0, maxLength: 40 });

/** A list of near frames whose handRel follows the given points. */
function path(points: { x: number; y: number }[]): FrameResult[] {
  return points.map((p) => near('left', 'upper', p));
}

// ---------- design test 8 ----------

describe('aggregateNullRules', () => {
  it('fewer than 5 frames gives null', () => {
    fc.assert(
      fc.property(fc.array(frameArb, { maxLength: MIN_FRAMES_PER_SECOND - 1 }), (frames) => {
        expect(aggregateSecond(frames)).toBeNull();
      }),
    );
  });

  it('a face seen in fewer than half of the frames gives null', () => {
    fc.assert(
      fc.property(fc.integer({ min: 5, max: 30 }), fc.nat(), (n, k) => {
        const seen = k % Math.ceil(n / 2); // always below n / 2
        const frames = [...repeat(away, seen), ...repeat(noFace, n - seen)];
        expect(seen * 2).toBeLessThan(n);
        expect(aggregateSecond(frames)).toBeNull();
      }),
    );
  });

  it('a face seen in exactly half of the frames is enough', () => {
    const frames = [...repeat(away, 3), ...repeat(noFace, 3)];
    expect(aggregateSecond(frames)).not.toBeNull();
  });

  it('otherwise never null', () => {
    fc.assert(
      fc.property(framesArb, (frames) => {
        const n = frames.length;
        const seen = frames.filter((f) => f.faceSeen).length;
        const result = aggregateSecond(frames);
        if (n < MIN_FRAMES_PER_SECOND || seen * 2 < n) expect(result).toBeNull();
        else expect(result).not.toBeNull();
      }),
    );
  });
});

// ---------- design test 9 ----------

describe('aggregateMajority', () => {
  it('handNearMouth is the strict majority of all frames', () => {
    fc.assert(
      fc.property(framesArb, (frames) => {
        const result = aggregateSecond(frames);
        if (result === null) return;
        const count = frames.filter((f) => f.handNearMouth).length;
        expect(result.handNearMouth).toBe(count * 2 > frames.length);
      }),
    );
  });

  it('exactly half of the frames near is not a majority', () => {
    const frames = [...repeat(near('left', 'upper'), 3), ...repeat(away, 3)];
    expect(aggregateSecond(frames)?.handNearMouth).toBe(false);
  });

  it('side and level follow the strict majority of the near frames only', () => {
    fc.assert(
      fc.property(framesArb, (frames) => {
        const result = aggregateSecond(frames);
        if (result === null) return;
        const nearFrames = frames.filter((f) => f.handNearMouth);
        const m = nearFrames.length;
        const held = <T>(values: T[], v: T) => values.filter((x) => x === v).length * 2 > m;
        const sides = nearFrames.map((f) => f.side);
        const levels = nearFrames.map((f) => f.level);
        // Req 3.6: when the aggregated handNearMouth is false, side and level are unknown.
        const meaningful = result.handNearMouth && m > 0;
        const expectedSide = !meaningful ? 'unknown' : held(sides, 'left') ? 'left' : held(sides, 'right') ? 'right' : 'unknown';
        const expectedLevel = !meaningful ? 'unknown' : held(levels, 'upper') ? 'upper' : held(levels, 'lower') ? 'lower' : 'unknown';
        expect(result.side).toBe(expectedSide);
        expect(result.level).toBe(expectedLevel);
      }),
    );
  });

  it('a second with handNearMouth false always has side and level unknown (req 3.6)', () => {
    fc.assert(
      fc.property(framesArb, (frames) => {
        const result = aggregateSecond(frames);
        if (result === null || result.handNearMouth) return;
        expect(result.side).toBe('unknown');
        expect(result.level).toBe('unknown');
      }),
    );
  });

  it('fewer than half of the frames near gives unknown side and level, even when the near frames agree', () => {
    const frames = [...repeat(near('right', 'lower'), 3), ...repeat(away, 4)];
    expect(aggregateSecond(frames)).toEqual({ handNearMouth: false, side: 'unknown', level: 'unknown', moving: false });
  });

  it('dead-zone frames among the near frames can stop a majority', () => {
    // 3 of 6 near frames say left, 3 are in the dead zone: not more than half.
    const frames = [...repeat(near('left', 'upper'), 3), ...repeat(near('unknown', 'unknown'), 3)];
    const result = aggregateSecond(frames);
    expect(result?.handNearMouth).toBe(true);
    expect(result?.side).toBe('unknown');
    expect(result?.level).toBe('unknown');
  });

  it('frames with the hand away never stop a majority', () => {
    // 3 near frames all say right/lower; 3 away frames. handNearMouth is false (3 of 6), but
    // with 4 near frames of 7 the near majority is clear and the away frames do not dilute it.
    const frames = [...repeat(near('right', 'lower'), 4), ...repeat(away, 3)];
    const result = aggregateSecond(frames);
    expect(result).toEqual({ handNearMouth: true, side: 'right', level: 'lower', moving: false });
  });

  it('side and level are unknown when the hand is never near', () => {
    const result = aggregateSecond(repeat(away, 8));
    expect(result).toEqual({ handNearMouth: false, side: 'unknown', level: 'unknown', moving: false });
  });
});

// ---------- design test 10 ----------

describe('aggregateMoving', () => {
  const still = { x: 0.3, y: 0.3 };

  it('a hand that does not move is not moving', () => {
    expect(aggregateSecond(path(repeat(still, 10)))?.moving).toBe(false);
  });

  it('jitter below MOVE_JITTER_STEP adds nothing, however many steps', () => {
    const tiny = MOVE_JITTER_STEP / 2;
    const points = Array.from({ length: 40 }, (_, i) => ({ x: 0.3 + (i % 2 === 0 ? 0 : tiny), y: 0.3 }));
    expect(aggregateSecond(path(points))?.moving).toBe(false);
  });

  it('a stroke longer than MOVING_MIN_TRAVEL is moving', () => {
    // Back and forth: path length is counted, not first-to-last distance.
    const stroke = MOVING_MIN_TRAVEL / 2 + 0.05;
    const points = [
      { x: 0.3, y: 0.3 },
      { x: 0.3 + stroke, y: 0.3 },
      { x: 0.3, y: 0.3 },
      { x: 0.3 + stroke, y: 0.3 },
      { x: 0.3, y: 0.3 },
    ];
    expect(aggregateSecond(path(points))?.moving).toBe(true);
  });

  it('gentle strokes of 0.25 face widths in a second (between 0.2 and 0.3) are moving', () => {
    expect(MOVING_MIN_TRAVEL).toBe(0.2);
    const stroke = 0.0625; // 4 steps = 0.25 face widths of path
    const points = [
      { x: 0.3, y: 0.3 },
      { x: 0.3 + stroke, y: 0.3 },
      { x: 0.3, y: 0.3 },
      { x: 0.3 + stroke, y: 0.3 },
      { x: 0.3, y: 0.3 },
    ];
    expect(aggregateSecond(path(points))?.moving).toBe(true);
  });

  it('a stroke shorter than MOVING_MIN_TRAVEL is not moving', () => {
    const stroke = MOVING_MIN_TRAVEL / 5;
    const points = [
      { x: 0.3, y: 0.3 },
      { x: 0.3 + stroke, y: 0.3 },
      { x: 0.3, y: 0.3 },
      { x: 0.3 + stroke, y: 0.3 },
      { x: 0.3, y: 0.3 },
    ];
    // total path = 4 * stroke = 0.8 * MOVING_MIN_TRAVEL, below it
    expect(aggregateSecond(path(points))?.moving).toBe(false);
  });

  it('a vertical stroke counts as well', () => {
    const points = [0.3, 0.7, 0.3, 0.7, 0.3].map((y) => ({ x: 0.3, y }));
    expect(aggregateSecond(path(points))?.moving).toBe(true);
  });

  it('a head that moves with the hand adds nothing (handRel is unchanged)', () => {
    // The head moves across the image, but handRel is measured on the face's own axes, so it stays.
    expect(aggregateSecond(path(repeat({ x: 0.4, y: 0.2 }, 12)))?.moving).toBe(false);
  });

  it('frames without handRel add no travel', () => {
    const frames = [near('left', 'upper', { x: 0, y: 0 }), away, near('left', 'upper', { x: 5, y: 5 }), away, away, away];
    expect(aggregateSecond(frames)?.moving).toBe(false);
  });
});

// ---------- design test 11 ----------

describe('aggregateIsDeterministic', () => {
  it('gives equal results on two calls and on a copied array, and does not change the input', () => {
    fc.assert(
      fc.property(framesArb, (frames) => {
        const before = JSON.stringify(frames);
        const first = aggregateSecond(frames);
        const second = aggregateSecond(frames);
        const copied = aggregateSecond(frames.map((f) => ({ ...f, handRel: f.handRel && { ...f.handRel } })));
        expect(second).toEqual(first);
        expect(copied).toEqual(first);
        expect(JSON.stringify(frames)).toBe(before);
      }),
    );
  });
});

// ---------- design test 14 ----------

describe('signalShape', () => {
  it('the output is null or has exactly the four keys with allowed values', () => {
    fc.assert(
      fc.property(framesArb, (frames) => {
        const result = aggregateSecond(frames);
        if (result === null) return;
        expect(Object.keys(result).sort()).toEqual(['handNearMouth', 'level', 'moving', 'side']);
        expect(typeof result.handNearMouth).toBe('boolean');
        expect(typeof result.moving).toBe('boolean');
        expect(['left', 'right', 'unknown']).toContain(result.side);
        expect(['upper', 'lower', 'unknown']).toContain(result.level);
      }),
    );
  });

  it('FrameResult has no field naming a tooth', () => {
    const sample: FrameResult = away;
    for (const key of Object.keys(sample)) {
      expect(key.toLowerCase()).not.toMatch(/tooth|teeth|molar|incisor|canine|premolar/);
    }
    expect(Object.keys(sample).sort()).toEqual(['faceSeen', 'handNearMouth', 'handRel', 'level', 'side']);
  });
});
