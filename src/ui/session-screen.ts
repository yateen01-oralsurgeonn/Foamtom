// The plain session screen (design section 10, req 11.2-11.5, 11.10, 11.11, 15.1).
// Start button, one monster over the active zone, countdown, caption, smoke after a
// defeat. Everything painted during a session comes from `toView(state)`. Every captioned
// line is also spoken through the speaker. A camera preview can be attached in a camera-mode
// session (`attachPreview`); it only changes where the monster is drawn and shows the video.
// Without one, the screen is the plain session screen.
// Styles are set through classes or element.style only (Content-Security-Policy).
import { getLine } from '../audio/lines';
import type { Speaker } from '../audio/speaker';
import { ZONE_ORDER } from '../logic/constants';
import { MONSTERS } from '../logic/monsters';
import type { ZoneId } from '../logic/types';
import type { View } from '../logic/view';
import type { CameraPreview } from './camera-preview';
import type { Effects } from './effects';
import { effectsFor } from './effects';
import { frameGuidance } from './frame-guidance';
import { hitClassFor, isHit } from './hit-feedback';
import { GATE_OPEN, gateOnAnimationEnd, gateOnPaint, nextMonsterVisible } from './leaving-gate';
import type { LeavingGate } from './leaving-gate';
import { createMirrorFrame } from './mirror-frame';
import { drawMonster } from './monster-art';
import { monsterDrawState, monsterScale, smokeLook } from './monster-draw-state';
import type { ZoneEnd } from './monster-draw-state';
import { createTitlePanel } from './title-panel';

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

// `drawMonster` lives in `monster-art.ts`; it is re-exported so `end-card.ts` keeps its import.
export { drawMonster } from './monster-art';

export interface SessionScreenHandlers {
  /** The big start button was tapped. */
  onStart: () => void;
  /** The smaller Monster Book button on the start panel. Not shown when this is missing. */
  onOpenBook?: () => void;
}

export interface SessionScreen {
  showStart(): void;
  /**
   * Paints one view. Shows the session panel if it is not showing. With a `zoneEnd`, one
   * leaving copy of that zone's monster is drawn in the state of its outcome.
   */
  paint(view: View): void;
  paint(view: View, zoneEnd: ZoneEnd): void;
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
  /** The current effects (reduced motion off or on). Read at each paint, so a change is followed. */
  getEffects: () => Effects = () => effectsFor(false),
): SessionScreen {
  const screen = el('section', 'screen');

  // Start panel (built by title-panel.ts)
  const titlePanel = createTitlePanel(
    { onStart: () => handlers.onStart(), onOpenBook: handlers.onOpenBook },
    speaker,
  );
  const startPanel = titlePanel.element;

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
  const smokePuffs = [
    el('span', 'smoke__puff smoke__puff--a'),
    el('span', 'smoke__puff smoke__puff--b'),
    el('span', 'smoke__puff smoke__puff--c'),
  ];
  smoke.append(...smokePuffs);
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

  // At most one leaving copy exists. It is removed on `animationend`, on the next zone end,
  // on pause, on ended and in showStart(). No timer.
  let leavingEl: HTMLElement | null = null;
  // While a leaving copy exists the next monster is hidden (design section 5.12).
  let gate: LeavingGate = GATE_OPEN;
  let lastView: View | null = null;
  // Alternates on each hit, so the other of two identical animations restarts the flinch.
  let hitFlip = false;

  function removeLeaving(): void {
    leavingEl?.remove();
    leavingEl = null;
    gate = GATE_OPEN;
  }

  /** Paints the live monster and its smoke from one view. Hidden while the gate is closed. */
  function paintMonster(view: View, monster: HTMLElement | null): void {
    const activeCell = cells.get(view.zoneId);
    const home = currentPreview ? currentPreview.monsterSlot : activeCell;
    if (home && monster && stage.parentElement !== home) home.append(stage);

    if (monster) {
      const waiting = !nextMonsterVisible(gate);
      const drawState = monsterDrawState(view, null);
      const alive = !waiting && (drawState === 'sitting' || drawState === 'shrinking');
      monster.hidden = !alive;
      monsterName.hidden = !alive;
      if (alive) {
        const scale = monsterScale(view.healthFraction).toFixed(3);
        monster.style.transform = `scale(${scale})`;
        // The flinch keyframes start and end at this size, so the size change still shows.
        monster.style.setProperty('--monster-scale', scale);
      }
      // Smoke only after a defeat; it thins in puffs, size and opacity.
      const look = smokeLook(view.smokeFraction);
      const showSmoke = !waiting && drawState === 'defeated';
      smoke.hidden = !showSmoke;
      if (showSmoke) {
        smokePuffs.forEach((puff, index) => {
          puff.hidden = index >= look.puffs;
        });
        smoke.style.transform = `scale(${look.scale.toFixed(3)})`;
        smoke.style.opacity = look.opacity.toFixed(3);
      }
    }
  }

  function drawLeaving(zoneEnd: ZoneEnd, view: View): void {
    removeLeaving();
    const def = MONSTERS.find((m) => m.id === zoneEnd.monsterId);
    if (!def) return;
    const state = monsterDrawState(view, zoneEnd.outcome);
    const body = el('div', `leaving__body leaving__body--${state}`);
    const art = drawMonster(def);
    if (state === 'trapped') {
      const index = ZONE_ORDER.indexOf(zoneEnd.zoneId);
      const bubble = el('div', 'leaving__bubble');
      bubble.classList.add(index % 2 === 0 ? 'trapped-wave' : 'trapped-sleep');
      bubble.append(art);
      body.append(bubble);
    } else {
      body.append(art);
      const puffs = el('div', 'smoke leaving__smoke');
      const count = state === 'defeated' ? 3 : 1;
      const names = ['a', 'b', 'c'];
      for (let i = 0; i < count; i += 1) {
        puffs.append(el('span', `smoke__puff smoke__puff--${names[state === 'defeated' ? i : 1]}`));
      }
      body.append(puffs);
    }
    const copy = el('div', `leaving leaving--${state}`);
    copy.setAttribute('aria-hidden', 'true');
    copy.append(body);
    body.addEventListener('animationend', (event) => {
      if (event.target === body && copy === leavingEl) {
        removeLeaving();
        gate = gateOnAnimationEnd(gate);
        if (lastView) paintMonster(lastView, showMonster(lastView.monsterId)); // the next monster appears now
      }
    });

    // Placement strings only; no tracking value is read.
    const slot = currentPreview ? currentPreview.monsterSlot : null;
    if (currentPreview && slot && slot.style.left !== '') {
      copy.classList.add('leaving--placed');
      copy.style.left = slot.style.left;
      copy.style.top = slot.style.top;
      copy.style.width = slot.style.width;
      copy.style.transform = slot.style.transform;
      currentPreview.element.append(copy);
    } else {
      const cell = cells.get(zoneEnd.zoneId);
      if (!cell) return;
      copy.classList.add('leaving--cell');
      cell.append(copy);
    }
    leavingEl = copy;
  }

  return {
    showStart(): void {
      removeLeaving();
      lastView = null;
      titlePanel.enableStart();
      spokenLineId = null;
      frame.paint(frameGuidance(null)); // a new session never starts with a lit region
      speaker.stop();
      sessionPanel.hidden = true;
      startPanel.hidden = false;
      screen.hidden = false;
    },

    paint(view: View, zoneEnd?: ZoneEnd): void {
      if (view.phase === 'ended') {
        removeLeaving();
        lastView = null;
        return; // the end card takes over
      }
      if (view.phase === 'paused') removeLeaving();
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

      // The leaving copy is drawn where the monster was, before the stage moves on.
      if (zoneEnd) drawLeaving(zoneEnd, view);
      for (const [id, cell] of cells) cell.classList.toggle('zone--active', id === view.zoneId);

      // The next monster waits for the leaving copy (at most MAX_LEAVING_PAINTS paints).
      const wasLeaving = gate.leaving;
      gate = gateOnPaint(gate, { zoneEnd, phase: view.phase });
      if (gate.leaving && !leavingEl) gate = GATE_OPEN; // no copy was drawn: nothing to wait for
      if (wasLeaving && !gate.leaving) removeLeaving(); // the gate opened by paint count
      const previousView = lastView;
      lastView = view;
      const monster = showMonster(view.monsterId);
      paintMonster(view, monster);
      // The hit flinch: only for a monster that is shown, only when its health just fell.
      if (monster) {
        const shown = !monster.hidden;
        const hit = shown && isHit(previousView, view);
        const hitClass = hitClassFor(hit, getEffects(), hitFlip);
        monster.classList.remove('monster--hit-a', 'monster--hit-b');
        if (hitClass) {
          monster.classList.add(hitClass);
          hitFlip = !hitFlip;
        }
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
