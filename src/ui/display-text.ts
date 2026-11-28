// The second text table: words that are shown (or read by a screen reader) but not spoken
// from `src/audio/lines.ts`. Every string is one of the approved lines of the
// mirror-and-screens spec (requirements 1.3, 14.1, 14.4). Pure: no DOM, no clock.


export type DisplayTextId = 'privacy' | 'book-title' | 'back' | 'grown-ups' | 'not-met';

export interface DisplayText {
  readonly id: DisplayTextId;
  readonly text: string;
  /** `shown` is visible text. `name-only` is read by a screen reader and not seen. */
  readonly kind: 'shown' | 'name-only';
}

export const DISPLAY_TEXT: Readonly<Record<DisplayTextId, DisplayText>> = {
  privacy: {
    id: 'privacy',
    text: 'The camera picture stays on this phone. It is never saved or sent.',
    kind: 'shown',
  },
  'book-title': { id: 'book-title', text: 'Monster Book', kind: 'shown' },
  back: { id: 'back', text: 'Back', kind: 'shown' },
  'grown-ups': { id: 'grown-ups', text: 'Grown-ups', kind: 'shown' },
  'not-met': { id: 'not-met', text: 'Not met yet', kind: 'name-only' },
};
