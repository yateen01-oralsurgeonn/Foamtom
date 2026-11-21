import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/ui/title-panel.ts', 'utf8');

describe('titlePanelSource', () => {
  it('has no camera, dynamic import, install prompt, timer, network or storage call', () => {
    for (const banned of [
      'getUserMedia',
      'import(',
      'beforeinstallprompt',
      'setTimeout',
      'setInterval',
      'fetch',
      'setItem',
      'localStorage',
    ]) {
      expect(source.includes(banned), banned).toBe(false);
    }
  });

  it('imports nothing from tracking', () => {
    const imports = source.match(/^import .*$/gm) ?? [];
    expect(imports.length).toBeGreaterThan(0);
    for (const line of imports) expect(line).not.toMatch(/tracking/);
  });

  it('takes its text from DISPLAY_TEXT and lines.ts', () => {
    expect(source).toMatch(/DISPLAY_TEXT\.privacy|DISPLAY_TEXT\['privacy'\]/);
    expect(source).toMatch(/DISPLAY_TEXT\['book-title'\]/);
    expect(source).toMatch(/getLine\('start'\)/);
  });

  it('has no string that mentions mute, sound off or volume', () => {
    expect(source).not.toMatch(/mute|sound off|volume/i);
  });

  it('uses titleControls and TAP_TARGETS', () => {
    expect(source).toMatch(/titleControls\(/);
    expect(source).toMatch(/TAP_TARGETS/);
  });

  it('creates the Monster Book button only when a handler is passed', () => {
    expect(source).toMatch(/if \(!onOpenBook\) continue/);
  });
});
