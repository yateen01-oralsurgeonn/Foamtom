import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { ZONE_DURATION, ZONE_ORDER } from '../src/logic/constants';
import { pause, resume, startSession, tick } from '../src/logic/session';
import { toSessionResult } from '../src/logic/session-result';
import { toView } from '../src/logic/view';
import type { BrushingSignal, SessionMode, SessionState, StartInput } from '../src/logic/types';

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
  return { mode, startedAt: 1_000, date: '2026-11-19', hour: 8, pastSessions: [] };
}

// The caption ids documented in src/logic/view.ts.
const CAPTION_IDS = [
  'zone-upper-right',
  'zone-upper-left',
  'zone-lower-left',
  'zone-lower-right',
  'smoke',
  'end',
];

// Matches the first zone (upper right); 20 of these defeat a normal monster.
const UPPER_RIGHT: BrushingSignal = { handNearMouth: true, side: 'right', level: 'upper', moving: true };

describe('viewMatchesState', () => {
  it('countdown, zone and fractions follow the state at every step', () => {
    fc.assert(
      fc.property(
        modeArb,
        fc.array(fc.tuple(maybeSignalArb, fc.constantFrom('tick', 'tick', 'tick', 'pause', 'resume')), {
          minLength: 0,
          maxLength: 130,
        }),
        (mode, steps) => {
          let state: SessionState = startSession(input(mode));
          const check = (): void => {
            const v = toView(state);
            expect(v.phase).toBe(state.phase);
            expect(v.countdown).toBe(state.zoneTimeRemaining);
            expect(v.zoneId).toBe(ZONE_ORDER[state.activeZoneIndex]);
            expect(v.monsterId).toBe(state.monsters[state.activeZoneIndex].def.id);
            expect(v.healthFraction).toBeGreaterThanOrEqual(0);
            expect(v.healthFraction).toBeLessThanOrEqual(1);
            expect(v.smokeFraction).toBeGreaterThanOrEqual(0);
            expect(v.smokeFraction).toBeLessThanOrEqual(1);
            expect(CAPTION_IDS).toContain(v.captionLineId);
          };
          check();
          for (const [signal, action] of steps) {
            state = action === 'pause' ? pause(state) : action === 'resume' ? resume(state) : tick(state, signal);
            check();
          }
        },
      ),
    );
  });

  it('shows the zone line at the start, the smoke line after an early defeat, and the end line at the end', () => {
    let state = startSession(input('camera'));
    expect(toView(state).captionLineId).toBe('zone-upper-right');
    expect(toView(state).healthFraction).toBe(1);
    expect(toView(state).smokeFraction).toBe(0);
    for (let i = 0; i < 20; i += 1) state = tick(state, UPPER_RIGHT);
    expect(toView(state).captionLineId).toBe('smoke');
    expect(toView(state).healthFraction).toBe(0);
    expect(toView(state).smokeFraction).toBe(1);
    state = tick(state, UPPER_RIGHT);
    expect(toView(state).smokeFraction).toBeLessThan(1);
    for (let i = state.ticksDone; i < 120; i += 1) state = tick(state, null);
    expect(toView(state).captionLineId).toBe('end');
    expect(toView(state).countdown).toBe(0);
  });

  it('timer-only: the monster is defeated on the 30th tick of its zone, with no smoke line', () => {
    let state = startSession(input('timer-only'));
    for (let i = 0; i < ZONE_DURATION - 1; i += 1) state = tick(state, null);
    expect(toView(state).captionLineId).toBe('zone-upper-right');
    expect(toView(state).healthFraction).toBeGreaterThan(0);
    state = tick(state, null);
    expect(toView(state).zoneId).toBe('upper-left');
    expect(toView(state).captionLineId).toBe('zone-upper-left');
  });
});

describe('smokeChangesNothingThatCounts', () => {
  // Zone 0 monster is defeated at tick 20 by matching signals. Ticks 21-30 differ between
  // the two runs; everything from tick 31 on is identical.
  it('same outcomes and monstersEarned whatever happens in the smoke', () => {
    fc.assert(
      fc.property(
        fc.array(maybeSignalArb, { minLength: 10, maxLength: 10 }),
        fc.array(maybeSignalArb, { minLength: 10, maxLength: 10 }),
        fc.array(maybeSignalArb, { minLength: 90, maxLength: 90 }),
        (smokeA, smokeB, rest) => {
          const lead = Array<BrushingSignal | null>(20).fill(UPPER_RIGHT);
          const play = (smoke: (BrushingSignal | null)[]): SessionState => {
            let state = startSession(input('camera'));
            const all = [...lead, ...smoke, ...rest];
            for (const s of all) {
              state = tick(state, s);
              const v = toView(state);
              expect(v.smokeFraction).toBeGreaterThanOrEqual(0);
              expect(v.smokeFraction).toBeLessThanOrEqual(1);
            }
            return state;
          };
          const a = play(smokeA);
          const b = play(smokeB);
          expect(a.monsters[0].outcome).toBe('defeated');
          expect(b.monsters[0].outcome).toBe('defeated');
          expect(a.monsters.map((m) => m.outcome)).toEqual(b.monsters.map((m) => m.outcome));
          expect(toSessionResult(a).monstersEarned).toEqual(toSessionResult(b).monstersEarned);
          expect(toSessionResult(a).zoneResults.map((z) => z.monsterOutcome)).toEqual(
            toSessionResult(b).zoneResults.map((z) => z.monsterOutcome),
          );
        },
      ),
    );
  });
});
