import { describe, expect, it } from 'vitest';
import { getLine } from '../src/audio/lines';

// The seven lines that existed before the mirror-and-screens spec. Their text and caption
// are fixed (requirements 14.2, 15.7).
const PINNED: ReadonlyArray<readonly [string, string]> = [
  ['start', 'Tap to brush for two minutes!'],
  ['zone-upper-right', 'A ghoul is hiding upper right!'],
  ['zone-upper-left', 'A ghoul is hiding upper left!'],
  ['zone-lower-left', 'A ghoul is hiding lower left!'],
  ['zone-lower-right', 'A ghoul is hiding lower right!'],
  ['smoke', 'Keep brushing! Brush the smoke away!'],
  ['end', 'Well done! Two minutes of brushing!'],
];

describe('existingLinesPinned', () => {
  it('the seven existing lines keep their exact text and caption', () => {
    for (const [id, words] of PINNED) {
      const line = getLine(id);
      expect(line, id).toBeDefined();
      expect(line?.text, `${id} text`).toBe(words);
      expect(line?.caption, `${id} caption`).toBe(words);
    }
  });

  it('end-close has the text and caption "Two minutes. Every corner."', () => {
    const line = getLine('end-close');
    expect(line).toBeDefined();
    expect(line?.text).toBe('Two minutes. Every corner.');
    expect(line?.caption).toBe('Two minutes. Every corner.');
  });
});
