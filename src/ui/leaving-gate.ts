// The leaving gate (design section 5.12, req 6.13, 15.12). While a leaving copy of a zone's
// monster exists, the next zone's monster is not shown. Pure: no DOM, no clock, no timer, no
// randomness. The count is paints (one per tick), never milliseconds.
import type { View } from '../logic/view';
import type { ZoneEnd } from './monster-draw-state';

export interface LeavingGate {
  readonly leaving: boolean;
  readonly paintsSinceEnd: number;
}

/** The second paint after the zone end opens the gate (the paint with the zone end is paint 0). */
export const MAX_LEAVING_PAINTS = 2;

export const GATE_OPEN: LeavingGate = { leaving: false, paintsSinceEnd: 0 };

export function gateOnPaint(
  gate: LeavingGate,
  input: { readonly zoneEnd: ZoneEnd | null | undefined; readonly phase: View['phase'] },
): LeavingGate {
  if (input.phase !== 'running') return GATE_OPEN; // paused, ended: the copy is removed
  if (input.zoneEnd) return { leaving: true, paintsSinceEnd: 0 }; // a new zone end replaces an old copy
  if (!gate.leaving) return gate;
  const n = gate.paintsSinceEnd + 1;
  return n >= MAX_LEAVING_PAINTS ? GATE_OPEN : { leaving: true, paintsSinceEnd: n };
}

export function gateOnAnimationEnd(_gate: LeavingGate): LeavingGate {
  return GATE_OPEN;
}

export function nextMonsterVisible(gate: LeavingGate): boolean {
  return !gate.leaving;
}
