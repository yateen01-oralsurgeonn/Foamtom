// The one bridge between the camera/tracker and the game (design section 3, req 15.3).
// Only the per-second BrushingSignal (or null) ever leaves a SignalSource.
import type { BrushingSignal } from '../logic/types';

export interface SignalSource {
  /** Asks for the camera once. Answers 'ready' or 'unavailable'. */
  start(): Promise<'ready' | 'unavailable'>;
  /** The signal for the last full second, or null when the tracker cannot see the child. */
  latest(): BrushingSignal | null;
  /** Stops the camera stream. Safe to call more than once. */
  stop(): void;
}

/** The source for this spec: no camera, so it is never ready and never sees anything. */
export const nullSignalSource: SignalSource = {
  start: () => Promise.resolve('unavailable'),
  latest: () => null,
  stop: () => {},
};
