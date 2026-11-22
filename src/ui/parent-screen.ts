// The parent (grown-ups) screen painter (parent-screen design sections 4, 5.1, 5.8).
// It builds the header and the gate when the screen opens, and the contents only after the
// gate has passed. It paints what parentView returned and decides nothing. It starts no
// camera, asks for no permission, plays no sound and sends nothing.
import type { Storage as GameStorage } from '../storage/storage';
import { DISPLAY_TEXT } from './display-text';
import { GATE_START } from './adult-gate';
import { clearAllData } from './parent-clear';
import { PARENT_TAP_TARGETS, PARENT_VIEW_CONSTANTS } from './parent-constants';
import { createGateView, type FrameScheduler, type GateView } from './parent-gate-view';
import {
  CLOSED_STATE,
  afterClear,
  askToClear,
  closeScreen,
  keepData,
  openScreen,
  showsContents,
  withGate,
  type ParentScreenState,
} from './parent-screen-model';
import { PARENT_TEXT } from './parent-text';
import { parentView, type ParentView } from './parent-view';
import type { VisibilitySource } from './game-loop';
import { TAP_TARGETS } from './tap-targets';

export interface ParentScreenDeps {
  readonly root: HTMLElement;
  readonly storage: Pick<GameStorage, 'loadSessions' | 'clearAll'>;
  /** Local YYYY-MM-DD, read by main.ts once per opening. */
  readonly today: () => string;
  /** Monotonic milliseconds: the gate's clock. */
  readonly now: () => number;
  readonly frames: FrameScheduler;
  readonly visibility: VisibilitySource;
  /** main.ts closes this screen and shows the title screen. */
  readonly onBack: () => void;
}

export interface ParentScreen {
  readonly open: () => void;
  readonly close: () => void;
}

const TITLE_ID = 'parent-title';
const DAYS_HEADING_ID = 'days-heading';
const CONFIRM_ID = 'clear-question';

function iconSpan(glyph: string): HTMLSpanElement {
  const icon = document.createElement('span');
  icon.className = 'icon-button__icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = glyph;
  return icon;
}

function labelSpan(text: string): HTMLSpanElement {
  const label = document.createElement('span');
  label.textContent = text;
  return label;
}

function applySize(node: HTMLElement, target: { minWidthPx: number; minHeightPx: number }): void {
  node.style.minWidth = `${target.minWidthPx}px`;
  node.style.minHeight = `${target.minHeightPx}px`;
}

function line(text: string): HTMLParagraphElement {
  const p = document.createElement('p');
  p.textContent = text;
  return p;
}

function listOf(className: string, texts: readonly string[]): HTMLUListElement {
  const ul = document.createElement('ul');
  ul.className = className;
  for (const text of texts) {
    const li = document.createElement('li');
    li.textContent = text;
    ul.append(li);
  }
  return ul;
}

/** The facts block: heading, seven day rows, three durations, the zone fact, and the nudge if any. */
function factsSection(view: ParentView): HTMLElement | null {
  if (!view.hasSessions || view.durations === null || view.daysHeading === null) return null;
  const section = document.createElement('section');
  section.className = 'parent-facts';
  section.setAttribute('aria-labelledby', DAYS_HEADING_ID);

  const heading = document.createElement('h2');
  heading.id = DAYS_HEADING_ID;
  heading.textContent = view.daysHeading;

  section.append(
    heading,
    listOf(
      'parent-days',
      view.days.map((d) => d.text),
    ),
    line(view.durations.withGame.text),
    line(view.durations.cameraSaw.text),
    line(view.durations.timerOnly.text),
  );
  if (view.zoneFact !== null) section.append(line(view.zoneFact.text));
  // The nudge is a plain paragraph: no icon, bell, badge or colour (requirement 7.8).
  if (view.nudge !== null) section.append(line(view.nudge.text));
  return section;
}

/**
 * Everything after the gate. Called only from the path that runs when the gate passes (and from
 * the repaint after a clear, which can only be reached from these contents).
 */
function buildContents(view: ParentView, notice: string | null, clear: HTMLElement): HTMLElement {
  const content = document.createElement('div');
  content.className = 'parent-content';

  const facts = factsSection(view);
  if (facts !== null) {
    content.append(facts);
  } else if (view.noSessionsText !== null) {
    const empty = line(view.noSessionsText);
    empty.className = 'parent-empty';
    content.append(empty);
  }

  // Row 24 after a failed clear: no claim that anything was cleared.
  if (notice !== null) {
    const note = line(notice);
    note.className = 'parent-notice';
    note.setAttribute('role', 'status');
    content.append(note);
  }

  const disclosure = document.createElement('section');
  disclosure.className = 'parent-disclosure';
  disclosure.setAttribute('aria-labelledby', TITLE_ID);
  disclosure.append(listOf('parent-disclosure__list', view.disclosure));
  content.append(disclosure, clear);
  return content;
}

export function createParentScreen(deps: ParentScreenDeps): ParentScreen {
  const { root, storage, today, now, frames, visibility, onBack } = deps;

  let state: ParentScreenState = CLOSED_STATE;
  let gateView: GateView | null = null;
  let heading: HTMLHeadingElement | null = null;
  let contentsEl: HTMLElement | null = null;
  let clearButton: HTMLButtonElement | null = null;
  let keepButton: HTMLButtonElement | null = null;
  const cleanups: Array<() => void> = [];
  const clearCleanups: Array<() => void> = [];

  const section = document.createElement('section');
  section.className = 'screen parent';
  section.hidden = true;
  root.append(section);

  function readSessions(): readonly unknown[] {
    try {
      return storage.loadSessions();
    } catch {
      // A failed read counts as no sessions and shows no error message.
      return [];
    }
  }

  function buildHeader(): HTMLElement {
    const header = document.createElement('header');
    header.className = 'parent__header';

    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'icon-button parent__back';
    back.setAttribute('aria-label', DISPLAY_TEXT.back.text);
    applySize(back, TAP_TARGETS.bookBack);
    const backIcon = document.createElement('span');
    backIcon.className = 'icon-button__icon';
    backIcon.textContent = '\u2190';
    const backLabel = document.createElement('span');
    backLabel.className = 'icon-button__label';
    backLabel.textContent = DISPLAY_TEXT.back.text;
    back.append(backIcon, backLabel);
    back.addEventListener('click', onBack);
    cleanups.push(() => back.removeEventListener('click', onBack));

    const title = document.createElement('h1');
    title.id = TITLE_ID;
    title.tabIndex = -1;
    title.textContent = PARENT_TEXT.heading.text;
    heading = title;

    header.append(back, title);
    return header;
  }

  /** Runs when the gate passes: the contents are built here and nowhere else. */
  function onPassed(): void {
    const view = state.view;
    if (state.phase !== 'gated' || view === null) return;
    state = withGate(state, { ...GATE_START, passed: true });
    if (!showsContents(state)) return;
    const gateSection = gateView !== null ? gateView.element : null;
    const contents = paintContents();
    if (contents === null) return;
    if (gateSection !== null) gateSection.replaceWith(contents);
    else section.append(contents);
    if (heading !== null) heading.focus();
  }

  /** Builds the contents from the current state. Only reachable once the gate has passed. */
  function paintContents(): HTMLElement | null {
    const view = state.view;
    if (!showsContents(state) || view === null) return null;
    const clear = buildClearSection();
    const contents = buildContents(view, state.notice, clear);
    contentsEl = contents;
    return contents;
  }

  function dropClearListeners(): void {
    for (const undo of clearCleanups.splice(0)) undo();
  }

  function listenClear(node: HTMLElement, handler: () => void): void {
    node.addEventListener('click', handler);
    clearCleanups.push(() => node.removeEventListener('click', handler));
  }

  /** The "Clear all data" button, and the one confirmation while the model says so. */
  function buildClearSection(): HTMLElement {
    dropClearListeners();
    clearButton = null;
    keepButton = null;
    const clear = document.createElement('section');
    clear.className = 'parent-clear';
    clear.setAttribute('aria-labelledby', TITLE_ID);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'parent-clear__button';
    button.setAttribute('aria-label', PARENT_TEXT['clear-button'].text);
    applySize(button, PARENT_TAP_TARGETS.clear);
    button.append(iconSpan('\u2716'), labelSpan(PARENT_TEXT['clear-button'].text));
    listenClear(button, onAskToClear);
    clearButton = button;
    clear.append(button);

    if (state.confirming) {
      const confirm = document.createElement('div');
      confirm.className = 'parent-clear__confirm';
      confirm.setAttribute('role', 'group');
      confirm.setAttribute('aria-labelledby', CONFIRM_ID);

      const question = line(PARENT_TEXT['clear-confirm'].text);
      question.id = CONFIRM_ID;

      const buttons = document.createElement('div');
      buttons.className = 'parent-clear__confirm-buttons';

      const doClear = document.createElement('button');
      doClear.type = 'button';
      doClear.className = 'parent-clear__confirm-clear';
      doClear.setAttribute('aria-label', PARENT_TEXT['clear-button'].text);
      applySize(doClear, PARENT_TAP_TARGETS.confirmClear);
      doClear.append(labelSpan(PARENT_TEXT['clear-button'].text));
      listenClear(doClear, onClearConfirmed);

      const keep = document.createElement('button');
      keep.type = 'button';
      keep.className = 'parent-clear__keep';
      keep.setAttribute('aria-label', PARENT_TEXT['clear-keep'].text);
      applySize(keep, PARENT_TAP_TARGETS.keep);
      keep.append(labelSpan(PARENT_TEXT['clear-keep'].text));
      listenClear(keep, onKeep);
      keepButton = keep;

      buttons.append(doClear, keep);
      confirm.append(question, buttons);
      clear.append(confirm);
    }
    return clear;
  }

  /** Swaps in a new clear section without rebuilding the facts. */
  function repaintClear(): void {
    if (contentsEl === null) return;
    const old = contentsEl.querySelector('.parent-clear');
    const next = buildClearSection();
    if (old !== null) old.replaceWith(next);
    else contentsEl.append(next);
  }

  function onAskToClear(): void {
    state = askToClear(state);
    if (!state.confirming) return;
    repaintClear();
    // Focus goes to "Keep", the safe default.
    if (keepButton !== null) keepButton.focus();
  }

  function onKeep(): void {
    state = keepData(state);
    repaintClear();
    if (clearButton !== null) clearButton.focus();
  }

  /** The one press that clears. No second confirmation. */
  function onClearConfirmed(): void {
    if (state.phase !== 'unlocked' || !state.confirming) return;
    const outcome = clearAllData(storage);
    const newView = parentView(readSessions(), PARENT_VIEW_CONSTANTS, today());
    state = afterClear(state, outcome, newView);
    const old = contentsEl;
    const next = paintContents();
    if (next !== null) {
      if (old !== null) old.replaceWith(next);
      else section.append(next);
    }
    if (clearButton !== null) clearButton.focus();
  }

  function closeNow(): void {
    if (gateView !== null) {
      gateView.destroy();
      gateView = null;
    }
    for (const undo of cleanups.splice(0)) undo();
    dropClearListeners();
    heading = null;
    contentsEl = null;
    clearButton = null;
    keepButton = null;
    section.replaceChildren();
    section.hidden = true;
    state = closeScreen();
  }

  return {
    open(): void {
      if (state.phase !== 'closed') closeNow();
      const view = parentView(readSessions(), PARENT_VIEW_CONSTANTS, today());
      state = openScreen(view);

      const header = buildHeader();
      const gate = createGateView({ now, frames, visibility, onPassed });
      gateView = gate;
      section.replaceChildren(header, gate.element);
      section.hidden = false;
      gate.button.focus();
    },

    close(): void {
      closeNow();
    },
  };
}
