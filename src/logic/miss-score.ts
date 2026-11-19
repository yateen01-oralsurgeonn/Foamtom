import { H_MAX, KIND_FLOOR, MISS_WINDOW, ZONE_DURATION, ZONE_ORDER } from './constants';
import type { MissScores, SessionResult, Zone, ZoneId } from './types';

/**
 * Per-zone miss score in [0, 1] from the MISS_WINDOW most recent camera-mode sessions
 * (by startedAt), counting verified zones only (req 14.1, 14.7).
 * Timer-only sessions, unverified zones and older sessions contribute nothing.
 */
export function computeMissScores(sessions: readonly SessionResult[]): MissScores {
  const recent = sessions
    .filter((s) => s.mode === 'camera')
    .map((s, i) => ({ s, i }))
    .sort((a, b) => b.s.startedAt - a.s.startedAt || b.i - a.i)
    .slice(0, MISS_WINDOW)
    .map((x) => x.s);

  const missSeconds = {} as Record<ZoneId, number>;
  const verifiedCount = {} as Record<ZoneId, number>;
  for (const id of ZONE_ORDER) {
    missSeconds[id] = 0;
    verifiedCount[id] = 0;
  }

  for (const session of recent) {
    for (const zr of session.zoneResults) {
      if (!zr.verified) continue;
      missSeconds[zr.zoneId] += Math.max(0, ZONE_DURATION - zr.secondsBrushed - zr.secondsUntracked);
      verifiedCount[zr.zoneId] += 1;
    }
  }

  const scores = {} as Record<ZoneId, number>;
  for (const id of ZONE_ORDER) {
    const n = verifiedCount[id];
    const raw = n > 0 ? missSeconds[id] / (ZONE_DURATION * n) : 0;
    scores[id] = Math.min(1, Math.max(0, raw));
  }
  return scores;
}

/**
 * Kind-proximity starting health (req 14.2):
 * clamp(round(H_MAX x (1 - 0.4 x missScore)), KIND_FLOOR, H_MAX).
 */
export function startingHealth(zone: Zone, missScores: MissScores): number {
  const score = Math.min(1, Math.max(0, missScores[zone.id] ?? 0));
  const health = Math.round(H_MAX * (1 - 0.4 * score));
  return Math.min(H_MAX, Math.max(KIND_FLOOR, health));
}
