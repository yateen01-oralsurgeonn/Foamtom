// Developer-only title card page for the demo video. Reads the URL once, builds the card
// from the game's own parts, and stops. No timer, no listener, nothing stored or sent.
import { MONSTERS } from '../src/logic/monsters';
import { REGION_LOOKS } from '../src/ui/effects';
import { REGION_ORDER } from '../src/ui/frame-guidance';
import type { FrameGuidance } from '../src/ui/frame-guidance';
import { createMirrorFrame } from '../src/ui/mirror-frame';
import { drawMonster } from '../src/ui/monster-art';
import { CARD_MONSTER_ID, TIMELINE, isStill, titleCardModel } from './title-card-model';

function byId(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) throw new Error('missing page element');
  return element;
}

// All four regions bright: the mirror is fully awake. Built here, not taken from the game's
// per-zone guidance function.
function fullyLit(): FrameGuidance {
  return {
    regions: REGION_ORDER.map((region) => ({ region, level: 'active', look: REGION_LOOKS.active })),
    activeRegion: null,
    flickering: false,
  };
}

function div(className: string): HTMLElement {
  const node = document.createElement('div');
  node.className = className;
  return node;
}

const params = new URLSearchParams(location.search);
const model = titleCardModel(params.get('card'));
const still = isStill(params.get('still'));

const stage = byId('stage');
stage.classList.add('title-card', `title-card--${model.card}`);
if (still) stage.classList.add('title-card--still');

for (const step of TIMELINE) {
  stage.style.setProperty(`--tc-${step.id}-delay`, `${step.startMs}ms`);
  stage.style.setProperty(`--tc-${step.id}-duration`, `${step.durationMs}ms`);
}

const frame = createMirrorFrame();
frame.paint(fullyLit());

const def = MONSTERS.find((m) => m.id === CARD_MONSTER_ID);
if (!def) throw new Error('monster missing');

const monsterBox = div('title-card__monster');
monsterBox.append(drawMonster(def));
frame.glass.append(monsterBox);

const mirrorBox = div('title-card__mirror');
mirrorBox.append(frame.element);

const textBox = div('title-card__text');
for (const line of model.lines) {
  const p = document.createElement('p');
  p.className = `title-card__line title-card__line--${line.role}`;
  p.textContent = line.text;
  textBox.append(p);
}

stage.append(mirrorBox, textBox);
