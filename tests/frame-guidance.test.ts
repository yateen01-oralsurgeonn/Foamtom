import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { REGION_LOOKS } from '../src/ui/effects';
import {
  REGION_ORDER,
  ZONE_REGION,
  frameGuidance,
  type FrameRegion,
} from '../src/ui/frame-guidance';
import type { CaptionLineId, View } from '../src/logic/view';
import type { ZoneId } from '../src/logic/types';

const ZONES: ZoneId[] = ['upper-right', 'upper-left', 'lower-left', 'lower-right'];

const viewArb: fc.Arbitrary<View> = fc.record({
  phase: fc.constantFrom('running', 'paused', 'ended') as fc.Arbitrary<View['phase']>,
  zoneId: fc.constantFrom(...ZONES),
  countdown: fc.integer({ min: 0, max: 30 }),
  captionLineId: fc.constantFrom(
    'zone-upper-right',
    'zone-upper-left',
    'zone-lower-left',
    'zone-lower-right',
    'smoke',
    'end',
  ) as fc.Arbitrary<CaptionLineId>,
  monsterId: fc.constantFrom('plaque-puff', 'sugar-sprite', 'gummy-gloop'),
  healthFraction: fc.double({ min: 0, max: 1, noNaN: true }),
  smokeFraction: fc.double({ min: 0, max: 1, noNaN: true }),
});

describe('frameGuidanceZones', () => {
  it('gives each zone exactly one active region, and the four are different', () => {
    const seen = new Set<FrameRegion>();
    for (const zoneId of ZONES) {
      const g = frameGuidance({ phase: 'running', zoneId });
      const active = g.regions.filter((r) => r.level === 'active');
      expect(active).toHaveLength(1);
      expect(g.activeRegion).toBe(active[0].region);
      expect(g.regions.filter((r) => r.level === 'dim')).toHaveLength(3);
      expect(g.regions.map((r) => r.region)).toEqual([...REGION_ORDER]);
      seen.add(active[0].region);
    }
    expect(seen.size).toBe(4);
  });

  it('maps the four zones as stated', () => {
    expect(ZONE_REGION['upper-left']).toBe('top-left');
    expect(ZONE_REGION['upper-right']).toBe('top-right');
    expect(ZONE_REGION['lower-left']).toBe('bottom-left');
    expect(ZONE_REGION['lower-right']).toBe('bottom-right');
    for (const zoneId of ZONES) {
      expect(frameGuidance({ phase: 'running', zoneId }).activeRegion).toBe(ZONE_REGION[zoneId]);
    }
  });

  it('gives four off regions and no active region when ended or null', () => {
    const cases = [null, ...ZONES.map((zoneId) => ({ phase: 'ended' as const, zoneId }))];
    for (const input of cases) {
      const g = frameGuidance(input);
      expect(g.regions).toHaveLength(4);
      for (const r of g.regions) {
        expect(r.level).toBe('off');
        expect(r.look).toEqual(REGION_LOOKS.off);
      }
      expect(g.activeRegion).toBeNull();
      expect(g.flickering).toBe(false);
    }
  });

  it('keeps the region lit but still when paused, and flickers when running', () => {
    for (const zoneId of ZONES) {
      const paused = frameGuidance({ phase: 'paused', zoneId });
      expect(paused.activeRegion).toBe(ZONE_REGION[zoneId]);
      expect(paused.flickering).toBe(false);
      expect(paused.regions.find((r) => r.level === 'active')?.look).toEqual(REGION_LOOKS.active);
      const running = frameGuidance({ phase: 'running', zoneId });
      expect(running.activeRegion).toBe(ZONE_REGION[zoneId]);
      expect(running.flickering).toBe(true);
    }
  });

  it('is equal for two views that differ only in health, smoke, caption, countdown or monster', () => {
    fc.assert(
      fc.property(viewArb, viewArb, (a, b) => {
        const b2: View = { ...b, phase: a.phase, zoneId: a.zoneId };
        expect(frameGuidance(b2)).toEqual(frameGuidance(a));
      }),
    );
  });

  it('keeps the same region before and after a defeat', () => {
    fc.assert(
      fc.property(viewArb, (v) => {
        const before: View = { ...v, healthFraction: 1, smokeFraction: 0, captionLineId: `zone-${v.zoneId}` };
        const after: View = { ...v, healthFraction: 0, smokeFraction: 1, captionLineId: 'smoke' };
        expect(frameGuidance(after)).toEqual(frameGuidance(before));
      }),
    );
  });

  it('always returns four regions in order for any view', () => {
    fc.assert(
      fc.property(viewArb, (v) => {
        const g = frameGuidance(v);
        expect(g.regions.map((r) => r.region)).toEqual([...REGION_ORDER]);
        expect(g.regions.filter((r) => r.level === 'active').length).toBe(
          v.phase === 'ended' ? 0 : 1,
        );
      }),
    );
  });
});

describe('frameGuidanceSource', () => {
  const source = readFileSync(new URL('../src/ui/frame-guidance.ts', import.meta.url), 'utf8');

  it('contains no scaleX, no raw-side strings and no left/right ternary', () => {
    expect(source).not.toContain('scaleX');
    expect(source).not.toContain('rawToChildSide');
    expect(source).not.toContain('raw-left');
    expect(source).not.toContain('raw-right');
    expect(source).not.toContain("? 'left' : 'right'");
    expect(source).not.toContain("? 'right' : 'left'");
  });
});
