import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { ZONE_ORDER } from '../src/logic/constants';
import { pause, resume, startSession, tick } from '../src/logic/session';
import type { BrushingSignal, SessionMode, SessionState, StartInput } from '../src/logic/types';
import type { View } from '../src/logic/view';
import {
  MIN_MONSTER_SCALE,
  monsterDrawState,
  monsterScale,
  smokeLook,
  zoneEndEvent,
  type ZoneEndOutcome,
} from '../src/ui/monster-draw-state';

// Helpers live in this file (no shared helper file).
const signalArb: fc.Arbitrary<BrushingSignal> = fc.record({
  handNearMouth: fc.boolean(),
  side: fc.constantFrom('left' as const, 'right' as const, 'unknown' as const),
  level: fc.constantFrom('upper' as const, 'lower' as const, 'unknown' as const),
  moving: fc.boolean(),
});
const maybeSignalArb = fc.option(signalArb, { nil: null });
const modeArb: fc.Arbitrary<SessionMode> = fc.constantFrom('camera' as const, 'timer-only' as const);
const fractionArb = fc.double({ min: 0, max: 1, noNaN: true });
const outcomeArb: fc.Arbitrary<ZoneEndOutcome | null> = fc.constantFrom(
  null,
  'defeated' as const,
  'fled' as const,
  'trapped' as const,
);

function input(mode: SessionMode): StartInput {
  return { mode, startedAt: 1_000, date: '2026-11-21', hour: 8, pastSessions: [] };
}

function viewWith(healthFraction: number, smokeFraction: number): View {
  return {
    phase: 'running',
    zoneId: 'upper-right',
    countdown: 10,
    captionLineId: 'zone-upper-right',
    monsterId: 'plaque-puff',
    healthFraction,
    smokeFraction,
  };
}

describe('monsterDrawStateProperties', () => {
  it('gives one state for every view and outcome, by the stated rules', () => {
    fc.assert(
      fc.property(fractionArb, fractionArb, outcomeArb, (h, s, outcome) => {
        const view = viewWith(h, s);
        const state = monsterDrawState(view, outcome);
        if (outcome !== null) expect(state).toBe(outcome);
        else if (h >= 1) expect(state).toBe('sitting');
        else if (h > 0) expect(state).toBe('shrinking');
        else if (s > 0) expect(state).toBe('defeated');
        else expect(state).toBe('gone');
        expect(monsterDrawState(view, outcome)).toBe(state);
      }),
    );
  });

  it('covers the edge values', () => {
    expect(monsterDrawState(viewWith(1, 0), null)).toBe('sitting');
    expect(monsterDrawState(viewWith(0.5, 0), null)).toBe('shrinking');
    expect(monsterDrawState(viewWith(0, 0.5), null)).toBe('defeated');
    expect(monsterDrawState(viewWith(0, 0), null)).toBe('gone');
    expect(monsterDrawState(viewWith(1, 0), 'fled')).toBe('fled');
    expect(monsterDrawState(viewWith(0, 0), 'trapped')).toBe('trapped');
    expect(monsterDrawState(viewWith(0, 1), 'defeated')).toBe('defeated');
  });
});

describe('scaleAndSmokeLook', () => {
  it('keeps the monster scale between the floor and 1, and never rises as health falls', () => {
    expect(MIN_MONSTER_SCALE).toBe(0.35);
    fc.assert(
      fc.property(fractionArb, fractionArb, (a, b) => {
        const [lo, hi] = a <= b ? [a, b] : [b, a];
        expect(monsterScale(lo)).toBeGreaterThanOrEqual(MIN_MONSTER_SCALE);
        expect(monsterScale(hi)).toBeLessThanOrEqual(1);
        expect(monsterScale(lo)).toBeLessThanOrEqual(monsterScale(hi));
      }),
    );
    expect(monsterScale(0)).toBe(MIN_MONSTER_SCALE);
    expect(monsterScale(1)).toBe(1);
  });

  it('never raises puffs, scale or opacity as smoke falls', () => {
    fc.assert(
      fc.property(fractionArb, fractionArb, (a, b) => {
        const [lo, hi] = a <= b ? [a, b] : [b, a];
        const low = smokeLook(lo);
        const high = smokeLook(hi);
        expect(low.puffs).toBeLessThanOrEqual(high.puffs);
        expect(low.scale).toBeLessThanOrEqual(high.scale);
        expect(low.opacity).toBeLessThanOrEqual(high.opacity);
      }),
    );
  });

  it('gives no puff at 0 and at least one above 0', () => {
    expect(smokeLook(0)).toEqual({ puffs: 0, scale: 0, opacity: 0 });
    fc.assert(
      fc.property(fc.double({ min: 1e-9, max: 1, noNaN: true }), (f) => {
        const look = smokeLook(f);
        expect(look.puffs).toBeGreaterThanOrEqual(1);
        expect(look.puffs).toBeLessThanOrEqual(3);
      }),
    );
  });
});

type Step = 'tick' | 'pause' | 'resume';

describe('zoneEndEvents', () => {
  it('gives exactly four events per session, in zone order, equal to the final outcomes', () => {
    fc.assert(
      fc.property(
        modeArb,
        fc.array(maybeSignalArb, { minLength: 120, maxLength: 120 }),
        fc.array(fc.constantFrom<Step>('tick', 'pause', 'resume'), { minLength: 0, maxLength: 120 }),
        (mode, signals, extras) => {
          let state: SessionState = startSession(input(mode));
          const events: NonNullable<ReturnType<typeof zoneEndEvent>>[] = [];
          let extraIndex = 0;
          for (const signal of signals) {
            // Before each tick, maybe pause and/or resume (these must give no event).
            const extra = extras[extraIndex++];
            if (extra === 'pause' || extra === 'resume') {
              const paused = pause(state);
              expect(zoneEndEvent(state, paused)).toBeNull();
              const resumed = resume(paused);
              expect(zoneEndEvent(paused, resumed)).toBeNull();
              state = resumed;
            }
            const next = tick(state, signal);
            const event = zoneEndEvent(state, next);
            if (event) events.push(event);
            state = next;
          }
          expect(state.phase).toBe('ended');
          expect(events).toHaveLength(4);
          expect(events.map((e) => e.zoneId)).toEqual([...ZONE_ORDER]);
          events.forEach((e, i) => {
            expect(e.outcome).not.toBe('pending');
            expect(e.outcome).toBe(state.monsters[i].outcome);
            expect(e.monsterId).toBe(state.monsters[i].def.id);
          });
          // No event once the session has ended, or from null.
          expect(zoneEndEvent(state, tick(state, null))).toBeNull();
        },
      ),
    );
  });

  it('gives no event for a first state, and none while paused', () => {
    const start = startSession(input('timer-only'));
    expect(zoneEndEvent(null, start)).toBeNull();
    expect(zoneEndEvent(start, pause(start))).toBeNull();
    expect(zoneEndEvent(pause(start), resume(pause(start)))).toBeNull();
  });
});
