// The end card (design section 5.6, req 9): the session's four monsters, the two closing
// lines as captions, a big button back to the start screen and a smaller button to the
// Monster Book. It has no other button and shows nothing that urges more play.
import { getLine } from '../audio/lines';
import type { Sounds } from '../audio/sound-player';
import type { Speaker } from '../audio/speaker';
import type { MonsterDef, MonsterOutcome } from '../logic/types';
import { DISPLAY_TEXT } from './display-text';
import { END_LINE_IDS, speakEnd } from './end-lines';
import { drawMonster } from './session-screen';
import { TAP_TARGETS } from './tap-targets';

export interface EndCardHandlers {
  /** The big button: back to the start screen. */
  onDone: () => void;
  /** The smaller button: open the Monster Book. The button exists only when this is given. */
  onOpenBook?: () => void;
}

export interface EndCard {
  show(monsters: readonly MonsterDef[], outcomes?: readonly MonsterOutcome[]): void;
  hide(): void;
  /** Shows the card again (after the Book) without speaking or playing anything. */
  unhide(): void;
}

export function createEndCard(
  root: HTMLElement,
  handlers: EndCardHandlers,
  speaker: Speaker,
  sounds?: Pick<Sounds, 'play'>,
): EndCard {
  const card = document.createElement('section');
  card.className = 'screen end-card';
  card.hidden = true;

  const captions = document.createElement('div');
  captions.className = 'end-card__captions';
  const captionEls = END_LINE_IDS.map(() => {
    const p = document.createElement('p');
    p.className = 'caption caption--end';
    p.setAttribute('aria-live', 'polite');
    return p;
  });
  captions.append(...captionEls);

  const row = document.createElement('div');
  row.className = 'end-card__monsters';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'big-button';
  button.setAttribute('aria-label', 'Back to the start');
  button.style.minWidth = `${TAP_TARGETS.endDone.minWidthPx}px`;
  button.style.minHeight = `${TAP_TARGETS.endDone.minHeightPx}px`;
  const icon = document.createElement('span');
  icon.className = 'big-button__icon';
  icon.textContent = '\u2302';
  const label = document.createElement('span');
  label.className = 'big-button__label';
  label.textContent = 'Done';
  button.append(icon, label);
  button.addEventListener('click', () => handlers.onDone());

  const buttons: HTMLElement[] = [button];

  const onOpenBook = handlers.onOpenBook;
  if (onOpenBook) {
    const bookName = DISPLAY_TEXT['book-title'].text;
    const bookButton = document.createElement('button');
    bookButton.type = 'button';
    bookButton.className = 'small-button';
    bookButton.setAttribute('aria-label', bookName);
    bookButton.style.minWidth = `${TAP_TARGETS.endBook.minWidthPx}px`;
    bookButton.style.minHeight = `${TAP_TARGETS.endBook.minHeightPx}px`;
    const bookIcon = document.createElement('span');
    bookIcon.className = 'small-button__icon';
    bookIcon.textContent = '\u{1F4D6}';
    const bookLabel = document.createElement('span');
    bookLabel.className = 'small-button__label';
    bookLabel.textContent = bookName;
    bookButton.append(bookIcon, bookLabel);
    bookButton.addEventListener('click', () => {
      speaker.unlock();
      onOpenBook();
    });
    buttons.push(bookButton);
  }

  card.append(row, captions, ...buttons);
  root.append(card);

  return {
    show(monsters: readonly MonsterDef[], outcomes?: readonly MonsterOutcome[]): void {
      END_LINE_IDS.forEach((id, i) => {
        const el = captionEls[i];
        if (el) el.textContent = getLine(id)?.caption ?? '';
      });
      row.replaceChildren(
        ...monsters.map((def, i) => {
          const item = document.createElement('div');
          item.className = 'end-card__item';
          const outcome = outcomes?.[i];
          if (outcome && outcome !== 'pending') item.classList.add(`end-card__item--${outcome}`);
          const name = document.createElement('span');
          name.className = 'end-card__name';
          name.textContent = def.name;
          item.append(drawMonster(def), name);
          return item;
        }),
      );
      card.hidden = false;
      speakEnd(speaker);
      sounds?.play('end');
    },

    hide(): void {
      card.hidden = true;
    },

    unhide(): void {
      card.hidden = false;
    },
  };
}
