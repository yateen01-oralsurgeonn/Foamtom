import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { PARENT_TAP_TARGETS } from '../src/ui/parent-constants';
import { TAP_TARGETS } from '../src/ui/tap-targets';

// Design test 16 (parentCss). Source scan of src/ui/parent-screen.css and index.html.

const RAW = readFileSync('src/ui/parent-screen.css', 'utf8');
const CSS = RAW.replace(/\/\*[\s\S]*?\*\//g, '');

function hexVar(name: string): string | null {
  const m = new RegExp(`${name}\\s*:\\s*(#[0-9a-fA-F]{6})\\s*;`).exec(CSS);
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

/** Selector lists and bodies of leaf rules, with @media blocks flattened. */
function leafRules(text: string): Array<{ selectors: string[]; body: string }> {
  const rules: Array<{ selectors: string[]; body: string }> = [];
  let i = 0;
  while (i < text.length) {
    const open = text.indexOf('{', i);
    if (open === -1) break;
    const head = text.slice(i, open).trim();
    let depth = 1;
    let j = open + 1;
    while (j < text.length && depth > 0) {
      if (text[j] === '{') depth += 1;
      else if (text[j] === '}') depth -= 1;
      j += 1;
    }
    const body = text.slice(open + 1, j - 1);
    if (/^@(media|supports)/.test(head)) rules.push(...leafRules(body));
    else if (!head.startsWith('@')) rules.push({ selectors: head.split(',').map((s) => s.trim()), body });
    i = j;
  }
  return rules;
}

const RULES = leafRules(CSS);

function bodiesFor(selector: string): string[] {
  return RULES.filter((r) => r.selectors.includes(selector)).map((r) => r.body);
}

describe('parentCss', () => {
  it('--parent-fg and --parent-bg are 6-digit hex with a contrast ratio of at least 4.5', () => {
    const fg = hexVar('--parent-fg');
    const bg = hexVar('--parent-bg');
    expect(fg).not.toBeNull();
    expect(bg).not.toBeNull();
    expect(contrast(fg!, bg!)).toBeGreaterThanOrEqual(4.5);
  });

  it('every interactive class has a :focus-visible rule', () => {
    const interactive = [
      'gate-button',
      'parent__back',
      'parent-clear__button',
      'parent-clear__confirm-clear',
      'parent-clear__keep',
    ];
    for (const name of interactive) {
      const bodies = bodiesFor(`.${name}:focus-visible`);
      expect(bodies.length, name).toBeGreaterThan(0);
      expect(bodies.join(' '), name).toMatch(/outline:\s*\d+px solid/);
    }
  });

  it('the gate button sets touch-action: none and user-select: none', () => {
    const body = bodiesFor('.gate-button').join(' ');
    expect(body).toMatch(/touch-action:\s*none/);
    expect(body).toMatch(/(^|[^-])user-select:\s*none/);
    expect(body).toMatch(/-webkit-touch-callout:\s*none/);
  });

  it('has a prefers-reduced-motion block that hides the ring and keeps the dots', () => {
    const block = /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?\})\s*\}/.exec(CSS);
    expect(block).not.toBeNull();
    const inner = block![1]!;
    expect(inner).toMatch(/\.gate__ring\s*\{[^}]*display:\s*none/);
    expect(inner).not.toContain('.gate__dot');
    // The dots are shown outside the block and fill by data-step in whole steps.
    expect(bodiesFor('.gate__dot').join(' ')).not.toMatch(/display:\s*none/);
    for (const step of ['1', '2', '3']) {
      expect(CSS).toContain(`[data-step='${step}']`);
    }
  });

  it('the ring is driven by --gate-fraction', () => {
    expect(bodiesFor('.gate__ring').join(' ')).toContain('var(--gate-fraction');
  });

  it('has no @font-face, url(, <style, infinite or animation', () => {
    expect(RAW).not.toContain('@font-face');
    expect(RAW).not.toContain('url(');
    expect(RAW).not.toContain('<style');
    expect(RAW).not.toContain('infinite');
    expect(RAW).not.toContain('animation');
  });

  it('TAP_TARGETS.bookBack and every PARENT_TAP_TARGETS entry are at least 48 x 48', () => {
    const sizes = [TAP_TARGETS.bookBack, ...Object.values(PARENT_TAP_TARGETS)];
    for (const size of sizes) {
      expect(size.minWidthPx).toBeGreaterThanOrEqual(48);
      expect(size.minHeightPx).toBeGreaterThanOrEqual(48);
    }
  });

  it('index.html links parent-screen.css once, in the same form as the other stylesheets', () => {
    const html = readFileSync('index.html', 'utf8');
    const links = html.match(/<link rel="stylesheet" href="[^"]+" \/>/g) ?? [];
    expect(links).toContain('<link rel="stylesheet" href="/src/ui/parent-screen.css" />');
    expect(links.filter((l) => l.includes('parent-screen.css'))).toHaveLength(1);
    expect(links).toHaveLength(5);
  });
});
