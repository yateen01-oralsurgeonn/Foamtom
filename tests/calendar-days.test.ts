import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { civilFromDays, daysFromCivil, parseDate, weekdayIndex, windowDates } from '../src/ui/calendar-days';

// Design test 1 (calendarDays), parent-screen requirements 3.1, 3.6, 13.2.

function pad(n: number, w: number): string {
  return String(n).padStart(w, '0');
}

/** A real calendar day, as year, month, day. Years 1 to 9999 so a 7-day window stays in range. */
const civilArb = fc
  .record({ year: fc.integer({ min: 1, max: 9999 }), month: fc.integer({ min: 1, max: 12 }), pick: fc.integer({ min: 0, max: 30 }) })
  .map(({ year, month, pick }) => {
    const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    const length = month === 2 ? (leap ? 29 : 28) : [4, 6, 9, 11].includes(month) ? 30 : 31;
    return { year, month, day: (pick % length) + 1 };
  });

function text(c: { year: number; month: number; day: number }): string {
  return `${pad(c.year, 4)}-${pad(c.month, 2)}-${pad(c.day, 2)}`;
}

describe('calendarDays', () => {
  it('anchors: 1970-01-01 is day 0 and a Thursday; 2026-11-16 is a Monday', () => {
    expect(daysFromCivil(1970, 1, 1)).toBe(0);
    expect(weekdayIndex(0)).toBe(4);
    expect(weekdayIndex(daysFromCivil(2026, 11, 16))).toBe(1);
    expect(weekdayIndex(daysFromCivil(2026, 11, 22))).toBe(0);
    expect(weekdayIndex(-1)).toBe(3);
  });

  it('daysFromCivil and civilFromDays are inverses', () => {
    fc.assert(
      fc.property(civilArb, (c) => {
        expect(civilFromDays(daysFromCivil(c.year, c.month, c.day))).toEqual(c);
      }),
    );
    fc.assert(
      fc.property(fc.integer({ min: -700000, max: 2800000 }), (n) => {
        const c = civilFromDays(n);
        expect(daysFromCivil(c.year, c.month, c.day)).toBe(n);
      }),
    );
  });

  it('consecutive day counts give consecutive calendar days', () => {
    fc.assert(
      fc.property(fc.integer({ min: -100000, max: 1000000 }), (n) => {
        const a = civilFromDays(n);
        const b = civilFromDays(n + 1);
        const sameMonth = b.year === a.year && b.month === a.month && b.day === a.day + 1;
        const newMonth = b.day === 1 && (b.month === a.month + 1 || (a.month === 12 && b.month === 1 && b.year === a.year + 1));
        expect(sameMonth || newMonth).toBe(true);
        expect(weekdayIndex(n + 1)).toBe((weekdayIndex(n) + 1) % 7);
      }),
    );
  });

  it('handles leap days, month ends and year ends', () => {
    expect(windowDates('2024-03-02', 7)).toEqual([
      '2024-02-25',
      '2024-02-26',
      '2024-02-27',
      '2024-02-28',
      '2024-02-29',
      '2024-03-01',
      '2024-03-02',
    ]);
    expect(windowDates('2026-03-03', 7)[0]).toBe('2026-02-25');
    expect(windowDates('2026-03-03', 7)).not.toContain('2026-02-29');
    expect(windowDates('2027-01-02', 7)).toEqual([
      '2026-12-27',
      '2026-12-28',
      '2026-12-29',
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
    ]);
    expect(windowDates('2100-03-01', 2)).toEqual(['2100-02-28', '2100-03-01']);
    expect(windowDates('2000-03-01', 2)).toEqual(['2000-02-29', '2000-03-01']);
  });

  it('windowDates(today, 7) is 7 consecutive dates ending at today, oldest first', () => {
    fc.assert(
      fc.property(civilArb, (c) => {
        const today = text(c);
        const dates = windowDates(today, 7);
        expect(dates).toHaveLength(7);
        expect(dates[6]).toBe(today);
        const base = daysFromCivil(c.year, c.month, c.day);
        dates.forEach((d, i) => {
          const parsed = parseDate(d);
          expect(parsed, d).not.toBeNull();
          if (parsed === null) return;
          expect(daysFromCivil(parsed.year, parsed.month, parsed.day)).toBe(base - 6 + i);
        });
        expect([...dates].sort()).toEqual(dates);
      }),
    );
  });

  it('windowDates follows n and gives [] for a bad n', () => {
    expect(windowDates('2026-11-22', 1)).toEqual(['2026-11-22']);
    expect(windowDates('2026-11-22', 3)).toEqual(['2026-11-20', '2026-11-21', '2026-11-22']);
    expect(windowDates('2026-11-22', 0)).toEqual([]);
    expect(windowDates('2026-11-22', -1)).toEqual([]);
    expect(windowDates('2026-11-22', 2.5)).toEqual([]);
  });

  it('parseDate reads a real day', () => {
    expect(parseDate('2026-11-22')).toEqual({ year: 2026, month: 11, day: 22 });
    expect(parseDate('2024-02-29')).toEqual({ year: 2024, month: 2, day: 29 });
    expect(parseDate('0001-01-01')).toEqual({ year: 1, month: 1, day: 1 });
  });

  it('invalid strings give null and []', () => {
    const bad = [
      '2026-02-29',
      '2100-02-29',
      '2026-13-01',
      '2026-00-10',
      '2026-04-31',
      '2026-01-00',
      '2026-1-1',
      '2026-11-2',
      '26-11-22',
      '2026/11/22',
      '2026-11-22 ',
      ' 2026-11-22',
      '2026-11-22T10:00',
      '',
      'today',
      '+2026-11-22',
    ];
    for (const s of bad) {
      expect(parseDate(s), s).toBeNull();
      expect(windowDates(s, 7), s).toEqual([]);
    }
    expect(parseDate(undefined as unknown as string)).toBeNull();
    expect(parseDate(20261122 as unknown as string)).toBeNull();
  });

  it('parseDate accepts exactly the real days', () => {
    fc.assert(
      fc.property(civilArb, (c) => {
        expect(parseDate(text(c))).toEqual(c);
      }),
    );
  });

  it('the file uses no clock, no locale and no time zone', () => {
    const source = readFileSync(join(process.cwd(), 'src/ui/calendar-days.ts'), 'utf8');
    for (const banned of [/\bDate\b/, /\bIntl\b/, /toLocale/, /getTimezoneOffset/, /performance/, /Math\.random/]) {
      expect(banned.test(source), String(banned)).toBe(false);
    }
  });
});
