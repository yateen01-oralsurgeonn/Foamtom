import type { MonsterBook, SessionResult, TimeOfDay } from './types';

/**
 * True only when the stored sessions of the day plus the session now starting
 * include at least one morning and at least one night session (req 10.6-10.8).
 * Sessions classified 'neither' never count toward eligibility.
 */
export function isRareEligibleForNewSession(
  todaysSessions: readonly SessionResult[],
  newTimeOfDay: TimeOfDay,
): boolean {
  const times = [...todaysSessions.map((s) => s.timeOfDay), newTimeOfDay];
  return times.includes('morning') && times.includes('night');
}

/** The Monster Book is the union of `monstersEarned` over all sessions (req 10.3). */
export function computeMonsterBook(sessions: readonly SessionResult[]): MonsterBook {
  const unlockedIds = new Set<string>();
  for (const session of sessions) {
    for (const id of session.monstersEarned) unlockedIds.add(id);
  }
  return { unlockedIds };
}
