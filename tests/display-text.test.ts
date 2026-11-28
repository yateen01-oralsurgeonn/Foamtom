import { describe, expect, it } from 'vitest';
import { DISPLAY_TEXT } from '../src/ui/display-text';
import { MONSTERS } from '../src/logic/monsters';
import { getLine } from '../src/audio/lines';

// Approved lines 1, 16, 17 and 19 of requirements.md (21 Nov 2026). Row 18 was added in task 36.
const APPROVED = {
  privacy: 'The camera picture stays on this phone. It is never saved or sent.',
  'book-title': 'Monster Book',
  back: 'Back',
  'grown-ups': 'Grown-ups',
  'not-met': 'Not met yet',
  // Approved lines 20 to 23 (Dr. Yatin, 28 Nov 2026).
  subtitle: 'The 2-minute toothbrushing game',
  'step-brush': 'Pick up your brush',
  'step-monsters': 'Monsters hide on your teeth',
  'step-away': 'Brush them away!',
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

  it('the four first-sight lines have the exact approved strings and are shown (28 Nov 2026)', () => {
    expect(DISPLAY_TEXT.subtitle.text).toBe('The 2-minute toothbrushing game');
    expect(DISPLAY_TEXT['step-brush'].text).toBe('Pick up your brush');
    expect(DISPLAY_TEXT['step-monsters'].text).toBe('Monsters hide on your teeth');
    expect(DISPLAY_TEXT['step-away'].text).toBe('Brush them away!');
    for (const id of ['subtitle', 'step-brush', 'step-monsters', 'step-away'] as const) {
      expect(DISPLAY_TEXT[id].kind, id).toBe('shown');
    }
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
