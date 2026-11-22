import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { REQUIRE_LEVEL_MATCH, REQUIRE_SIDE_MATCH } from '../src/logic/constants';
import { computeVerifiedTime } from '../src/logic/stats';
import type { SessionResult } from '../src/logic/types';
import { civilFromDays, daysFromCivil, parseDate, windowDates } from '../src/ui/calendar-days';
import { PARENT_VIEW_CONSTANTS, type ParentViewConstants } from '../src/ui/parent-constants';
import { PARENT_TEXT } from '../src/ui/parent-text';
import { parentView, type ParentView } from '../src/ui/parent-view';
import { oddSessionArb, sessionArb, todayArb } from './fixtures/parent-sessions';

// Parent-screen task 6: parentViewSevenDays, parentViewTimeFacts,
// parentViewTimerAndUnverifiedNeverCount, parentViewTooLittleData, parentViewDisclosure
// (design tests 2, 3, 4, 7, 8). Requirements 1.6, 3 to 8, 13, 14.

const C = PARENT_VIEW_CONSTANTS;

const APPROVED_DISCLOSURE = [
  'The camera picture stays on this phone. It is never saved or sent.',
  'Brushing times and the Monster Book are saved on this phone only, until you press Clear all data.',
  'The camera sees a moving hand near the mouth. It cannot see the brush, the teeth, or which part of the mouth is being brushed.',
  'In camera sessions, monsters get weaker in turns where brushing was often not seen.',
  'A monster that is nearly beaten when the time is up counts as beaten.',
  'Every monster your child meets goes into the Monster Book, beaten or not.',
];

/** The day after `date`, as YYYY-MM-DD. */
function nextDay(date: string): string {
  const p = parseDate(date)!;
  const c = civilFromDays(daysFromCivil(p.year, p.month, p.day) + 1);
  return `${String(c.year).padStart(4, '0')}-${String(c.month).padStart(2, '0')}-${String(c.day).padStart(2, '0')}`;
}

interface Case {
  today: string;
  /** The 7 dates of the window, oldest first. */
  windowDays: string[];
  /** The 7 days just before the window. */
  outsideDays: string[];
  sessions: SessionResult[];
}

/** Valid sessions dated in the window, the 7 days before it, and one future day. */
const caseArb: fc.Arbitrary<Case> = todayArb.chain((today) => {
  const fourteen = windowDates(today, 14);
  const windowDays = fourteen.slice(7);
  const outsideDays = fourteen.slice(0, 7);
  const dates = [...fourteen, nextDay(today)];
  return fc
    .array(sessionArb(dates), { maxLength: 14 })
    .map((sessions) => ({ today, windowDays, outsideDays, sessions }));
});

function windowOf(c: Case): SessionResult[] {
  return c.sessions.filter((s) => c.windowDays.includes(s.date));
}

function withDates(dates: readonly string[], count: number): fc.Arbitrary<SessionResult[]> {
  return fc.array(sessionArb(dates), { minLength: count, maxLength: count + 6 });
}

describe('parentViewSevenDays', () => {
  it('gives exactly 7 consecutive rows ending today, with the right counts (any valid sessions, any today)', () => {
    fc.assert(
      fc.property(caseArb, (c) => {
        const view = parentView(c.sessions, C, c.today);
        if (c.sessions.length === 0) {
          expect(view.hasSessions).toBe(false);
          expect(view.days).toEqual([]);
          return;
        }
        expect(view.hasSessions).toBe(true);
        expect(view.days.map((d) => d.date)).toEqual(c.windowDays);
        expect(view.days[6].date).toBe(c.today);
        for (const row of view.days) {
          const expected = c.sessions.filter((s) => s.date === row.date).length;
          expect(row.count).toBe(expected);
          expect(row.text.endsWith(`: ${expected}`)).toBe(true);
          expect(row.text).toMatch(
            /^(Sun|Mon|Tue|Wed|Thu|Fri|Sat) [1-9]\d? (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec): \d+$/,
          );
        }
      }),
    );
  });

  it('counts sessions of any mode and time of day, and shows 0 for an empty day', () => {
    fc.assert(
      fc.property(caseArb, (c) => {
        fc.pre(c.sessions.length > 0);
        const view = parentView(c.sessions, C, c.today);
        const total = view.days.reduce((sum, d) => sum + d.count, 0);
        expect(total).toBe(windowOf(c).length);
        for (const row of view.days) {
          if (row.count === 0) expect(row.text).toMatch(/: 0$/);
        }
      }),
    );
  });

  it('ignores sessions before the window and after today in rows, durations, zone fact and nudge', () => {
    fc.assert(
      fc.property(caseArb, (c) => {
        fc.pre(c.sessions.length > 0);
        const inside = windowOf(c);
        fc.pre(inside.length > 0);
        expect(parentView(c.sessions, C, c.today)).toEqual(parentView(inside, C, c.today));
      }),
    );
  });

  it('shows the approved example form: 2026-11-22 starts the window on Mon 16 Nov', () => {
    const base: SessionResult = fc.sample(sessionArb(['2026-11-16']), 1)[0];
    const view = parentView([base, base], C, '2026-11-22');
    expect(view.daysHeading).toBe('Sessions in the last 7 days');
    expect(view.days[0].text).toBe('Mon 16 Nov: 2');
    expect(view.days[6].text).toBe('Sun 22 Nov: 0');
  });

  it('puts no rating, streak or colour word in a row', () => {
    fc.assert(
      fc.property(caseArb, (c) => {
        const view = parentView(c.sessions, C, c.today);
        for (const row of view.days) {
          expect(row.text).not.toMatch(/streak|good|great|well done|target|total|red|green|again/i);
        }
        expect(Object.keys(view.days[0] ?? { date: 0, count: 0, text: 0 }).sort()).toEqual(['count', 'date', 'text']);
      }),
    );
  });
});

describe('parentViewTimeFacts', () => {
  it('equals an independent sum over the window and obeys the ceilings (any valid sessions)', () => {
    fc.assert(
      fc.property(caseArb, (c) => {
        const view = parentView(c.sessions, C, c.today);
        fc.pre(view.hasSessions);
        const d = view.durations!;

        // Independent oracle: plain loops over the sessions.
        let withGame = 0;
        let timerOnly = 0;
        let cameraSaw = 0;
        let verifiedResults = 0;
        let cameraSessions = 0;
        for (const s of c.sessions) {
          if (!c.windowDays.includes(s.date)) continue;
          withGame += s.durationSeconds;
          if (s.mode === 'timer-only') timerOnly += s.durationSeconds;
          if (s.mode === 'camera') {
            cameraSessions += 1;
            for (const zr of s.zoneResults) {
              if (zr.verified) {
                cameraSaw += zr.secondsBrushed;
                verifiedResults += 1;
              }
            }
          }
        }

        expect(d.withGame.seconds).toBe(withGame);
        expect(d.timerOnly.seconds).toBe(timerOnly);
        expect(d.cameraSaw.seconds).toBe(cameraSaw);
        expect(d.cameraSaw.seconds).toBe(computeVerifiedTime(windowOf(c)));

        expect(d.cameraSaw.seconds).toBeLessThanOrEqual(30 * verifiedResults);
        expect(d.cameraSaw.seconds).toBeLessThanOrEqual(120 * cameraSessions);
        expect(d.cameraSaw.seconds).toBeLessThanOrEqual(d.withGame.seconds);
        expect(d.cameraSaw.seconds + d.timerOnly.seconds).toBeLessThanOrEqual(d.withGame.seconds);
      }),
    );
  });

  it('writes each duration as whole minutes and seconds, and shows three lines only', () => {
    fc.assert(
      fc.property(caseArb, (c) => {
        const view = parentView(c.sessions, C, c.today);
        fc.pre(view.hasSessions);
        const d = view.durations!;
        expect(Object.keys(d).sort()).toEqual(['cameraSaw', 'timerOnly', 'withGame']);
        const forms: Array<[typeof d.withGame, RegExp]> = [
          [d.withGame, /^Time with the game: (\d+) min (\d+) s$/],
          [d.cameraSaw, /^Of that, the camera saw brushing: (\d+) min (\d+) s$/],
          [d.timerOnly, /^Timer only, not checked by the camera: (\d+) min (\d+) s$/],
        ];
        for (const [line, form] of forms) {
          const m = form.exec(line.text);
          expect(m).not.toBeNull();
          const minutes = Number(m![1]);
          const seconds = Number(m![2]);
          expect(seconds).toBeGreaterThanOrEqual(0);
          expect(seconds).toBeLessThanOrEqual(59);
          expect(minutes * 60 + seconds).toBe(line.seconds);
        }
      }),
    );
  });

  it('shows the exact text for a known case: one timer-only session is 2 min 0 s', () => {
    const [s] = fc.sample(sessionArb(['2026-11-22']), { numRuns: 1, seed: 7 });
    const timer: SessionResult = { ...s, mode: 'timer-only' };
    const view = parentView([timer], C, '2026-11-22');
    expect(view.durations!.withGame.text).toBe('Time with the game: 2 min 0 s');
    expect(view.durations!.timerOnly.text).toBe('Timer only, not checked by the camera: 2 min 0 s');
    expect(view.durations!.cameraSaw.text).toBe('Of that, the camera saw brushing: 0 min 0 s');
  });

  it('floors a total that is not a whole number of minutes, never rounding up', () => {
    const [s] = fc.sample(sessionArb(['2026-11-22']), { numRuns: 1, seed: 11 });
    const short: SessionResult = {
      ...s,
      mode: 'timer-only',
      durationSeconds: 75,
      zoneResults: s.zoneResults.map((z) => ({ ...z, secondsBrushed: 0, secondsUntracked: 0 })),
    };
    const view = parentView([short], C, '2026-11-22');
    expect(view.durations!.withGame.text).toBe('Time with the game: 1 min 15 s');
  });
});

describe('parentViewTimerAndUnverifiedNeverCount', () => {
  const dates = windowDates('2026-11-22', 7);
  const today = '2026-11-22';

  it('timer-only sessions never raise "camera saw", change the zone fact or make a nudge appear', () => {
    fc.assert(
      fc.property(withDates(dates, 1), withDates(dates, 0), (base, extra) => {
        const timer = extra.map((s): SessionResult => ({ ...s, mode: 'timer-only' }));
        const before = parentView(base, C, today);
        const after = parentView([...base, ...timer], C, today);
        expect(after.durations!.cameraSaw.seconds).toBe(before.durations!.cameraSaw.seconds);
        expect(after.zoneFact).toEqual(before.zoneFact);
        expect(after.nudge).toEqual(before.nudge);
      }),
    );
  });

  it('timer-only sessions alone give no zone, no nudge and no camera time', () => {
    fc.assert(
      fc.property(withDates(dates, 1), (list) => {
        const timer = list.map((s): SessionResult => ({ ...s, mode: 'timer-only' }));
        const view = parentView(timer, C, today);
        expect(view.zoneFact!.kind).toBe('not-enough');
        expect(view.zoneFact!.zones).toEqual([]);
        expect(view.nudge).toBeNull();
        expect(view.durations!.cameraSaw.seconds).toBe(0);
      }),
    );
  });

  it('an unverified result never raises "camera saw"', () => {
    fc.assert(
      fc.property(withDates(dates, 1), fc.nat({ max: 5 }), (list, seed) => {
        let i = 0;
        const changed = list.map(
          (s): SessionResult => ({
            ...s,
            zoneResults: s.zoneResults.map((z) => ({ ...z, verified: (i++ + seed) % 3 === 0 ? false : z.verified })),
          }),
        );
        const before = parentView(list, C, today).durations!.cameraSaw.seconds;
        const after = parentView(changed, C, today).durations!.cameraSaw.seconds;
        expect(after).toBeLessThanOrEqual(before);
      }),
    );
  });

  it('what an unverified result holds never changes the view', () => {
    fc.assert(
      fc.property(withDates(dates, 1), fc.nat({ max: 5 }), (list, seed) => {
        const make = (brushed: number): SessionResult[] => {
          let i = 0;
          return list.map(
            (s): SessionResult => ({
              ...s,
              zoneResults: s.zoneResults.map((z) =>
                (i++ + seed) % 3 === 0
                  ? { ...z, verified: false, secondsBrushed: brushed, secondsUntracked: 0 }
                  : z,
              ),
            }),
          );
        };
        expect(parentView(make(0), C, today)).toEqual(parentView(make(30), C, today));
      }),
    );
  });

  it('when every result is unverified there is no camera time, no named zone and no nudge', () => {
    fc.assert(
      fc.property(withDates(dates, 1), (list) => {
        const none = list.map(
          (s): SessionResult => ({ ...s, zoneResults: s.zoneResults.map((z) => ({ ...z, verified: false })) }),
        );
        const view = parentView(none, C, today);
        expect(view.durations!.cameraSaw.seconds).toBe(0);
        expect(view.zoneFact!.zones).toEqual([]);
        expect(view.zoneFact!.kind).toBe('not-enough');
        expect(view.nudge).toBeNull();
      }),
    );
  });
});

describe('parentViewTooLittleData', () => {
  const ROW12 = PARENT_TEXT['zone-not-enough'].text;
  const ROW13 = PARENT_TEXT['no-sessions'].text;

  function expectNoSessionsView(view: ParentView): void {
    expect(view.hasSessions).toBe(false);
    expect(view.noSessionsText).toBe(ROW13);
    expect(view.noSessionsText).toBe('No sessions yet.');
    expect(view.daysHeading).toBeNull();
    expect(view.days).toEqual([]);
    expect(view.durations).toBeNull();
    expect(view.zoneFact).toBeNull();
    expect(view.nudge).toBeNull();
    expect(view.disclosure).toEqual(APPROVED_DISCLOSURE);
  }

  it('an empty store gives only "No sessions yet." and still the disclosure', () => {
    expectNoSessionsView(parentView([], C, '2026-11-22'));
  });

  it('a store holding only skipped sessions gives the same view', () => {
    fc.assert(
      fc.property(fc.array(oddSessionArb, { maxLength: 10 }), (odd) => {
        expectNoSessionsView(parentView(odd, C, '2026-11-22'));
      }),
    );
  });

  it('a today that does not parse gives the no-sessions view and does not throw', () => {
    fc.assert(
      fc.property(withDates(windowDates('2026-11-22', 7), 1), fc.constantFrom('', '2026-02-29', '2026-1-1', 'today'), (list, bad) => {
        expectNoSessionsView(parentView(list, C, bad));
      }),
    );
  });

  it('sessions that are all outside the window give seven rows of 0, zero durations and row 12', () => {
    const fourteen = windowDates('2026-11-22', 14);
    const outside = [...fourteen.slice(0, 7), '2026-11-23'];
    fc.assert(
      fc.property(withDates(outside, 1), (list) => {
        const view = parentView(list, C, '2026-11-22');
        expect(view.hasSessions).toBe(true);
        expect(view.days).toHaveLength(7);
        expect(view.days.every((d) => d.count === 0 && d.text.endsWith(': 0'))).toBe(true);
        expect(view.durations!.withGame.text).toBe('Time with the game: 0 min 0 s');
        expect(view.durations!.cameraSaw.text).toBe('Of that, the camera saw brushing: 0 min 0 s');
        expect(view.durations!.timerOnly.text).toBe('Timer only, not checked by the camera: 0 min 0 s');
        expect(view.zoneFact!.text).toBe(ROW12);
        expect(view.zoneFact!.zones).toEqual([]);
        expect(view.nudge).toBeNull();
        expect(view.noSessionsText).toBeNull();
      }),
    );
  });

  it('the too-little-data lines hold no advice or urging', () => {
    for (const text of [ROW12, ROW13]) {
      expect(text).not.toMatch(/brush more|try again|keep going|again|should/i);
    }
  });
});

describe('parentViewDisclosure', () => {
  const today = '2026-11-22';
  const dates = windowDates(today, 7);

  function states(): ParentView[] {
    const some = fc.sample(sessionArb(dates), { numRuns: 6, seed: 3 });
    const outside = fc.sample(sessionArb(['2026-11-01']), { numRuns: 2, seed: 5 });
    return [
      parentView([], C, today), // no sessions, and the state after a clear
      parentView(outside, C, today), // sessions, none in the window
      parentView(some.slice(0, 1), C, today), // too little data
      parentView(some, C, today), // enough data
      parentView(some, C, 'not a date'),
    ];
  }

  it('returns exactly the six approved lines, in order, in every data state', () => {
    for (const view of states()) {
      expect(view.disclosure).toEqual(APPROVED_DISCLOSURE);
      expect(view.disclosure).toHaveLength(6);
      expect(view.disclosureNeedsApproval).toBe(false);
    }
  });

  it('returns the six lines for any valid sessions', () => {
    fc.assert(
      fc.property(caseArb, (c) => {
        expect(parentView(c.sessions, C, c.today).disclosure).toEqual(APPROVED_DISCLOSURE);
      }),
    );
  });

  it('states none of the numbers 15, 20, 36 or 9', () => {
    for (const view of states()) {
      for (const line of view.disclosure) {
        expect(line).not.toMatch(/(^|[^0-9])(15|20|36|9)([^0-9]|$)/);
      }
    }
  });

  it('leaves line 3 out and asks for approval when either constant passed in is true', () => {
    const variants: ParentViewConstants[] = [
      { ...C, REQUIRE_SIDE_MATCH: true },
      { ...C, REQUIRE_LEVEL_MATCH: true },
      { ...C, REQUIRE_SIDE_MATCH: true, REQUIRE_LEVEL_MATCH: true },
    ];
    for (const constants of variants) {
      for (const sessions of [[], fc.sample(sessionArb(dates), { numRuns: 4, seed: 9 })]) {
        const view = parentView(sessions, constants, today);
        expect(view.disclosureNeedsApproval).toBe(true);
        expect(view.disclosure).toEqual([
          APPROVED_DISCLOSURE[0],
          APPROVED_DISCLOSURE[1],
          APPROVED_DISCLOSURE[3],
          APPROVED_DISCLOSURE[4],
          APPROVED_DISCLOSURE[5],
        ]);
        expect(view.disclosure).not.toContain(APPROVED_DISCLOSURE[2]);
      }
    }
  });

  it('GUARD: the real REQUIRE_SIDE_MATCH and REQUIRE_LEVEL_MATCH are false', () => {
    const message =
      'Disclosure line 3 says the camera cannot see which part of the mouth is brushed. ' +
      'Dr. Yatin must approve new wording for line 3 before REQUIRE_SIDE_MATCH or REQUIRE_LEVEL_MATCH becomes true.';
    expect(REQUIRE_SIDE_MATCH, message).toBe(false);
    expect(REQUIRE_LEVEL_MATCH, message).toBe(false);
  });
});

describe('parentView purity', () => {
  it('changes no input and gives the same result twice', () => {
    fc.assert(
      fc.property(caseArb, (c) => {
        const before = JSON.stringify(c.sessions);
        const first = parentView(c.sessions, C, c.today);
        const second = parentView(c.sessions, C, c.today);
        expect(JSON.stringify(c.sessions)).toBe(before);
        expect(second).toEqual(first);
      }),
    );
  });

  it('does not throw for a list that is not a list', () => {
    for (const bad of [null, undefined, 5, 'x', {}] as unknown[]) {
      expect(() => parentView(bad as readonly unknown[], C, '2026-11-22')).not.toThrow();
    }
  });
});
