// The parent (grown-ups) screen painter (parent-screen design sections 4, 5.1, 5.8).
// It builds the header and the gate when the screen opens, and the contents only after the
// gate has passed. It paints what parentView returned and decides nothing. It starts no
// camera, asks for no permission, plays no sound and sends nothing.
import type { Storage as GameStorage } from '../storage/storage';
import { DISPLAY_TEXT } from './display-text';
import { GATE_START } from './adult-gate';
import { PARENT_VIEW_CONSTANTS } from './parent-constants';
import { createGateView, type FrameScheduler, type GateView } from './parent-gate-view';
import {
  CLOSED_STATE,
  closeScreen,
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

/** Everything after the gate. Called only from the path that runs when the gate passes. */
function buildContents(view: ParentView): HTMLElement {
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

  const disclosure = document.createElement('section');
  disclosure.className = 'parent-disclosure';
  disclosure.setAttribute('aria-labelledby', TITLE_ID);
  disclosure.append(listOf('parent-disclosure__list', view.disclosure));
  content.append(disclosure);
  return content;
}

export function createParentScreen(deps: ParentScreenDeps): ParentScreen {
  const { root, storage, today, now, frames, visibility, onBack } = deps;

  let state: ParentScreenState = CLOSED_STATE;
  let gateView: GateView | null = null;
  let heading: HTMLHeadingElement | null = null;
  const cleanups: Array<() => void> = [];

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
    const contents = buildContents(view);
    if (gateSection !== null) gateSection.replaceWith(contents);
    else section.append(contents);
    if (heading !== null) heading.focus();
  }

  function closeNow(): void {
    if (gateView !== null) {
      gateView.destroy();
      gateView = null;
    }
    for (const undo of cleanups.splice(0)) undo();
    heading = null;
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
