import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { UNTRACKED_LIMIT, ZONE_DURATION, ZONE_ORDER } from '../src/logic/constants';
import { MONSTERS } from '../src/logic/monsters';
import { toSessionResult } from '../src/logic/session-result';
import { startSession, tick } from '../src/logic/session';
import { toView } from '../src/logic/view';
import type {
  BrushingSignal,
  SessionMode,
  SessionResult,
  SessionState,
  StartInput,
} from '../src/logic/types';

// Helpers live in this file (no shared helper file).
const signalArb: fc.Arbitrary<BrushingSignal> = fc.record({
  handNearMouth: fc.boolean(),
  side: fc.constantFrom('left' as const, 'right' as const, 'unknown' as const),
  level: fc.constantFrom('upper' as const, 'lower' as const, 'unknown' as const),
  moving: fc.boolean(),
});
const maybeSignalArb = fc.option(signalArb, { nil: null });
const signalsArb = fc.array(maybeSignalArb, { minLength: 120, maxLength: 120 });
const modeArb: fc.Arbitrary<SessionMode> = fc.constantFrom('camera' as const, 'timer-only' as const);

function input(mode: SessionMode, pastSessions: readonly SessionResult[] = []): StartInput {
  return { mode, startedAt: 1_000, date: '2026-11-19', hour: 8, pastSessions };
}

function play(mode: SessionMode, signals: readonly (BrushingSignal | null)[]): SessionState {
  let state = startSession(input(mode));
  for (const s of signals) state = tick(state, s);
  return state;
}

// A signal that matches the zone with this index (zone order: UR, UL, LL, LR).
const MATCHING: readonly BrushingSignal[] = [
  { handNearMouth: true, side: 'right', level: 'upper', moving: true },
  { handNearMouth: true, side: 'left', level: 'upper', moving: true },
  { handNearMouth: true, side: 'left', level: 'lower', moving: true },
  { handNearMouth: true, side: 'right', level: 'lower', moving: true },
];

describe('toSessionResult', () => {
  it('throws when the session has not ended', () => {
    expect(() => toSessionResult(startSession(input('camera')))).toThrow();
  });

  it('sessionIsExactly120Ticks: a completed session has durationSeconds 120', () => {
    fc.assert(
      fc.property(modeArb, signalsArb, (mode, signals) => {
        const state = play(mode, signals);
        expect(state.phase).toBe('ended');
        expect(toSessionResult(state).durationSeconds).toBe(120);
      }),
    );
  });

  it('timerOnlyDefeatsEveryMonsterAt30: a timer-only result has 30 brushed, 0 untracked, unverified', () => {
    fc.assert(
      fc.property(signalsArb, (signals) => {
        const result = toSessionResult(play('timer-only', signals));
        expect(result.mode).toBe('timer-only');
        expect(result.zoneResults).toHaveLength(4);
        for (const z of result.zoneResults) {
          expect(z.secondsBrushed).toBe(30);
          expect(z.secondsUntracked).toBe(0);
          expect(z.verified).toBe(false);
          expect(z.monsterOutcome).toBe('defeated');
        }
      }),
    );
  });
});

describe('resultInvariants', () => {
  it('holds for any camera-mode session', () => {
    fc.assert(
      fc.property(signalsArb, (signals) => {
        const state = play('camera', signals);
        const result = toSessionResult(state);
        expect(result.zoneResults.map((z) => z.zoneId)).toEqual([...ZONE_ORDER]);
        for (const z of result.zoneResults) {
          expect(z.secondsBrushed + z.secondsUntracked).toBeLessThanOrEqual(ZONE_DURATION);
          expect(z.verified).toBe(z.secondsUntracked <= UNTRACKED_LIMIT);
          expect(['defeated', 'fled', 'trapped']).toContain(z.monsterOutcome);
        }
        expect(result.monstersEarned).toEqual(state.monsters.map((m) => m.def.id));
        expect(new Set(result.monstersEarned).size).toBe(4);
        expect(result.zoneResults.map((z) => z.monsterId)).toEqual([...result.monstersEarned]);
        expect(result.date).toBe('2026-11-19');
        expect(result.mode).toBe('camera');
        expect(result.startedAt).toBe(1_000);
      }),
    );
  });

  it('earns a trapped monster too', () => {
    // Nothing matches and the signal is never null: no damage at all.
    const idle: BrushingSignal = { handNearMouth: false, side: 'unknown', level: 'unknown', moving: false };
    const result = toSessionResult(play('camera', Array(120).fill(idle)));
    expect(result.zoneResults.every((z) => z.monsterOutcome === 'trapped')).toBe(true);
    expect(result.monstersEarned).toHaveLength(4);
    expect(result.monstersEarned.every((id) => MONSTERS.some((m) => m.id === id))).toBe(true);
  });
});
