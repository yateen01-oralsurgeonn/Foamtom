import fc from 'fast-check';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DAMAGE_PER_SECOND,
  H_MAX,
  REQUIRE_LEVEL_MATCH,
  REQUIRE_SIDE_MATCH,
  SESSION_DURATION,
  UNTRACKED_DRAIN,
  ZONE_DURATION,
  ZONE_ORDER,
} from '../src/logic/constants';
import { MONSTERS } from '../src/logic/monsters';
import { isBrushing, pause, resume, startSession, tick } from '../src/logic/session';
import type {
  BrushingSignal,
  SessionMode,
  SessionResult,
  SessionState,
  StartInput,
  Zone,
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

const pastSessionArb: fc.Arbitrary<SessionResult> = fc
  .uniqueArray(fc.constantFrom(...MONSTERS.map((m) => m.id)), { minLength: 0, maxLength: 4 })
  .map((ids) => ({
    date: '2026-11-19',
    timeOfDay: 'morning' as const,
    mode: 'camera' as const,
    zoneResults: ZONE_ORDER.map((zoneId, i) => ({
      zoneId,
      monsterId: ids[i] ?? MONSTERS[0].id,
      secondsBrushed: 30,
      secondsUntracked: 0,
      verified: true,
      monsterOutcome: 'defeated' as const,
    })),
    monstersEarned: ids,
    startedAt: 0,
    durationSeconds: 120,
  }));
const pastSessionsArb = fc.array(pastSessionArb, { minLength: 0, maxLength: 12 });

function input(mode: SessionMode, pastSessions: readonly SessionResult[] = [], hour = 8): StartInput {
  return { mode, startedAt: 1_000, date: '2026-11-19', hour, pastSessions };
}

const FULL_BRUSH: BrushingSignal = { handNearMouth: true, side: 'right', level: 'upper', moving: true };

afterEach(() => {
  vi.doUnmock('../src/logic/constants');
  vi.resetModules();
});

describe('startSession', () => {
  it('starts running at zone 0 with four full-health pending monsters and the zone order', () => {
    const s = startSession(input('camera'));
    expect(s.phase).toBe('running');
    expect(s.activeZoneIndex).toBe(0);
    expect(s.zoneTimeRemaining).toBe(ZONE_DURATION);
    expect(s.ticksDone).toBe(0);
    expect(s.zones.map((z) => z.id)).toEqual([...ZONE_ORDER]);
    expect(s.monsters.every((m) => m.health === H_MAX && m.startingHealth === H_MAX && m.outcome === 'pending')).toBe(true);
    expect(s.monsters.map((m) => m.zoneId)).toEqual([...ZONE_ORDER]);
    expect(s.timeOfDay).toBe('morning');
  });
});

describe('isBrushingTruthTable', () => {
  const zones: Zone[] = startSession(input('camera')).zones as Zone[];
  const sides = ['left', 'right', 'unknown'] as const;
  const levels = ['upper', 'lower', 'unknown'] as const;
  const bools = [true, false];

  function everySignal(): BrushingSignal[] {
    const out: BrushingSignal[] = [];
    for (const handNearMouth of bools)
      for (const side of sides)
        for (const level of levels)
          for (const moving of bools) out.push({ handNearMouth, side, level, moving });
    return out;
  }

  it('covers all 36 signals', () => {
    expect(everySignal()).toHaveLength(36);
  });

  it('is true only when hand near, moving, and side and level match as the constants require; null is never brushing', () => {
    for (const zone of zones) {
      expect(isBrushing(null, zone)).toBe(false);
      for (const sig of everySignal()) {
        const expected =
          sig.handNearMouth &&
          sig.moving &&
          (!REQUIRE_SIDE_MATCH || sig.side === zone.side) &&
          (!REQUIRE_LEVEL_MATCH || sig.level === zone.level);
        expect(isBrushing(sig, zone)).toBe(expected);
      }
    }
  });

  it('counts a wrong-side, right-level signal near the mouth and moving as brushing (req 5.7, 21 Nov 2026)', () => {
    expect(REQUIRE_SIDE_MATCH).toBe(false);
    for (const zone of zones) {
      const wrongSide = zone.side === 'left' ? 'right' : 'left';
      const sig: BrushingSignal = { handNearMouth: true, side: wrongSide, level: zone.level, moving: true };
      expect(isBrushing(sig, zone)).toBe(true);
    }
  });

  it('ignores level when REQUIRE_LEVEL_MATCH is false', async () => {
    vi.resetModules();
    vi.doMock('../src/logic/constants', async (importOriginal) => ({
      ...(await importOriginal<typeof import('../src/logic/constants')>()),
      REQUIRE_LEVEL_MATCH: false,
    }));
    const mod = await import('../src/logic/session');
    const zs = mod.startSession(input('camera')).zones;
    for (const zone of zs) {
      expect(mod.isBrushing(null, zone)).toBe(false);
      for (const sig of everySignal()) {
        const expected =
          sig.handNearMouth && sig.moving && (!REQUIRE_SIDE_MATCH || sig.side === zone.side);
        expect(mod.isBrushing(sig, zone)).toBe(expected);
      }
    }
  });
});

describe('healthChangesOnlyByTheRule', () => {
  it('each tick changes only the active monster by -3, -2 or 0, never below 0, whole numbers, never up', () => {
    fc.assert(
      fc.property(modeArb, pastSessionsArb, signalsArb, (mode, past, signals) => {
        let state = startSession(input(mode, past));
        for (const signal of signals) {
          const before = state;
          const zone = before.zones[before.activeZoneIndex];
          const effective = mode === 'timer-only' ? null : signal;
          const expectedDamage =
            effective === null ? UNTRACKED_DRAIN : isBrushing(effective, zone) ? DAMAGE_PER_SECOND : 0;
          state = tick(before, signal);
          before.monsters.forEach((m, i) => {
            const after = state.monsters[i];
            if (i === before.activeZoneIndex) {
              expect(after.health).toBe(Math.max(0, m.health - expectedDamage));
            } else {
              expect(after.health).toBe(m.health);
            }
            expect(Number.isInteger(after.health)).toBe(true);
            expect(after.health).toBeGreaterThanOrEqual(0);
            expect(after.health).toBeLessThanOrEqual(m.health);
          });
        }
      }),
    );
  });

  it('a wrong-side signal damages the monster only when REQUIRE_SIDE_MATCH is true', () => {
    // Zone 0 is upper right; this signal is the wrong side, right level.
    const wrongSide: BrushingSignal = { handNearMouth: true, side: 'left', level: 'upper', moving: true };
    let state = startSession(input('camera'));
    for (let i = 0; i < 10; i++) state = tick(state, wrongSide);
    if (REQUIRE_SIDE_MATCH) {
      expect(state.monsters[0].health).toBe(H_MAX);
      expect(state.secondsBrushedPerZone[0]).toBe(0);
    } else {
      expect(state.monsters[0].health).toBe(H_MAX - 10 * DAMAGE_PER_SECOND);
      expect(state.secondsBrushedPerZone[0]).toBe(10);
    }
    expect(state.secondsUntrackedPerZone[0]).toBe(0);
  });

  it('a wrong-level signal never damages the monster while level is checked', () => {
    const wrongLevel: BrushingSignal = { handNearMouth: true, side: 'right', level: 'lower', moving: true };
    let state = startSession(input('camera'));
    for (let i = 0; i < 10; i++) state = tick(state, wrongLevel);
    expect(state.monsters[0].health).toBe(H_MAX);
    expect(state.secondsBrushedPerZone[0]).toBe(0);
    expect(state.secondsUntrackedPerZone[0]).toBe(0);
  });
});

describe('sessionIsExactly120Ticks', () => {
  it('runs through ticks 1-119, ends at 120, and tick 121 changes nothing', () => {
    fc.assert(
      fc.property(modeArb, pastSessionsArb, signalsArb, (mode, past, signals) => {
        let state = startSession(input(mode, past));
        signals.forEach((signal, i) => {
          state = tick(state, signal);
          const done = i + 1;
          expect(state.ticksDone).toBe(done);
          if (done < SESSION_DURATION) {
            expect(state.phase).toBe('running');
            expect(state.activeZoneIndex).toBe(Math.floor(done / ZONE_DURATION));
          }
        });
        expect(state.phase).toBe('ended');
        expect(state.ticksDone).toBe(120);
        expect(tick(state, FULL_BRUSH)).toEqual(state);
      }),
    );
  });

  it('ticks sent while paused change nothing and are not counted', () => {
    fc.assert(
      fc.property(
        modeArb,
        fc.integer({ min: 0, max: 119 }),
        fc.array(maybeSignalArb, { maxLength: 20 }),
        signalsArb,
        (mode, before, whilePaused, signals) => {
          let state = startSession(input(mode));
          for (let i = 0; i < before; i++) state = tick(state, signals[i]);
          const paused = pause(state);
          expect(paused.phase).toBe('paused');
          let still = paused;
          for (const s of whilePaused) still = tick(still, s);
          expect(still).toEqual(paused);
          const resumed = resume(still);
          expect(resumed).toEqual(state);
          expect(resumed.ticksDone).toBe(before);
        },
      ),
    );
  });

  it('pause and resume leave other phases alone and do not change the input', () => {
    const s = startSession(input('camera'));
    expect(resume(s)).toBe(s);
    const p = pause(s);
    expect(s.phase).toBe('running');
    expect(pause(p)).toBe(p);
    let ended = s;
    for (let i = 0; i < 120; i++) ended = tick(ended, null);
    expect(pause(ended)).toBe(ended);
    expect(resume(ended)).toBe(ended);
  });
});

describe('timerOnlyDefeatsEveryMonsterAt30', () => {
  it('every monster starts at 60 and is defeated on exactly the 30th tick of its zone', () => {
    fc.assert(
      fc.property(pastSessionsArb, signalsArb, (past, signals) => {
        let state: SessionState = startSession(input('timer-only', past));
        expect(state.monsters.every((m) => m.health === 60)).toBe(true);
        signals.forEach((signal, i) => {
          const zoneIndex = state.activeZoneIndex;
          const tickInZone = (i % ZONE_DURATION) + 1;
          state = tick(state, signal);
          const m = state.monsters[zoneIndex];
          expect(m.health).toBe(60 - 2 * tickInZone);
          if (tickInZone < ZONE_DURATION) {
            expect(m.outcome).toBe('pending');
            expect(m.defeatedAtElapsed).toBeNull();
          } else {
            expect(m.outcome).toBe('defeated');
            expect(m.defeatedAtElapsed).toBe(30);
          }
        });
        expect(state.monsters.every((m) => m.health === 0 && m.outcome === 'defeated')).toBe(true);
      }),
    );
  });
});
