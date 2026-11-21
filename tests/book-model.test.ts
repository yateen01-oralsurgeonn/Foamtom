import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { computeMonsterBook } from '../src/logic/monster-book';
import { MONSTERS } from '../src/logic/monsters';
import type { SessionResult } from '../src/logic/types';
import { bookTapAction, bookViewFromLoader, monsterBookView } from '../src/ui/book-model';

const ids = MONSTERS.map((m) => m.id);

const sessionArb = fc.record({
  date: fc.constantFrom('2026-11-01', '2026-11-02', '2026-12-24'),
  timeOfDay: fc.constantFrom('morning', 'night', 'neither'),
  mode: fc.constantFrom('camera', 'timer'),
  monstersEarned: fc.array(fc.oneof(fc.constantFrom(...ids), fc.constant('not-in-table')), { maxLength: 6 }),
  startedAt: fc.nat(),
}).map(
  (r) =>
    ({
      date: r.date,
      timeOfDay: r.timeOfDay,
      mode: r.mode,
      zoneResults: [],
      monstersEarned: r.monstersEarned,
      startedAt: r.startedAt,
      durationSeconds: 120,
    }) as unknown as SessionResult,
);
const sessionsArb = fc.array(sessionArb, { maxLength: 8 });

describe('monsterBookView', () => {
  it('always has twelve entries in table order, 8 common then 4 rare', () => {
    fc.assert(
      fc.property(sessionsArb, (sessions) => {
        const { entries } = monsterBookView(sessions);
        expect(entries.map((e) => e.id)).toEqual(ids);
        expect(entries.slice(0, 8).every((e) => !e.rare)).toBe(true);
        expect(entries.slice(8).every((e) => e.rare)).toBe(true);
      }),
    );
  });

  it('owned exactly when the id is in computeMonsterBook(sessions).unlockedIds', () => {
    fc.assert(
      fc.property(sessionsArb, (sessions) => {
        const unlocked = computeMonsterBook(sessions).unlockedIds;
        for (const e of monsterBookView(sessions).entries) {
          expect(e.owned).toBe(unlocked.has(e.id));
        }
      }),
    );
  });

  it('not-owned entries have name null and owned entries have the monster name', () => {
    fc.assert(
      fc.property(sessionsArb, (sessions) => {
        for (const e of monsterBookView(sessions).entries) {
          const def = MONSTERS.find((m) => m.id === e.id);
          expect(e.name).toBe(e.owned ? def?.name : null);
        }
      }),
    );
  });

  it('rare is true for rares whether owned or not', () => {
    fc.assert(
      fc.property(sessionsArb, (sessions) => {
        for (const e of monsterBookView(sessions).entries) {
          const def = MONSTERS.find((m) => m.id === e.id);
          expect(e.rare).toBe(def?.rarity === 'rare');
        }
      }),
    );
  });

  it('is the same for any order of sessions and any dates and times of day', () => {
    fc.assert(
      fc.property(sessionsArb, fc.constantFrom('morning', 'night', 'neither'), (sessions, tod) => {
        const reversed = [...sessions].reverse();
        const changed = sessions.map(
          (s) => ({ ...s, timeOfDay: tod, date: '2030-01-01', startedAt: 0 }) as SessionResult,
        );
        const base = monsterBookView(sessions);
        expect(monsterBookView(reversed)).toEqual(base);
        expect(monsterBookView(changed)).toEqual(base);
      }),
    );
  });

  it('gives twelve silhouettes for empty sessions', () => {
    const { entries } = monsterBookView([]);
    expect(entries).toHaveLength(12);
    expect(entries.every((e) => !e.owned && e.name === null)).toBe(true);
  });

  it('ignores an id in monstersEarned that is not in the table', () => {
    const odd = { monstersEarned: ['not-in-table', 'ghost'] } as unknown as SessionResult;
    expect(monsterBookView([odd])).toEqual(monsterBookView([]));
    expect(monsterBookView([odd]).entries).toHaveLength(12);
  });
});

describe('bookFromLoader', () => {
  it('gives the same as monsterBookView for a loader that returns sessions', () => {
    fc.assert(
      fc.property(sessionsArb, (sessions) => {
        expect(bookViewFromLoader(() => sessions)).toEqual(monsterBookView(sessions));
      }),
    );
  });

  it('gives twelve silhouettes and does not throw when the loader throws', () => {
    const view = bookViewFromLoader(() => {
      throw new Error('storage failed');
    });
    expect(view).toEqual(monsterBookView([]));
    expect(view.entries).toHaveLength(12);
    expect(view.entries.every((e) => !e.owned && e.name === null)).toBe(true);
  });
});

describe('bookTapAction', () => {
  it('says the name for an owned entry and nothing for a not-owned entry', () => {
    fc.assert(
      fc.property(sessionsArb, (sessions) => {
        for (const e of monsterBookView(sessions).entries) {
          const action = bookTapAction(e);
          if (e.owned) {
            expect(action).toEqual({ kind: 'say-name', text: e.name });
          } else {
            expect(action).toEqual({ kind: 'none' });
          }
        }
      }),
    );
  });
});
