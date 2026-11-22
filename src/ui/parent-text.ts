// Every parent-facing line of the parent screen, word for word from the approved table
// "Lines for Dr. Yatin to approve" (requirements.md, approved 22 Nov 2026).
// Display-only: shown, never spoken, never in src/audio/lines.ts. Pure: no DOM, no clock.
// Row 4 ("Back") is not repeated here: it stays DISPLAY_TEXT.back.
import type { ZoneId } from '../logic/types';

export type ParentTextId =
  | 'heading'
  | 'gate-instruction'
  | 'gate-label'
  | 'days-heading'
  | 'day-row'
  | 'time-game'
  | 'time-camera'
  | 'time-timer'
  | 'zone-least-one'
  | 'zone-least-many'
  | 'zone-every'
  | 'zone-not-enough'
  | 'no-sessions'
  | 'nudge'
  | 'disclosure-1'
  | 'disclosure-2'
  | 'disclosure-3'
  | 'disclosure-4'
  | 'disclosure-5'
  | 'disclosure-6'
  | 'clear-button'
  | 'clear-confirm'
  | 'clear-keep'
  | 'clear-failed';

export interface ParentTextRow {
  readonly id: ParentTextId;
  /** The row number in "Lines for Dr. Yatin to approve": '1', '2', ..., '10b', ..., '24'. */
  readonly row: string;
  /** May hold {placeholders}: weekday, day, month, n, m, s, zone, zones. */
  readonly text: string;
}

function row(id: ParentTextId, rowNumber: string, text: string): readonly [ParentTextId, ParentTextRow] {
  return [id, { id, row: rowNumber, text }];
}

export const PARENT_TEXT: Readonly<Record<ParentTextId, ParentTextRow>> = Object.fromEntries([
  row('heading', '1', 'Grown-ups'),
  row('gate-instruction', '2', 'Hold the button for 3 seconds.'),
  row('gate-label', '3', 'Hold'),
  row('days-heading', '5', 'Sessions in the last 7 days'),
  row('day-row', '6', '{weekday} {day} {month}: {n}'),
  row('time-game', '7', 'Time with the game: {m} min {s} s'),
  row('time-camera', '8', 'Of that, the camera saw brushing: {m} min {s} s'),
  row('time-timer', '9', 'Timer only, not checked by the camera: {m} min {s} s'),
  row('zone-least-one', '10', 'Brushing was seen least during the {zone} turn.'),
  row('zone-least-many', '10b', 'Brushing was seen least during the {zones} turns.'),
  row('zone-every', '11', 'Brushing was seen in every turn.'),
  row('zone-not-enough', '12', 'Not enough camera sessions yet.'),
  row('no-sessions', '13', 'No sessions yet.'),
  row(
    'nudge',
    '14',
    'During the {zone} turn, brushing was not seen on {n} nights. Try brushing it first tonight.',
  ),
  row('disclosure-1', '15', 'The camera picture stays on this phone. It is never saved or sent.'),
  row(
    'disclosure-2',
    '16',
    'Brushing times and the Monster Book are saved on this phone only, until you press Clear all data.',
  ),
  row(
    'disclosure-3',
    '17',
    'The camera sees a moving hand near the mouth. It cannot see the brush, the teeth, or which part of the mouth is being brushed.',
  ),
  row(
    'disclosure-4',
    '18',
    'In camera sessions, monsters get weaker in turns where brushing was often not seen.',
  ),
  row('disclosure-5', '19', 'A monster that is nearly beaten when the time is up counts as beaten.'),
  row('disclosure-6', '20', 'Every monster your child meets goes into the Monster Book, beaten or not.'),
  row('clear-button', '21', 'Clear all data'),
  row('clear-confirm', '22', 'Clear all data from this phone? It cannot be undone.'),
  row('clear-keep', '23', 'Keep'),
  row('clear-failed', '24', 'The data on this phone could not be cleared.'),
]) as Record<ParentTextId, ParentTextRow>;

/** Row 25: zone names inside rows 10, 10b and 14. */
export const ZONE_NAMES: Readonly<Record<ZoneId, string>> = {
  'upper-right': 'upper-right',
  'upper-left': 'upper-left',
  'lower-left': 'lower-left',
  'lower-right': 'lower-right',
};

/** Three-letter weekday names, indexed like weekdayIndex: 0 = Sunday. */
export const WEEKDAY_NAMES: readonly string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Three-letter month names, indexed month - 1: 0 = January. */
export const MONTH_NAMES: readonly string[] = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** Pieces for a list of zone names: "a, b and c". No comma before "and" (requirement 5.3). */
export const JOIN = { separator: ', ', last: ' and ' } as const;

/** Replaces each {name} in `text`. Throws if a placeholder has no value. */
export function fill(text: string, values: Readonly<Record<string, string | number>>): string {
  return text.replace(/\{([a-z]+)\}/g, (_whole, name: string) => {
    if (!Object.prototype.hasOwnProperty.call(values, name)) {
      throw new Error(`Unfilled placeholder {${name}} in "${text}"`);
    }
    return String(values[name]);
  });
}
