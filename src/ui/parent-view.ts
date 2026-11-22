// parentView: every number and sentence the parent screen shows after the gate
// (parent-screen design sections 4, 5.3 to 5.6, requirement 13).
// Pure: no DOM, no clock, no randomness, no storage, no network. The painter only paints this result.
import { computeVerifiedTime } from '../logic/stats';
import type { SessionResult } from '../logic/types';
import { daysFromCivil, parseDate, weekdayIndex, windowDates } from './calendar-days';
import { acceptedSessions } from './parent-accept';
import { WINDOW_DAYS, type ParentViewConstants } from './parent-constants';
import { nightsPerZone, nudge as buildNudge, type Nudge } from './parent-nudge';
import { MONTH_NAMES, PARENT_TEXT, WEEKDAY_NAMES, fill, type ParentTextId } from './parent-text';
import { zoneFact as buildZoneFact, type ZoneFact } from './parent-zone-fact';

export type { Nudge } from './parent-nudge';
export type { ZoneFact, ZoneFactKind } from './parent-zone-fact';

export interface DayRow {
  /** YYYY-MM-DD. */
  readonly date: string;
  /** Accepted sessions with this date. */
  readonly count: number;
  /** Row 6, for example "Mon 16 Nov: 2". */
  readonly text: string;
}

export interface DurationLine {
  /** Whole seconds, floored. */
  readonly seconds: number;
  readonly text: string;
}

export interface DurationsView {
  /** Row 7. */
  readonly withGame: DurationLine;
  /** Row 8. */
  readonly cameraSaw: DurationLine;
  /** Row 9. */
  readonly timerOnly: DurationLine;
}

export interface ParentView {
  /** At least one accepted session in the store. */
  readonly hasSessions: boolean;
  /** Row 13 when `hasSessions` is false, else null. */
  readonly noSessionsText: string | null;
  /** Row 5 when `hasSessions`. */
  readonly daysHeading: string | null;
  /** Exactly 7 when `hasSessions`, else []. */
  readonly days: readonly DayRow[];
  readonly durations: DurationsView | null;
  readonly zoneFact: ZoneFact | null;
  readonly nudge: Nudge | null;
  /** Rows 15 to 20 in order; line 3 is left out when a REQUIRE_* constant is true. */
  readonly disclosure: readonly string[];
  /** True only when a REQUIRE_* constant is true (requirement 8.4). */
  readonly disclosureNeedsApproval: boolean;
}

const DISCLOSURE_IDS: readonly ParentTextId[] = [
  'disclosure-1',
  'disclosure-2',
  'disclosure-3',
  'disclosure-4',
  'disclosure-5',
  'disclosure-6',
];
/** Index of disclosure line 3 in `DISCLOSURE_IDS`: true only while no side or level check is on. */
const CAMERA_LIMIT_LINE = 2;

function disclosureFor(constants: ParentViewConstants): { lines: string[]; needsApproval: boolean } {
  const needsApproval = constants.REQUIRE_SIDE_MATCH || constants.REQUIRE_LEVEL_MATCH;
  const lines: string[] = [];
  DISCLOSURE_IDS.forEach((id, i) => {
    if (needsApproval && i === CAMERA_LIMIT_LINE) return;
    lines.push(PARENT_TEXT[id].text);
  });
  return { lines, needsApproval };
}

function dayText(date: string, count: number): string {
  const civil = parseDate(date);
  if (civil === null) return '';
  const weekday = WEEKDAY_NAMES[weekdayIndex(daysFromCivil(civil.year, civil.month, civil.day))];
  return fill(PARENT_TEXT['day-row'].text, {
    weekday,
    day: civil.day,
    month: MONTH_NAMES[civil.month - 1],
    n: count,
  });
}

function duration(id: ParentTextId, totalSeconds: number): DurationLine {
  const seconds = Math.floor(totalSeconds);
  return {
    seconds,
    text: fill(PARENT_TEXT[id].text, { m: Math.floor(seconds / 60), s: seconds % 60 }),
  };
}

/**
 * Everything the parent screen shows after the gate.
 * Skips stored sessions that fail `acceptedSessions`. Never throws, reads no clock, changes no input.
 * `today` is a local YYYY-MM-DD date read once by the caller.
 */
export function parentView(
  sessions: readonly unknown[],
  constants: ParentViewConstants,
  today: string,
): ParentView {
  const disclosure = disclosureFor(constants);
  const accepted = Array.isArray(sessions) ? acceptedSessions(sessions, constants) : [];
  const dates = windowDates(today, WINDOW_DAYS);

  if (accepted.length === 0 || dates.length === 0) {
    return {
      hasSessions: false,
      noSessionsText: PARENT_TEXT['no-sessions'].text,
      daysHeading: null,
      days: [],
      durations: null,
      zoneFact: null,
      nudge: null,
      disclosure: disclosure.lines,
      disclosureNeedsApproval: disclosure.needsApproval,
    };
  }

  const inWindow = new Set(dates);
  const windowSessions: SessionResult[] = accepted.filter((s) => inWindow.has(s.date));

  const days: DayRow[] = dates.map((date) => {
    let count = 0;
    for (const s of windowSessions) if (s.date === date) count += 1;
    return { date, count, text: dayText(date, count) };
  });

  let withGameTotal = 0;
  let timerOnlyTotal = 0;
  for (const s of windowSessions) {
    withGameTotal += s.durationSeconds;
    if (s.mode === 'timer-only') timerOnlyTotal += s.durationSeconds;
  }
  const durations: DurationsView = {
    withGame: duration('time-game', withGameTotal),
    cameraSaw: duration('time-camera', computeVerifiedTime(windowSessions)),
    timerOnly: duration('time-timer', timerOnlyTotal),
  };

  const cameraSessions = windowSessions.filter((s) => s.mode === 'camera');

  return {
    hasSessions: true,
    noSessionsText: null,
    daysHeading: PARENT_TEXT['days-heading'].text,
    days,
    durations,
    zoneFact: buildZoneFact(cameraSessions, constants),
    nudge: buildNudge(nightsPerZone(windowSessions, constants), constants),
    disclosure: disclosure.lines,
    disclosureNeedsApproval: disclosure.needsApproval,
  };
}
