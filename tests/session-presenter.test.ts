import fc from 'fast-check';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ZONE_ORDER } from '../src/logic/constants';
import { pause, resume, startSession, tick } from '../src/logic/session';
import type { BrushingSignal, SessionMode, SessionState } from '../src/logic/types';
import { toView } from '../src/logic/view';
import type { View } from '../src/logic/view';
import type { ZoneEnd } from '../src/ui/monster-draw-state';
import { createSessionPresenter } from '../src/ui/session-presenter';
import { cuesFor } from '../src/ui/sound-cues';
import type { SoundId } from '../src/audio/sounds';

// Helpers live in this file (no shared helper file).
const signalArb: fc.Arbitrary<BrushingSignal> = fc.record({
  handNearMouth: fc.boolean(),
  side: fc.constantFrom('left' as const, 'right' as const, 'unknown' as const),
  level: fc.constantFrom('upper' as const, 'lower' as const, 'unknown' as const),
  moving: fc.boolean(),
});
const maybeSignalArb = fc.option(signalArb, { nil: null });
const modeArb: fc.Arbitrary<SessionMode> = fc.constantFrom('camera' as const, 'timer-only' as const);

interface PaintCall {
  readonly view: View;
  readonly zoneEnd: ZoneEnd | undefined;
}

function fakeScreen() {
  const calls: PaintCall[] = [];
  function paint(view: View, zoneEnd?: ZoneEnd): void {
    calls.push({ view, zoneEnd });
  }
  return { calls, screen: { paint } };
}

function start(mode: SessionMode): SessionState {
  return startSession({ mode, startedAt: 1_000, date: '2026-11-21', hour: 8, pastSessions: [] });
}

describe('sessionPresenterZoneEnds', () => {
  it('passes exactly three zone ends, zones one to three in order, over a whole session', () => {
    fc.assert(
      fc.property(modeArb, fc.array(maybeSignalArb, { minLength: 120, maxLength: 120 }), (mode, signals) => {
        const { calls, screen } = fakeScreen();
        const presenter = createSessionPresenter({ screen });
        let state = start(mode);
        presenter.update(state);
        for (const signal of signals) {
          state = tick(state, signal);
          presenter.update(state);
        }
        expect(state.phase).toBe('ended');
        expect(calls).toHaveLength(121);
        const ends = calls.map((c) => c.zoneEnd).filter((e): e is ZoneEnd => e !== undefined);
        expect(ends).toHaveLength(3);
        expect(ends.map((e) => e.zoneId)).toEqual(ZONE_ORDER.slice(0, 3));
        // None on the ended paint, and the view is the one toView gives.
        expect(calls[calls.length - 1].zoneEnd).toBeUndefined();
        expect(calls[calls.length - 1].view).toEqual(toView(state));
        ends.forEach((e, i) => expect(e.outcome).toBe(state.monsters[i].outcome));
      }),
    );
  });

  it('passes no zone end on pause or resume', () => {
    fc.assert(
      fc.property(modeArb, fc.array(maybeSignalArb, { minLength: 119, maxLength: 119 }), (mode, signals) => {
        const { calls, screen } = fakeScreen();
        const presenter = createSessionPresenter({ screen });
        let state = start(mode);
        presenter.update(state);
        for (const signal of signals) {
          const paused = pause(state);
          presenter.update(paused);
          expect(calls[calls.length - 1].zoneEnd).toBeUndefined();
          const resumed = resume(paused);
          presenter.update(resumed);
          expect(calls[calls.length - 1].zoneEnd).toBeUndefined();
          state = tick(resumed, signal);
          presenter.update(state);
        }
      }),
    );
  });

  it('reset() forgets the previous state, so the next update carries no zone end', () => {
    // Timer-only: the zone changes on the 30th tick.
    const { calls, screen } = fakeScreen();
    const presenter = createSessionPresenter({ screen });
    let state = start('timer-only');
    presenter.update(state);
    for (let i = 0; i < 29; i += 1) {
      state = tick(state, null);
      presenter.update(state);
    }
    const before = state;
    const next = tick(before, null);
    expect(next.activeZoneIndex).toBeGreaterThan(before.activeZoneIndex);
    presenter.reset();
    presenter.update(next);
    expect(calls[calls.length - 1].zoneEnd).toBeUndefined();
    // Without reset the same step carries one.
    const second = fakeScreen();
    const other = createSessionPresenter({ screen: second.screen });
    other.update(before);
    other.update(next);
    expect(second.calls[1].zoneEnd?.zoneId).toBe(ZONE_ORDER[0]);
  });

  it('has no timer, document or window in its source', () => {
    const source = readFileSync('src/ui/session-presenter.ts', 'utf8');
    for (const word of ['setTimeout', 'setInterval', 'requestAnimationFrame', 'document', 'window']) {
      expect(source.includes(word)).toBe(false);
    }
  });
});

describe('soundCuesPlayed', () => {
  it('plays exactly the cuesFor results, in order, with their delays, and nothing at ended', () => {
    fc.assert(
      fc.property(modeArb, fc.array(maybeSignalArb, { minLength: 120, maxLength: 120 }), (mode, signals) => {
        const plays: { id: SoundId; delayMs: number | undefined }[] = [];
        const sounds = { play: (id: SoundId, delayMs?: number) => void plays.push({ id, delayMs }) };
        const { screen } = fakeScreen();
        const presenter = createSessionPresenter({ screen, sounds });
        const expected: { id: SoundId; delayMs: number }[] = [];
        let state = start(mode);
        let prev: SessionState | null = null;
        expected.push(...cuesFor(prev, state));
        presenter.update(state);
        prev = state;
        for (const signal of signals) {
          state = tick(state, signal);
          const before = plays.length;
          presenter.update(state);
          expected.push(...cuesFor(prev, state));
          if (state.phase === 'ended') expect(plays.length).toBe(before);
          prev = state;
        }
        expect(plays).toEqual(expected.map((c) => ({ id: c.id, delayMs: c.delayMs })));
        expect(plays.filter((p) => p.id === 'zone-start')).toHaveLength(4);
      }),
    );
  });

  it('works without a sounds dependency', () => {
    const { screen } = fakeScreen();
    const presenter = createSessionPresenter({ screen });
    expect(() => presenter.update(start('timer-only'))).not.toThrow();
  });
});
