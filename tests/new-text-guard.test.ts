import { describe, expect, it } from 'vitest';
import { DISPLAY_TEXT } from '../src/ui/display-text';
import { MONSTERS } from '../src/logic/monsters';
import { getLine } from '../src/audio/lines';

// Core banned list (requirement 14.4). The camera-and-light rule is not applied: the
// privacy line has to say "camera".
const CORE_BANNED = [
  'prevent',
  'cure',
  'cavity-free',
  'guarantee',
  'diagnose',
  'clinic',
  'doctor',
  'almost',
  'lost',
  'lose',
  'failed',
  'missed',
];
// Urging and scary words.
const SECOND_LIST = [
  'again',
  'tomorrow',
  'come back',
  'streak',
  'hurry',
  'blood',
  'gore',
  'kill',
  'die',
  'dead',
  'hurt',
  'scream',
];

/** Returns the banned words found in `text`, matched as whole words on lower-case text. */
function bannedWordsIn(text: string): string[] {
  const lower = text.toLowerCase();
  return [...CORE_BANNED, ...SECOND_LIST].filter((word) =>
    new RegExp(`(^|[^a-z])${word}([^a-z]|$)`).test(lower),
  );
}

// One array of every new text to check. Tasks 33 and 36 add `rare-invite` and `grown-ups`.
const CHECKED_TEXTS: ReadonlyArray<readonly [string, string]> = [
  ...Object.values(DISPLAY_TEXT).map((row) => [`display-text ${row.id}`, row.text] as const),
  // The caption shown for a monster is its name, so one string covers both.
  ...MONSTERS.map((m) => [`monster ${m.id}`, m.name] as const),
  ['line end-close text', getLine('end-close')?.text ?? ''],
  ['line end-close caption', getLine('end-close')?.caption ?? ''],
];

describe('newTextGuard', () => {
  it('the matcher passes the rare names and flags whole words only', () => {
    expect(bannedWordsIn('Twilight Toffee Wraith')).toEqual([]);
    expect(bannedWordsIn('Midnight Molar Ghoul')).toEqual([]);
    expect(bannedWordsIn('Do not die')).toEqual(['die']);
    expect(bannedWordsIn('Diet')).toEqual([]);
    expect(bannedWordsIn('Come back soon')).toEqual(['come back']);
  });

  it('the checked list holds every row, all twelve names and end-close', () => {
    expect(CHECKED_TEXTS.length).toBe(Object.keys(DISPLAY_TEXT).length + 12 + 2);
    expect(CHECKED_TEXTS.map(([label]) => label)).toContain('display-text grown-ups');
    for (const [label, text] of CHECKED_TEXTS) expect(text, label).not.toBe('');
  });

  it('no new text contains a banned, urging or scary word', () => {
    for (const [label, text] of CHECKED_TEXTS) {
      expect(bannedWordsIn(text), label).toEqual([]);
    }
  });
});
