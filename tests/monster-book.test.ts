import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { ZONE_ORDER } from '../src/logic/constants';
import { MONSTERS } from '../src/logic/monsters';
import { computeMonsterBook, isRareEligibleForNewSession } from '../src/logic/monster-book';
import type { SessionResult, TimeOfDay } from '../src/logic/types';

// Helpers live in this file (no shared helper file).
const timeOfDayArb = fc.constantFrom<TimeOfDay>('morning', 'night', 'neither');
const monsterIdArb = fc.constantFrom(...MONSTERS.map((m) => m.id));

const sessionArb: fc.Arbitrary<SessionResult> = fc
  .record({
    timeOfDay: timeOfDayArb,
    ids: fc.uniqueArray(monsterIdArb, { minLength: 0, maxLength: 4 }),
  })
  .map(({ timeOfDay, ids }) => ({
    date: '2026-11-19',
    timeOfDay,
    mode: 'timer-only' as const,
    zoneResults: ZONE_ORDER.map((zoneId, i) => ({
      zoneId,
      monsterId: ids[i] ?? MONSTERS[0].id,
      secondsBrushed: 30,
      secondsUntracked: 0,
      verified: false,
      monsterOutcome: 'defeated' as const,
    })),
    monstersEarned: ids,
    startedAt: 0,
    durationSeconds: 120,
  }));

describe('rareNeedsMorningAndNightCountingNewSession', () => {
  it('is eligible exactly when stored + new sessions include a morning and a night', () => {
    fc.assert(
      fc.property(fc.array(sessionArb, { maxLength: 8 }), timeOfDayArb, (sessions, newTod) => {
        const times = [...sessions.map((s) => s.timeOfDay), newTod];
        const expected = times.includes('morning') && times.includes('night');
        expect(isRareEligibleForNewSession(sessions, newTod)).toBe(expected);
      }),
    );
  });

  it('counts the session that is starting', () => {
    const morning = { ...sessionAt('morning') };
    expect(isRareEligibleForNewSession([morning], 'night')).toBe(true);
    expect(isRareEligibleForNewSession([sessionAt('night')], 'morning')).toBe(true);
    expect(isRareEligibleForNewSession([], 'night')).toBe(false);
    expect(isRareEligibleForNewSession([morning], 'morning')).toBe(false);
  });

  it("'neither' sessions never make a day eligible", () => {
    expect(isRareEligibleForNewSession([sessionAt('neither'), sessionAt('morning')], 'neither')).toBe(false);
    expect(isRareEligibleForNewSession([sessionAt('neither')], 'night')).toBe(false);
  });
});

describe('computeMonsterBook', () => {
  it('is the union of monstersEarned over all sessions', () => {
    fc.assert(
      fc.property(fc.array(sessionArb, { maxLength: 10 }), (sessions) => {
        const expected = new Set(sessions.flatMap((s) => s.monstersEarned));
        const book = computeMonsterBook(sessions);
        expect(book.unlockedIds).toEqual(expected);
      }),
    );
  });

  it('is empty with no sessions', () => {
    expect(computeMonsterBook([]).unlockedIds.size).toBe(0);
  });
});

function sessionAt(timeOfDay: TimeOfDay): SessionResult {
  return {
    date: '2026-11-19',
    timeOfDay,
    mode: 'timer-only',
    zoneResults: [],
    monstersEarned: [],
    startedAt: 0,
    durationSeconds: 120,
  };
}
