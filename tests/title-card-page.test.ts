import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '..');
const read = (p: string): string => readFileSync(resolve(root, p), 'utf8');

const HTML_PATH = 'promo/title-card.html';
const TS_PATH = 'promo/title-card.ts';
const CSS_PATH = 'promo/title-card.css';
const MODEL_PATH = 'promo/title-card-model.ts';
const FILES = [HTML_PATH, TS_PATH, CSS_PATH, MODEL_PATH];

const csp = (html: string): string | undefined =>
  /http-equiv="Content-Security-Policy"\s+content="([^"]*)"/.exec(html)?.[1];

describe('title card page', () => {
  it('pageIsDevOnlyAndSafe', () => {
    for (const f of FILES) expect(existsSync(resolve(root, f)), f).toBe(true);
    const html = read(HTML_PATH);
    const css = read(CSS_PATH);
    const ts = read(TS_PATH);

    const pageCsp = csp(html);
    expect(pageCsp).toBeDefined();
    expect(pageCsp).toBe(csp(read('index.html')));

    const title = /<title>([^<]*)<\/title>/.exec(html)?.[1] ?? '';
    expect(title).toContain('FOAMTOM-PROMO-TITLE-CARD');
    expect(html).not.toMatch(/style\s*=/i);
    expect(html).not.toMatch(/<style/i);
    const scripts = html.match(/<script\b[^>]*>/gi) ?? [];
    expect(scripts.length).toBeGreaterThan(0);
    for (const s of scripts) expect(s).toMatch(/\ssrc=/);
    expect(html).not.toContain('data:');
    expect(html).not.toMatch(/https?:\/\//);
    expect(html).not.toContain('@font-face');

    expect(css).not.toContain('url(');
    expect(css).not.toContain('@font-face');
    expect(css).not.toContain('@import');

    for (const banned of [
      'fetch',
      'XMLHttpRequest',
      'WebSocket',
      'sendBeacon',
      'localStorage',
      'sessionStorage',
      'document.cookie',
      'getUserMedia',
      'console',
      'innerHTML',
      'import(',
    ]) {
      expect(ts, banned).not.toContain(banned);
    }

    const allowed = new Set([
      './title-card-model',
      '../src/ui/mirror-frame',
      '../src/ui/frame-guidance',
      '../src/ui/effects',
      '../src/ui/monster-art',
      '../src/logic/monsters',
    ]);
    const imports = [...ts.matchAll(/^\s*import\b[^;]*?from\s+'([^']+)'/gms)].map((m) => m[1]!);
    expect(imports.length).toBeGreaterThan(0);
    for (const spec of imports) expect(allowed.has(spec), spec).toBe(true);
    expect(ts).not.toMatch(/tracking|storage|audio/);
  });

  it('pageIsStillAndDeterministic', () => {
    for (const f of FILES) {
      const text = read(f);
      for (const banned of [
        '--cycle-',
        'Math.random',
        'requestAnimationFrame',
        'setTimeout',
        'setInterval',
        'matchMedia',
        'prefers-reduced-motion',
        'infinite',
        'animationend',
      ]) {
        expect(text, `${f}: ${banned}`).not.toContain(banned);
      }
    }

    const css = read(CSS_PATH);
    expect(css).toMatch(/\.title-card\s+\.mirror-frame\s*\{[^}]*animation:\s*none\s*;/);
    expect(css).toMatch(/\.title-card--still[^{]*\{[^}]*animation:\s*none\s*!important/);

    const declarations = [...css.matchAll(/(?<![-\w])animation:\s*([^;]+);/g)].map((m) => m[1]!.trim());
    expect(declarations.length).toBeGreaterThan(0);
    for (const d of declarations) {
      expect(d.startsWith('none') || d.includes('var(--tc-'), d).toBe(true);
    }

    const keyframes = [...css.matchAll(/@keyframes[^{]+\{((?:[^{}]*\{[^{}]*\})*)\s*\}/g)];
    expect(keyframes.length).toBeGreaterThan(0);
    for (const block of keyframes) {
      const props = [...block[1]!.matchAll(/\{([^}]*)\}/g)]
        .flatMap((m) => m[1]!.split(';'))
        .map((d) => d.split(':')[0]!.trim())
        .filter((p) => p.length > 0);
      expect(props.length).toBeGreaterThan(0);
      for (const p of props) expect(p).toBe('opacity');
    }
  });

  it('pageBuildsFromGameParts', () => {
    const ts = read(TS_PATH);
    const css = read(CSS_PATH);
    expect(ts).toContain('createMirrorFrame(');
    expect(ts).toContain('drawMonster(');
    expect(ts).toContain('MONSTERS');
    expect(ts).toContain('CARD_MONSTER_ID');
    expect(ts).toMatch(/frame\.glass\.append\(/);
    expect(ts).toContain('.paint(');
    expect(ts).toContain('REGION_ORDER');
    expect(ts).toContain('REGION_LOOKS.active');
    expect(ts).not.toContain('frameGuidance(');
    expect(ts).not.toMatch(/createElement\(\s*['"]a['"]\s*\)/);
    for (const word of ['FOAMTOM', 'Haunted', 'Kiro', 'github']) expect(ts, word).not.toContain(word);
    expect(css).toMatch(/\.mirror-frame__glass\s*\{[^}]*height:\s*\d+px/);
  });
});
