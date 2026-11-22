import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { JOIN, MONTH_NAMES, PARENT_TEXT, WEEKDAY_NAMES, ZONE_NAMES, fill } from '../src/ui/parent-text';
import { LINES } from '../src/audio/lines';
import { DISPLAY_TEXT } from '../src/ui/display-text';
import fc from 'fast-check';
import type { SessionResult } from '../src/logic/types';
import { windowDates } from '../src/ui/calendar-days';
import { PARENT_VIEW_CONSTANTS } from '../src/ui/parent-constants';
import { parentView, type ParentView } from '../src/ui/parent-view';
import { sessionArb, todayArb } from './fixtures/parent-sessions';

// Design test 10, table part (parentTextPinned). parent-screen requirements 10.1 to 10.6,
// 11.1 to 11.4, 13.4.

/** The approved strings, copied from "Lines for Dr. Yatin to approve" (rows 1, 2, 3, 5 to 24). */
const APPROVED: ReadonlyArray<readonly [string, string, string]> = [
  ['heading', '1', 'Grown-ups'],
  ['gate-instruction', '2', 'Hold the button for 3 seconds.'],
  ['gate-label', '3', 'Hold'],
  ['days-heading', '5', 'Sessions in the last 7 days'],
  ['day-row', '6', '{weekday} {day} {month}: {n}'],
  ['time-game', '7', 'Time with the game: {m} min {s} s'],
  ['time-camera', '8', 'Of that, the camera saw brushing: {m} min {s} s'],
  ['time-timer', '9', 'Timer only, not checked by the camera: {m} min {s} s'],
  ['zone-least-one', '10', 'Brushing was seen least during the {zone} turn.'],
  ['zone-least-many', '10b', 'Brushing was seen least during the {zones} turns.'],
  ['zone-every', '11', 'Brushing was seen in every turn.'],
  ['zone-not-enough', '12', 'Not enough camera sessions yet.'],
  ['no-sessions', '13', 'No sessions yet.'],
  [
    'nudge',
    '14',
    'During the {zone} turn, brushing was not seen on {n} nights. Try brushing it first tonight.',
  ],
  ['disclosure-1', '15', 'The camera picture stays on this phone. It is never saved or sent.'],
  [
    'disclosure-2',
    '16',
    'Brushing times and the Monster Book are saved on this phone only, until you press Clear all data.',
  ],
  [
    'disclosure-3',
    '17',
    'The camera sees a moving hand near the mouth. It cannot see the brush, the teeth, or which part of the mouth is being brushed.',
  ],
  [
    'disclosure-4',
    '18',
    'In camera sessions, monsters get weaker in turns where brushing was often not seen.',
  ],
  ['disclosure-5', '19', 'A monster that is nearly beaten when the time is up counts as beaten.'],
  ['disclosure-6', '20', 'Every monster your child meets goes into the Monster Book, beaten or not.'],
  ['clear-button', '21', 'Clear all data'],
  ['clear-confirm', '22', 'Clear all data from this phone? It cannot be undone.'],
  ['clear-keep', '23', 'Keep'],
  ['clear-failed', '24', 'The data on this phone could not be cleared.'],
];

const BANNED_STEMS = [
  'risk',
  'danger',
  'disease',
  'decay',
  'cavity',
  'prevent',
  'cure',
  'guarantee',
  'diagnos',
  'clinic',
  'doctor',
  'missed',
  'skipped',
];
const URGING = ['again', 'streak', 'keep going', 'brush more', 'you should', "don't forget"];

/** Banned stems and urging phrases found in `text`, case-insensitive. */
function wordingProblems(text: string): string[] {
  const lower = text.toLowerCase();
  return [...BANNED_STEMS, ...URGING].filter((w) => lower.includes(w));
}

function linkProblems(text: string): string[] {
  const found: string[] = [];
  if (/\d{7,}/.test(text)) found.push('digit run');
  if (text.includes('@')) found.push('@');
  if (/www/i.test(text)) found.push('www');
  if (/http/i.test(text)) found.push('http');
  return found;
}

describe('parentTextPinned (table)', () => {
  it('the table equals the approved strings, ids and row numbers exactly', () => {
    const rows = Object.values(PARENT_TEXT);
    expect(rows.length).toBe(APPROVED.length);
    for (const [id, rowNumber, text] of APPROVED) {
      const found = (PARENT_TEXT as Record<string, { id: string; row: string; text: string }>)[id];
      expect(found, id).toBeDefined();
      expect(found.id).toBe(id);
      expect(found.row).toBe(rowNumber);
      expect(found.text).toBe(text);
    }
  });

  it('row 4 "Back" is not duplicated: it stays DISPLAY_TEXT.back', () => {
    expect(Object.values(PARENT_TEXT).some((r) => r.row === '4')).toBe(false);
    expect(DISPLAY_TEXT.back.text).toBe('Back');
  });

  it('ZONE_NAMES are the four approved names', () => {
    expect(ZONE_NAMES).toEqual({
      'upper-right': 'upper-right',
      'upper-left': 'upper-left',
      'lower-left': 'lower-left',
      'lower-right': 'lower-right',
    });
  });

  it('weekday and month names are three-letter names; JOIN holds the two pieces', () => {
    expect(WEEKDAY_NAMES).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
    expect(MONTH_NAMES).toEqual(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']);
    expect(JOIN.separator).toBe(', ');
    expect(JOIN.last).toBe(' and ');
  });

  it('no row id appears in src/audio/lines.ts', () => {
    const source = readFileSync(join(process.cwd(), 'src/audio/lines.ts'), 'utf8');
    const lineIds = LINES.map((l) => l.id);
    for (const row of Object.values(PARENT_TEXT)) {
      expect(lineIds, row.id).not.toContain(row.id);
      expect(source.includes(`'${row.id}'`) || source.includes(`"${row.id}"`), row.id).toBe(false);
    }
  });

  it('no banned stem and no urging phrase appears in any row, zone name or date name', () => {
    const texts = [
      ...Object.values(PARENT_TEXT).map((r) => r.text),
      ...Object.values(ZONE_NAMES),
      ...WEEKDAY_NAMES,
      ...MONTH_NAMES,
    ];
    for (const text of texts) expect(wordingProblems(text), text).toEqual([]);
  });

  it('no run of 7 or more digits, no @, www or http in any row', () => {
    for (const row of Object.values(PARENT_TEXT)) expect(linkProblems(row.text), row.id).toEqual([]);
  });

  it('the wording matcher flags the banned forms and passes the nudge', () => {
    expect(wordingProblems('The upper-left turn was missed')).toContain('missed');
    expect(wordingProblems('It prevents problems')).toContain('prevent');
    expect(wordingProblems('This is risky')).toContain('risk');
    expect(wordingProblems('Do not skip... skipped')).toContain('skipped');
    expect(wordingProblems('Try again')).toContain('again');
    expect(wordingProblems(PARENT_TEXT.nudge.text)).toEqual([]);
    expect(linkProblems('call 12345678')).toEqual(['digit run']);
    expect(linkProblems('a@b www.x http://y')).toEqual(['@', 'www', 'http']);
  });

  it('fill replaces every placeholder and throws on an unfilled one', () => {
    expect(fill(PARENT_TEXT['day-row'].text, { weekday: 'Mon', day: 16, month: 'Nov', n: 2 })).toBe('Mon 16 Nov: 2');
    expect(fill(PARENT_TEXT.nudge.text, { zone: ZONE_NAMES['upper-right'], n: 3 })).toBe(
      'During the upper-right turn, brushing was not seen on 3 nights. Try brushing it first tonight.',
    );
    expect(fill('No placeholders.', {})).toBe('No placeholders.');
    expect(() => fill('Hello {name}', {})).toThrow();
    expect(() => fill(PARENT_TEXT['time-game'].text, { m: 1 })).toThrow();
  });
});


// Design test 10, sentence part (parentTextPinned). Every sentence parentView returns matches one
// approved template with only a number, a date part or a zone name filled in.

const ZONE_PATTERN = '(?:upper-right|upper-left|lower-left|lower-right)';
const PLACEHOLDER_PATTERNS: Record<string, string> = {
  weekday: `(?:${WEEKDAY_NAMES.join('|')})`,
  day: '[1-9]\\d?',
  month: `(?:${MONTH_NAMES.join('|')})`,
  n: '\\d+',
  m: '\\d+',
  s: '\\d+',
  zone: ZONE_PATTERN,
  zones: `${ZONE_PATTERN}(?:, ${ZONE_PATTERN})* and ${ZONE_PATTERN}`,
};

function templateRegex(template: string): RegExp {
  const escaped = template.replace(/[.*+?^$()|[\]\\]/g, '\\$&');
  const body = escaped.replace(/\{([a-z]+)\}/g, (_w, name: string) => PLACEHOLDER_PATTERNS[name]);
  return new RegExp(`^${body}$`);
}

const TEMPLATE_REGEXES = Object.values(PARENT_TEXT).map((r) => templateRegex(r.text));

/** True when `sentence` is one approved template with only allowed fills. */
function matchesApprovedTemplate(sentence: string): boolean {
  return TEMPLATE_REGEXES.some((re) => re.test(sentence));
}

/** Every sentence a ParentView holds. */
function sentencesOf(view: ParentView): string[] {
  const out: string[] = [...view.disclosure];
  if (view.noSessionsText !== null) out.push(view.noSessionsText);
  if (view.daysHeading !== null) out.push(view.daysHeading);
  for (const d of view.days) out.push(d.text);
  if (view.durations !== null) {
    out.push(view.durations.withGame.text, view.durations.cameraSaw.text, view.durations.timerOnly.text);
  }
  if (view.zoneFact !== null) out.push(view.zoneFact.text);
  if (view.nudge !== null) out.push(view.nudge.text);
  return out;
}

/** A camera night session in which brushing was verified and not seen in the zones set to 'zero'. */
function shapedSession(
  s: SessionResult,
  shape: ReadonlyArray<'keep' | 'zero' | 'full'>,
  quiet: boolean,
): SessionResult {
  if (!quiet) return s;
  return {
    ...s,
    mode: 'camera',
    timeOfDay: 'night',
    zoneResults: s.zoneResults.map((z, i) => {
      if (shape[i] === 'keep') return { ...z, verified: true };
      const brushed = shape[i] === 'full' ? 30 : 0;
      return { ...z, verified: true, secondsBrushed: brushed, secondsUntracked: 0 };
    }),
  };
}

describe('parentTextPinned (sentences)', () => {
  it('every sentence parentView returns is one approved template with only allowed fills', () => {
    const arb = todayArb.chain((today) => {
      const dates = [...windowDates(today, 14), today];
      const shaped = fc
        .tuple(
          sessionArb(dates),
          fc.array(fc.constantFrom<'keep' | 'zero' | 'full'>('keep', 'zero', 'full'), { minLength: 4, maxLength: 4 }),
          fc.boolean(),
        )
        .map(([s, shape, quiet]) => shapedSession(s, shape, quiet));
      return fc.array(shaped, { maxLength: 14 }).map((sessions) => ({ today, sessions }));
    });
    fc.assert(
      fc.property(arb, ({ today, sessions }) => {
        const view = parentView(sessions, PARENT_VIEW_CONSTANTS, today);
        for (const sentence of sentencesOf(view)) {
          expect(matchesApprovedTemplate(sentence), sentence).toBe(true);
          expect(wordingProblems(sentence), sentence).toEqual([]);
          expect(linkProblems(sentence), sentence).toEqual([]);
        }
      }),
    );
  });

  it('covers the nudge and a four-turn tie in a hand-built case', () => {
    const today = '2026-11-22';
    const [base] = fc.sample(sessionArb([today]), { numRuns: 1, seed: 5 });
    const quiet = (date: string): SessionResult =>
      shapedSession({ ...base, date }, ['zero', 'zero', 'zero', 'zero'], true);
    const sessions = [quiet('2026-11-20'), quiet('2026-11-21'), quiet('2026-11-22')];
    const view = parentView(sessions, PARENT_VIEW_CONSTANTS, today);
    expect(view.nudge?.text).toBe(
      'During the upper-right turn, brushing was not seen on 3 nights. Try brushing it first tonight.',
    );
    expect(view.zoneFact?.text).toBe(
      'Brushing was seen least during the upper-right, upper-left, lower-left and lower-right turns.',
    );
    const sentences = sentencesOf(view);
    expect(sentences).toContain(view.nudge!.text);
    expect(sentences).toContain(view.zoneFact!.text);
    for (const sentence of sentences) expect(matchesApprovedTemplate(sentence), sentence).toBe(true);
  });

  it('the template matcher flags "was missed", "prevents" and "risky" and passes the nudge', () => {
    const nudge = 'During the upper-right turn, brushing was not seen on 3 nights. Try brushing it first tonight.';
    expect(matchesApprovedTemplate(nudge)).toBe(true);
    expect(matchesApprovedTemplate('The upper-left turn was missed.')).toBe(false);
    expect(matchesApprovedTemplate('Brushing prevents problems.')).toBe(false);
    expect(matchesApprovedTemplate('Brushing was seen least during the risky turn.')).toBe(false);
    expect(matchesApprovedTemplate('During the upper-right turn, brushing was not seen on 3 nights.')).toBe(false);
    expect(matchesApprovedTemplate('During the middle turn, brushing was not seen on 3 nights. Try brushing it first tonight.')).toBe(
      false,
    );
    expect(wordingProblems('The upper-left turn was missed.')).toContain('missed');
    expect(wordingProblems('Brushing prevents problems.')).toContain('prevent');
    expect(wordingProblems('Brushing was seen least during the risky turn.')).toContain('risk');
    expect(wordingProblems(nudge)).toEqual([]);
  });
});
