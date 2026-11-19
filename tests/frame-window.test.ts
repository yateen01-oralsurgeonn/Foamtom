import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { framesInLastSecond } from '../src/tracking/frame-window';
import { aggregateSecond } from '../src/tracking/aggregate-second';
import { WINDOW_MS } from '../src/tracking/thresholds';
import type { FrameResult, TimedFrame } from '../src/tracking/types';

function frame(tag: number): FrameResult {
  // tag goes into handRel.x so each frame can be told apart
  return { faceSeen: true, handNearMouth: true, side: 'left', level: 'upper', handRel: { x: tag, y: 0 } };
}

describe('framesInLastSecond', () => {
  it('keeps exactly the frames in (now - 1000, now], in order', () => {
    const now = 5000;
    const timed: TimedFrame[] = [
      { t: now - WINDOW_MS - 1, frame: frame(1) },
      { t: now - WINDOW_MS, frame: frame(2) }, // on the open edge: dropped
      { t: now - WINDOW_MS + 1, frame: frame(3) },
      { t: now - 500, frame: frame(4) },
      { t: now, frame: frame(5) }, // on the closed edge: kept
      { t: now + 1, frame: frame(6) },
    ];
    const kept = framesInLastSecond(timed, now);
    expect(kept.map((f) => f.handRel?.x)).toEqual([3, 4, 5]);
  });

  it('is empty when the tracker stalled, and aggregateSecond of that is null', () => {
    const timed: TimedFrame[] = Array.from({ length: 10 }, (_, i) => ({ t: i * 100, frame: frame(i) }));
    const stalled = framesInLastSecond(timed, 10_000);
    expect(stalled).toEqual([]);
    expect(aggregateSecond(stalled)).toBeNull();
  });

  it('property: result equals the filter on t, keeps order and does not change the input', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 20_000 }), { maxLength: 40 }),
        fc.integer({ min: 0, max: 20_000 }),
        (times, now) => {
          const timed: TimedFrame[] = times.map((t, i) => ({ t, frame: frame(i) }));
          const copy = timed.map((x) => ({ ...x }));
          const expected = timed.filter((x) => x.t > now - WINDOW_MS && x.t <= now).map((x) => x.frame);
          expect(framesInLastSecond(timed, now)).toEqual(expected);
          expect(timed).toEqual(copy);
        },
      ),
    );
  });
});
