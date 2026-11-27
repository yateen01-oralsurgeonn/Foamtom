import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { strokeShape } from '../src/tracking/stroke-shape';
import { MOVE_JITTER_STEP, STROKE_MIN_POINTS } from '../src/tracking/thresholds';
import type { Point } from '../src/tracking/types';

// ---------- helpers (hand-written, local to this file) ----------

/** 12 points round a centre. */
function circle(cx: number, cy: number, radius: number): Point[] {
  return Array.from({ length: 12 }, (_, i) => ({
    x: cx + radius * Math.cos((i * 2 * Math.PI) / 12),
    y: cy + radius * Math.sin((i * 2 * Math.PI) / 12),
  }));
}

// Fixed, tiny, non-random noise.
const NOISE = [0.004, -0.003, 0.002, -0.005, 0.003, -0.002, 0.005, -0.004, 0.001, -0.001, 0.004, -0.003];

/** 12 points going back and forth along one axis: 0, +a, 0, -a, 0, +a, ... plus tiny noise on the other axis. */
function scrub(amplitude: number, alongX: boolean): Point[] {
  const wave = [0, 1, 0, -1];
  return Array.from({ length: 12 }, (_, i) => {
    const along = amplitude * wave[i % wave.length];
    return alongX ? { x: along, y: NOISE[i] } : { x: NOISE[i], y: along };
  });
}

describe('strokeShape', () => {
  it('a circle of 12 points, radius 0.15, is circles', () => {
    const shape = strokeShape(circle(0.3, 0.4, 0.15));
    expect(shape.kind).toBe('circles');
    expect(shape.roundness).toBeGreaterThan(0.9);
    expect(shape.reversalShare).toBe(0);
    expect(shape.points).toBe(12);
  });

  it('a side-to-side scrub is scrub with the long axis along the face', () => {
    const shape = strokeShape(scrub(0.2, true));
    expect(shape.kind).toBe('scrub');
    expect(shape.axisAngleDeg).toBeLessThan(20);
  });

  it('an up-and-down scrub is scrub with the long axis up and down', () => {
    const shape = strokeShape(scrub(0.2, false));
    expect(shape.kind).toBe('scrub');
    expect(shape.axisAngleDeg).toBeGreaterThan(70);
  });

  it('fewer than STROKE_MIN_POINTS points is unclear', () => {
    const few = circle(0, 0, 0.3).slice(0, STROKE_MIN_POINTS - 1);
    expect(strokeShape(few).kind).toBe('unclear');
    expect(strokeShape([]).kind).toBe('unclear');
  });

  it('a hand standing still is unclear', () => {
    const still = Array.from({ length: 12 }, () => ({ x: 0.3, y: 0.3 }));
    const shape = strokeShape(still);
    expect(shape.kind).toBe('unclear');
    expect(shape.points).toBe(0);
    expect(shape.roundness).toBe(0);
  });

  it('camera jitter (steps below the jitter step) is dropped', () => {
    const jitter = Array.from({ length: 12 }, (_, i) => ({ x: 0.3 + (i % 2) * (MOVE_JITTER_STEP / 2), y: 0.3 }));
    expect(strokeShape(jitter).kind).toBe('unclear');
  });
});

// ---------- properties ----------

// Points whose neighbouring steps are all far above the jitter step: each step is 0.05 to 0.3 long
// in a random direction, so no step is dropped by a shift or by a scale of 1 or more. At least 5 steps\n// of 0.05 give a path above MOVING_MIN_TRAVEL and at least STROKE_MIN_POINTS points.
const pathArb: fc.Arbitrary<Point[]> = fc
  .array(fc.record({ length: fc.double({ min: 0.05, max: 0.3, noNaN: true }), angle: fc.double({ min: 0, max: 6.28, noNaN: true }) }), {
    minLength: 5,
    maxLength: 20,
  })
  .map((steps) => {
    const points: Point[] = [{ x: 0, y: 0 }];
    for (const s of steps) {
      const last = points[points.length - 1];
      points.push({ x: last.x + s.length * Math.cos(s.angle), y: last.y + s.length * Math.sin(s.angle) });
    }
    return points;
  });

const offsetArb = fc.double({ min: -2, max: 2, noNaN: true });
const factorArb = fc.double({ min: 1.5, max: 4, noNaN: true });

describe('strokeShape properties', () => {
  it('moving every point by the same offset never changes kind', () => {
    fc.assert(
      fc.property(pathArb, offsetArb, offsetArb, (points, dx, dy) => {
        const moved = points.map((p) => ({ x: p.x + dx, y: p.y + dy }));
        expect(strokeShape(moved).kind).toBe(strokeShape(points).kind);
      }),
    );
  });

  it('scaling every point about the centre by a factor above 1 never changes kind', () => {
    fc.assert(
      fc.property(pathArb, factorArb, (points, factor) => {
        const cx = points.reduce((sum, p) => sum + p.x, 0) / points.length;
        const cy = points.reduce((sum, p) => sum + p.y, 0) / points.length;
        const scaled = points.map((p) => ({ x: cx + (p.x - cx) * factor, y: cy + (p.y - cy) * factor }));
        expect(strokeShape(scaled).kind).toBe(strokeShape(points).kind);
      }),
    );
  });

  it('reversing the order of the points never changes kind', () => {
    fc.assert(
      fc.property(pathArb, (points) => {
        expect(strokeShape([...points].reverse()).kind).toBe(strokeShape(points).kind);
      }),
    );
  });
});
