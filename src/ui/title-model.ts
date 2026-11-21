// The controls of the title screen, as data (design section 5.5). Pure: no DOM, no clock.
// The `parent` control is added later (task 37). There is no mute or volume control.

import type { DisplayTextId } from './display-text';
import type { TapTargetId } from './tap-targets';

export interface TitleControl {
  readonly id: 'start' | 'book' | 'parent';
  readonly size: 'large' | 'small' | 'quiet';
  readonly target: TapTargetId;
  /** `start-line` is the existing spoken line. */
  readonly textId: DisplayTextId | 'start-line';
  readonly icon: true;
}

export function titleControls(): TitleControl[] {
  return [
    { id: 'start', size: 'large', target: 'start', textId: 'start-line', icon: true },
    { id: 'book', size: 'small', target: 'titleBook', textId: 'book-title', icon: true },
  ];
}
