import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const screen = readFileSync('src/ui/session-screen.ts', 'utf8');
const css = readFileSync('src/ui/monster-art.css', 'utf8');

/** The text of the first `{ ... }` block that follows `start` (balanced braces). */
function blockAfter(source: string, start: string): string {
  const from = source.indexOf(start);
  expect(from).toBeGreaterThanOrEqual(0);
  const open = source.indexOf('{', from);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(open, i + 1);
    }
  }
  throw new Error('unbalanced braces');
}

describe('leavingCopySource', () => {
  it('uses animationend and no timer', () => {
    expect(screen).toMatch(/addEventListener\('animationend'/);
    expect(screen).not.toMatch(/setTimeout|setInterval|requestAnimationFrame|requestVideoFrameCallback/);
  });

  it('removes the copy in showStart, on pause and on ended', () => {
    expect(blockAfter(screen, 'showStart(): void')).toMatch(/removeLeaving\(\)/);
    const paint = blockAfter(screen, 'paint(view: View, zoneEnd?: ZoneEnd): void');
    expect(paint).toMatch(/phase === 'ended'\) \{\s*removeLeaving\(\)/);
    expect(paint).toMatch(/phase === 'paused'\) removeLeaving\(\)/);
  });

  it('removes the old copy when the next zone end arrives (one copy at a time)', () => {
    const draw = blockAfter(screen, 'function drawLeaving');
    expect(draw.trimStart().slice(0, 200)).toMatch(/removeLeaving\(\)/);
    expect(screen).toMatch(/let leavingEl: HTMLElement \| null = null/);
  });

  it('does not import DrawValue or draw-value', () => {
    expect(screen).not.toMatch(/DrawValue|draw-value/);
  });

  it('chooses the trapped class by ZONE_ORDER index parity, with no randomness', () => {
    expect(screen).toMatch(/ZONE_ORDER\.indexOf\(zoneEnd\.zoneId\)/);
    expect(screen).toMatch(/index % 2 === 0 \? 'trapped-wave' : 'trapped-sleep'/);
    expect(screen).not.toMatch(/Math\.random/);
  });

  it('has the leaving styles, a reduced-motion fade, and no infinite animation of its own', () => {
    expect(css).toMatch(/\.trapped-wave/);
    expect(css).toMatch(/\.trapped-sleep/);
    expect(css).toMatch(/\.fx-no-leaving/);
    const leavingRules = css.slice(css.indexOf('Leaving copy:'));
    for (const rule of leavingRules.split('}')) {
      if (rule.includes('infinite')) expect(rule).toMatch(/var\(--cycle-/);
    }
    expect(leavingRules).toMatch(/1400ms/);
  });
});
