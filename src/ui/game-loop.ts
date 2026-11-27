// The only module in the app that owns a timer (req 15.2, design section 3).
// Everything outside the loop is passed in: clock, scheduler, signal source, visibility
// source and wake-lock helper. Ticks are driven by elapsed visible clock time, not by
// counting timer callbacks, so late or bunched callbacks still give exactly one tick per
// visible second (req 13.12).
import { pause, resume, tick } from '../logic/session';
import type { SessionMode, SessionState } from '../logic/types';
import type { SignalSource } from '../tracking/signal-source';

/** How often the scheduler wakes the loop to look at the clock. */
const POLL_MS = 250;
/** The camera must be ready within this long of the start tap, else timer-only (req 8.1). */
const START_TIMEOUT_MS = 15000;
/** The waiting line shows when the camera is still not ready this long after the start tap (req 8.7). */
const CAMERA_WAIT_LINE_DELAY_MS = 1000;
/** A session hidden for longer than this is dropped (req 2.7). */
const HIDDEN_DROP_MS = 60000;

export interface Clock {
  now(): number;
}

/** Each call returns a function that cancels the timer. */
export interface Scheduler {
  every(ms: number, callback: () => void): () => void;
  after(ms: number, callback: () => void): () => void;
}

export interface VisibilitySource {
  isHidden(): boolean;
  /** Returns a function that removes the listener. */
  subscribe(listener: (hidden: boolean) => void): () => void;
}

export interface WakeLockHelper {
  /** May refuse or throw; the loop carries on silently (req 15.4). */
  request(): Promise<void> | void;
  release(): void;
}

export interface GameLoopDeps {
  clock: Clock;
  scheduler: Scheduler;
  source: SignalSource;
  visibility: VisibilitySource;
  wakeLock: WakeLockHelper;
  /** Builds the session once the mode is known (after start() answers, or after 15 s). */
  createSession: (mode: SessionMode) => SessionState;
  /**
   * `true` once, when the camera is still starting 1 s after the start tap; `false` once, when
   * the mode is known. Never called if the source answers within 1 s (req 8.7).
   */
  onWaiting?: (waiting: boolean) => void;
  onState: (state: SessionState) => void;
  onEnded: (state: SessionState) => void;
  /** The session was hidden for more than 60 s: nothing is saved. */
  onDropped: () => void;
}

export interface GameLoop {
  /** Starts one session. Does nothing if a session is already in progress. */
  begin(): Promise<void>;
}

export function createGameLoop(deps: GameLoopDeps): GameLoop {
  const { clock, scheduler, source, visibility, wakeLock } = deps;
  let busy = false;

  /**
   * Asks the source once; falls back to timer-only after 15 s (req 8.1, 8.3). If the source has
   * not answered after 1 s, the waiting line is shown once; it is hidden before the mode is
   * known, so before the session starts, in either mode (req 8.7).
   */
  function decideMode(): Promise<SessionMode> {
    return new Promise<SessionMode>((resolve) => {
      let settled = false;
      let waitingShown = false;
      const cancelWait = scheduler.after(CAMERA_WAIT_LINE_DELAY_MS, () => {
        if (settled || waitingShown) return;
        waitingShown = true;
        deps.onWaiting?.(true);
      });
      function settle(mode: SessionMode): void {
        settled = true;
        cancelWait();
        if (waitingShown) {
          waitingShown = false;
          deps.onWaiting?.(false);
        }
        resolve(mode);
      }
      const cancelTimeout = scheduler.after(START_TIMEOUT_MS, () => {
        if (settled) return;
        source.stop();
        settle('timer-only');
      });
      let answer: Promise<'ready' | 'unavailable'>;
      try {
        answer = source.start();
      } catch {
        answer = Promise.resolve('unavailable');
      }
      answer.then(
        (result) => {
          if (settled) {
            source.stop(); // answered after the 15 s: release a late camera
            return;
          }
          cancelTimeout();
          settle(result === 'ready' ? 'camera' : 'timer-only');
        },
        () => {
          if (settled) return;
          cancelTimeout();
          settle('timer-only');
        },
      );
    });
  }

  function runSession(initial: SessionState): void {
    let state = initial;
    let visibleMs = 0;
    let emitted = 0;
    let mark = clock.now();
    let hiddenAt: number | null = null;
    let finished = false;
    let lockHeld = false;

    function requestLock(): void {
      lockHeld = true;
      try {
        Promise.resolve(wakeLock.request()).catch(() => {});
      } catch {
        // refused: carry on silently
      }
    }

    function releaseLock(): void {
      if (!lockHeld) return;
      lockHeld = false;
      try {
        wakeLock.release();
      } catch {
        // nothing to do
      }
    }

    function accrue(): void {
      if (hiddenAt !== null) return;
      const now = clock.now();
      visibleMs += Math.max(0, now - mark);
      mark = now;
    }

    function cleanup(): void {
      finished = true;
      cancelPoll();
      unsubscribe();
      source.stop();
      releaseLock();
      busy = false;
    }

    function emitDueTicks(): void {
      const due = Math.floor(visibleMs / 1000);
      while (!finished && emitted < due) {
        emitted += 1;
        const signal = state.mode === 'camera' ? source.latest() : null;
        state = tick(state, signal);
        deps.onState(state);
        if (state.phase === 'ended') {
          cleanup();
          deps.onEnded(state);
        }
      }
    }

    function dropIfHiddenTooLong(): boolean {
      if (hiddenAt === null || clock.now() - hiddenAt <= HIDDEN_DROP_MS) return false;
      cleanup();
      deps.onDropped();
      return true;
    }

    function onPoll(): void {
      if (finished) return;
      if (hiddenAt !== null) {
        dropIfHiddenTooLong();
        return;
      }
      accrue();
      emitDueTicks();
    }

    /** Camera sessions only: start the source again after a hide. The answer is ignored (req 7.3). */
    function restartSource(): void {
      try {
        Promise.resolve(source.start()).catch(() => {});
      } catch {
        // a failed restart leaves latest() null; the mode does not change
      }
    }

    function onVisibility(hidden: boolean): void {
      if (finished) return;
      if (hidden && hiddenAt === null) {
        accrue();
        emitDueTicks();
        if (finished) return;
        hiddenAt = clock.now();
        state = pause(state);
        deps.onState(state);
        source.stop();
        releaseLock();
      } else if (!hidden && hiddenAt !== null) {
        if (dropIfHiddenTooLong()) return;
        hiddenAt = null;
        mark = clock.now();
        state = resume(state);
        deps.onState(state);
        if (state.mode === 'camera') restartSource();
      }
    }

    const cancelPoll = scheduler.every(POLL_MS, onPoll);
    const unsubscribe = visibility.subscribe(onVisibility);

    requestLock();
    deps.onState(state);
    if (visibility.isHidden()) onVisibility(true);
  }

  return {
    async begin(): Promise<void> {
      if (busy) return;
      busy = true;
      const mode = await decideMode();
      runSession(deps.createSession(mode));
    },
  };
}
