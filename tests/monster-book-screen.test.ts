import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/ui/monster-book-screen.ts', 'utf8');

describe('bookScreenIsReadOnly', () => {
  it('has no storage write, dynamic import, camera, timer or network call', () => {
    for (const banned of [
      'saveSession',
      'setItem',
      'localStorage',
      'import(',
      'getUserMedia',
      'setTimeout',
      'setInterval',
      'fetch',
    ]) {
      expect(source.includes(banned), banned).toBe(false);
    }
  });

  it('imports nothing from tracking, the mirror frame or the frame guidance', () => {
    const imports = source.match(/^import .*$/gm) ?? [];
    expect(imports.length).toBeGreaterThan(0);
    for (const line of imports) {
      expect(line).not.toMatch(/tracking|mirror-frame|frame-guidance/);
    }
  });

  it('reads the sessions through bookViewFromLoader', () => {
    expect(source).toMatch(/bookViewFromLoader\(/);
  });

  it('takes its text from DISPLAY_TEXT and the monsters name field', () => {
    expect(source).toMatch(/DISPLAY_TEXT\.back|DISPLAY_TEXT\['back'\]/);
    expect(source).toMatch(/DISPLAY_TEXT\['book-title'\]/);
    expect(source).toMatch(/DISPLAY_TEXT\['not-met'\]/);
    expect(source).toMatch(/entry\.name/);
  });

  it('has no padlock or cross character', () => {
    // U+1F512 padlock, U+1F513 open padlock, U+2715 U+2716 U+274C crosses, U+2717 U+2718 ballot marks.
    expect(source).not.toMatch(/[\u{1F512}\u{1F513}\u2715\u2716\u274C\u2717\u2718]/u);
    expect(source).not.toMatch(/\\u\{?(1F512|1F513|2715|2716|274C)\}?/i);
  });

  it('sizes its controls from TAP_TARGETS', () => {
    expect(source).toMatch(/TAP_TARGETS\.bookBack/);
    expect(source).toMatch(/TAP_TARGETS\.bookCell/);
  });
});
