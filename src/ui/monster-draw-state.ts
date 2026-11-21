// Pure decisions for drawing a monster, its smoke, and the end of a zone.
// Design section 5.4. No DOM, no clock, no randomness.
import type { MonsterOutcome, SessionState, ZoneId } from '../logic/types';
import type { View } from '../logic/view';

/** The smallest the monster is drawn, so it never vanishes before it is defeated. */
export const MIN_MONSTER_SCALE = 0.35;

export type MonsterDrawState = 'sitting' | 'shrinking' | 'defeated' | 'gone' | 'fled' | 'trapped';
export type ZoneEndOutcome = 'defeated' | 'fled' | 'trapped';

export interface ZoneEnd {
  readonly zoneId: ZoneId;
  readonly monsterId: string;
  readonly outcome: ZoneEndOutcome;
}

export interface SmokeLook {
  readonly puffs: 0 | 1 | 2 | 3;
  readonly scale: number;
  readonly opacity: number;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** One draw state for every (view, outcome). A zone-end outcome wins over the live view. */
export function monsterDrawState(
  view: Pick<View, 'healthFraction' | 'smokeFraction'>,
  endOutcome: ZoneEndOutcome | null,
): MonsterDrawState {
  if (endOutcome !== null) return endOutcome;
  const h = view.healthFraction;
  if (h >= 1) return 'sitting';
  if (h > 0) return 'shrinking';
  return view.smokeFraction > 0 ? 'defeated' : 'gone';
}

/** Size of the monster, from MIN_MONSTER_SCALE (health 0) to 1 (full health). */
export function monsterScale(h: number): number {
  return MIN_MONSTER_SCALE + (1 - MIN_MONSTER_SCALE) * clamp01(h);
}

/** How the smoke looks for a smoke fraction: fewer, smaller, fainter puffs as it thins. */
export function smokeLook(f: number): SmokeLook {
  if (!(f > 0)) return { puffs: 0, scale: 0, opacity: 0 };
  const c = clamp01(f);
  return {
    puffs: Math.ceil(3 * c) as 1 | 2 | 3,
    scale: 0.6 + 0.4 * c,
    opacity: 0.35 + 0.65 * c,
  };
}

function isZoneEndOutcome(outcome: MonsterOutcome): outcome is ZoneEndOutcome {
  return outcome !== 'pending';
}

/** The zone that ended between two states, or null. Pause and resume never give one. */
export function zoneEndEvent(prev: SessionState | null, next: SessionState): ZoneEnd | null {
  if (prev === null || next.phase === 'paused' || prev.phase === 'paused') return null;
  let endedIndex: number | null = null;
  if (next.activeZoneIndex > prev.activeZoneIndex) endedIndex = prev.activeZoneIndex;
  else if (prev.phase !== 'ended' && next.phase === 'ended') endedIndex = prev.activeZoneIndex;
  if (endedIndex === null) return null;
  const m = next.monsters[endedIndex];
  if (!isZoneEndOutcome(m.outcome)) return null; // cannot happen: no event rather than a wrong one
  return { zoneId: m.zoneId, monsterId: m.def.id, outcome: m.outcome };
}
