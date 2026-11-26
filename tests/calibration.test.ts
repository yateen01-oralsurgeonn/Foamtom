import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  CALIBRATION_ZONES,
  classifyByCalibration,
  handFeatures,
  zoneOverWindow,
  type CalibrationSet,
  type CalibrationVote,
  type ZoneId,
} from '../src/tracking/calibration';
import { adaptHands } from '../src/tracking/landmark-adapters';
import { CALIBRATION_K, CALIBRATION_LEAD_IN_SECONDS, CALIBRATION_SECONDS_PER_ZONE } from '../src/tracking/thresholds';
import type { FaceInput, FrameInput, HandInput, Point } from '../src/tracking/types';

// Hand-written numbers only. Positions are written in the one unit (x times aspect) and turned
// into raw image coordinates by dividing x by the aspect, so the same scene fits any frame shape.

function faceFor(aspect: number): FaceInput {
  return {
    mouth: { x: 0.5 / aspect, y: 0.6 },
    edgeA: { x: 0.3 / aspect, y: 0.5 },
    edgeB: { x: 0.7 / aspect, y: 0.5 },
  };
}

/** A hand of 21 distinct landmarks, near the mouth unless `dx`/`dy` move it. */
function handFor(aspect: number, dx = 0, dy = 0, handedness?: 'Left' | 'Right'): HandInput {
  const landmarks: Point[] = Array.from({ length: 21 }, (_, i) => ({
    x: (0.55 + i * 0.005 + dx) / aspect,
    y: 0.7 + i * 0.002 + dy,
  }));
  return handedness ? { landmarks, handedness } : { landmarks };
}

function frameFor(aspect: number, faces: FaceInput[], hands: HandInput[]): FrameInput {
  return { aspect, faces, hands };
}

describe('handFeatures', () => {
  it('gives the same numbers for the same hand on a square frame and a 16:9 frame', () => {
    const wide = 16 / 9;
    const square = handFeatures(frameFor(1, [faceFor(1)], [handFor(1)]));
    const sixteenNine = handFeatures(frameFor(wide, [faceFor(wide)], [handFor(wide)]));
    expect(square).not.toBeNull();
    expect(sixteenNine).not.toBeNull();
    expect(sixteenNine).toHaveLength(square?.length ?? -1);
    square?.forEach((value, i) => expect(sixteenNine?.[i]).toBeCloseTo(value, 10));
  });

  it('uses the aspect argument when it is given', () => {
    const wide = 16 / 9;
    const input = frameFor(1, [faceFor(wide)], [handFor(wide)]); // frame says 1, scene is 16:9
    const viaArgument = handFeatures(input, wide);
    const viaFrame = handFeatures(frameFor(wide, [faceFor(wide)], [handFor(wide)]));
    viaFrame?.forEach((value, i) => expect(viaArgument?.[i]).toBeCloseTo(value, 10));
  });

  it('has 5 landmark positions (x, y) and the handedness: 11 numbers', () => {
    expect(handFeatures(frameFor(1, [faceFor(1)], [handFor(1)]))).toHaveLength(11);
  });

  it('gives +1 for a right hand, -1 for a left hand and 0 when MediaPipe gave none', () => {
    const last = (h?: 'Left' | 'Right'): number | undefined => {
      const f = handFeatures(frameFor(1, [faceFor(1)], [handFor(1, 0, 0, h)]));
      return f?.[f.length - 1];
    };
    expect(last('Right')).toBe(1);
    expect(last('Left')).toBe(-1);
    expect(last()).toBe(0);
  });

  it('is null without a face, without a hand, and with a far hand', () => {
    expect(handFeatures(frameFor(1, [], [handFor(1)]))).toBeNull();
    expect(handFeatures(frameFor(1, [faceFor(1)], []))).toBeNull();
    expect(handFeatures(frameFor(1, [faceFor(1)], [handFor(1, 0.6, 0.3)]))).toBeNull();
  });

  it('uses the hand nearest the mouth, and does not change with a second, smaller face', () => {
    const near = handFor(1);
    const far = handFor(1, 0.6, 0.3);
    const small: FaceInput = { mouth: { x: 0.15, y: 0.3 }, edgeA: { x: 0.1, y: 0.28 }, edgeB: { x: 0.2, y: 0.28 } };
    const alone = handFeatures(frameFor(1, [faceFor(1)], [near]));
    expect(handFeatures(frameFor(1, [faceFor(1)], [far, near]))).toEqual(alone);
    expect(handFeatures(frameFor(1, [small, faceFor(1)], [near]))).toEqual(alone);
  });
});

describe('adaptHands handedness', () => {
  const landmarks = Array.from({ length: 21 }, (_, i) => ({ x: i / 100, y: 0.5 }));

  it('adds the label MediaPipe gives, by hand index', () => {
    const hands = adaptHands({
      landmarks: [landmarks, landmarks],
      handedness: [[{ categoryName: 'Left' }], [{ categoryName: 'Right' }]],
    });
    expect(hands.map((h) => h.handedness)).toEqual(['Left', 'Right']);
  });

  it('leaves the field out when there is no usable label', () => {
    expect(adaptHands({ landmarks: [landmarks] })).toEqual([{ landmarks }]);
    expect(adaptHands({ landmarks: [landmarks], handedness: [[{ categoryName: 'x' }]] })).toEqual([{ landmarks }]);
  });
});

// A synthetic set: four clusters on a line in feature space, ten frames each.
function clusterSet(): CalibrationSet {
  const centres: Record<ZoneId, number> = { 'upper-right': 0, 'upper-left': 10, 'lower-left': 20, 'lower-right': 30 };
  const set: { zone: ZoneId; features: number[] }[] = [];
  for (const zone of CALIBRATION_ZONES) {
    for (let i = 0; i < 10; i++) set.push({ zone, features: [centres[zone] + (i % 3) * 0.1, i * 0.05] });
  }
  return set;
}

describe('classifyByCalibration', () => {
  it('picks the zone whose cluster the query is near, with its vote count', () => {
    const set = clusterSet();
    expect(classifyByCalibration(set, [10.1, 0.1], CALIBRATION_K)).toEqual({ zone: 'upper-left', votes: CALIBRATION_K });
    expect(classifyByCalibration(set, [30, 0], CALIBRATION_K)?.zone).toBe('lower-right');
    expect(classifyByCalibration(set, [0.2, 0.3], CALIBRATION_K)?.zone).toBe('upper-right');
  });

  it('counts the votes of a query between two clusters', () => {
    const set = clusterSet();
    const answer = classifyByCalibration(set, [6, 0.2], CALIBRATION_K);
    expect(answer).not.toBeNull();
    expect(['upper-right', 'upper-left']).toContain(answer?.zone);
  });

  it('is null for a set smaller than k', () => {
    const small = clusterSet().slice(0, CALIBRATION_K - 1);
    expect(classifyByCalibration(small, [0, 0], CALIBRATION_K)).toBeNull();
    expect(classifyByCalibration([], [0, 0], CALIBRATION_K)).toBeNull();
    expect(classifyByCalibration(clusterSet().slice(0, CALIBRATION_K), [0, 0], CALIBRATION_K)).not.toBeNull();
  });

  it('does not depend on the order of the set', () => {
    const set = clusterSet();
    const reversed = [...set].reverse();
    const shuffled = [...set].sort((p, q) => ((p.features[1] * 7919) % 1) - ((q.features[1] * 7919) % 1));
    for (const query of [[0, 0], [5, 0.2], [15, 0.1], [25, 0.3], [40, 1]]) {
      const expected = classifyByCalibration(set, query, CALIBRATION_K);
      expect(classifyByCalibration(reversed, query, CALIBRATION_K)).toEqual(expected);
      expect(classifyByCalibration(shuffled, query, CALIBRATION_K)).toEqual(expected);
    }
  });

  it('property: moving the whole set and the query by the same offset never changes the answer', () => {
    const entry = fc.record({
      zone: fc.constantFrom(...CALIBRATION_ZONES),
      features: fc.array(fc.integer({ min: -50, max: 50 }), { minLength: 3, maxLength: 3 }),
    });
    fc.assert(
      fc.property(
        fc.array(entry, { minLength: 0, maxLength: 30 }),
        fc.array(fc.integer({ min: -50, max: 50 }), { minLength: 3, maxLength: 3 }),
        fc.array(fc.integer({ min: -1000, max: 1000 }), { minLength: 3, maxLength: 3 }),
        fc.integer({ min: 1, max: 9 }),
        (set, query, offset, k) => {
          const moved = set.map((e) => ({ zone: e.zone, features: e.features.map((v, i) => v + offset[i]) }));
          const movedQuery = query.map((v, i) => v + offset[i]);
          expect(classifyByCalibration(moved, movedQuery, k)).toEqual(classifyByCalibration(set, query, k));
        },
      ),
    );
  });
});

describe('zoneOverWindow', () => {
  const vote = (zone: ZoneId): CalibrationVote => ({ zone, votes: CALIBRATION_K });

  it('gives the majority zone and how many frames agree', () => {
    const results = [
      vote('upper-left'),
      vote('upper-left'),
      vote('lower-left'),
      vote('upper-left'),
      null,
      vote('upper-left'),
      vote('upper-right'),
      vote('upper-left'),
    ];
    const answer = zoneOverWindow(results);
    expect(answer?.zone).toBe('upper-left');
    expect(answer?.agree).toBe(5);
    expect(answer?.total).toBe(7);
    expect(answer?.share).toBeCloseTo(5 / 7, 12);
  });

  it('is null when no frame has an answer', () => {
    expect(zoneOverWindow([])).toBeNull();
    expect(zoneOverWindow([null, null])).toBeNull();
  });

  it('a tie goes to the earlier zone in the game order', () => {
    expect(zoneOverWindow([vote('lower-right'), vote('upper-left')])?.zone).toBe('upper-left');
  });
});

describe('calibration constants', () => {
  it('are the starting values for the debug page', () => {
    expect(CALIBRATION_K).toBe(7);
    expect(CALIBRATION_SECONDS_PER_ZONE).toBe(5);
    expect(CALIBRATION_LEAD_IN_SECONDS).toBe(3);
  });

  it('the zones are in the game order', () => {
    expect(CALIBRATION_ZONES).toEqual(['upper-right', 'upper-left', 'lower-left', 'lower-right']);
  });
});
