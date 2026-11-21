import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const FILES = ['src/ui/mirror-frame.ts', 'src/ui/frame-art.ts'];
const sources = FILES.map((f) => ({ file: f, text: readFileSync(f, 'utf8') }));

describe('decorativeFrame (source)', () => {
  it('marks the deco element aria-hidden', () => {
    const frame = readFileSync('src/ui/mirror-frame.ts', 'utf8');
    expect(frame).toContain("mirror-frame__deco");
    expect(frame).toMatch(/setAttribute\(\s*'aria-hidden'\s*,\s*'true'\s*\)/);
  });

  it('builds the structure of the design', () => {
    const frame = readFileSync('src/ui/mirror-frame.ts', 'utf8');
    for (const name of ['mirror-frame', 'mirror-frame__deco', 'mirror-frame__glass', 'frame-fog', 'frame-region', 'frame-glow']) {
      expect(frame).toContain(name);
    }
    for (const name of ['frame-region--active', 'frame-region--dim', 'frame-region--off', 'frame-region--flicker']) {
      expect(frame).toContain(name);
    }
    expect(frame).toContain('setProperty');
  });

  it('has no scaleX and never mentions the mirrored preview', () => {
    for (const { file, text } of sources) {
      expect(text, file).not.toContain('scaleX');
      expect(text, file).not.toContain('preview--mirrored');
    }
  });

  it('has no innerHTML, style attribute or style element', () => {
    for (const { file, text } of sources) {
      expect(text, file).not.toContain('innerHTML');
      expect(text, file).not.toContain('style=');
      expect(text, file).not.toContain('<style');
    }
  });

  it('chooses no side by ternary and has no raw- string', () => {
    for (const { file, text } of sources) {
      expect(text, file).not.toContain("? 'left' : 'right'");
      expect(text, file).not.toContain("? 'right' : 'left'");
      expect(text, file).not.toContain('raw-');
    }
  });

  it('builds SVG only through createElementNS', () => {
    const art = readFileSync('src/ui/frame-art.ts', 'utf8');
    expect(art).toContain('createElementNS');
    expect(art).not.toMatch(/createElement\(\s*'svg'/);
  });
});
