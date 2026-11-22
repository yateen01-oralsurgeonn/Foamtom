import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { computeVerifiedTime } from '../src/logic/stats';
import type { SessionResult } from '../src/logic/types';
import { windowDates } from '../src/ui/calendar-days';
import { PARENT_VIEW_CONSTANTS } from '../src/ui/parent-constants';
import { PARENT_TEXT } from '../src/ui/parent-text';
import { parentView } from '../src/ui/parent-view';
import { oddSessionArb, sessionArb, todayArb } from './fixtures/parent-sessions';

// Parent-screen task 7.1: parentViewOddData (design test 9). Requirements 13.5, 13.7, 14.15.

const C = PARENT_VIEW_CONSTANTS;

interface Mix {
  today: string;
  valid: SessionResult[];
  odd: unknown[];
  /** The valid and odd values together, in one order. */
  mixed: unknown[];
  /** The same values in another order. */
  shuffled: unknown[];
}

/** `items` in the order given by sorting on `keys` (ties keep the original order). */
function reorder<T>(items: readonly T[], keys: readonly number[]): T[] {
  return items
    .map((item, i) => ({ item, key: keys[i] ?? 0, i }))
    .sort((a, b) => a.key - b.key || a.i - b.i)
    .map((x) => x.item);
}

const mixArb: fc.Arbitrary<Mix> = todayArb.chain((today) => {
  const fourteen = windowDates(today, 14);
  const dates = [...fourteen, today];
  return fc
    .tuple(
      fc.array(sessionArb(dates), { maxLength: 10 }),
      fc.array(oddSessionArb, { maxLength: 10 }),
    )
    .chain(([valid, odd]) => {
      const total = valid.length + odd.length;
      const keys = fc.array(fc.nat({ max: 1000 }), { minLength: total, maxLength: total });
      return fc.tuple(keys, keys).map(([k1, k2]) => {
        const all: unknown[] = [...valid, ...odd];
        return { today, valid, odd, mixed: reorder(all, k1), shuffled: reorder(all, k2) };
      });
    });
});

describe('parentViewOddData', () => {
  it('gives the same result as the valid sessions alone, for any mix of valid, odd and non-object values', () => {
    fc.assert(
      fc.property(mixArb, (m) => {
        expect(parentView(m.mixed, C, m.today)).toEqual(parentView(m.valid, C, m.today));
      }),
    );
  });

  it('gives the same result for the same list in another order', () => {
    fc.assert(
      fc.property(mixArb, (m) => {
        expect(parentView(m.shuffled, C, m.today)).toEqual(parentView(m.mixed, C, m.today));
        expect(parentView([...m.mixed].reverse(), C, m.today)).toEqual(parentView(m.mixed, C, m.today));
      }),
    );
  });

  it('keeps the time ceilings of test 3 for the whole mix', () => {
    fc.assert(
      fc.property(mixArb, (m) => {
        const view = parentView(m.mixed, C, m.today);
        fc.pre(view.hasSessions);
        const d = view.durations!;
        const inWindow = new Set(windowDates(m.today, 7));

        let verifiedResults = 0;
        let cameraSessions = 0;
        for (const s of m.valid) {
          if (!inWindow.has(s.date) || s.mode !== 'camera') continue;
          cameraSessions += 1;
          verifiedResults += s.zoneResults.filter((z) => z.verified).length;
        }

        expect(d.cameraSaw.seconds).toBe(computeVerifiedTime(m.valid.filter((s) => inWindow.has(s.date))));
        expect(d.cameraSaw.seconds).toBeLessThanOrEqual(30 * verifiedResults);
        expect(d.cameraSaw.seconds).toBeLessThanOrEqual(120 * cameraSessions);
        expect(d.cameraSaw.seconds).toBeLessThanOrEqual(d.withGame.seconds);
        expect(d.cameraSaw.seconds + d.timerOnly.seconds).toBeLessThanOrEqual(d.withGame.seconds);
        expect(d.withGame.seconds).toBeLessThanOrEqual(120 * m.valid.length);
      }),
    );
  });

  it('never throws for any JSON value, as the list or inside the list', () => {
    fc.assert(
      fc.property(fc.jsonValue(), fc.array(fc.jsonValue(), { maxLength: 8 }), fc.string(), (value, list, today) => {
        expect(() => parentView(value as readonly unknown[], C, '2026-11-22')).not.toThrow();
        expect(() => parentView(list, C, '2026-11-22')).not.toThrow();
        expect(() => parentView([value, ...list], C, today)).not.toThrow();
      }),
    );
  });

  it('never throws for odd sessions that sit among valid ones, and changes none of them', () => {
    fc.assert(
      fc.property(mixArb, (m) => {
        const before = JSON.stringify(m.mixed);
        expect(() => parentView(m.mixed, C, m.today)).not.toThrow();
        expect(JSON.stringify(m.mixed)).toBe(before);
      }),
    );
  });

  it('a store holding only skipped sessions shows row 13', () => {
    fc.assert(
      fc.property(todayArb, fc.array(oddSessionArb, { maxLength: 12 }), (today, odd) => {
        const view = parentView(odd, C, today);
        expect(view.hasSessions).toBe(false);
        expect(view.noSessionsText).toBe(PARENT_TEXT['no-sessions'].text);
        expect(view.days).toEqual([]);
        expect(view.durations).toBeNull();
        expect(view.zoneFact).toBeNull();
        expect(view.nudge).toBeNull();
      }),
    );
  });
});
