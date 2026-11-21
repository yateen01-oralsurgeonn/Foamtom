import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { FRAME_METRICS, ONE_SHOT_MS } from '../src/ui/effects';

const RAW = readFileSync('src/ui/frame.css', 'utf8');
const CSS = RAW.replace(/\/\*[\s\S]*?\*\//g, '');

/** Body of the first rule whose selector list contains exactly this selector. */
function ruleBody(selector: string): string {
  const re = /([^{}]+)\{([^{}]*)\}/g;
  for (const m of CSS.matchAll(re)) {
    const selectors = m[1]!.split(',').map((s) => s.trim());
    if (selectors.includes(selector)) return m[2]!;
  }
  throw new Error(`no rule for ${selector}`);
}

function zIndex(body: string): number {
  const m = /z-index:\s*(-?\d+)/.exec(body);
  expect(m).not.toBeNull();
  return Number(m![1]);
}

/** Property names used inside every @keyframes block. */
function keyframeProperties(): string[] {
  const props: string[] = [];
  for (const block of CSS.matchAll(/@keyframes\s+[\w-]+\s*\{((?:[^{}]*\{[^{}]*\})*)\s*\}/g)) {
    for (const inner of block[1]!.matchAll(/\{([^{}]*)\}/g)) {
      for (const decl of inner[1]!.split(';')) {
        const name = decl.split(':')[0]!.trim();
        if (name) props.push(name);
      }
    }
  }
  return props;
}

describe('frameCss', () => {
  it('the glow layer has a lower z-index than the glass', () => {
    expect(zIndex(ruleBody('.frame-glow'))).toBeLessThan(zIndex(ruleBody('.mirror-frame__glass')));
  });

  it('pointer-events: none is on the deco layer', () => {
    expect(ruleBody('.mirror-frame__deco')).toMatch(/pointer-events:\s*none/);
  });

  it('has no scaleX', () => {
    expect(RAW).not.toContain('scaleX');
  });

  it('the keyframes use only opacity and transform', () => {
    const props = keyframeProperties();
    expect(props.length).toBeGreaterThan(0);
    for (const p of props) expect(['opacity', 'transform']).toContain(p);
  });

  it('uses no filter, backdrop-filter or mix-blend-mode', () => {
    expect(CSS).not.toMatch(/(^|[^-\w])filter\s*:/);
    expect(CSS).not.toContain('backdrop-filter');
    expect(CSS).not.toContain('mix-blend-mode');
  });

  it('the ring is FRAME_METRICS.ringPx wide', () => {
    expect(ruleBody('.mirror-frame')).toContain(`--ring: ${FRAME_METRICS.ringPx}px`);
  });

  it('the fade-in lasts ONE_SHOT_MS.fadeIn and the glow move lasts ONE_SHOT_MS.glowMove', () => {
    expect(ruleBody('.mirror-frame')).toContain(`frame-fade-in ${ONE_SHOT_MS.fadeIn}ms`);
    expect(ruleBody('.frame-glow')).toContain(`opacity ${ONE_SHOT_MS.glowMove}ms`);
  });

  it('the flame shows only in the active region', () => {
    expect(ruleBody('.frame-flame')).toMatch(/display:\s*none/);
    expect(ruleBody('.frame-region--active .frame-flame')).toMatch(/display:\s*block/);
  });

  it('cracks are at about 35% opacity', () => {
    expect(ruleBody('.frame-cracks')).toMatch(/opacity:\s*0\.35/);
  });

  it('has .fx-no-flicker, .fx-no-fog and .fx-paused rules', () => {
    expect(ruleBody('.fx-no-flicker .frame-glow')).toContain('animation: none');
    expect(ruleBody('.fx-no-fog .frame-fog::before')).toContain('animation: none');
    expect(ruleBody('.fx-paused .mirror-frame')).toContain('animation-play-state: paused');
  });
});
