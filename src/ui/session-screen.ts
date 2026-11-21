// The plain session screen (design section 10, req 11.2-11.5, 11.10, 11.11, 15.1).
// Start button, one monster over the active zone, countdown, caption, smoke after a
// defeat. Everything painted during a session comes from `toView(state)`. Every captioned
// line is also spoken through the speaker. A camera preview can be attached in a camera-mode
// session (`attachPreview`); it only changes where the monster is drawn and shows the video.
// Without one, the screen is the plain session screen.
// Styles are set through classes or element.style only (Content-Security-Policy).
import { getLine } from '../audio/lines';
import type { Speaker } from '../audio/speaker';
import { MONSTERS } from '../logic/monsters';
import type { MonsterDef, ZoneId } from '../logic/types';
import type { View } from '../logic/view';
import type { CameraPreview } from './camera-preview';
import { frameGuidance } from './frame-guidance';
import { createMirrorFrame } from './mirror-frame';
import { MIN_MONSTER_SCALE } from './monster-draw-state';

/** Mouth grid in mirror order: the child's right is on the right of the screen. */
const GRID: readonly { id: ZoneId; label: string }[] = [
  { id: 'upper-left', label: 'Upper left' },
  { id: 'upper-right', label: 'Upper right' },
  { id: 'lower-left', label: 'Lower left' },
  { id: 'lower-right', label: 'Lower right' },
];

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/**
 * Draws one cute monster from plain elements. Shared with the end card.
 * Rare monsters get a star, so rarity is not shown by colour alone.
 */
export function drawMonster(def: MonsterDef): HTMLElement {
  const body = el('div', `monster monster--${def.id}`);
  body.setAttribute('role', 'img');
  body.setAttribute('aria-label', def.name);
  body.append(el('span', 'monster__ear monster__ear--left'), el('span', 'monster__ear monster__ear--right'));
  body.append(el('span', 'monster__eye monster__eye--left'), el('span', 'monster__eye monster__eye--right'));
  body.append(el('span', 'monster__mouth'));
  if (def.rarity === 'rare') body.append(el('span', 'monster__star', '\u2605'));
  return body;
}

export interface SessionScreenHandlers {
  /** The big start button was tapped. */
  onStart: () => void;
}

export interface SessionScreen {
  showStart(): void;
  /** Paints one view. Shows the session panel if it is not showing. */
  paint(view: View): void;
  hide(): void;
  /**
   * Shows a camera preview on the session panel and lets it draw the monster (it places the
   * monster itself through `preview.placeMonster`). `null` removes it, and the screen is the
   * plain session screen again. Never called in guided-timer mode.
   */
  attachPreview(preview: CameraPreview | null): void;
}

export function createSessionScreen(
  root: HTMLElement,
  handlers: SessionScreenHandlers,
  speaker: Speaker,
): SessionScreen {
  const screen = el('section', 'screen');

  // Start panel
  const startPanel = el('div', 'panel panel--start');
  const title = el('h1', 'title', 'Foamtom: The Haunted Mirror');
  const startButton = el('button', 'big-button');
  startButton.type = 'button';
  startButton.setAttribute('aria-label', 'Start brushing');
  startButton.append(el('span', 'big-button__icon', '\u25B6'), el('span', 'big-button__label', 'Brush!'));
  const startCaption = el('p', 'caption', getLine('start')?.caption ?? '');
  startPanel.append(title, startButton, startCaption);

  // Session panel
  const sessionPanel = el('div', 'panel panel--session');
  const countdown = el('div', 'countdown');
  countdown.setAttribute('aria-label', 'Seconds left in this part');
  const mouth = el('div', 'mouth');
  const cells = new Map<ZoneId, HTMLElement>();
  for (const zone of GRID) {
    const cell = el('div', `zone zone--${zone.id}`);
    cell.append(el('span', 'zone__label', zone.label));
    cells.set(zone.id, cell);
    mouth.append(cell);
  }
  const stage = el('div', 'stage');
  const monsterName = el('span', 'stage__name');
  const smoke = el('div', 'smoke');
  smoke.append(el('span', 'smoke__puff smoke__puff--a'), el('span', 'smoke__puff smoke__puff--b'), el('span', 'smoke__puff smoke__puff--c'));
  const sessionCaption = el('p', 'caption caption--session');
  sessionCaption.setAttribute('aria-live', 'polite');
  // The haunted-mirror frame is the guidance. It is a sibling of the mirrored preview, never
  // its parent or child. In a timer-only session its glass holds the mouth grid; in a camera
  // session the glass holds the preview and the grid sits below the frame.
  const frame = createMirrorFrame();
  frame.glass.append(mouth);
  frame.paint(frameGuidance(null));
  sessionPanel.append(countdown, frame.element, sessionCaption);

  screen.append(startPanel, sessionPanel);
  root.append(screen);
  sessionPanel.hidden = true;

  let drawnMonsterId: string | null = null;
  let monsterEl: HTMLElement | null = null;
  let spokenLineId: string | null = null;
  let currentPreview: CameraPreview | null = null;

  startButton.addEventListener('click', () => {
    startButton.disabled = true; // one tap starts one session
    speaker.unlock(); // this tap unlocks sound
    speaker.say('start');
    handlers.onStart();
  });

  function showMonster(monsterId: string): HTMLElement | null {
    if (drawnMonsterId === monsterId && monsterEl) return monsterEl;
    const def = MONSTERS.find((m) => m.id === monsterId);
    if (!def) return null;
    monsterEl?.remove();
    monsterEl = drawMonster(def);
    stage.replaceChildren(monsterEl, smoke, monsterName);
    monsterName.textContent = def.name;
    drawnMonsterId = monsterId;
    return monsterEl;
  }

  return {
    showStart(): void {
      startButton.disabled = false;
      spokenLineId = null;
      frame.paint(frameGuidance(null)); // a new session never starts with a lit region
      speaker.stop();
      sessionPanel.hidden = true;
      startPanel.hidden = false;
      screen.hidden = false;
    },

    paint(view: View): void {
      if (view.phase === 'ended') return; // the end card takes over
      screen.hidden = false;
      startPanel.hidden = true;
      sessionPanel.hidden = false;

      // One synchronous call, in this order: the frame, the caption and voice, the monster.
      frame.paint(frameGuidance(view));
      countdown.textContent = String(view.countdown);
      sessionCaption.textContent = getLine(view.captionLineId)?.caption ?? '';
      if (view.phase === 'paused') {
        speaker.stop(); // the child has left the screen
      } else if (view.captionLineId !== spokenLineId) {
        spokenLineId = view.captionLineId;
        speaker.say(view.captionLineId); // every captioned line is also spoken, once
      }

      for (const [id, cell] of cells) cell.classList.toggle('zone--active', id === view.zoneId);
      const activeCell = cells.get(view.zoneId);
      const monster = showMonster(view.monsterId);
      const home = currentPreview ? currentPreview.monsterSlot : activeCell;
      if (home && monster && stage.parentElement !== home) home.append(stage);

      if (monster) {
        const defeated = view.healthFraction <= 0;
        monster.hidden = defeated;
        monsterName.hidden = defeated;
        const scale = MIN_MONSTER_SCALE + (1 - MIN_MONSTER_SCALE) * view.healthFraction;
        monster.style.transform = `scale(${scale.toFixed(3)})`;
        smoke.hidden = view.smokeFraction <= 0;
        smoke.style.opacity = view.smokeFraction.toFixed(3);
      }
      sessionPanel.classList.toggle('is-paused', view.phase === 'paused');
    },

    hide(): void {
      screen.hidden = true;
    },

    attachPreview(preview: CameraPreview | null): void {
      if (preview === currentPreview) return;
      if (currentPreview) {
        stage.remove(); // back to the zone cell on the next paint
        currentPreview.element.remove();
      }
      currentPreview = preview;
      if (preview) {
        // The grid moves out below the frame; the preview takes the glass.
        mouth.remove();
        frame.glass.append(preview.element);
        frame.element.after(mouth);
        if (monsterEl) preview.monsterSlot.append(stage);
      } else {
        mouth.remove();
        frame.glass.append(mouth); // the grid goes back into the glass
      }
    },
  };
}
