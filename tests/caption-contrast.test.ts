import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/ui/screens.css', 'utf8');

function hexVar(name: string): string | null {
  const m = new RegExp(`${name}\\s*:\\s*(#[0-9a-fA-F]{6})\\s*;`).exec(css);
  return m ? m[1]! : null;
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4),
  ) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

describe('captionContrast', () => {
  it('--caption-fg and --caption-bg are 6-digit hex values in screens.css', () => {
    expect(hexVar('--caption-fg')).not.toBeNull();
    expect(hexVar('--caption-bg')).not.toBeNull();
  });

  it('their contrast ratio is at least 4.5 to 1', () => {
    const fg = hexVar('--caption-fg')!;
    const bg = hexVar('--caption-bg')!;
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('.caption uses both variables', () => {
    const rule = /\.caption\s*\{[^}]*\}/.exec(css.slice(css.indexOf('Caption plate')));
    expect(rule?.[0]).toContain('var(--caption-bg)');
    expect(rule?.[0]).toContain('var(--caption-fg)');
  });
});
