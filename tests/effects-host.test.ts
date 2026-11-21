import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { LOOP_CYCLES_MS } from '../src/ui/effects';
import type { LoopId } from '../src/ui/effects';
import { cycleVariableName, startEffects } from '../src/ui/effects-host';
import type { EffectsRoot, MediaQueryLike } from '../src/ui/effects-host';

function fakeRoot(): EffectsRoot & { vars: Map<string, string>; classes: Set<string> } {
  const classes = new Set<string>();
  const vars = new Map<string, string>();
  return {
    classes,
    vars,
    classList: {
      add: (n) => void classes.add(n),
      remove: (n) => void classes.delete(n),
      contains: (n) => classes.has(n),
    },
    style: { setProperty: (n, v) => void vars.set(n, v) },
  };
}

function fakeMedia(initial: boolean) {
  const listeners = new Set<() => void>();
  const query = {
    matches: initial,
    addEventListener: (_t: 'change', l: () => void) => void listeners.add(l),
    removeEventListener: (_t: 'change', l: () => void) => void listeners.delete(l),
  };
  return {
    query: query as MediaQueryLike & { matches: boolean },
    set(value: boolean) {
      (query as { matches: boolean }).matches = value;
      for (const l of [...listeners]) l();
    },
    listeners,
  };
}

function fakeVisibility(initialHidden: boolean) {
  let hidden = initialHidden;
  const listeners = new Set<(h: boolean) => void>();
  return {
    source: {
      isHidden: () => hidden,
      subscribe(l: (h: boolean) => void) {
        listeners.add(l);
        return () => void listeners.delete(l);
      },
    },
    set(value: boolean) {
      hidden = value;
      for (const l of [...listeners]) l(value);
    },
  };
}

const MOVING_CLASSES = [
  'fx-no-flicker',
  'fx-no-fog',
  'fx-no-smoke-drift',
  'fx-no-leaving',
  'fx-no-book',
  'fx-no-hit',
];

describe('effectsHostFollowsPreference', () => {
  it('puts the reduced-motion classes on the root at start and follows a change', () => {
    const root = fakeRoot();
    const media = fakeMedia(true);
    startEffects({ root, matchMedia: () => media.query });
    expect([...root.classes].sort()).toEqual([...MOVING_CLASSES].sort());

    media.set(false);
    expect(root.classes.size).toBe(0);

    media.set(true);
    expect([...root.classes].sort()).toEqual([...MOVING_CLASSES].sort());
  });

  it('starts with no classes when motion is allowed', () => {
    const root = fakeRoot();
    startEffects({ root, matchMedia: () => fakeMedia(false).query });
    expect(root.classes.size).toBe(0);
  });

  it('sets fx-paused while hidden and clears it when visible', () => {
    const root = fakeRoot();
    const vis = fakeVisibility(false);
    startEffects({ root, visibility: vis.source });
    expect(root.classes.has('fx-paused')).toBe(false);
    vis.set(true);
    expect(root.classes.has('fx-paused')).toBe(true);
    vis.set(false);
    expect(root.classes.has('fx-paused')).toBe(false);
  });

  it('sets fx-paused at start when the document is already hidden', () => {
    const root = fakeRoot();
    startEffects({ root, visibility: fakeVisibility(true).source });
    expect(root.classes.has('fx-paused')).toBe(true);
  });

  it('gives no classes and no error when matchMedia is missing or throws', () => {
    const missing = fakeRoot();
    expect(() => startEffects({ root: missing })).not.toThrow();
    expect(missing.classes.size).toBe(0);

    const throwing = fakeRoot();
    expect(() =>
      startEffects({
        root: throwing,
        matchMedia: () => {
          throw new Error('no media');
        },
      }),
    ).not.toThrow();
    expect(throwing.classes.size).toBe(0);
  });

  it('writes one --cycle- variable per LoopId with the table value', () => {
    const root = fakeRoot();
    startEffects({ root });
    const ids = Object.keys(LOOP_CYCLES_MS) as LoopId[];
    expect(root.vars.size).toBe(ids.length);
    for (const id of ids) {
      expect(root.vars.get(cycleVariableName(id))).toBe(`${LOOP_CYCLES_MS[id]}ms`);
    }
    expect(root.vars.get('--cycle-flame-active')).toBe('1700ms');
    expect(root.vars.get('--cycle-smoke-drift')).toBe('2800ms');
  });

  it('stops listening after the returned stop function is called', () => {
    const root = fakeRoot();
    const media = fakeMedia(false);
    const vis = fakeVisibility(false);
    const stop = startEffects({ root, matchMedia: () => media.query, visibility: vis.source });
    stop();
    expect(media.listeners.size).toBe(0);
    media.set(true);
    vis.set(true);
    expect(root.classes.size).toBe(0);
  });

  it('uses no timer', () => {
    const source = readFileSync('src/ui/effects-host.ts', 'utf8');
    for (const word of ['setTimeout', 'setInterval', 'requestAnimationFrame', 'requestVideoFrameCallback']) {
      expect(source).not.toContain(word);
    }
  });
});
