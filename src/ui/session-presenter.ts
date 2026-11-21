// Session presenter (design sections 2 and 5.4). Keeps the previous state, asks the pure
// functions for the view and for the zone that just ended, and hands both to the screen.
// It makes no game decision, owns no timer and touches no DOM.
import type { SessionState } from '../logic/types';
import { toView } from '../logic/view';
import type { Sounds } from '../audio/sound-player';
import { zoneEndEvent } from './monster-draw-state';
import type { SessionScreen } from './session-screen';
import { cuesFor } from './sound-cues';

export interface SessionPresenterDeps {
  readonly screen: Pick<SessionScreen, 'paint'>;
  /** Optional: soft sounds for zone starts and monster outcomes (req 10.4, 10.6). */
  readonly sounds?: Pick<Sounds, 'play'>;
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
      const cues = cuesFor(previous, state); // none at `ended`
      previous = state;
      if (zoneEnd) deps.screen.paint(view, zoneEnd);
      else deps.screen.paint(view);
      if (deps.sounds) {
        for (const cue of cues) deps.sounds.play(cue.id, cue.delayMs);
      }
    },
    reset(): void {
      previous = null;
    },
  };
}
