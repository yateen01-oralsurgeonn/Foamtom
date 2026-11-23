// The title panel (design section 5.5, req 1): the game name, one large start button, a
// smaller Monster Book button and the privacy line. The controls come from `titleControls()`
// and their sizes from `TAP_TARGETS`. The panel only paints. It asks for nothing, loads
// nothing and makes no request. The parent control is built only when a handler is given.
import { getLine } from '../audio/lines';
import type { Speaker } from '../audio/speaker';
import { DISPLAY_TEXT } from './display-text';
import { TAP_TARGETS } from './tap-targets';
import { titleControls } from './title-model';

export interface TitlePanelHandlers {
  /** The large start button was tapped. */
  onStart: () => void;
  /** The smaller Monster Book button. The button exists only when this is given. */
  onOpenBook?: () => void;
  /** The small, quiet parent control. The control exists only when this is given. */
  onParentOpen?: () => void;
}

export interface TitlePanel {
  readonly element: HTMLElement;
  /** Re-enables the start button when the title screen is shown again. */
  enableStart(): void;
}

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

export function createTitlePanel(handlers: TitlePanelHandlers, speaker: Speaker): TitlePanel {
  const panel = el('div', 'panel panel--start');
  const title = el('h1', 'title', 'Foamtom: The Haunted Mirror');
  panel.append(title);

  let startButton: HTMLButtonElement | null = null;

  const onParentOpen = handlers.onParentOpen;

  for (const control of titleControls(onParentOpen !== undefined)) {
    const target = TAP_TARGETS[control.target as keyof typeof TAP_TARGETS];
    if (control.id === 'start') {
      // Icon, label, accessible name and the `start` line are unchanged.
      const button = el('button', 'big-button');
      button.type = 'button';
      button.setAttribute('aria-label', 'Start brushing');
      button.style.minWidth = `${target.minWidthPx}px`;
      button.style.minHeight = `${target.minHeightPx}px`;
      button.append(el('span', 'big-button__icon', '\u25B6'), el('span', 'big-button__label', 'Brush!'));
      button.addEventListener('click', () => {
        button.disabled = true; // one tap starts one session
        speaker.unlock(); // this tap unlocks audio
        speaker.say('start');
        handlers.onStart();
      });
      startButton = button;
      panel.append(button);
    } else if (control.id === 'book') {
      const onOpenBook = handlers.onOpenBook;
      if (!onOpenBook) continue;
      const bookName = DISPLAY_TEXT['book-title'].text;
      const button = el('button', 'small-button');
      button.type = 'button';
      button.setAttribute('aria-label', bookName);
      button.style.minWidth = `${target.minWidthPx}px`;
      button.style.minHeight = `${target.minHeightPx}px`;
      button.append(el('span', 'small-button__icon', '\u{1F4D6}'), el('span', 'small-button__label', bookName));
      button.addEventListener('click', () => {
        speaker.unlock(); // names are spoken whichever screen the child came from
        onOpenBook(); // no session, no camera
      });
      panel.append(button);
    } else if (control.id === 'parent') {
      // Small and quiet: an icon and a small word, with an accessible name. It builds no gate; the
      // parent-screen spec provides the handler and everything behind it.
      if (!onParentOpen) continue;
      const parentName = DISPLAY_TEXT['grown-ups'].text;
      const button = el('button', 'icon-button icon-button--quiet');
      button.type = 'button';
      button.setAttribute('aria-label', parentName);
      button.style.minWidth = `${target.minWidthPx}px`;
      button.style.minHeight = `${target.minHeightPx}px`;
      const icon = el('span', 'icon-button__icon', '\u{1F9D1}');
      icon.setAttribute('aria-hidden', 'true');
      // The small word next to the icon (decision of 23 Nov 2026). The icon is aria-hidden, so
      // the name is read once, from aria-label.
      const word = el('span', 'icon-button__word', parentName);
      button.append(icon, word);
      button.addEventListener('click', () => onParentOpen());
      panel.append(button);
    }
  }

  // Shown, never spoken.
  const privacy = el('p', 'title-privacy', DISPLAY_TEXT.privacy.text);
  const startCaption = el('p', 'caption', getLine('start')?.caption ?? '');
  panel.append(privacy, startCaption);

  return {
    element: panel,
    enableStart(): void {
      if (startButton) startButton.disabled = false;
    },
  };
}
