// Hit feedback (design section 5.11, req 6.9, 6.10). Pure: no DOM, no clock, no timer, no
// randomness. Decides when the monster flinches and which of two identical animations to use.
import type { View } from '../logic/view';
import type { Effects } from './effects';

/** The three `View` fields the decision needs, and nothing else. */
export type HitView = Pick<View, 'zoneId' | 'monsterId' | 'healthFraction'>;

/** Two identical animations with different names: swapping restarts the flinch with no timer. */
export type HitClass = 'monster--hit-a' | 'monster--hit-b';

/**
 * True only when both views exist, the zone and the monster are the same, and the health
 * fraction is lower. A zone change is never a hit.
 */
export function isHit(prevView: HitView | null, view: HitView | null): boolean {
  if (prevView === null || view === null) return false;
  if (prevView.zoneId !== view.zoneId || prevView.monsterId !== view.monsterId) return false;
  return view.healthFraction < prevView.healthFraction;
}

/** The class to put on the monster, or `null` for no flinch (no hit, or reduced motion). */
export function hitClassFor(
  hit: boolean,
  effects: Pick<Effects, 'hitMotion'>,
  flip: boolean,
): HitClass | null {
  if (!hit || !effects.hitMotion) return null;
  return flip ? 'monster--hit-b' : 'monster--hit-a';
}
