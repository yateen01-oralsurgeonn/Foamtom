import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { CUE_GAP_MS } from '../src/audio/sounds';
import { pause, resume, startSession, tick } from '../src/logic/session';
import type { BrushingSignal, SessionMode, SessionState, StartInput } from '../src/logic/types';
import { cuesFor, type SoundCue } from '../src/ui/sound-cues';

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

const OUTCOME_IDS = ['defeat', 'flee', 'trapped'];
const SOUND_FOR = { defeated: 'defeat', fled: 'flee', trapped: 'trapped' } as const;

describe('soundCues', () => {
  it('gives the right cues at every tick of a session, and none at the end', () => {
    fc.assert(
      fc.property(modeArb, fc.array(maybeSignalArb, { minLength: 120, maxLength: 120 }), (mode, signals) => {
        let state: SessionState = startSession(input(mode));
        let zoneStarts = 0;

        const first = cuesFor(null, state);
        expect(first).toEqual([{ id: 'zone-start', delayMs: 0 }]);
        zoneStarts += 1;

        const outcomeCuesPerMonster: number[] = [0, 0, 0, 0];
        for (const signal of signals) {
          const next = tick(state, signal);
          const cues = cuesFor(state, next);
          if (next.phase === 'ended') {
            expect(cues).toEqual([]);
          } else {
            const changed = next.monsters
              .map((m, i) => ({ m, i }))
              .filter(({ m, i }) => m.outcome !== state.monsters[i].outcome);
            const expectedOutcomeIds = changed
              .map(({ m }) => SOUND_FOR[m.outcome as keyof typeof SOUND_FOR])
              .sort();
            const outcomeCues = cues.filter((c) => OUTCOME_IDS.includes(c.id));
            expect(outcomeCues.map((c) => c.id).sort()).toEqual(expectedOutcomeIds);
            changed.forEach(({ i }) => (outcomeCuesPerMonster[i] += 1));
            for (const c of outcomeCues) expect(c.delayMs).toBe(0);

            const starts = cues.filter((c) => c.id === 'zone-start');
            const zoneChanged = next.activeZoneIndex > state.activeZoneIndex;
            expect(starts).toHaveLength(zoneChanged ? 1 : 0);
            for (const s of starts) {
              expect(s.delayMs).toBe(outcomeCues.length > 0 ? CUE_GAP_MS : 0);
            }
            expect(cues).toHaveLength(outcomeCues.length + starts.length);
            zoneStarts += starts.length;
          }
          state = next;
        }
        expect(state.phase).toBe('ended');
        expect(zoneStarts).toBe(4);
        // No outcome cue appears twice for one monster.
        for (const n of outcomeCuesPerMonster) expect(n).toBeLessThanOrEqual(1);
      }),
    );
  });

  it('gives no cue for pause, resume or an unchanged state', () => {
    const start = startSession(input('timer-only'));
    expect(cuesFor(start, pause(start))).toEqual([]);
    expect(cuesFor(pause(start), resume(pause(start)))).toEqual([]);
    expect(cuesFor(start, start)).toEqual([]);
  });

  it('gives the defeat cue at tick 20 and the next zone-start at tick 30 with no delay in timer-only mode', () => {
    let state = startSession(input('timer-only'));
    for (let t = 1; t <= 30; t++) {
      const next = tick(state, null);
      const cues = cuesFor(state, next);
      if (t === 20) expect(cues).toEqual([{ id: 'defeat', delayMs: 0 }]);
      else if (t === 30) expect(cues).toEqual([{ id: 'zone-start', delayMs: 0 }]);
      else expect(cues).toEqual([]);
      state = next;
    }
  });
});
