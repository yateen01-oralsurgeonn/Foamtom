import { describe, expect, it } from 'vitest';
import { DISPLAY_TEXT } from '../src/ui/display-text';
import { MONSTERS } from '../src/logic/monsters';
import { getLine } from '../src/audio/lines';

// Approved lines 1, 16, 17 and 19 of requirements.md (21 Nov 2026). Row 18 was added in task 36.
const APPROVED = {
  privacy: 'The camera stays on this phone. Nothing is saved or sent.',
  'book-title': 'Monster Book',
  back: 'Back',
  'grown-ups': 'Grown-ups',
  'not-met': 'Not met yet',
} as const;

// Approved lines 4 to 15, in table order.
const APPROVED_NAMES = [
  'Plaque Puff',
  'Sugar Sprite',
  'Gummy Gloop',
  'Fuzzlefang',
  'Crumb Goblin',
  'Sticky Wisp',
  'Molar Mumbler',
  'Tartar Tot',
  'Midnight Molar Ghoul',
  'Dawn Drool Dragon',
  'Moonlit Mint Phantom',
  'Twilight Toffee Wraith',
];

describe('displayTextPinned', () => {
  it('DISPLAY_TEXT equals the approved strings exactly', () => {
    expect(Object.keys(DISPLAY_TEXT).sort()).toEqual(Object.keys(APPROVED).sort());
    for (const [id, text] of Object.entries(APPROVED)) {
      const row = DISPLAY_TEXT[id as keyof typeof APPROVED];
      expect(row.id).toBe(id);
      expect(row.text).toBe(text);
    }
  });

  it('the kinds are shown, shown, shown, shown and name-only (grown-ups shown since 23 Nov 2026)', () => {
    expect(DISPLAY_TEXT.privacy.kind).toBe('shown');
    expect(DISPLAY_TEXT['book-title'].kind).toBe('shown');
    expect(DISPLAY_TEXT.back.kind).toBe('shown');
    expect(DISPLAY_TEXT['grown-ups'].kind).toBe('shown');
    expect(DISPLAY_TEXT['grown-ups'].text).toBe('Grown-ups');
    expect(DISPLAY_TEXT['not-met'].kind).toBe('name-only');
  });

  it('lines.ts has rare-invite with text and caption "Brush morning AND night."', () => {
    const line = getLine('rare-invite');
    expect(line).toBeDefined();
    expect(line?.text).toBe('Brush morning AND night.');
    expect(line?.caption).toBe('Brush morning AND night.');
  });

  it('the monster names are the twelve approved ones, in order', () => {
    expect(MONSTERS.map((m) => m.name)).toEqual(APPROVED_NAMES);
  });
});
