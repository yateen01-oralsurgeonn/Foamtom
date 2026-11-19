// Monster table, assignment and zone-end resolution. See design section 7 (req 7.6, 10.4, 10.9, 10.10, 14.3).
// Pure: no randomness, no DOM, no Date.
import { RESCUE_THRESHOLD } from './constants';
import type { MonsterDef, MonsterState, SessionResult } from './types';

const COMMON_RULE = 'Meet it in any brushing session.';
const RARE_RULE = 'Brush in the morning and at night on the same day.';

/** All 12 monsters in table order: 8 common, then 4 rare (req 10.4). */
export const MONSTERS: readonly MonsterDef[] = [
  { id: 'plaque-puff', name: 'Plaque Puff', rarity: 'common', unlockRule: COMMON_RULE },
  { id: 'sugar-sprite', name: 'Sugar Sprite', rarity: 'common', unlockRule: COMMON_RULE },
  { id: 'gummy-gloop', name: 'Gummy Gloop', rarity: 'common', unlockRule: COMMON_RULE },
  { id: 'fuzzlefang', name: 'Fuzzlefang', rarity: 'common', unlockRule: COMMON_RULE },
  { id: 'crumb-goblin', name: 'Crumb Goblin', rarity: 'common', unlockRule: COMMON_RULE },
  { id: 'sticky-wisp', name: 'Sticky Wisp', rarity: 'common', unlockRule: COMMON_RULE },
  { id: 'molar-mumbler', name: 'Molar Mumbler', rarity: 'common', unlockRule: COMMON_RULE },
  { id: 'tartar-tot', name: 'Tartar Tot', rarity: 'common', unlockRule: COMMON_RULE },
  { id: 'midnight-molar-ghoul', name: 'Midnight Molar Ghoul', rarity: 'rare', unlockRule: RARE_RULE },
  { id: 'dawn-drool-dragon', name: 'Dawn Drool Dragon', rarity: 'rare', unlockRule: RARE_RULE },
  { id: 'moonlit-mint-phantom', name: 'Moonlit Mint Phantom', rarity: 'rare', unlockRule: RARE_RULE },
  { id: 'twilight-toffee-wraith', name: 'Twilight Toffee Wraith', rarity: 'rare', unlockRule: RARE_RULE },
];

/**
 * Picks the four monsters of a session, one per zone in zone order, by the fixed rule
 * in design section 7. No randomness: the same input always gives the same answer.
 */
export function assignMonsters(
  pastSessions: readonly SessionResult[],
  rareEligible: boolean,
): readonly MonsterDef[] {
  const owned = new Set<string>();
  for (const session of pastSessions) {
    for (const id of session.monstersEarned) owned.add(id);
  }

  const commons = MONSTERS.filter((m) => m.rarity === 'common');
  const start = (pastSessions.length * 4) % commons.length;
  const rotated = [...commons.slice(start), ...commons.slice(0, start)];

  const ordered = [
    ...commons.filter((m) => !owned.has(m.id)),
    ...rotated.filter((m) => owned.has(m.id)),
  ];

  if (rareEligible) {
    const rares = MONSTERS.filter((m) => m.rarity === 'rare');
    const rare = rares.find((m) => !owned.has(m.id)) ?? rares[0];
    return [ordered[0], ordered[1], ordered[2], rare];
  }
  return [ordered[0], ordered[1], ordered[2], ordered[3]];
}

/**
 * Applies the zone-end outcome to one monster (req 7.4, 7.5, 14.3).
 * A defeated monster stays defeated. A pending monster is `fled` at health
 * <= RESCUE_THRESHOLD, else `trapped`. Returns a new object; the input is not changed.
 */
export function resolveMonster(monster: MonsterState): MonsterState {
  if (monster.outcome !== 'pending') return monster;
  const outcome = monster.health <= RESCUE_THRESHOLD ? 'fled' : 'trapped';
  return { ...monster, outcome };
}
