import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createGameLoop } from '../src/ui/game-loop';
import { getLine } from '../src/audio/lines';
import type { SignalSource } from '../src/tracking/signal-source';
import { startSession } from '../src/logic/session';
import type { BrushingSignal, SessionMode, SessionState } from '../src/logic/types';

// Design test 15 (gameLoopExactTicks) plus the task 6 tests on start(), stop() and the 15 s limit, and the waiting line (req 8.7).
// The fakes below live in this file on purpose: there is no shared helper file.

type Timer = { due: number; every: number | null; cb: () => void };

/** Time moves only when the test moves it. */
function makeWorld() {
  let t = 0;
  let timers: Timer[] = [];
  const clock = { now: () => t };
  const add = (ms: number, every: number | null, cb: () => void) => {
    const timer: Timer = { due: t + ms, every, cb };
    timers.push(timer);
    return () => {
      timers = timers.filter((x) => x !== timer);
    };
  };
  const scheduler = {
    every: (ms: number, cb: () => void) => add(ms, ms, cb),
    after: (ms: number, cb: () => void) => add(ms, null, cb),
  };
  const fire = (timer: Timer) => {
    if (timer.every === null) timers = timers.filter((x) => x !== timer);
    else timer.due = t + timer.every;
    timer.cb();
  };
  return {
    clock,
    scheduler,
    /** Smooth time: every timer fires on time. */
    advance(ms: number) {
      const target = t + ms;
      for (;;) {
        const due = timers.filter((x) => x.due <= target).sort((a, b) => a.due - b.due);
        if (due.length === 0) break;
        t = Math.max(t, due[0].due);
        fire(due[0]);
      }
      t = target;
    },
    /** Late callbacks: time jumps, then each due timer fires once. */
    jump(ms: number) {
      t += ms;
      for (const timer of timers.filter((x) => x.due <= t)) if (timers.includes(timer)) fire(timer);
    },
    /** Time passes and no callback runs at all. */
    skip(ms: number) {
      t += ms;
    },
    /** One late poll. */
    pollNow() {
      for (const timer of timers.filter((x) => x.every !== null)) if (timers.includes(timer)) fire(timer);
    },
  };
}

function makeVisibility() {
  let hidden = false;
  const listeners = new Set<(hidden: boolean) => void>();
  return {
    isHidden: () => hidden,
    subscribe(listener: (hidden: boolean) => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    set(value: boolean) {
      hidden = value;
      for (const listener of [...listeners]) listener(value);
    },
    listenerCount: () => listeners.size,
  };
}

function makeWakeLock(behaviour: 'ok' | 'throws' | 'rejects' = 'ok') {
  const lock = {
    requests: 0,
    releases: 0,
    request() {
      lock.requests += 1;
      if (behaviour === 'throws') throw new Error('refused');
      if (behaviour === 'rejects') return Promise.reject(new Error('refused'));
      return Promise.resolve();
    },
    release() {
      lock.releases += 1;
    },
  };
  return lock;
}

type StartBehaviour = 'ready' | 'unavailable' | 'never' | 'late' | 'rejects';

function makeSource(behaviour: StartBehaviour, signal: BrushingSignal | null = null) {
  let answerLate: (value: 'ready' | 'unavailable') => void = () => {};
  const source = {
    startCalls: 0,
    stopCalls: 0,
    latestCalls: 0,
    answerLate: (value: 'ready' | 'unavailable') => answerLate(value),
    start(): Promise<'ready' | 'unavailable'> {
      source.startCalls += 1;
      if (behaviour === 'ready') return Promise.resolve('ready');
      if (behaviour === 'unavailable') return Promise.resolve('unavailable');
      if (behaviour === 'rejects') return Promise.reject(new Error('no camera'));
      return new Promise((resolve) => {
        answerLate = resolve;
      });
    },
    latest() {
      source.latestCalls += 1;
      return signal;
    },
    stop() {
      source.stopCalls += 1;
    },
  } satisfies SignalSource & Record<string, unknown>;
  return source;
}

function makeLoop(
  behaviour: StartBehaviour,
  options: { signal?: BrushingSignal | null; wakeLock?: 'ok' | 'throws' | 'rejects' } = {},
) {
  const world = makeWorld();
  const visibility = makeVisibility();
  const wakeLock = makeWakeLock(options.wakeLock);
  const source = makeSource(behaviour, options.signal ?? null);
  const modes: SessionMode[] = [];
  const states: SessionState[] = [];
  let ended = 0;
  let dropped = 0;
  let endedState: SessionState | null = null;
  const waiting: boolean[] = [];
  const order: string[] = [];
  const loop = createGameLoop({
    clock: world.clock,
    scheduler: world.scheduler,
    source,
    visibility,
    wakeLock,
    onWaiting: (value) => {
      waiting.push(value);
      order.push(value ? 'waiting-on' : 'waiting-off');
    },
    createSession: (mode) => {
      modes.push(mode);
      order.push('session');
      return startSession({
        mode,
        startedAt: 0,
        date: '2026-01-01',
        hour: 8,
        pastSessions: [],
      });
    },
    onState: (state) => states.push(state),
    onEnded: (state) => {
      ended += 1;
      endedState = state;
    },
    onDropped: () => {
      dropped += 1;
    },
  });
  return {
    world,
    visibility,
    wakeLock,
    source,
    modes,
    states,
    loop,
    waiting,
    order,
    get ended() {
      return ended;
    },
    get dropped() {
      return dropped;
    },
    get endedState() {
      return endedState;
    },
    get last() {
      return states[states.length - 1];
    },
    /** Number of states that carried a new tick. */
    ticks() {
      let count = 0;
      for (let i = 1; i < states.length; i++) {
        if (states[i].ticksDone > states[i - 1].ticksDone) count += 1;
      }
      return count;
    },
  };
}

const chunkArb = fc.record({
  visibleMs: fc.integer({ min: 1, max: 4000 }),
  jump: fc.boolean(),
  hiddenMs: fc.option(fc.integer({ min: 0, max: 60000 }), { nil: null }),
  hiddenJump: fc.boolean(),
});

describe('gameLoopExactTicks', () => {
  it('120 visible seconds give exactly 120 ticks, whatever the callback pattern and hidden spans', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom<SessionMode>('camera', 'timer-only'),
        fc.array(chunkArb, { minLength: 1, maxLength: 200 }),
        async (mode, chunks) => {
          const h = makeLoop(mode === 'camera' ? 'ready' : 'unavailable');
          await h.loop.begin();
          expect(h.modes).toEqual([mode]);

          let remaining = 120000;
          let resumes = 0; // hide-then-show events that do not drop the session
          const move = (ms: number, jump: boolean) => (jump ? h.world.jump(ms) : h.world.advance(ms));
          for (const chunk of chunks) {
            const ms = Math.min(chunk.visibleMs, remaining);
            move(ms, chunk.jump);
            remaining -= ms;
            if (remaining === 0) break;
            if (chunk.hiddenMs !== null) {
              h.visibility.set(true);
              const before = h.ticks(); // visible time up to the hide is already counted
              move(chunk.hiddenMs, chunk.hiddenJump);
              h.visibility.set(false);
              resumes += 1;
              expect(h.ticks()).toBe(before); // hidden time gives no ticks
            }
          }
          if (remaining > 0) h.world.advance(remaining);
          h.world.pollNow();

          expect(h.dropped).toBe(0);
          expect(h.ended).toBe(1);
          expect(h.ticks()).toBe(120);
          expect(h.last.ticksDone).toBe(120);
          expect(h.last.phase).toBe('ended');
          expect(h.wakeLock.requests).toBe(1);
          expect(h.wakeLock.releases).toBe(1);
          expect(h.source.startCalls).toBe(mode === 'camera' ? 1 + resumes : 1);

          const seen = h.states.length;
          h.world.advance(30000); // nothing more happens after the end
          expect(h.states.length).toBe(seen);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('more than 60 s hidden drops the session: not ended, nothing saved, wake lock released', async () => {
    const h = makeLoop('ready');
    await h.loop.begin();
    h.world.advance(10000);
    h.visibility.set(true);
    h.world.advance(61000);
    expect(h.dropped).toBe(1);
    expect(h.ended).toBe(0);
    expect(h.last.ticksDone).toBe(10);
    expect(h.wakeLock.releases).toBe(1);
    expect(h.visibility.listenerCount()).toBe(0);
    h.visibility.set(false);
    h.world.advance(10000);
    expect(h.dropped).toBe(1);
    expect(h.last.ticksDone).toBe(10);
  });

  it('is dropped on return when no callback ran while hidden for more than 60 s', async () => {
    const h = makeLoop('ready');
    await h.loop.begin();
    h.world.advance(5000);
    h.visibility.set(true);
    h.world.skip(60001);
    h.visibility.set(false);
    expect(h.dropped).toBe(1);
    expect(h.ended).toBe(0);
  });

  it('exactly 60 s hidden is resumed, not dropped, from the same second', async () => {
    const h = makeLoop('ready');
    await h.loop.begin();
    h.world.advance(5000);
    h.visibility.set(true);
    h.world.skip(60000);
    h.visibility.set(false);
    expect(h.dropped).toBe(0);
    expect(h.last.phase).toBe('running');
    expect(h.last.ticksDone).toBe(5);
    h.world.advance(1000);
    expect(h.last.ticksDone).toBe(6);
  });

  it('a session that starts while the tab is hidden waits paused', async () => {
    const h = makeLoop('ready');
    h.visibility.set(true);
    await h.loop.begin();
    h.world.advance(20000);
    expect(h.last.phase).toBe('paused');
    expect(h.last.ticksDone).toBe(0);
    h.visibility.set(false);
    h.world.advance(1000);
    expect(h.last.ticksDone).toBe(1);
  });

  it('asks for the wake lock once and carries on silently when it is refused', async () => {
    for (const behaviour of ['throws', 'rejects'] as const) {
      const h = makeLoop('unavailable', { wakeLock: behaviour });
      await h.loop.begin();
      h.world.advance(120000);
      h.world.pollNow();
      expect(h.wakeLock.requests).toBe(1);
      expect(h.ended).toBe(1);
      expect(h.last.ticksDone).toBe(120);
    }
  });

  it('uses the latest signal in camera mode and ignores the source in timer-only mode', async () => {
    const matching: BrushingSignal = {
      handNearMouth: true,
      side: 'right',
      level: 'upper',
      moving: true,
    };
    const camera = makeLoop('ready', { signal: matching });
    await camera.loop.begin();
    camera.world.advance(5000);
    expect(camera.last.secondsBrushedPerZone[0]).toBe(5);

    const timerOnly = makeLoop('unavailable', { signal: matching });
    await timerOnly.loop.begin();
    timerOnly.world.advance(5000);
    expect(timerOnly.source.latestCalls).toBe(0);
    expect(timerOnly.last.secondsBrushedPerZone[0]).toBe(0);
    expect(timerOnly.last.secondsUntrackedPerZone[0]).toBe(5);
  });
});

describe('game loop: SignalSource start()', () => {
  it('start() is called exactly once per session', async () => {
    const h = makeLoop('ready');
    await h.loop.begin();
    await h.loop.begin(); // ignored while a session is running
    h.world.advance(120000);
    h.world.pollNow();
    expect(h.ended).toBe(1);
    expect(h.source.startCalls).toBe(1);

    await h.loop.begin(); // a new session asks again, once
    expect(h.source.startCalls).toBe(2);
    expect(h.modes).toEqual(['camera', 'camera']);
  });

  it('start() is never called again after the source answers unavailable', async () => {
    const h = makeLoop('unavailable');
    await h.loop.begin();
    h.world.advance(120000);
    h.world.pollNow();
    expect(h.source.startCalls).toBe(1);
    expect(h.modes).toEqual(['timer-only']);
  });
});

describe('game loop: SignalSource stop()', () => {
  it('stop() is called at the end of the session', async () => {
    const h = makeLoop('ready');
    await h.loop.begin();
    h.world.advance(119000);
    expect(h.source.stopCalls).toBe(0);
    h.world.advance(1000);
    h.world.pollNow();
    expect(h.ended).toBe(1);
    expect(h.source.stopCalls).toBe(1);
  });

  it('stop() is called as soon as the tab is hidden', async () => {
    const h = makeLoop('ready');
    await h.loop.begin();
    h.world.advance(3000);
    expect(h.source.stopCalls).toBe(0);
    h.visibility.set(true);
    expect(h.source.stopCalls).toBe(1);
    expect(h.wakeLock.releases).toBe(1);
  });

  it('stop() is called when a hidden session is dropped', async () => {
    const h = makeLoop('ready');
    await h.loop.begin();
    h.visibility.set(true);
    h.world.advance(61000);
    expect(h.dropped).toBe(1);
    expect(h.source.stopCalls).toBeGreaterThanOrEqual(1);
  });
});

describe('game loop: 15 s start limit', () => {
  it('a source that is not ready within 15 s gives a timer-only session', async () => {
    const h = makeLoop('never');
    const begun = h.loop.begin();
    h.world.advance(14900);
    expect(h.modes).toEqual([]); // still waiting
    h.world.advance(100);
    await begun;
    expect(h.modes).toEqual(['timer-only']);
    expect(h.source.startCalls).toBe(1); // no second request
    h.world.advance(30000);
    expect(h.last.mode).toBe('timer-only');
    expect(h.last.ticksDone).toBe(30);
  });

  it('a camera that answers ready after 15 s is stopped and the session stays timer-only', async () => {
    const h = makeLoop('late');
    const begun = h.loop.begin();
    h.world.advance(15000);
    await begun;
    const stopsBefore = h.source.stopCalls;
    h.source.answerLate('ready');
    await Promise.resolve();
    await Promise.resolve();
    expect(h.source.stopCalls).toBe(stopsBefore + 1);
    expect(h.modes).toEqual(['timer-only']);
    expect(h.source.startCalls).toBe(1);
  });

  it('a source that answers in time gives a camera session and the 15 s timer is cancelled', async () => {
    const h = makeLoop('late');
    const begun = h.loop.begin();
    h.world.advance(12000);
    h.source.answerLate('ready');
    await begun;
    expect(h.modes).toEqual(['camera']);
    h.world.advance(10000);
    expect(h.modes).toEqual(['camera']);
    expect(h.last.mode).toBe('camera');
  });

  it('a source that rejects gives a timer-only session', async () => {
    const h = makeLoop('rejects');
    await h.loop.begin();
    expect(h.modes).toEqual(['timer-only']);
  });
});

describe('game loop: waiting line (req 8.7)', () => {
  it('appears after 1 s when the source has not answered, and not before', async () => {
    const h = makeLoop('never');
    const begun = h.loop.begin();
    h.world.advance(999);
    expect(h.waiting).toEqual([]);
    h.world.advance(1);
    expect(h.waiting).toEqual([true]);
    h.world.advance(14000);
    await begun;
  });

  it('is shown once and stays up until the 15 s limit, then is gone before the session starts', async () => {
    const h = makeLoop('never');
    const begun = h.loop.begin();
    h.world.advance(14999);
    expect(h.waiting).toEqual([true]); // once, not repeated
    h.world.advance(1);
    await begun;
    expect(h.waiting).toEqual([true, false]);
    expect(h.order).toEqual(['waiting-on', 'waiting-off', 'session']);
  });

  it('is gone before a camera session starts when the camera answers ready after 1 s', async () => {
    const h = makeLoop('late');
    const begun = h.loop.begin();
    h.world.advance(4000);
    expect(h.waiting).toEqual([true]);
    h.source.answerLate('ready');
    await begun;
    expect(h.modes).toEqual(['camera']);
    expect(h.order).toEqual(['waiting-on', 'waiting-off', 'session']);
  });

  it('is gone when a late answer is unavailable, and the session is timer-only', async () => {
    const h = makeLoop('late');
    const begun = h.loop.begin();
    h.world.advance(2000);
    h.source.answerLate('unavailable');
    await begun;
    expect(h.modes).toEqual(['timer-only']);
    expect(h.order).toEqual(['waiting-on', 'waiting-off', 'session']);
  });

  it('never appears when the source answers ready within 1 s', async () => {
    const h = makeLoop('ready');
    await h.loop.begin();
    h.world.advance(5000);
    expect(h.waiting).toEqual([]);
    expect(h.order).toEqual(['session']);
  });

  it('never appears when the source answers unavailable within 1 s (camera refused)', async () => {
    const h = makeLoop('unavailable');
    await h.loop.begin();
    h.world.advance(5000);
    expect(h.waiting).toEqual([]);
    expect(h.order).toEqual(['session']);
  });

  it('never appears when the source rejects within 1 s', async () => {
    const h = makeLoop('rejects');
    await h.loop.begin();
    h.world.advance(5000);
    expect(h.waiting).toEqual([]);
  });

  it('is not shown again during the session, nor on a resume', async () => {
    const h = makeLoop('never');
    const begun = h.loop.begin();
    h.world.advance(15000);
    await begun;
    h.world.advance(5000);
    h.visibility.set(true);
    h.visibility.set(false);
    h.world.advance(5000);
    expect(h.waiting).toEqual([true, false]);
  });

  it('is shown at most once per start, across two starts', async () => {
    const h = makeLoop('late');
    const first = h.loop.begin();
    h.world.advance(3000);
    h.source.answerLate('ready');
    await first;
    expect(h.waiting).toEqual([true, false]);
    h.world.advance(125000); // the session ends and the loop is free again
    expect(h.ended).toBe(1);
    const second = h.loop.begin();
    h.world.advance(3000);
    h.source.answerLate('ready');
    await second;
    expect(h.waiting).toEqual([true, false, true, false]);
  });

  it('has a line in the voice table, with the exact text and caption', () => {
    const line = getLine('waiting');
    expect(line?.text).toBe('Getting the mirror ready...');
    expect(line?.caption).toBe('Getting the mirror ready...');
  });
});

describe('gameLoopResumeRestart', () => {
  it('camera mode: hidden then visible calls start() once more', async () => {
    const h = makeLoop('ready');
    await h.loop.begin();
    h.world.advance(5000);
    h.visibility.set(true);
    expect(h.source.startCalls).toBe(1);
    h.visibility.set(false);
    expect(h.source.startCalls).toBe(2);
    h.world.advance(1000);
    expect(h.last.ticksDone).toBe(6);
  });

  it('timer-only mode: hidden then visible does not call start()', async () => {
    const h = makeLoop('unavailable');
    await h.loop.begin();
    h.world.advance(5000);
    h.visibility.set(true);
    h.visibility.set(false);
    expect(h.source.startCalls).toBe(1);
  });

  it('a session dropped after more than 60 s hidden does not call start()', async () => {
    const h = makeLoop('ready');
    await h.loop.begin();
    h.world.advance(5000);
    h.visibility.set(true);
    h.world.skip(60001);
    h.visibility.set(false);
    expect(h.dropped).toBe(1);
    expect(h.source.startCalls).toBe(1);
  });

  it("when the restart answers 'unavailable' or fails, the mode does not change and the session ticks on", async () => {
    for (const how of ['unavailable', 'rejects', 'throws'] as const) {
      const h = makeLoop('ready');
      await h.loop.begin();
      h.world.advance(5000);
      h.visibility.set(true);
      h.source.start = (): Promise<'ready' | 'unavailable'> => {
        h.source.startCalls += 1;
        if (how === 'throws') throw new Error('no camera');
        return how === 'rejects'
          ? Promise.reject(new Error('no camera'))
          : Promise.resolve('unavailable');
      };
      h.visibility.set(false);
      await Promise.resolve();
      expect(h.source.startCalls).toBe(2);
      expect(h.last.mode).toBe('camera');
      h.world.advance(3000);
      expect(h.last.mode).toBe('camera');
      expect(h.last.ticksDone).toBe(8);
    }
  });
});
