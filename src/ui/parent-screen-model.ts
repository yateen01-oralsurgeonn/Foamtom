// Parent screen model: pure phases, the clear confirmation and the notice
// (parent-screen design sections 4 and 5.7). No DOM, no clock, no storage.
import { GATE_START, type GateState } from './adult-gate';
import { clearNotice, type ClearOutcome } from './parent-clear';
import type { ParentView } from './parent-view';

export type ParentPhase = 'closed' | 'gated' | 'unlocked';

export interface ParentScreenState {
  readonly phase: ParentPhase;
  /** null when closed (req 1.6). */
  readonly view: ParentView | null;
  readonly gate: GateState;
  /** The clear confirmation is showing. */
  readonly confirming: boolean;
  /** Row 24 text, or null. */
  readonly notice: string | null;
}

export const CLOSED_STATE: ParentScreenState = {
  phase: 'closed',
  view: null,
  gate: GATE_START,
  confirming: false,
  notice: null,
};

/** Opening always starts gated, with a fresh gate, no notice and no confirmation. */
export function openScreen(view: ParentView): ParentScreenState {
  return { phase: 'gated', view, gate: GATE_START, confirming: false, notice: null };
}

/** Takes in the gate's new state. The contents unlock only when the gate has passed. */
export function withGate(state: ParentScreenState, gate: GateState): ParentScreenState {
  if (state.phase !== 'gated') return state;
  return { ...state, gate, phase: gate.passed ? 'unlocked' : 'gated' };
}

/** Shows the one confirmation. Does nothing unless the contents are unlocked. */
export function askToClear(state: ParentScreenState): ParentScreenState {
  if (state.phase !== 'unlocked') return state;
  return { ...state, confirming: true };
}

/** "Keep": ends the confirmation and removes nothing. */
export function keepData(state: ParentScreenState): ParentScreenState {
  if (!state.confirming) return state;
  return { ...state, confirming: false };
}

/** After the clear: ends the confirmation, takes the re-read view, sets a notice only for 'failed'. */
export function afterClear(
  state: ParentScreenState,
  outcome: ClearOutcome,
  newView: ParentView,
): ParentScreenState {
  if (state.phase !== 'unlocked') return state;
  return { ...state, confirming: false, view: newView, notice: clearNotice(outcome) };
}

/** Nothing from the sessions or the gate survives. */
export function closeScreen(): ParentScreenState {
  return CLOSED_STATE;
}

/** The contents are shown only in phase `unlocked` (req 1.2). */
export function showsContents(state: ParentScreenState): boolean {
  return state.phase === 'unlocked';
}
