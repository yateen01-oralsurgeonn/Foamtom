import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { cycleVariableName } from '../src/ui/effects-host';
import { LOOP_CYCLES_MS } from '../src/ui/effects';
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

  it('the rule reader finds nested and flat rules and skips keyframes', () => {
    const rules = leafRules('@media (a) { .x { color: red; } } @keyframes k { 0% { opacity: 0; } } .y { top: 0; }');
    expect(rules.map((r) => r.selector)).toEqual(['.x', '.y']);
  });
});
