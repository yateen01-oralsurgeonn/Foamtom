import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { H_MAX, RESCUE_THRESHOLD, ZONE_ORDER } from '../src/logic/constants';
import { MONSTERS, assignMonsters, resolveMonster } from '../src/logic/monsters';
import type { MonsterState, SessionResult } from '../src/logic/types';

// Helpers live in this file (no shared helper file).
const monsterIdArb = fc.constantFrom(...MONSTERS.map((m) => m.id));

const pastSessionArb: fc.Arbitrary<SessionResult> = fc
  .uniqueArray(monsterIdArb, { minLength: 0, maxLength: 4 })
  .map((ids) => ({
    date: '2026-11-19',
    timeOfDay: 'morning' as const,
    mode: 'timer-only' as const,
    zoneResults: ZONE_ORDER.map((zoneId, i) => ({
      zoneId,
      monsterId: ids[i] ?? MONSTERS[0].id,
      secondsBrushed: 30,
      secondsUntracked: 0,
      verified: false,
      monsterOutcome: 'defeated' as const,
    })),
    monstersEarned: ids,
    startedAt: 0,
    durationSeconds: 120,
  }));

const pastSessionsArb = fc.array(pastSessionArb, { minLength: 0, maxLength: 20 });

function monsterWithHealth(health: number, outcome: MonsterState['outcome'] = 'pending'): MonsterState {
  return {
    def: MONSTERS[0],
    zoneId: 'upper-right',
    health,
    startingHealth: H_MAX,
    maxHealth: H_MAX,
    outcome,
    defeatedAtElapsed: outcome === 'defeated' ? 20 : null,
  };
}

describe('monsterTableAndAssignment', () => {
  it('the table has 12 monsters: 8 common and 4 rare, with unique ids', () => {
    expect(MONSTERS).toHaveLength(12);
    expect(MONSTERS.filter((m) => m.rarity === 'common')).toHaveLength(8);
    expect(MONSTERS.filter((m) => m.rarity === 'rare')).toHaveLength(4);
    expect(new Set(MONSTERS.map((m) => m.id)).size).toBe(12);
    expect(MONSTERS.slice(0, 8).every((m) => m.rarity === 'common')).toBe(true);
    expect(MONSTERS.map((m) => m.name)).toEqual([
      'Plaque Puff',
      'Sugar Sprite',
      'Gummy Gloop',
      'Fuzzlefang',
      'Crumb Goblin',
      'Sticky Wisp',
      'Molar Mumbler',
      'Tartar Tot',
      'Midnight Molar Ghoul',
      'Dawn Drool Dragon',
      'Moonlit Mint Phantom',
      'Twilight Toffee Wraith',
    ]);
    expect(MONSTERS.every((m) => m.unlockRule.length > 0)).toBe(true);
  });

  it('gives four different monsters; rare only when eligible, then exactly one, on the last zone; deterministic', () => {
    fc.assert(
      fc.property(pastSessionsArb, fc.boolean(), (past, eligible) => {
        const result = assignMonsters(past, eligible);
        expect(result).toHaveLength(4);
        expect(new Set(result.map((m) => m.id)).size).toBe(4);
        const rares = result.filter((m) => m.rarity === 'rare');
        if (eligible) {
          expect(rares).toHaveLength(1);
          expect(result[3].rarity).toBe('rare');
        } else {
          expect(rares).toHaveLength(0);
        }
        expect(assignMonsters(past, eligible)).toEqual(result);
      }),
    );
  });

  it('puts unowned commons first in table order, then owned commons from the rotation start', () => {
    const none = assignMonsters([], false).map((m) => m.id);
    expect(none).toEqual(['plaque-puff', 'sugar-sprite', 'gummy-gloop', 'fuzzlefang']);

    fc.assert(
      fc.property(pastSessionsArb, (past) => {
        const owned = new Set(past.flatMap((s) => s.monstersEarned));
        const commons = MONSTERS.filter((m) => m.rarity === 'common');
        const unowned = commons.filter((m) => !owned.has(m.id));
        const result = assignMonsters(past, false);
        unowned.slice(0, 4).forEach((m, i) => expect(result[i].id).toBe(m.id));
      }),
    );
  });

  it('a child who owns every common sees all eight in turn', () => {
    const allCommons = MONSTERS.filter((m) => m.rarity === 'common').map((m) => m.id);
    const session = (): SessionResult => ({
      date: '2026-11-19',
      timeOfDay: 'morning',
      mode: 'timer-only',
      zoneResults: [],
      monstersEarned: allCommons,
      startedAt: 0,
      durationSeconds: 120,
    });
    const seen = new Set<string>();
    for (let n = 0; n < 2; n++) {
      const past = Array.from({ length: 1 + n }, session);
      for (const m of assignMonsters(past, false)) seen.add(m.id);
    }
    expect(seen.size).toBe(8);
  });

  it('the rare is the first unowned rare in table order, else the first rare', () => {
    fc.assert(
      fc.property(pastSessionsArb, (past) => {
        const owned = new Set(past.flatMap((s) => s.monstersEarned));
        const rares = MONSTERS.filter((m) => m.rarity === 'rare');
        const expected = rares.find((m) => !owned.has(m.id)) ?? rares[0];
        expect(assignMonsters(past, true)[3].id).toBe(expected.id);
      }),
    );
  });
});

describe('rescueAtOrBelow9', () => {
  it('a pending monster at zone end is fled at health <= 9, else trapped', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: H_MAX }), (health) => {
        const resolved = resolveMonster(monsterWithHealth(health));
        expect(resolved.outcome).toBe(health <= RESCUE_THRESHOLD ? 'fled' : 'trapped');
        expect(resolved.health).toBe(health);
      }),
    );
  });

  it('a defeated monster stays defeated and the input is not changed', () => {
    const defeated = monsterWithHealth(0, 'defeated');
    expect(resolveMonster(defeated)).toBe(defeated);
    const pending = monsterWithHealth(9);
    resolveMonster(pending);
    expect(pending.outcome).toBe('pending');
  });
});
