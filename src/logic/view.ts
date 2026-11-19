// Plain values the screen paints. See design section 3 (req 11.3-11.5, 7.8).
// Pure: no randomness, no DOM, no Date.
import { ZONE_DURATION } from './constants';
import type { SessionState, ZoneId } from './types';

/**
 * `captionLineId` values `toView` can produce (task 7 `src/audio/lines.ts` must have a
 * line with each of these ids):
 *   'zone-upper-right' | 'zone-upper-left' | 'zone-lower-left' | 'zone-lower-right'
 *       the active zone's announcement (req 4.1, 11.5)
 *   'smoke'  while the active monster is defeated before its zone's 30 s end and the zone
 *       is still running: "Keep brushing! Brush the smoke away!" (req 7.8)
 *   'end'    when the session has ended: the closing line
 * The start button's line is not produced here; the start screen owns it.
 */
export type CaptionLineId =
  | 'zone-upper-right'
  | 'zone-upper-left'
  | 'zone-lower-left'
  | 'zone-lower-right'
  | 'smoke'
  | 'end';

export interface View {
  readonly phase: SessionState['phase'];
  readonly zoneId: ZoneId;
  readonly countdown: number; // seconds left in the active zone
  readonly captionLineId: CaptionLineId;
  readonly monsterId: string; // the active zone's monster
  readonly healthFraction: number; // [0, 1]: health / startingHealth
  readonly smokeFraction: number; // [0, 1]: 0 when there is no smoke; for drawing only
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Turns the session state into the plain values the screen paints. */
export function toView(state: SessionState): View {
  const i = state.activeZoneIndex;
  const zone = state.zones[i];
  const monster = state.monsters[i];

  const defeatedAt = monster.defeatedAtElapsed;
  // Smoke exists only when the monster was defeated before the zone's last second.
  const hasSmoke = defeatedAt !== null && defeatedAt < ZONE_DURATION;
  const smokeFraction =
    defeatedAt !== null && hasSmoke
      ? clamp01(1 - state.secondsSmokeClearedPerZone[i] / Math.max(1, ZONE_DURATION - defeatedAt))
      : 0;

  const healthFraction =
    monster.startingHealth > 0 ? clamp01(monster.health / monster.startingHealth) : 0;

  let captionLineId: CaptionLineId;
  if (state.phase === 'ended') captionLineId = 'end';
  else if (hasSmoke) captionLineId = 'smoke';
  else captionLineId = `zone-${zone.id}`;

  return {
    phase: state.phase,
    zoneId: zone.id,
    countdown: state.zoneTimeRemaining,
    captionLineId,
    monsterId: monster.def.id,
    healthFraction,
    smokeFraction,
  };
}
