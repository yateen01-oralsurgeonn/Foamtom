import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(join(__dirname, '..', 'src', 'ui', 'monster-art.css'), 'utf8');

/** The body of the first rule whose selector is exactly `selector`. */
function ruleBody(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`, 'm').exec(css);
  if (!m) throw new Error(`rule ${selector} not found`);
  return m[1];
}

function luminance(hex: string): number {
  const channel = (i: number): number => {
    const c = parseInt(hex.slice(1 + 2 * i, 3 + 2 * i), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
}

function contrastAgainstWhite(hex: string): number {
  return 1.05 / (luminance(hex) + 0.05);
}

describe('smokeOutlineReadable', () => {
  const puff = ruleBody('.smoke__puff');

  it('gives the puff outline as a 6-digit hex that is not near-white and has contrast of at least 3 to 1 against white', () => {
    const m = /border-color:\s*(#[0-9a-fA-F]{6})\s*;/.exec(puff);
    expect(m).not.toBeNull();
    const hex = m![1];
    expect(hex.toLowerCase()).not.toBe('#f4eefc');
    expect(contrastAgainstWhite(hex)).toBeGreaterThanOrEqual(3);
  });

  it('holds the 1.2 size multiplier and uses it for every puff size', () => {
    expect(puff).toMatch(/--smoke-size-mult:\s*1\.2\s*;/);
    for (const name of ['a', 'b', 'c']) {
      const body = ruleBody(`.smoke__puff--${name}`);
      expect(body).toMatch(/width:\s*calc\(\d+px \* var\(--smoke-size-mult\)\)/);
      expect(body).toMatch(/height:\s*calc\(\d+px \* var\(--smoke-size-mult\)\)/);
    }
  });

  it('keeps the puff sizes 20 % above the old ones (38, 44, 32 px)', () => {
    const base: Record<string, number> = { a: 38, b: 44, c: 32 };
    for (const [name, px] of Object.entries(base)) {
      const body = ruleBody(`.smoke__puff--${name}`);
      const m = /width:\s*calc\((\d+)px \* var/.exec(body);
      expect(Number(m![1])).toBe(px);
    }
  });

  it('leaves the puff drift duration on its cycle variable', () => {
    expect(puff).toMatch(/var\(--cycle-smoke-drift\)/);
  });
});
