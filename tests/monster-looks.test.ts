import { describe, expect, it } from 'vitest';
import { MONSTERS } from '../src/logic/monsters';
import { MONSTER_LOOKS, shapeKey } from '../src/ui/monster-looks';

const BODIES = ['round', 'tall', 'wide', 'drop'];
const EARS = ['none', 'round', 'points', 'horns'];
const EXTRAS = ['none', 'tail', 'tuft', 'wings', 'bumps', 'wisps'];
const MOUTHS = ['smile', 'oh', 'tongue', 'wavy'];
const CRESTS = ['none', 'moon', 'sun', 'halo', 'crown'];

describe('monsterLooks', () => {
  const ids = MONSTERS.map((m) => m.id);

  it('has exactly the twelve monster ids, in table order', () => {
    expect(Object.keys(MONSTER_LOOKS)).toEqual(ids);
    expect(ids).toHaveLength(12);
  });

  it('gives twelve pairwise different shape keys', () => {
    const keys = ids.map((id) => shapeKey(MONSTER_LOOKS[id]));
    expect(new Set(keys).size).toBe(12);
  });

  it('keeps every field in its allowed set', () => {
    for (const id of ids) {
      const look = MONSTER_LOOKS[id];
      expect(BODIES).toContain(look.body);
      expect(EARS).toContain(look.ears);
      expect([1, 2, 3]).toContain(look.eyes);
      expect(EXTRAS).toContain(look.extra);
      expect(MOUTHS).toContain(look.mouth);
      expect(CRESTS).toContain(look.crest);
      expect(typeof look.star).toBe('boolean');
    }
  });

  it('has no mouth value that names teeth, fangs, blood or drips, and no colour field', () => {
    for (const id of ids) {
      const look = MONSTER_LOOKS[id];
      expect(look.mouth).not.toMatch(/tooth|teeth|fang|blood|drip/i);
      expect(Object.keys(look).sort()).toEqual(
        ['body', 'crest', 'ears', 'extra', 'eyes', 'mouth', 'star'],
      );
    }
  });

  it('gives every rare a star and a crest, with four different crests', () => {
    const rares = MONSTERS.filter((m) => m.rarity === 'rare');
    expect(rares).toHaveLength(4);
    for (const m of rares) {
      expect(MONSTER_LOOKS[m.id].star).toBe(true);
      expect(MONSTER_LOOKS[m.id].crest).not.toBe('none');
    }
    expect(new Set(rares.map((m) => MONSTER_LOOKS[m.id].crest)).size).toBe(4);
  });

  it('gives no common monster a star or a crest', () => {
    for (const m of MONSTERS.filter((x) => x.rarity === 'common')) {
      expect(MONSTER_LOOKS[m.id].star).toBe(false);
      expect(MONSTER_LOOKS[m.id].crest).toBe('none');
    }
  });
});
