import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { monsterAnchor, CHEEK_OFFSET, LEVEL_LIFT, MONSTER_SIZE } from '../src/ui/monster-anchor';
import { rawToChildSide } from '../src/tracking/side';
import type { DrawValue } from '../src/tracking/draw-value';
import type { Zone, ZoneId } from '../src/logic/types';

const ZONES: readonly Zone[] = (
  [
    ['upper-right', 'right', 'upper'],
    ['upper-left', 'left', 'upper'],
    ['lower-left', 'left', 'lower'],
    ['lower-right', 'right', 'lower'],
  ] as const
).map(([id, side, level], index) => ({ id: id as ZoneId, side, level, index, label: id }));

const zone = (id: ZoneId): Zone => ZONES.find((z) => z.id === id)!;

const drawArb: fc.Arbitrary<DrawValue> = fc.record({
  mouth: fc.record({ x: fc.double({ min: 0, max: 1, noNaN: true }), y: fc.double({ min: 0, max: 1, noNaN: true }) }),
  faceWidth: fc.double({ min: 0.05, max: 0.8, noNaN: true }),
  roll: fc.double({ min: -0.6, max: 0.6, noNaN: true }),
});

const centred = (faceWidth: number, roll = 0): DrawValue => ({ mouth: { x: 0.5, y: 0.5 }, faceWidth, roll });

describe('monsterAnchorPlacement', () => {
  it('null in gives null out', () => {
    for (const z of ZONES) expect(monsterAnchor(null, z)).toBeNull();
  });

  it('left zones sit on the raw side that rawToChildSide calls left', () => {
    const rawSideOfLeft = rawToChildSide('raw-right') === 'left' ? 1 : -1;
    fc.assert(
      fc.property(drawArb, (draw) => {
        const flat = { ...draw, roll: 0, mouth: { x: 0.5, y: 0.5 } };
        for (const id of ['upper-left', 'lower-left'] as const) {
          const a = monsterAnchor(flat, zone(id))!;
          expect(Math.sign(a.x - 0.5)).toBe(rawSideOfLeft);
        }
        for (const id of ['upper-right', 'lower-right'] as const) {
          const a = monsterAnchor(flat, zone(id))!;
          expect(Math.sign(a.x - 0.5)).toBe(-rawSideOfLeft);
        }
      }),
    );
  });

  it('upper zones are above lower zones (smaller y)', () => {
    fc.assert(
      fc.property(drawArb, (draw) => {
        for (const side of ['left', 'right'] as const) {
          const up = monsterAnchor({ ...draw, roll: 0, mouth: { x: 0.5, y: 0.5 } }, ZONES.find((z) => z.side === side && z.level === 'upper')!)!;
          const low = monsterAnchor({ ...draw, roll: 0, mouth: { x: 0.5, y: 0.5 } }, ZONES.find((z) => z.side === side && z.level === 'lower')!)!;
          expect(up.y).toBeLessThan(low.y);
        }
      }),
    );
  });

  it('the anchor stays inside the stage', () => {
    fc.assert(
      fc.property(drawArb, fc.constantFrom(...ZONES), (draw, z) => {
        const a = monsterAnchor(draw, z)!;
        const half = a.size / 2;
        expect(a.x - half).toBeGreaterThanOrEqual(-1e-9);
        expect(a.x + half).toBeLessThanOrEqual(1 + 1e-9);
        expect(a.y - half).toBeGreaterThanOrEqual(-1e-9);
        expect(a.y + half).toBeLessThanOrEqual(1 + 1e-9);
      }),
    );
  });

  it('keeps a mouth at the very edge of the stage inside it', () => {
    const edge: DrawValue = { mouth: { x: 1, y: 0 }, faceWidth: 0.3, roll: 0 };
    for (const z of ZONES) {
      const a = monsterAnchor(edge, z)!;
      expect(a.x + a.size / 2).toBeLessThanOrEqual(1);
      expect(a.y - a.size / 2).toBeGreaterThanOrEqual(0);
    }
  });

  it('the size scales with faceWidth', () => {
    const small = monsterAnchor(centred(0.2), zone('upper-left'))!;
    const big = monsterAnchor(centred(0.4), zone('upper-left'))!;
    expect(small.size).toBeCloseTo(MONSTER_SIZE * 0.2, 9);
    expect(big.size).toBeCloseTo(MONSTER_SIZE * 0.4, 9);
    expect(big.size).toBeCloseTo(small.size * 2, 9);
  });

  it('the offsets are the named constants times face width', () => {
    const a = monsterAnchor(centred(0.4), zone('lower-left'))!;
    const sign = rawToChildSide('raw-right') === 'left' ? 1 : -1;
    expect(a.x).toBeCloseTo(0.5 + sign * CHEEK_OFFSET * 0.4, 9);
    expect(a.y).toBeCloseTo(0.5 + LEVEL_LIFT * 0.4, 9);
  });

  it('a tilted face (roll) turns the monster and its position', () => {
    const upright = monsterAnchor(centred(0.4, 0), zone('upper-left'))!;
    const tilted = monsterAnchor(centred(0.4, 0.5), zone('upper-left'))!;
    expect(upright.rotate).toBe(0);
    expect(tilted.rotate).toBe(0.5);
    expect(tilted.y).not.toBeCloseTo(upright.y, 3);
  });
});
