// Session presenter (design sections 2 and 5.4). Keeps the previous state, asks the pure
// functions for the view and for the zone that just ended, and hands both to the screen.
// It makes no game decision, owns no timer and touches no DOM.
import type { SessionState } from '../logic/types';
import { toView } from '../logic/view';
import { zoneEndEvent } from './monster-draw-state';
import type { SessionScreen } from './session-screen';

export interface SessionPresenterDeps {
  readonly screen: Pick<SessionScreen, 'paint'>;
}

export interface SessionPresenter {
  /** Paints one state, with the zone that just ended (if any) as the second argument. */
  update(state: SessionState): void;
  /** Forgets the previous state, so the next update carries no zone end. */
  reset(): void;
}

export function createSessionPresenter(deps: SessionPresenterDeps): SessionPresenter {
  let previous: SessionState | null = null;
  return {
    update(state: SessionState): void {
      const view = toView(state);
      // The last zone is shown by the end card, so no zone end is passed at `ended`.
      const zoneEnd = state.phase === 'ended' ? null : zoneEndEvent(previous, state);
      previous = state;
      if (zoneEnd) deps.screen.paint(view, zoneEnd);
      else deps.screen.paint(view);
    },
    reset(): void {
      previous = null;
    },
  };
}
