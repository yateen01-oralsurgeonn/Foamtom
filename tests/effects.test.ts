import { describe, expect, it } from 'vitest';
import {
  LOOP_CYCLES_MS,
  MIN_CYCLE_MS,
  REGION_LOOKS,
  effectClasses,
  effectsFor,
  type LoopId,
} from '../src/ui/effects';

const LOOP_IDS: LoopId[] = ['flameActive', 'glowActive', 'glowDim', 'fogDrift', 'smokeDrift'];
const MOVING = ['flicker', 'fogDrift', 'smokeDrift', 'leavingMotion', 'bookMotion'] as const;
const STATES = ['glow', 'ornament', 'sizeChange', 'smokeThinning'] as const;

describe('effectsForReducedMotion', () => {
  it('turns off the five moving effects and keeps the four states under reduced motion', () => {
    const e = effectsFor(true);
    for (const k of MOVING) expect(e[k]).toBe(false);
    for (const k of STATES) expect(e[k]).toBe(true);
  });

  it('has all nine on when motion is allowed', () => {
    const e = effectsFor(false);
    const all = [...MOVING, ...STATES];
    expect(all).toHaveLength(9);
    for (const k of all) expect(e[k]).toBe(true);
    expect(effectClasses(e)).toEqual([]);
  });

  it('lists exactly the effects that are off', () => {
    expect([...effectClasses(effectsFor(true))].sort()).toEqual(
      ['fx-no-book', 'fx-no-flicker', 'fx-no-fog', 'fx-no-leaving', 'fx-no-smoke-drift'].sort(),
    );
    const partial = { ...effectsFor(false), fogDrift: false, bookMotion: false };
    expect([...effectClasses(partial)].sort()).toEqual(['fx-no-book', 'fx-no-fog']);
  });
});

describe('flashRate', () => {
  it('gives every LoopId a cycle and no others', () => {
    expect(Object.keys(LOOP_CYCLES_MS).sort()).toEqual([...LOOP_IDS].sort());
  });

  it('keeps every cycle at least MIN_CYCLE_MS', () => {
    expect(MIN_CYCLE_MS).toBe(334);
    for (const id of LOOP_IDS) expect(LOOP_CYCLES_MS[id]).toBeGreaterThanOrEqual(MIN_CYCLE_MS);
  });

  it('keeps every flicker amplitude at 0.25 or less', () => {
    for (const level of ['active', 'dim', 'off'] as const) {
      expect(REGION_LOOKS[level].flickerAmplitude).toBeLessThanOrEqual(0.25);
    }
  });
});

describe('frameRegionLooksDiffer', () => {
  it('makes active brighter, larger and candle-lit against dim', () => {
    const a = REGION_LOOKS.active;
    const d = REGION_LOOKS.dim;
    expect(a.glowOpacity).toBeGreaterThan(d.glowOpacity);
    expect(a.glowSizePx).toBeGreaterThan(d.glowSizePx);
    expect(a.flame).toBe(true);
    expect(d.flame).toBe(false);
    expect(a.flickerAmplitude).toBeGreaterThan(d.flickerAmplitude);
  });

  it('gives off no glow and no flame', () => {
    const o = REGION_LOOKS.off;
    expect(o.glowOpacity).toBe(0);
    expect(o.glowSizePx).toBe(0);
    expect(o.flame).toBe(false);
  });
});
