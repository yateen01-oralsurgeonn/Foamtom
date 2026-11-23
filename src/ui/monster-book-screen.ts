// The Monster Book screen (design section 5.7, req 7). It reads the saved sessions each time
// it opens, through the loader it is given, and only shows what they say. It shows no frame,
// starts no camera and keeps nothing.
import type { Speaker, TextSpeaker } from '../audio/speaker';
import type { SessionResult } from '../logic/types';
import { MONSTERS } from '../logic/monsters';
import { getLine } from '../audio/lines';
import { bookTapAction, bookViewFromLoader, type BookEntry, type BookTapAction } from './book-model';
import { createBookSpeech } from './book-speech';
import { DISPLAY_TEXT } from './display-text';
import { drawMonster, drawSilhouette } from './monster-art';
import { TAP_TARGETS } from './tap-targets';

export interface MonsterBookScreenDeps {
  root: HTMLElement;
  loadSessions: () => readonly SessionResult[];
  speaker: Speaker & TextSpeaker;
  /** Called after the back button has stopped any speech. The caller decides where to go. */
  onBack: () => void;
}

export interface MonsterBookScreen {
  /** Reads the sessions again, builds the cells and shows the screen. */
  open(): void;
  /** Hides the screen. */
  close(): void;
}

function applySize(node: HTMLElement, target: { minWidthPx: number; minHeightPx: number }): void {
  node.style.minWidth = `${target.minWidthPx}px`;
  node.style.minHeight = `${target.minHeightPx}px`;
}

export function createMonsterBookScreen(deps: MonsterBookScreenDeps): MonsterBookScreen {
  const { root, loadSessions, speaker, onBack } = deps;
  const speech = createBookSpeech(speaker);

  const section = document.createElement('section');
  section.className = 'screen book';
  section.hidden = true;

  const header = document.createElement('header');
  header.className = 'book__header';

  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'icon-button book__back';
  back.setAttribute('aria-label', DISPLAY_TEXT.back.text);
  applySize(back, TAP_TARGETS.bookBack);
  const backIcon = document.createElement('span');
  backIcon.className = 'icon-button__icon';
  backIcon.textContent = '\u2190';
  const backLabel = document.createElement('span');
  backLabel.className = 'icon-button__label';
  backLabel.textContent = DISPLAY_TEXT.back.text;
  back.append(backIcon, backLabel);
  back.addEventListener('click', () => {
    speaker.stop();
    onBack();
  });

  const heading = document.createElement('h1');
  heading.className = 'book__title';
  heading.textContent = DISPLAY_TEXT['book-title'].text;
  header.append(back, heading);

  const commons = document.createElement('div');
  commons.className = 'book__commons';
  const rares = document.createElement('div');
  rares.className = 'book__rares';

  const caption = document.createElement('p');
  caption.className = 'caption book__caption';
  caption.setAttribute('aria-live', 'polite');

  // The rare invitation (req 8): created once, outside the loop over entries, and shown only
  // while some rare monster is not owned. Its words are the `rare-invite` line's caption.
  const inviteLine = getLine('rare-invite');
  const invite = document.createElement('p');
  invite.className = 'book__invite';
  invite.textContent = inviteLine ? inviteLine.caption : '';
  invite.hidden = true;

  section.append(header, commons, rares, invite, caption);
  root.append(section);

  function showTapped(action: BookTapAction): void {
    if (action.kind === 'say-name') caption.textContent = action.text;
    else if (action.kind === 'say-line') caption.textContent = inviteLine ? inviteLine.caption : '';
  }

  function ownedCell(entry: BookEntry): HTMLElement {
    const def = MONSTERS.find((m) => m.id === entry.id);
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'book-cell';
    applySize(cell, TAP_TARGETS.bookCell);
    if (entry.name !== null) cell.setAttribute('aria-label', entry.name);
    if (def) cell.append(drawMonster(def));
    const name = document.createElement('span');
    name.className = 'book-cell__name';
    name.textContent = entry.name ?? '';
    cell.append(name);
    cell.addEventListener('click', () => {
      const action = bookTapAction(entry);
      speech.run(action);
      showTapped(action);
    });
    return cell;
  }

  function unmetCell(entry: BookEntry): HTMLElement {
    const silhouette = drawSilhouette(entry.rare ? 'rare' : 'common');
    if (entry.rare) {
      // A rare silhouette is a button: a tap speaks the invitation line (req 8.1).
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'book-cell book-cell--unmet book-cell--rare-unmet';
      cell.setAttribute('aria-label', DISPLAY_TEXT['not-met'].text);
      applySize(cell, TAP_TARGETS.bookCell);
      cell.append(silhouette);
      cell.addEventListener('click', () => {
        const action = bookTapAction(entry);
        speech.run(action);
        showTapped(action);
      });
      return cell;
    }
    const cell = document.createElement('div');
    cell.className = 'book-cell book-cell--unmet';
    cell.setAttribute('role', 'img');
    cell.setAttribute('aria-label', DISPLAY_TEXT['not-met'].text);
    applySize(cell, TAP_TARGETS.bookCell);
    cell.append(silhouette);
    return cell;
  }

  return {
    open(): void {
      const view = bookViewFromLoader(loadSessions);
      const commonCells: HTMLElement[] = [];
      const rareCells: HTMLElement[] = [];
      for (const entry of view.entries) {
        const cell = entry.owned ? ownedCell(entry) : unmetCell(entry);
        (entry.rare ? rareCells : commonCells).push(cell);
      }
      commons.replaceChildren(...commonCells);
      rares.replaceChildren(...rareCells);
      invite.hidden = !view.showRareInvitation;
      caption.textContent = '';
      section.hidden = false;
    },

    close(): void {
      section.hidden = true;
    },
  };
}
