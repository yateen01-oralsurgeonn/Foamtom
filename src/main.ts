// Wiring only: the clock, the signal source, the browser's visibility and wake-lock
// adapters, the game loop and the screens. Past sessions are loaded when a session starts
// and the result is saved when it ends.
import { createBrowserSpeaker } from './audio/speaker';
import { startSession } from './logic/session';
import { toSessionResult } from './logic/session-result';
import { toView } from './logic/view';
import { createStorage } from './storage/storage';
import type { StorageBackend } from './storage/storage';
import type { SessionState, Zone } from './logic/types';
import { nullSignalSource } from './tracking/signal-source';
import type { SignalSource } from './tracking/signal-source';
// Type-only imports are erased at build time. The camera, tracker and MediaPipe code is loaded
// with a dynamic import() after the start tap (see `source` below), never statically.
import type { CameraSignalSource } from './tracking/camera-source';
import type { CameraPreview } from './ui/camera-preview';
import type { monsterAnchor as MonsterAnchorFn } from './ui/monster-anchor';
import { createEndCard } from './ui/end-card';
import { startEffects } from './ui/effects-host';
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

startEffects({
  root: document.documentElement,
  matchMedia: typeof window.matchMedia === 'function' ? (q) => window.matchMedia(q) : undefined,
  visibility: {
    isHidden: () => document.hidden,
    subscribe(listener) {
      const handler = (): void => listener(document.hidden);
      document.addEventListener('visibilitychange', handler);
      return () => document.removeEventListener('visibilitychange', handler);
    },
  },
});

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

  // The camera for the current session, loaded lazily after the start tap. Null in timer-only
  // mode and before the first start.
  interface CameraRun {
    readonly camera: CameraSignalSource;
    readonly createPreview: () => CameraPreview;
    readonly anchorFor: typeof MonsterAnchorFn;
    preview: CameraPreview | null;
    unsubscribe: (() => void) | null;
  }
  let run: CameraRun | null = null;
  let zone: Zone | null = null;
  // Bumped by stop(), so a camera that finishes loading after a stop is never created.
  let loadGeneration = 0;

  function paintAnchor(): void {
    if (!run?.preview) return;
    const draw = run.camera.latestDraw();
    run.preview.placeMonster(zone === null ? null : run.anchorFor(draw, zone));
  }

  function endCameraRun(): void {
    const finished = run;
    run = null;
    zone = null;
    if (!finished) return;
    finished.unsubscribe?.();
    screen.attachPreview(null);
    finished.preview?.destroy();
    finished.camera.stop();
  }

  async function loadCamera(): Promise<CameraRun | null> {
    try {
      const [cameraModule, loaderModule, previewModule, anchorModule] = await Promise.all([
        import('./tracking/camera-source'),
        import('./tracking/mediapipe-loader'),
        import('./ui/camera-preview'),
        import('./ui/monster-anchor'),
      ]);
      const camera = cameraModule.createCameraSignalSource({
        now: () => Date.now(),
        getUserMedia: (constraints) => navigator.mediaDevices.getUserMedia(constraints),
        loadTrackers: () => loaderModule.loadTrackers(),
      });
      return {
        camera,
        createPreview: previewModule.createCameraPreview,
        anchorFor: anchorModule.monsterAnchor,
        preview: null,
        unsubscribe: null,
      };
    } catch {
      return null; // the import failed: timer-only
    }
  }

  // The loop is built once, so it gets this small source. It loads the camera on the first
  // start() of a session (inside the start tap) and passes every later call to it.
  const source: SignalSource = {
    async start() {
      if (run) return run.camera.start(); // a restart after the tab comes back
      const generation = ++loadGeneration;
      const loaded = await loadCamera();
      if (loaded === null || generation !== loadGeneration) return 'unavailable';
      run = loaded;
      return loaded.camera.start();
    },
    latest: () => (run ? run.camera.latest() : nullSignalSource.latest()),
    stop() {
      loadGeneration += 1;
      run?.camera.stop();
    },
  };

  function showCamera(state: SessionState): void {
    zone = state.zones[state.activeZoneIndex] ?? null;
    if (state.mode !== 'camera' || !run) return;
    if (!run.preview) {
      const preview = run.createPreview();
      preview.attach(run.camera);
      screen.attachPreview(preview);
      run.preview = preview;
      run.unsubscribe = run.camera.onDraw(() => paintAnchor());
    }
    paintAnchor();
  }

  const loop = createGameLoop({
    clock: { now: () => Date.now() },
    scheduler,
    source,
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
    onState: (state) => {
      screen.paint(toView(state));
      showCamera(state);
    },
    onEnded: (state) => {
      endCameraRun();
      storage.saveSession(toSessionResult(state));
      screen.hide();
      speaker.stop();
      endCard.show(state.monsters.map((m) => m.def));
    },
    onDropped: () => {
      endCameraRun();
      endCard.hide();
      screen.showStart();
    },
  });

  screen.showStart();
}
