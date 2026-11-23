import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { cycleVariableName } from '../src/ui/effects-host';
import { FRAME_METRICS, LOOP_CYCLES_MS } from '../src/ui/effects';
import type { LoopId } from '../src/ui/effects';

// The three stylesheets of this spec. The test reads whichever exist, so it keeps
// checking as later tasks create the other two.
const CSS_FILES = ['src/ui/frame.css', 'src/ui/monster-art.css', 'src/ui/screens.css'];

export interface CssRule {
  readonly selector: string;
  readonly body: string;
}

function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Leaf rules of a stylesheet. At-rules with nested rules (@media) are flattened; @keyframes are skipped. */
function leafRules(text: string): CssRule[] {
  const rules: CssRule[] = [];
  let i = 0;
  while (i < text.length) {
    const open = text.indexOf('{', i);
    if (open === -1) break;
    const selector = text.slice(i, open).trim();
    let depth = 1;
    let j = open + 1;
    while (j < text.length && depth > 0) {
      if (text[j] === '{') depth += 1;
      else if (text[j] === '}') depth -= 1;
      j += 1;
    }
    const body = text.slice(open + 1, j - 1);
    if (/^@(media|supports)/.test(selector)) rules.push(...leafRules(body));
    else if (!selector.startsWith('@')) rules.push({ selector, body });
    i = j;
  }
  return rules;
}

function readCss(path: string): string {
  return stripComments(readFileSync(path, 'utf8'));
}

const existing = CSS_FILES.filter((f) => existsSync(f));

describe('cssGuards', () => {
  it('reads at least frame.css', () => {
    expect(existing).toContain('src/ui/frame.css');
  });

  it('has no @font-face, no url( and no <style', () => {
    for (const file of existing) {
      const text = readCss(file);
      expect(text, file).not.toContain('@font-face');
      expect(text, file).not.toContain('url(');
      expect(text, file).not.toContain('<style');
    }
  });

  it('every rule with infinite takes its duration from var(--cycle-) and has no literal time', () => {
    let found = 0;
    for (const file of existing) {
      for (const rule of leafRules(readCss(file))) {
        if (!/\binfinite\b/.test(rule.body)) continue;
        found += 1;
        expect(rule.body, `${file} ${rule.selector}`).toContain('var(--cycle-');
        const withoutVars = rule.body.replace(/var\([^)]*\)/g, '');
        expect(withoutVars, `${file} ${rule.selector}`).not.toMatch(/\d(\.\d+)?m?s\b/);
      }
    }
    expect(found).toBeGreaterThan(0);
  });

  it('every --cycle- name used corresponds to a LoopId in effects.ts', () => {
    const known = new Set((Object.keys(LOOP_CYCLES_MS) as LoopId[]).map(cycleVariableName));
    let used = 0;
    for (const file of existing) {
      for (const match of readCss(file).matchAll(/var\((--cycle-[a-z-]+)\)/g)) {
        used += 1;
        expect(known.has(match[1]!), `${file} ${match[1]}`).toBe(true);
      }
    }
    expect(used).toBeGreaterThan(0);
  });

  it('every interactive class defined in the stylesheets has a :focus-visible rule', () => {
    const files = ['src/ui/styles.css', ...existing];
    const rules = files.flatMap((f) => leafRules(readCss(f)));
    const selectorsOf = (r: CssRule): string[] => r.selector.split(',').map((s) => s.trim());
    for (const name of ['big-button', 'small-button', 'icon-button', 'book-cell']) {
      const defined = rules.some((r) => selectorsOf(r).some((s) => new RegExp(`\\.${name}(?![\\w-])`).test(s)));
      if (!defined) continue;
      const focused = rules.some((r) =>
        selectorsOf(r).some((s) => new RegExp(`\\.${name}(?![\\w-])[^,]*:focus-visible`).test(s)),
      );
      expect(focused, `${name} has a :focus-visible rule`).toBe(true);
    }
  });

  it('FRAME_METRICS.ringLandscapePx is smaller than ringPx', () => {
    expect(FRAME_METRICS.ringLandscapePx).toBeLessThan(FRAME_METRICS.ringPx);
  });

  it('screens.css uses auto-fit for the Book grids', () => {
    const rules = leafRules(readCss('src/ui/screens.css'));
    for (const cls of ['.book__commons', '.book__rares']) {
      const rule = rules.find((r) => r.selector.split(',').map((s) => s.trim()).includes(cls));
      expect(rule, cls).toBeDefined();
      expect(rule!.body, cls).toContain('auto-fit');
    }
  });

  it('the Book screen scrolls when it is taller than the window', () => {
    const rules = leafRules(readCss('src/ui/screens.css'));
    expect(rules.some((r) => r.selector === '.book' && /overflow-y:\s*auto/.test(r.body))).toBe(true);
  });

  it('the empty Book caption has no plate and keeps its height', () => {
    const rules = leafRules(readCss('src/ui/screens.css'));
    const empty = rules.find((r) => r.selector === '.book__caption:empty');
    expect(empty).toBeDefined();
    expect(empty!.body).toMatch(/background:\s*transparent/);
    const plain = rules.find((r) => r.selector === '.book__caption');
    expect(plain).toBeDefined();
    expect(plain!.body).toMatch(/min-height:\s*[\d.]+rem/);
  });

  it('the rule reader finds nested and flat rules and skips keyframes', () => {
    const rules = leafRules('@media (a) { .x { color: red; } } @keyframes k { 0% { opacity: 0; } } .y { top: 0; }');
    expect(rules.map((r) => r.selector)).toEqual(['.x', '.y']);
  });
});
