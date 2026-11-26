import { describe, expect, it } from 'vitest';
import { selectHandPoint } from '../src/tracking/classify-frame';
import { BRUSH_HEAD_REACH, HAND_POINT } from '../src/tracking/thresholds';
import type { HandInput, Point } from '../src/tracking/types';

// Hand-written numbers only. Landmark 5 is the index knuckle, 17 the little-finger knuckle.
// `unit` points are in the one unit (x times aspect); the raw x is unit x divided by aspect.
function handFromUnit(unit: { k5: Point; k17: Point }, aspect: number): HandInput {
  const landmarks: Point[] = Array.from({ length: 21 }, (_, i) => ({ x: i / 100 / aspect, y: i / 50 }));
  landmarks[5] = { x: unit.k5.x / aspect, y: unit.k5.y };
  landmarks[17] = { x: unit.k17.x / aspect, y: unit.k17.y };
  return { landmarks };
}

describe('brush-head hand point', () => {
  it('(a) a flat hand with the index knuckle left of the little-finger knuckle gives a point further left', () => {
    const hand = handFromUnit({ k5: { x: 0.4, y: 0.5 }, k17: { x: 0.6, y: 0.5 } }, 1);
    const head = selectHandPoint(hand, 'brush-head');
    expect(head.x).toBeLessThan(0.4);
    expect(head.y).toBeCloseTo(0.5, 12);
    // Reach is in knuckle widths: knuckle width 0.2, reach 1.0.
    expect(head.x).toBeCloseTo(0.4 - BRUSH_HEAD_REACH * 0.2, 12);
  });

  it('(b) a 16:9 frame gives the same direction and length as a square frame', () => {
    const arrangement = { k5: { x: 0.5, y: 0.4 }, k17: { x: 0.7, y: 0.5 } };
    const aspect = 16 / 9;
    const square = selectHandPoint(handFromUnit(arrangement, 1), 'brush-head', 1);
    const wide = selectHandPoint(handFromUnit(arrangement, aspect), 'brush-head', aspect);
    // Back in the one unit, the wide result is the square result.
    expect(wide.x * aspect).toBeCloseTo(square.x, 12);
    expect(wide.y).toBeCloseTo(square.y, 12);
  });

  it('(c) palm, wrist and fingertips do not depend on the aspect argument and keep their values', () => {
    const landmarks: Point[] = Array.from({ length: 21 }, (_, i) => ({ x: i / 100, y: i / 50 }));
    const hand: HandInput = { landmarks };
    for (const kind of ['palm', 'wrist', 'fingertips'] as const) {
      expect(selectHandPoint(hand, kind, 16 / 9)).toEqual(selectHandPoint(hand, kind));
    }
    expect(selectHandPoint(hand, 'palm').x).toBeCloseTo(0.088, 12);
    expect(selectHandPoint(hand, 'wrist')).toEqual({ x: 0, y: 0 });
    expect(selectHandPoint(hand, 'fingertips').y).toBeCloseTo(0.24, 12);
  });

  it('the game still uses the palm', () => {
    expect(HAND_POINT).toBe('palm');
  });
});
