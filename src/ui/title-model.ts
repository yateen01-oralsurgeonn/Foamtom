// The controls of the title screen, as data (design section 5.5). Pure: no DOM, no clock.
// The `parent` control exists only when a handler is given. There is no mute or volume control.

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

/** One step of the how-to strip under the subtitle (requirement 17.2). Shown, never spoken. */
export interface HowtoStep {
  readonly id: 'brush' | 'monsters' | 'away';
  readonly textId: DisplayTextId;
  readonly icon: 'toothbrush' | 'tooth-monster' | 'smoke';
}

/** The three steps, in the order they are read and drawn. */
export const HOWTO_STEPS: readonly HowtoStep[] = Object.freeze([
  Object.freeze({ id: 'brush', textId: 'step-brush', icon: 'toothbrush' }),
  Object.freeze({ id: 'monsters', textId: 'step-monsters', icon: 'tooth-monster' }),
  Object.freeze({ id: 'away', textId: 'step-away', icon: 'smoke' }),
] as const satisfies readonly HowtoStep[]);

export function titleControls(hasParentHandler = false): TitleControl[] {
  const controls: TitleControl[] = [
    { id: 'start', size: 'large', target: 'start', textId: 'start-line', icon: true },
    { id: 'book', size: 'small', target: 'titleBook', textId: 'book-title', icon: true },
  ];
  if (hasParentHandler) {
    controls.push({ id: 'parent', size: 'quiet', target: 'parent', textId: 'grown-ups', icon: true });
  }
  return controls;
}
