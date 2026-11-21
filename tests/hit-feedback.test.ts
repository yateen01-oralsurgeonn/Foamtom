import fc from 'fast-check';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { startSession, tick } from '../src/logic/session';
import type { BrushingSignal, SessionMode, StartInput } from '../src/logic/types';
import { toView, type View } from '../src/logic/view';
import { ONE_SHOT_MS, effectsFor } from '../src/ui/effects';
import { hitClassFor, isHit, type HitView } from '../src/ui/hit-feedback';

// Helpers live in this file (no shared helper file).
const signalArb: fc.Arbitrary<BrushingSignal> = fc.record({
  handNearMouth: fc.boolean(),
  side: fc.constantFrom('left' as const, 'right' as const, 'unknown' as const),
  level: fc.constantFrom('upper' as const, 'lower' as const, 'unknown' as const),
  moving: fc.boolean(),
});
const maybeSignalArb = fc.option(signalArb, { nil: null });
const modeArb: fc.Arbitrary<SessionMode> = fc.constantFrom('camera' as const, 'timer-only' as const);
const zoneArb = fc.constantFrom('upper-right', 'upper-left', 'lower-left', 'lower-right') as fc.Arbitrary<
  HitView['zoneId']
>;
const idArb = fc.constantFrom('plaque-puff', 'sugar-sprite', 'gummy-gloop', 'fuzzlefang');
const fractionArb = fc.double({ min: 0, max: 1, noNaN: true });
const hitViewArb: fc.Arbitrary<HitView> = fc.record({
  zoneId: zoneArb,
  monsterId: idArb,
  healthFraction: fractionArb,
});

function input(mode: SessionMode): StartInput {
  return { mode, startedAt: 1_000, date: '2026-11-21', hour: 8, pastSessions: [] };
}

/** The view after each tick of a whole session (the start view first). */
function views(mode: SessionMode, signals: readonly (BrushingSignal | null)[]): View[] {
  let state = startSession(input(mode));
  const all = [toView(state)];
  for (const signal of signals) {
    if (state.phase === 'ended') break;
    state = tick(state, signal);
    if (state.phase !== 'ended') all.push(toView(state));
  }
  return all;
}

const sessionArb = fc.tuple(modeArb, fc.array(maybeSignalArb, { minLength: 120, maxLength: 120 }));

describe('hitOnlyWhenHealthDrops', () => {
  it('is true exactly when both views exist, zone and monster match and health is lower', () => {
    fc.assert(
      fc.property(hitViewArb, hitViewArb, (a, b) => {
        const expected =
          a.zoneId === b.zoneId && a.monsterId === b.monsterId && b.healthFraction < a.healthFraction;
        expect(isHit(a, b)).toBe(expected);
      }),
    );
  });

  it('is false when health is equal or higher', () => {
    fc.assert(
      fc.property(hitViewArb, fractionArb, (a, extra) => {
        const same = { ...a };
        const higher = { ...a, healthFraction: Math.min(1, a.healthFraction + extra) };
        expect(isHit(a, same)).toBe(false);
        expect(isHit(a, higher)).toBe(false);
      }),
    );
  });

  it('is false when either view is null', () => {
    fc.assert(
      fc.property(hitViewArb, (a) => {
        expect(isHit(null, a)).toBe(false);
        expect(isHit(a, null)).toBe(false);
      }),
    );
    expect(isHit(null, null)).toBe(false);
  });

  it('over a whole session in either mode: at most one hit per tick, and a hit only when health fell', () => {
    fc.assert(
      fc.property(sessionArb, ([mode, signals]) => {
        const all = views(mode, signals);
        let hits = 0;
        for (let i = 1; i < all.length; i += 1) {
          const prev = all[i - 1]!;
          const next = all[i]!;
          const hit = isHit(prev, next);
          if (hit) {
            hits += 1;
            expect(next.healthFraction).toBeLessThan(prev.healthFraction);
          }
        }
        expect(hits).toBeLessThanOrEqual(all.length - 1);
      }),
    );
  });
});

describe('noHitOnZoneChange', () => {
  it('is false whenever the zone or the monster differs, whatever the health', () => {
    fc.assert(
      fc.property(hitViewArb, hitViewArb, (a, b) => {
        fc.pre(a.zoneId !== b.zoneId || a.monsterId !== b.monsterId);
        expect(isHit(a, b)).toBe(false);
        expect(isHit(a, { ...b, healthFraction: 0 })).toBe(false);
      }),
    );
  });

  it('over a whole session in either mode no tick on which the zone changes is a hit', () => {
    fc.assert(
      fc.property(sessionArb, ([mode, signals]) => {
        const all = views(mode, signals);
        for (let i = 1; i < all.length; i += 1) {
          const prev = all[i - 1]!;
          const next = all[i]!;
          if (prev.zoneId !== next.zoneId) expect(isHit(prev, next)).toBe(false);
        }
      }),
    );
  });
});

const CSS = readFileSync('src/ui/monster-art.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

/** The text of a `@keyframes name { ... }` block, or null. */
function keyframes(name: string): string | null {
  const start = CSS.indexOf(`@keyframes ${name}`);
  if (start === -1) return null;
  const open = CSS.indexOf('{', start);
  let depth = 1;
  let i = open + 1;
  while (i < CSS.length && depth > 0) {
    if (CSS[i] === '{') depth += 1;
    else if (CSS[i] === '}') depth -= 1;
    i += 1;
  }
  return CSS.slice(open + 1, i - 1);
}

/** The body of the first rule whose selector is exactly `selector`. */
function ruleBody(selector: string): string | null {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`(^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`).exec(CSS);
  return match ? match[2]! : null;
}

describe('noHitWhenReducedMotion', () => {
  it('hitClassFor is null for every input under reduced motion', () => {
    const reduced = effectsFor(true);
    expect(reduced.hitMotion).toBe(false);
    fc.assert(
      fc.property(fc.boolean(), fc.boolean(), (hit, flip) => {
        expect(hitClassFor(hit, reduced, flip)).toBeNull();
      }),
    );
  });

  it('hitClassFor is null when there is no hit, even with motion on', () => {
    const on = effectsFor(false);
    expect(on.hitMotion).toBe(true);
    expect(hitClassFor(false, on, false)).toBeNull();
    expect(hitClassFor(false, on, true)).toBeNull();
  });

  it('alternates monster--hit-a and monster--hit-b with motion on', () => {
    const on = effectsFor(false);
    expect(hitClassFor(true, on, false)).toBe('monster--hit-a');
    expect(hitClassFor(true, on, true)).toBe('monster--hit-b');
  });

  it('keeps the flinch at 300 ms or less', () => {
    expect(ONE_SHOT_MS.hit).toBeLessThanOrEqual(300);
  });

  it('the hit rules have no infinite, use only transform in their keyframes, and fx-no-hit turns them off', () => {
    for (const cls of ['.monster--hit-a', '.monster--hit-b']) {
      const body = ruleBody(cls);
      expect(body, cls).not.toBeNull();
      expect(body!, cls).toMatch(/animation:\s*hit-squash-[ab]\s+300ms/);
      expect(body!, cls).not.toContain('infinite');
    }
    for (const name of ['hit-squash-a', 'hit-squash-b']) {
      const frames = keyframes(name);
      expect(frames, name).not.toBeNull();
      const properties = [...frames!.matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1]);
      expect(properties.length, name).toBeGreaterThan(0);
      for (const property of properties) expect(property, name).toBe('transform');
    }
    const off = /\.fx-no-hit \.monster--hit-a,\s*\.fx-no-hit \.monster--hit-b\s*\{([^}]*)\}/.exec(CSS);
    expect(off).not.toBeNull();
    expect(off![1]).toMatch(/animation:\s*none/);
  });

  it('hit-feedback.ts is pure: no DOM, clock, timer or randomness', () => {
    const source = readFileSync('src/ui/hit-feedback.ts', 'utf8');
    for (const word of [
      'document',
      'window',
      'Date',
      'performance',
      'Math.random',
      'setTimeout',
      'setInterval',
      'requestAnimationFrame',
      'localStorage',
      'tracking/',
    ]) {
      expect(source, word).not.toContain(word);
    }
  });

  it('session-screen.ts uses isHit and hitClassFor and still has no timer call', () => {
    const source = readFileSync('src/ui/session-screen.ts', 'utf8');
    expect(source).toContain('isHit(');
    expect(source).toContain('hitClassFor(');
    for (const word of ['setTimeout', 'setInterval', 'requestAnimationFrame', 'offsetWidth', 'getBoundingClientRect']) {
      expect(source, word).not.toContain(word);
    }
  });
});
