// Wiring only: the clock, the signal source, the browser's visibility and wake-lock
// adapters, the game loop and the screens. Past sessions are loaded when a session starts
// and the result is saved when it ends.
import { createBrowserSpeaker } from './audio/speaker';
import { startSession } from './logic/session';
import { toSessionResult } from './logic/session-result';
import { toView } from './logic/view';
import { createStorage } from './storage/storage';
import type { StorageBackend } from './storage/storage';
import { nullSignalSource } from './tracking/signal-source';
import { createEndCard } from './ui/end-card';
import { createGameLoop } from './ui/game-loop';
import type { Scheduler, VisibilitySource, WakeLockHelper } from './ui/game-loop';
import { createSessionScreen } from './ui/session-screen';

const app = document.getElementById('app');

const scheduler: Scheduler = {
  every(ms, callback) {
    const id = setInterval(callback, ms);
    return () => clearInterval(id);
  },
  after(ms, callback) {
    const id = setTimeout(callback, ms);
    return () => clearTimeout(id);
  },
};

const visibility: VisibilitySource = {
  isHidden: () => document.hidden,
  subscribe(listener) {
    const handler = (): void => listener(document.hidden);
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  },
};

interface WakeLockSentinelLike {
  release(): Promise<void>;
}
interface WakeLockNavigator {
  wakeLock?: { request(type: 'screen'): Promise<WakeLockSentinelLike> };
}

function createWakeLock(): WakeLockHelper {
  let sentinel: WakeLockSentinelLike | null = null;
  let wanted = false;
  return {
    async request() {
      wanted = true;
      const api = (navigator as unknown as WakeLockNavigator).wakeLock;
      if (!api) return; // not supported: carry on silently
      const got = await api.request('screen');
      if (wanted) sentinel = got;
      else void got.release().catch(() => {});
    },
    release() {
      wanted = false;
      const held = sentinel;
      sentinel = null;
      if (held) void held.release().catch(() => {});
    },
  };
}

function localDate(now: Date): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

// Reading `localStorage` can throw when storage is blocked; then nothing is saved or loaded.
function browserBackend(): StorageBackend {
  const blocked: StorageBackend = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };
  try {
    return window.localStorage;
  } catch {
    return blocked;
  }
}

if (app) {
  const speaker = createBrowserSpeaker();
  const storage = createStorage(browserBackend());
  const screen = createSessionScreen(app, { onStart: () => void loop.begin() }, speaker);
  const endCard = createEndCard(
    app,
    {
      onDone: () => {
        endCard.hide();
        screen.showStart();
      },
    },
    speaker,
  );

  const loop = createGameLoop({
    clock: { now: () => Date.now() },
    scheduler,
    source: nullSignalSource,
    visibility,
    wakeLock: createWakeLock(),
    createSession: (mode) => {
      const now = new Date(); // the clock is read once per session
      return startSession({
        mode,
        startedAt: now.getTime(),
        date: localDate(now),
        hour: now.getHours(),
        pastSessions: storage.loadSessions(),
      });
    },
    onState: (state) => screen.paint(toView(state)),
    onEnded: (state) => {
      storage.saveSession(toSessionResult(state));
      screen.hide();
      speaker.stop();
      endCard.show(state.monsters.map((m) => m.def));
    },
    onDropped: () => {
      endCard.hide();
      screen.showStart();
    },
  });

  screen.showStart();
}
