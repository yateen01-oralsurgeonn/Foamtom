import fc from 'fast-check';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { pause, resume, startSession, tick } from '../src/logic/session';
import type { BrushingSignal, SessionMode, SessionState, StartInput } from '../src/logic/types';
import { toView } from '../src/logic/view';
import {
  GATE_OPEN,
  MAX_LEAVING_PAINTS,
  gateOnAnimationEnd,
  gateOnPaint,
  nextMonsterVisible,
  type LeavingGate,
} from '../src/ui/leaving-gate';
import { zoneEndEvent, type ZoneEnd } from '../src/ui/monster-draw-state';

// Helpers live in this file (no shared helper file).
const signalArb: fc.Arbitrary<BrushingSignal> = fc.record({
  handNearMouth: fc.boolean(),
  side: fc.constantFrom('left' as const, 'right' as const, 'unknown' as const),
  level: fc.constantFrom('upper' as const, 'lower' as const, 'unknown' as const),
  moving: fc.boolean(),
});
const maybeSignalArb = fc.option(signalArb, { nil: null });
const modeArb: fc.Arbitrary<SessionMode> = fc.constantFrom('camera' as const, 'timer-only' as const);

function input(mode: SessionMode): StartInput {
  return { mode, startedAt: 1_000, date: '2026-11-21', hour: 8, pastSessions: [] };
}

const END: ZoneEnd = { zoneId: 'upper-right', monsterId: 'plaque-puff', outcome: 'defeated' };

/** Every state of a whole session, in order (the first one is the start state). */
function states(mode: SessionMode, signals: readonly (BrushingSignal | null)[]): SessionState[] {
  let state = startSession(input(mode));
  const all = [state];
  for (const signal of signals) {
    if (state.phase === 'ended') break;
    state = tick(state, signal);
    all.push(state);
  }
  return all;
}

describe('nextMonsterWaitsForLeavingCopy', () => {
  it('closes at the paint that carries a zone end', () => {
    const gate = gateOnPaint(GATE_OPEN, { zoneEnd: END, phase: 'running' });
    expect(nextMonsterVisible(gate)).toBe(false);
  });

  it('stays closed until animationend, which opens it at once', () => {
    let gate = gateOnPaint(GATE_OPEN, { zoneEnd: END, phase: 'running' });
    expect(nextMonsterVisible(gate)).toBe(false);
    gate = gateOnPaint(gate, { zoneEnd: null, phase: 'running' });
    expect(nextMonsterVisible(gate)).toBe(false); // paint 1
    expect(nextMonsterVisible(gateOnAnimationEnd(gate))).toBe(true);
  });

  it('opens at the second paint after the zone end when no animationend comes, never a third', () => {
    expect(MAX_LEAVING_PAINTS).toBe(2);
    let gate = gateOnPaint(GATE_OPEN, { zoneEnd: END, phase: 'running' }); // paint 0
    gate = gateOnPaint(gate, { zoneEnd: undefined, phase: 'running' }); // paint 1
    expect(nextMonsterVisible(gate)).toBe(false);
    gate = gateOnPaint(gate, { zoneEnd: undefined, phase: 'running' }); // paint 2
    expect(nextMonsterVisible(gate)).toBe(true);
  });

  it('opens at once on pause and on ended', () => {
    const closed = gateOnPaint(GATE_OPEN, { zoneEnd: END, phase: 'running' });
    expect(nextMonsterVisible(gateOnPaint(closed, { zoneEnd: null, phase: 'paused' }))).toBe(true);
    expect(nextMonsterVisible(gateOnPaint(closed, { zoneEnd: null, phase: 'ended' }))).toBe(true);
    expect(nextMonsterVisible(gateOnPaint(closed, { zoneEnd: END, phase: 'ended' }))).toBe(true);
  });

  it('lets a second zone end replace the first', () => {
    let gate = gateOnPaint(GATE_OPEN, { zoneEnd: END, phase: 'running' });
    gate = gateOnPaint(gate, { zoneEnd: null, phase: 'running' });
    gate = gateOnPaint(gate, { zoneEnd: END, phase: 'running' });
    expect(gate).toEqual({ leaving: true, paintsSinceEnd: 0 });
  });

  it('over whole sessions in both modes: closed at each zone end, open by paint 2, open on pause and ended', () => {
    fc.assert(
      fc.property(
        modeArb,
        fc.array(maybeSignalArb, { minLength: 120, maxLength: 120 }),
        fc.boolean(),
        fc.integer({ min: 1, max: 118 }),
        (mode, signals, withAnimationEnd, pauseAt) => {
          let gate: LeavingGate = GATE_OPEN;
          let prev: SessionState | null = null;
          let sincePaintZero: number | null = null;
          const run = (state: SessionState, paused: boolean): void => {
            const view = toView(state);
            const zoneEnd = paused ? null : zoneEndEvent(prev, state);
            gate = gateOnPaint(gate, { zoneEnd, phase: view.phase });
            if (zoneEnd && view.phase === 'running') {
              sincePaintZero = 0;
              expect(nextMonsterVisible(gate)).toBe(false);
            } else if (sincePaintZero !== null) {
              sincePaintZero += 1;
              if (view.phase !== 'running') {
                expect(nextMonsterVisible(gate)).toBe(true);
                sincePaintZero = null;
              } else if (withAnimationEnd && sincePaintZero === 1) {
                gate = gateOnAnimationEnd(gate);
                expect(nextMonsterVisible(gate)).toBe(true);
                sincePaintZero = null;
              } else if (sincePaintZero >= MAX_LEAVING_PAINTS) {
                expect(nextMonsterVisible(gate)).toBe(true);
                sincePaintZero = null;
              } else {
                expect(nextMonsterVisible(gate)).toBe(false);
              }
            }
            expect(sincePaintZero === null || sincePaintZero < MAX_LEAVING_PAINTS).toBe(true);
            prev = state;
          };
          let state = startSession(input(mode));
          run(state, false);
          for (let i = 0; i < signals.length && state.phase !== 'ended'; i += 1) {
            state = tick(state, signals[i] ?? null);
            run(state, false);
            if (i === pauseAt && state.phase === 'running') {
              const paused = pause(state);
              run(paused, true);
              expect(nextMonsterVisible(gate)).toBe(true);
              state = resume(paused);
              prev = state;
            }
          }
          expect(state.phase).toBe('ended');
          expect(nextMonsterVisible(gate)).toBe(true);
        },
      ),
    );
  });

  it('sees a zone end in the generated sessions (the test is not empty)', () => {
    const all = states('timer-only', Array.from({ length: 120 }, () => null));
    const ends = all.filter((s, i) => zoneEndEvent(all[i - 1] ?? null, s) !== null);
    expect(ends.length).toBeGreaterThanOrEqual(3);
  });

  it('session-screen.ts uses the gate, hides the live monster and has no timer', () => {
    const screen = readFileSync('src/ui/session-screen.ts', 'utf8');
    expect(screen).toMatch(/gateOnPaint\(/);
    expect(screen).toMatch(/gateOnAnimationEnd\(/);
    expect(screen).toMatch(/nextMonsterVisible\(/);
    expect(screen).toMatch(/monster\.hidden = /);
    expect(screen).not.toMatch(/setTimeout|setInterval|requestAnimationFrame|requestVideoFrameCallback/);
  });

  it('leaving-gate.ts is pure', () => {
    const source = readFileSync('src/ui/leaving-gate.ts', 'utf8');
    expect(source).not.toMatch(/document|window|Date|performance|Math\.random|setTimeout|setInterval|localStorage/);
  });
});
