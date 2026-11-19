// Builds the stored result of a finished session. See design section 5 (req 9.1-9.3, 10.1, 10.2).
// Pure: no randomness, no DOM, no Date.
import { UNTRACKED_LIMIT, ZONE_DURATION } from './constants';
import type { SessionResult, SessionState, ZoneResult } from './types';

/** Turns an ended session into a SessionResult. Throws if the session has not ended. */
export function toSessionResult(state: SessionState): SessionResult {
  if (state.phase !== 'ended') {
    throw new Error('toSessionResult: the session has not ended');
  }
  const timerOnly = state.mode === 'timer-only';

  const zoneResults: ZoneResult[] = state.zones.map((zone, i) => {
    const monster = state.monsters[i];
    if (monster.outcome === 'pending') {
      throw new Error('toSessionResult: a monster was not resolved');
    }
    const secondsUntracked = timerOnly ? 0 : state.secondsUntrackedPerZone[i];
    return {
      zoneId: zone.id,
      monsterId: monster.def.id,
      secondsBrushed: timerOnly ? ZONE_DURATION : state.secondsBrushedPerZone[i],
      secondsUntracked,
      verified: !timerOnly && secondsUntracked <= UNTRACKED_LIMIT,
      monsterOutcome: monster.outcome,
    };
  });

  return {
    date: state.date,
    timeOfDay: state.timeOfDay,
    mode: state.mode,
    zoneResults,
    // Every monster met goes into the Monster Book, beaten or not (req 10.2).
    monstersEarned: state.monsters.map((m) => m.def.id),
    startedAt: state.startedAt,
    durationSeconds: state.ticksDone,
  };
}
