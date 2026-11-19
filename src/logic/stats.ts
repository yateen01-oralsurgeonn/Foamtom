import { ZONE_DURATION, ZONE_ORDER } from './constants';
import type { SessionResult, ZoneId } from './types';

/**
 * Total verified brushing time in seconds (req 13.4).
 * Sums secondsBrushed over verified zones of camera-mode sessions only.
 * Untracked seconds, timer-only sessions and unverified zones add 0.
 */
export function computeVerifiedTime(sessions: readonly SessionResult[]): number {
  let total = 0;
  for (const session of sessions) {
    if (session.mode !== 'camera') continue;
    for (const zr of session.zoneResults) {
      if (!zr.verified) continue;
      total += zr.secondsBrushed;
    }
  }
  return total;
}

/**
 * The zone with the highest average miss over ALL stored camera-mode sessions,
 * using verified zones only (req 13.4). Miss of one zone result is
 * max(0, 30 - secondsBrushed - secondsUntracked). A tie goes to the first zone
 * in ZONE_ORDER. Returns null when there is no verified camera data.
 * Does not use computeMissScores.
 */
export function zoneMostMissed(sessions: readonly SessionResult[]): ZoneId | null {
  const missSum = new Map<ZoneId, number>();
  const count = new Map<ZoneId, number>();
  for (const id of ZONE_ORDER) {
    missSum.set(id, 0);
    count.set(id, 0);
  }

  for (const session of sessions) {
    if (session.mode !== 'camera') continue;
    for (const zr of session.zoneResults) {
      if (!zr.verified) continue;
      const miss = Math.max(0, ZONE_DURATION - zr.secondsBrushed - zr.secondsUntracked);
      missSum.set(zr.zoneId, (missSum.get(zr.zoneId) ?? 0) + miss);
      count.set(zr.zoneId, (count.get(zr.zoneId) ?? 0) + 1);
    }
  }

  let best: ZoneId | null = null;
  for (const id of ZONE_ORDER) {
    const n = count.get(id) ?? 0;
    if (n === 0) continue;
    if (best === null) {
      best = id;
      continue;
    }
    // Compare averages exactly by cross-multiplying (integers): sum/n > bestSum/bestN.
    const bestN = count.get(best) ?? 0;
    if ((missSum.get(id) ?? 0) * bestN > (missSum.get(best) ?? 0) * n) best = id;
  }
  return best;
}
