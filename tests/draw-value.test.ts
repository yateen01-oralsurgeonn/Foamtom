import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { toDrawValue } from '../src/tracking/draw-value';
import type { FaceInput } from '../src/tracking/types';

const face = (
  mouth: [number, number],
  a: [number, number],
  b: [number, number],
): FaceInput => ({
  mouth: { x: mouth[0], y: mouth[1] },
  edgeA: { x: a[0], y: a[1] },
  edgeB: { x: b[0], y: b[1] },
});

describe('toDrawValue', () => {
  it('gives the mouth, the width as a fraction of image width and the roll of the face axis', () => {
    const value = toDrawValue(face([0.5, 0.6], [0.4, 0.5], [0.6, 0.5]), 1);
    expect(value).not.toBeNull();
    expect(value!.mouth).toEqual({ x: 0.5, y: 0.6 });
    expect(value!.faceWidth).toBeCloseTo(0.2, 9);
    expect(value!.roll).toBeCloseTo(0, 9);
  });

  it('measures the width as a fraction of image width when the image is wider than tall', () => {
    // Image 2:1. Edge points 0.2 apart across the width: 0.2 of the image width.
    expect(toDrawValue(face([0.5, 0.5], [0.4, 0.5], [0.6, 0.5]), 2)!.faceWidth).toBeCloseTo(0.2, 9);
    // 0.2 apart down the height: 0.2 of the height is 0.1 of the width.
    const tall = toDrawValue(face([0.5, 0.5], [0.5, 0.4], [0.5, 0.6]), 2)!;
    expect(tall.faceWidth).toBeCloseTo(0.1, 9);
  });

  it('turns the roll with the tilt of the face axis', () => {
    expect(toDrawValue(face([0.5, 0.5], [0.4, 0.4], [0.6, 0.6]), 1)!.roll).toBeCloseTo(Math.PI / 4, 9);
    expect(toDrawValue(face([0.5, 0.5], [0.4, 0.6], [0.6, 0.4]), 1)!.roll).toBeCloseTo(-Math.PI / 4, 9);
  });

  it('gives no value for a face of width zero or a bad aspect', () => {
    expect(toDrawValue(face([0.5, 0.5], [0.5, 0.5], [0.5, 0.5]), 1)).toBeNull();
    expect(toDrawValue(face([0.5, 0.5], [0.4, 0.5], [0.6, 0.5]), 0)).toBeNull();
    expect(toDrawValue(face([0.5, 0.5], [0.4, 0.5], [0.6, 0.5]), Number.NaN)).toBeNull();
  });

  it('does not depend on which edge point is listed first', () => {
    fc.assert(
      fc.property(
        fc.record({
          mx: fc.double({ min: 0, max: 1, noNaN: true }),
          my: fc.double({ min: 0, max: 1, noNaN: true }),
          ax: fc.double({ min: 0, max: 1, noNaN: true }),
          ay: fc.double({ min: 0, max: 1, noNaN: true }),
          bx: fc.double({ min: 0, max: 1, noNaN: true }),
          by: fc.double({ min: 0, max: 1, noNaN: true }),
          aspect: fc.double({ min: 0.3, max: 3, noNaN: true }),
        }),
        (r) => {
          fc.pre(Math.abs(r.ax - r.bx) > 1e-6);
          const one = toDrawValue(face([r.mx, r.my], [r.ax, r.ay], [r.bx, r.by]), r.aspect);
          const two = toDrawValue(face([r.mx, r.my], [r.bx, r.by], [r.ax, r.ay]), r.aspect);
          expect(one).toEqual(two);
          expect(one!.roll).toBeGreaterThanOrEqual(-Math.PI / 2);
          expect(one!.roll).toBeLessThanOrEqual(Math.PI / 2);
          expect(one!.faceWidth).toBeGreaterThan(0);
        },
      ),
    );
  });
});
