import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// camera-preview.ts is browser code, so these tests scan its source (task 6.3).
const SOURCE = readFileSync('src/ui/camera-preview.ts', 'utf8');
const CSS = readFileSync('src/ui/styles.css', 'utf8');

// Comments may name the forbidden things in words; only code is scanned.
const CODE = SOURCE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('cameraPreviewSource', () => {
  it.each(['toDataURL', 'toBlob', 'MediaRecorder', 'captureStream', 'console.', 'setInterval', 'setTimeout'])(
    'does not use %s',
    (word) => {
      expect(CODE).not.toContain(word);
    },
  );

  it('has no capture, record or share control', () => {
    expect(CODE).not.toMatch(/<button/i);
    expect(CODE).not.toMatch(/createElement\(\s*['"`]button/i);
    expect(CODE).not.toMatch(/screenshot|record|share|navigator\.share|getDisplayMedia/i);
  });

  it('applies the mirror only through the CSS class', () => {
    // No inline mirror of the stage or the video; the only scaleX is the monster's own flip back.
    expect(CODE).toContain("MIRROR_CLASS = 'preview--mirrored'");
    expect(CODE).toMatch(/stage\.className\s*=\s*`preview \$\{MIRROR_CLASS\}`/);
    const flips = CODE.match(/scaleX\(/g) ?? [];
    expect(flips).toHaveLength(1);
    expect(CODE).toMatch(/slot\.style\.transform[^\n]*scaleX\(-1\)/);
    expect(CODE).not.toMatch(/(stage|video)\.style\.transform/);
    expect(CODE).not.toMatch(/(stage|video)\.style\.setProperty/);

    const rule = CSS.match(/\.preview--mirrored\s*\{([^}]*)\}/);
    expect(rule).not.toBeNull();
    expect(rule![1]).toContain('transform: scaleX(-1)');
  });

  it('flips the monster back in the stylesheet and keeps a transition on position', () => {
    expect(CSS).toMatch(/\.preview__monster--plain\s*\{[^}]*scaleX\(-1\)/);
    expect(CSS).toMatch(/\.preview__monster\s*\{[^}]*transition:[^;]*left/);
  });

  it('exposes attach, placeMonster and destroy', () => {
    expect(CODE).toMatch(/attach\(source: CameraSignalSource\)/);
    expect(CODE).toMatch(/placeMonster\(anchor: Anchor \| null\)/);
    expect(CODE).toMatch(/destroy\(\)/);
  });

  it('keeps styles in the stylesheet or element.style (no style element, no URL)', () => {
    expect(CODE).not.toMatch(/createElement\(\s*['"`]style/);
    expect(CODE).not.toMatch(/https?:\/\//);
  });
});
