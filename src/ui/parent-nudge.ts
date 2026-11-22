// The nudge (parent-screen design 5.5, requirement 7).
// Pure: no DOM, no clock, no randomness, no storage. Display-only text from PARENT_TEXT.
import type { SessionResult, ZoneId } from '../logic/types';
import type { ParentViewConstants } from './parent-constants';
import { PARENT_TEXT, ZONE_NAMES, fill } from './parent-text';

export interface Nudge {
  readonly zone: ZoneId;
  readonly nights: number;
  /** Row 14, with only the zone name and the number filled in. */
  readonly text: string;
}

/**
 * Nights per zone over the accepted sessions of the window.
 * A night for a zone is a calendar day with at least one verified result for the zone in a
 * camera-mode night session, where every such result has `secondsBrushed === 0`.
 * Unverified results neither count nor block. Timer-only, morning and `neither` sessions are
 * never read. Two night sessions on one day give at most one night.
 */
export function nightsPerZone(
  windowSessions: readonly SessionResult[],
  constants: ParentViewConstants,
): Record<ZoneId, number> {
  // zone -> date -> true when some verified night result saw brushing that day
  const days = new Map<ZoneId, Map<string, boolean>>();
  for (const zone of constants.ZONE_ORDER) days.set(zone, new Map());

  for (const session of windowSessions) {
    if (session.mode !== 'camera' || session.timeOfDay !== 'night') continue;
    for (const zr of session.zoneResults) {
      if (!zr.verified) continue;
      const byDate = days.get(zr.zoneId);
      if (byDate === undefined) continue;
      const sawBrushing = (byDate.get(session.date) ?? false) || zr.secondsBrushed > 0;
      byDate.set(session.date, sawBrushing);
    }
  }

  const nights = {} as Record<ZoneId, number>;
  for (const zone of constants.ZONE_ORDER) {
    let count = 0;
    for (const sawBrushing of days.get(zone)!.values()) {
      if (!sawBrushing) count += 1;
    }
    nights[zone] = count;
  }
  return nights;
}

/**
 * The nudge, or `null` when no zone has `NUDGE_MIN_NIGHTS` nights.
 * Names the zone with the most nights; a tie goes to the first in `ZONE_ORDER`.
 */
export function nudge(nights: Readonly<Record<ZoneId, number>>, constants: ParentViewConstants): Nudge | null {
  let top = 0;
  let zone: ZoneId | null = null;
  for (const candidate of constants.ZONE_ORDER) {
    const n = nights[candidate] ?? 0;
    if (zone === null || n > top) {
      zone = candidate;
      top = n;
    }
  }
  if (zone === null || top < constants.NUDGE_MIN_NIGHTS) return null;
  return { zone, nights: top, text: fill(PARENT_TEXT.nudge.text, { zone: ZONE_NAMES[zone], n: top }) };
}
