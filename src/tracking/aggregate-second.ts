// One second of frame results -> one BrushingSignal, or null (design 5.4, req 4).
// Pure: no clock, no randomness. Every threshold comes from thresholds.ts.
import type { BrushingSignal } from '../logic/types';
import type { FrameResult } from './types';
import { MIN_FACE_FRACTION, MIN_FRAMES_PER_SECOND, MOVE_JITTER_STEP, MOVING_MIN_TRAVEL } from './thresholds';

/** Hand path length in face widths. Steps smaller than MOVE_JITTER_STEP are noise and add nothing. */
function travel(frames: readonly FrameResult[]): number {
  let total = 0;
  for (let i = 1; i < frames.length; i++) {
    const a = frames[i - 1].handRel;
    const b = frames[i].handRel;
    if (a === null || b === null) continue;
    const step = Math.hypot(b.x - a.x, b.y - a.y);
    if (step >= MOVE_JITTER_STEP) total += step;
  }
  return total;
}

export function aggregateSecond(frames: readonly FrameResult[]): BrushingSignal | null {
  const n = frames.length;
  if (n < MIN_FRAMES_PER_SECOND) return null;

  const seen = frames.filter((f) => f.faceSeen).length;
  // Exactly MIN_FACE_FRACTION of the frames is enough; fewer gives null.
  if (seen < n * MIN_FACE_FRACTION) return null;

  const handNearMouth = frames.filter((f) => f.handNearMouth).length * 2 > n;

  // side and level are counted among the near-mouth frames only.
  const near = frames.filter((f) => f.handNearMouth);
  const m = near.length;
  const majorityNear = (pred: (f: FrameResult) => boolean): boolean =>
    near.filter(pred).length * 2 > m;

  let side: BrushingSignal['side'] = 'unknown';
  let level: BrushingSignal['level'] = 'unknown';
  if (m > 0) {
    if (majorityNear((f) => f.side === 'left')) side = 'left';
    else if (majorityNear((f) => f.side === 'right')) side = 'right';
    if (majorityNear((f) => f.level === 'upper')) level = 'upper';
    else if (majorityNear((f) => f.level === 'lower')) level = 'lower';
  }

  const moving = travel(frames) > MOVING_MIN_TRAVEL;
  return { handNearMouth, side, level, moving };
}
