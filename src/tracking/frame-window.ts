// The frames of the last second (design 5.6, req 4.7, 6.4). Pure: time is an argument.
import type { FrameResult, TimedFrame } from './types';
import { WINDOW_MS } from './thresholds';

/** Frame results whose time t is in (nowMs - WINDOW_MS, nowMs], in their original order. */
export function framesInLastSecond(timed: readonly TimedFrame[], nowMs: number): FrameResult[] {
  return timed.filter((item) => item.t > nowMs - WINDOW_MS && item.t <= nowMs).map((item) => item.frame);
}
