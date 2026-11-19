// The end card (design section 10, req 15.5): the session's four monsters, the closing
// line as a caption, and one button back to the start screen. It does not urge the child
// to play again. Captions only in this task; speech arrives in task 9.
import { getLine } from '../audio/lines';
import type { MonsterDef } from '../logic/types';
import { drawMonster } from './session-screen';

export interface EndCardHandlers {
  /** The one button: back to the start screen. */
  onDone: () => void;
}

export interface EndCard {
  show(monsters: readonly MonsterDef[]): void;
  hide(): void;
}

export function createEndCard(root: HTMLElement, handlers: EndCardHandlers): EndCard {
  const card = document.createElement('section');
  card.className = 'screen end-card';
  card.hidden = true;

  const caption = document.createElement('p');
  caption.className = 'caption caption--end';
  caption.setAttribute('aria-live', 'polite');

  const row = document.createElement('div');
  row.className = 'end-card__monsters';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'big-button';
  button.setAttribute('aria-label', 'Back to the start');
  const icon = document.createElement('span');
  icon.className = 'big-button__icon';
  icon.textContent = '\u2302';
  const label = document.createElement('span');
  label.className = 'big-button__label';
  label.textContent = 'Done';
  button.append(icon, label);
  button.addEventListener('click', () => handlers.onDone());

  card.append(row, caption, button);
  root.append(card);

  return {
    show(monsters: readonly MonsterDef[]): void {
      caption.textContent = getLine('end')?.caption ?? '';
      row.replaceChildren(
        ...monsters.map((def) => {
          const item = document.createElement('div');
          item.className = 'end-card__item';
          const name = document.createElement('span');
          name.className = 'end-card__name';
          name.textContent = def.name;
          item.append(drawMonster(def), name);
          return item;
        }),
      );
      card.hidden = false;
    },

    hide(): void {
      card.hidden = true;
    },
  };
}
