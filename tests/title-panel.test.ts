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

  it('creates the parent control only in a branch that needs the handler', () => {
    expect(source).toMatch(/titleControls\(onParentOpen !== undefined\)/);
    expect(source).toMatch(/if \(!onParentOpen\) continue/);
    // exactly one place builds the control, and it is the branch for the 'parent' control
    const branch = source.indexOf("control.id === 'parent'");
    expect(branch).toBeGreaterThan(-1);
    expect(source.indexOf('icon-button')).toBeGreaterThan(branch);
    expect(source.split('icon-button icon-button--quiet').length - 1).toBe(1);
  });

  it('gives the parent control its name from DISPLAY_TEXT and its size from TAP_TARGETS', () => {
    expect(source).toMatch(/DISPLAY_TEXT\['grown-ups'\]/);
    expect(source).toMatch(/TAP_TARGETS\[control\.target/);
  });

  it('builds no bypass and no padlock in the parent control', () => {
    expect(source).not.toMatch(/bypass|padlock|\u{1F512}|\u{1F513}/iu);
  });

  it('is the only file with a parent control: the session screen creates none', () => {
    const screenSource = readFileSync('src/ui/session-screen.ts', 'utf8');
    expect(screenSource).not.toMatch(/icon-button|grown-ups/);
    expect(screenSource).toMatch(/onParentOpen: handlers\.onOpenParent/);
    const endCardSource = readFileSync('src/ui/end-card.ts', 'utf8');
    expect(endCardSource).not.toMatch(/grown-ups|onOpenParent|onParentOpen/);
  });
});
