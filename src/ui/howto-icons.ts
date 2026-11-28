// The three small drawings of the how-to strip on the title screen (requirement 17.4, design 5.5.1),
// also used large on the developer share card. Plain elements and class names only: the pictures
// are stylesheet rules in `howto-icons.css`. No emoji, no image file, no network. Each drawing
// sizes itself from the custom property `--icon` of its parent (44 px when none is set).
import { MONSTERS } from '../logic/monsters';
import type { MonsterDef } from '../logic/types';
import { drawMonster } from './monster-art';

/** The monster of the strip and of the share card, looked up in the monster table. */
export const STRIP_MONSTER_ID = 'plaque-puff';

function span(className: string): HTMLElement {
  const node = document.createElement('span');
  node.className = className;
  return node;
}

/** A toothbrush: handle, neck, head and a row of bristles. */
export function drawToothbrush(): HTMLElement {
  const root = span('tb');
  const body = span('tb__body');
  body.append(span('tb__handle'), span('tb__neck'), span('tb__head'), span('tb__bristles'));
  root.append(body);
  return root;
}

/**
 * A tooth with a monster on it. The monster is the game's own drawing. When the entry is missing
 * from the monster table the tooth is drawn alone: the title screen must never fail for this.
 */
export function drawToothWithMonster(def?: MonsterDef): HTMLElement {
  const root = span('tooth');
  root.append(span('tooth__root tooth__root--left'), span('tooth__root tooth__root--right'), span('tooth__crown'));
  const monster = def ?? MONSTERS.find((m) => m.id === STRIP_MONSTER_ID);
  if (monster) root.append(drawMonster(monster));
  return root;
}

/** The monster gone: three soft puffs of smoke and two sparkles. */
export function drawSmokeAndSparkle(): HTMLElement {
  const root = span('puff');
  root.append(
    span('puff__cloud puff__cloud--a'),
    span('puff__cloud puff__cloud--b'),
    span('puff__cloud puff__cloud--c'),
    span('puff__spark puff__spark--big'),
    span('puff__spark puff__spark--small'),
  );
  return root;
}
