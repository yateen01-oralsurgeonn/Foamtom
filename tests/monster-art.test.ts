import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { MONSTERS } from '../src/logic/monsters';

const art = readFileSync('src/ui/monster-art.ts', 'utf8');
const screen = readFileSync('src/ui/session-screen.ts', 'utf8');

describe('drawMonsterSignature (source)', () => {
  it('exports drawMonster(def: MonsterDef): HTMLElement with role img and an aria-label from the name', () => {
    expect(art).toMatch(/export function drawMonster\(def: MonsterDef\): HTMLElement/);
    expect(art).toMatch(/setAttribute\(\s*'role'\s*,\s*'img'\s*\)/);
    expect(art).toMatch(/setAttribute\(\s*'aria-label'\s*,\s*def\.name\s*\)/);
  });

  it('reads its shape classes from MONSTER_LOOKS', () => {
    expect(art).toContain('MONSTER_LOOKS');
    for (const part of ['body', 'ears', 'eyes', 'extra', 'mouth', 'crest']) {
      expect(art).toContain(`monster--${part}-`);
    }
    expect(art).toContain('monster--${def.id}');
  });

  it('is re-exported by session-screen.ts', () => {
    expect(screen).toMatch(/export \{ drawMonster \} from '\.\/monster-art'/);
    expect(screen).not.toMatch(/export function drawMonster/);
  });

  it('has no innerHTML, <img, url(, timers or animation frames', () => {
    for (const banned of ['innerHTML', '<img', 'url(', 'setTimeout', 'setInterval', 'requestAnimationFrame']) {
      expect(art, banned).not.toContain(banned);
    }
  });

  it('drawSilhouette has no text that names a monster', () => {
    expect(art).toContain('export function drawSilhouette');
    const silhouette = art.slice(art.indexOf('export function drawSilhouette'));
    for (const m of MONSTERS) {
      expect(silhouette.toLowerCase()).not.toContain(m.name.toLowerCase());
      expect(silhouette).not.toContain(m.id);
    }
    expect(silhouette).not.toMatch(/[\u{1F512}\u{1F513}\u2715\u2716\u274C\u2A09]/u);
  });
});
