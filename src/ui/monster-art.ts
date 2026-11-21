// Monster drawings (design section 5.3, req 5). Built from plain elements; the shape classes
// come from MONSTER_LOOKS, the colour class stays `monster--<id>`. Plain elements only.
import type { MonsterDef, Rarity } from '../logic/types';
import { MONSTER_LOOKS } from './monster-looks';

function el(tag: 'div' | 'span', className: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/**
 * Draws one cute monster from plain elements. Shared with the end card and the Monster Book.
 * Rare monsters get a star and a crest, so rarity is not shown by colour alone.
 */
export function drawMonster(def: MonsterDef): HTMLElement {
  const body = el('div', `monster monster--${def.id}`);
  body.setAttribute('role', 'img');
  body.setAttribute('aria-label', def.name);
  const look = MONSTER_LOOKS[def.id];
  if (look) {
    body.classList.add(
      `monster--body-${look.body}`,
      `monster--ears-${look.ears}`,
      `monster--eyes-${look.eyes}`,
      `monster--extra-${look.extra}`,
      `monster--mouth-${look.mouth}`,
      `monster--crest-${look.crest}`,
    );
  }
  body.append(el('span', 'monster__ear monster__ear--left'), el('span', 'monster__ear monster__ear--right'));
  body.append(el('span', 'monster__eye monster__eye--left'), el('span', 'monster__eye monster__eye--right'));
  if (look && look.eyes === 3) body.append(el('span', 'monster__eye monster__eye--middle'));
  body.append(el('span', 'monster__mouth'));
  if (def.rarity === 'rare') body.append(el('span', 'monster__star', '\u2605'));
  return body;
}

/**
 * One friendly blob for a monster the child has not met. The same for every common monster;
 * a rare one adds the star and a crest shape. No name, padlock, cross or number.
 */
export function drawSilhouette(rarity: Rarity): HTMLElement {
  const blob = el('div', `silhouette silhouette--${rarity}`);
  blob.append(el('span', 'silhouette__blob'));
  if (rarity === 'rare') {
    blob.append(el('span', 'silhouette__crest'), el('span', 'silhouette__star', '\u2605'));
  }
  return blob;
}
