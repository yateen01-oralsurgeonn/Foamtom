// Adult gate: a pure state machine for "hold for three seconds" (parent-screen design 5.2).
// The caller passes the time in. The state keeps only the start of the current hold, never a
// total, so several short holds can never add up to the full time (req 2.4).

export type HoldSource = 'pointer' | 'key';

export interface GateState {
  /** Clock milliseconds at the press; null when not held. */
  readonly heldSince: number | null;
  readonly source: HoldSource | null;
  /** In memory only (req 2.2). */
  readonly passed: boolean;
}

export interface GateProgress {
  readonly elapsedMs: number;
  /** Whole seconds held, 0 to the hold seconds. */
  readonly step: number;
  /** 0 to 1. */
  readonly fraction: number;
}

export const GATE_START: GateState = { heldSince: null, source: null, passed: false };

/** Starts a hold. Ignored when already passed or already held (one hold at a time). */
export function gatePress(state: GateState, source: HoldSource, nowMs: number): GateState {
  if (state.passed || state.heldSince !== null) return state;
  return { heldSince: nowMs, source, passed: false };
}

/** Passes the gate once the current hold has lasted the full time. */
export function gateAdvance(state: GateState, nowMs: number, holdSeconds: number): GateState {
  if (state.passed || state.heldSince === null) return state;
  if (Math.max(0, nowMs - state.heldSince) >= holdSeconds * 1000) {
    return { ...state, passed: true };
  }
  return state;
}

/** Finger up, pointer cancel or leave, key up. A key up cannot end a pointer hold, and the reverse. */
export function gateRelease(state: GateState, source: HoldSource): GateState {
  if (state.passed) return state;
  if (state.source !== source) return state;
  return GATE_START;
}

/** Focus lost or tab hidden. */
export function gateCancel(state: GateState): GateState {
  return state.passed ? state : GATE_START;
}

export function gateProgress(state: GateState, nowMs: number, holdSeconds: number): GateProgress {
  const total = holdSeconds * 1000;
  if (state.heldSince === null && !state.passed) return { elapsedMs: 0, step: 0, fraction: 0 };
  const elapsed = state.passed
    ? total
    : Math.min(total, Math.max(0, nowMs - (state.heldSince as number)));
  return { elapsedMs: elapsed, step: Math.floor(elapsed / 1000), fraction: elapsed / total };
}
