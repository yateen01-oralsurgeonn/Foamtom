import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { windowDates } from '../src/ui/calendar-days';
import { PARENT_VIEW_CONSTANTS } from '../src/ui/parent-constants';
import { acceptedSessions, acceptSession } from '../src/ui/parent-accept';
import { oddSessionArb, sessionArb, todayArb } from './fixtures/parent-sessions';

// Parent-screen task 3 (parentAccept): requirements 13.5, 13.7, 14.15.

const C = PARENT_VIEW_CONSTANTS;

/** The window, the days just outside it and a future day, for a given today. */
function datesFor(today: string): string[] {
  const span = windowDates(today, 9); // 7 window days plus the 2 before them
  const next = windowDates(today, 1)[0];
  return [...span, next, '2999-01-01'];
}

const validArb = todayArb.chain((today) => sessionArb(datesFor(today)));

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value)) deepFreeze((value as Record<string, unknown>)[key]);
  }
  return value;
}

function sortedJson(list: readonly unknown[]): string[] {
  return list.map((v) => JSON.stringify(v)).sort();
}

describe('parentAccept', () => {
  it('accepts every valid session', () => {
    fc.assert(
      fc.property(validArb, (session) => {
        expect(acceptSession(session, C)).toBe(true);
      }),
    );
  });

  it('skips every odd session', () => {
    fc.assert(
      fc.property(oddSessionArb, (odd) => {
        expect(acceptSession(odd, C)).toBe(false);
      }),
    );
  });

  it('acceptedSessions keeps exactly the valid ones, in their order', () => {
    fc.assert(
      fc.property(fc.array(fc.oneof(validArb, oddSessionArb), { maxLength: 20 }), (list) => {
        const expected = list.filter((v) => acceptSession(v, C));
        expect(acceptedSessions(list, C)).toEqual(expected);
      }),
    );
  });

  it('a mix gives the same accepted list as the valid sessions alone', () => {
    fc.assert(
      fc.property(fc.array(validArb, { maxLength: 10 }), fc.array(oddSessionArb, { maxLength: 10 }), (valid, odd) => {
        const mixed = [...odd, ...valid, ...odd];
        expect(acceptedSessions(mixed, C)).toEqual(valid);
      }),
    );
  });

  it('never throws for any JSON value, and never changes its input', () => {
    fc.assert(
      fc.property(fc.jsonValue(), (value) => {
        const before = JSON.stringify(value);
        const frozen = deepFreeze(JSON.parse(before) as unknown);
        expect(() => acceptSession(frozen, C)).not.toThrow();
        expect(() => acceptedSessions([frozen, frozen], C)).not.toThrow();
        expect(JSON.stringify(frozen)).toBe(before);
      }),
    );
    fc.assert(
      fc.property(fc.oneof(validArb, oddSessionArb), (value) => {
        const before = JSON.stringify(value);
        const frozen = deepFreeze(JSON.parse(before ?? 'null') as unknown);
        acceptSession(frozen, C);
        expect(JSON.stringify(frozen)).toBe(before ?? 'null');
      }),
    );
  });

  it('the accepted set does not depend on the order of the list', () => {
    fc.assert(
      fc.property(
        fc
          .array(fc.oneof(validArb, oddSessionArb), { maxLength: 15 })
          .chain((list) =>
            fc
              .shuffledSubarray(list, { minLength: list.length, maxLength: list.length })
              .map((shuffled) => [list, shuffled] as const),
          ),
        ([list, shuffled]) => {
          expect(sortedJson(acceptedSessions(shuffled, C))).toEqual(sortedJson(acceptedSessions(list, C)));
        },
      ),
    );
  });

  it('uses the constants passed in', () => {
    const base = {
      date: '2026-11-22',
      timeOfDay: 'night',
      mode: 'camera',
      startedAt: 1,
      monstersEarned: ['a', 'b', 'c', 'd'],
      durationSeconds: 120,
      zoneResults: C.ZONE_ORDER.map((zoneId) => ({
        zoneId,
        monsterId: 'a',
        secondsBrushed: 30,
        secondsUntracked: 0,
        verified: true,
        monsterOutcome: 'defeated',
      })),
    };
    expect(acceptSession(base, C)).toBe(true);
    expect(acceptSession({ ...base, durationSeconds: 119 }, C)).toBe(false);
    expect(acceptSession({ ...base, durationSeconds: 121 }, C)).toBe(false);
    expect(acceptSession(base, { ...C, ZONE_DURATION: 29 })).toBe(false);
    expect(acceptSession({ ...base, durationSeconds: 130 }, { ...C, SESSION_DURATION: 130 })).toBe(true);
  });
});
