// Stroke shape: do the last second's hand positions go round (small circles) or back and forth
// (scrubbing)? Debug page experiment of 27 Nov 2026 (requirements "Experiment 3"). Pure: no DOM,
// no clock, no randomness. The game does not import this file. Every number comes from
// thresholds.ts except the degree conversion.
import {
  CIRCLE_MAX_REVERSAL_SHARE,
  CIRCLE_MIN_ROUNDNESS,
  MOVE_JITTER_STEP,
  MOVING_MIN_TRAVEL,
  SCRUB_MAX_ROUNDNESS,
  SCRUB_MIN_REVERSAL_SHARE,
  STROKE_MIN_POINTS,
  STROKE_REVERSAL_DEG,
} from './thresholds';
import type { Point } from './types';

export interface StrokeShape {
  readonly kind: 'circles' | 'scrub' | 'unclear';
  /** Square root of smaller / larger eigenvalue of the covariance. 1 = round, 0 = a line. */
  readonly roundness: number;
  /** Long axis against the face's x axis, folded into 0..90. 0 = side to side, 90 = up and down. */
  readonly axisAngleDeg: number;
  /** Share of turns between consecutive steps that change direction by more than STROKE_REVERSAL_DEG. */
  readonly reversalShare: number;
  /** Points that remain after camera noise is dropped. */
  readonly points: number;
}

const RADIANS_PER_DEGREE = Math.PI / 180;

interface Step {
  readonly dx: number;
  readonly dy: number;
  readonly length: number;
}

/**
 * Points are the non-null handRel values of the last second, in time order. Steps shorter than
 * MOVE_JITTER_STEP are noise and are dropped; a point stays only if a kept step starts or ends
 * there, so the answer does not depend on the direction of time.
 */
export function strokeShape(points: readonly Point[]): StrokeShape {
  const steps: Step[] = [];
  const used: boolean[] = points.map(() => false);
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const length = Math.hypot(dx, dy);
    if (length < MOVE_JITTER_STEP) continue;
    steps.push({ dx, dy, length });
    used[i - 1] = true;
    used[i] = true;
  }
  const kept = points.filter((_, i) => used[i]);
  const count = kept.length;

  // Roundness and axis, from the 2x2 covariance of the remaining points.
  let roundness = 0;
  let axisAngleDeg = 0;
  if (count > 0) {
    const meanX = kept.reduce((sum, p) => sum + p.x, 0) / count;
    const meanY = kept.reduce((sum, p) => sum + p.y, 0) / count;
    let sxx = 0;
    let syy = 0;
    let sxy = 0;
    for (const p of kept) {
      sxx += (p.x - meanX) * (p.x - meanX);
      syy += (p.y - meanY) * (p.y - meanY);
      sxy += (p.x - meanX) * (p.y - meanY);
    }
    sxx /= count;
    syy /= count;
    sxy /= count;
    const middle = (sxx + syy) / 2;
    const spread = Math.hypot((sxx - syy) / 2, sxy);
    const larger = middle + spread;
    const smaller = Math.max(0, middle - spread);
    roundness = larger > 0 ? Math.sqrt(smaller / larger) : 0;
    if (larger > 0) axisAngleDeg = Math.abs((0.5 * Math.atan2(2 * sxy, sxx - syy)) / RADIANS_PER_DEGREE);
  }

  // Reversals: turns between consecutive remaining steps.
  let turns = 0;
  let reversals = 0;
  for (let i = 1; i < steps.length; i++) {
    const a = steps[i - 1];
    const b = steps[i];
    const turn = Math.abs(Math.atan2(a.dx * b.dy - a.dy * b.dx, a.dx * b.dx + a.dy * b.dy));
    turns += 1;
    if (turn > STROKE_REVERSAL_DEG * RADIANS_PER_DEGREE) reversals += 1;
  }
  const reversalShare = turns > 0 ? reversals / turns : 0;

  const path = steps.reduce((sum, s) => sum + s.length, 0);
  let kind: StrokeShape['kind'] = 'unclear';
  if (count >= STROKE_MIN_POINTS && path > MOVING_MIN_TRAVEL) {
    if (roundness >= CIRCLE_MIN_ROUNDNESS && reversalShare < CIRCLE_MAX_REVERSAL_SHARE) kind = 'circles';
    else if (roundness < SCRUB_MAX_ROUNDNESS || reversalShare >= SCRUB_MIN_REVERSAL_SHARE) kind = 'scrub';
  }
  return { kind, roundness, axisAngleDeg, reversalShare, points: count };
}
