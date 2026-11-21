import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCameraSignalSource, type CameraDeps } from '../src/tracking/camera-source';
import type { Trackers } from '../src/tracking/mediapipe-loader';

// design test 20: cameraSourceLifecycle. Fakes only: no camera, no models, no real clock.

const POINT = (x: number, y: number) => ({ x, y });
// Detector keypoints: 3 is the mouth, 4 and 5 are the ears (see landmark-adapters.ts).
const DETECTOR_RESULT = {
  detections: [
    {
      keypoints: [POINT(0.45, 0.4), POINT(0.55, 0.4), POINT(0.5, 0.5), POINT(0.5, 0.6), POINT(0.4, 0.5), POINT(0.6, 0.5)],
    },
  ],
};
const NO_FACE_RESULT = { detections: [] };
// A hand with all 21 landmarks just below the mouth.
const HAND_RESULT = { landmarks: [Array.from({ length: 21 }, () => POINT(0.5, 0.68))] };

interface FakeTrack {
  stopped: number;
  stop(): void;
}
function fakeStream(): { stream: MediaStream; tracks: FakeTrack[] } {
  const tracks: FakeTrack[] = [0, 1].map(() => {
    const track = {
      stopped: 0,
      stop() {
        track.stopped += 1;
      },
    };
    return track;
  });
  return { stream: { getTracks: () => tracks } as unknown as MediaStream, tracks };
}

interface FakeVideo {
  muted: boolean;
  playsInline: boolean;
  srcObject: unknown;
  videoWidth: number;
  videoHeight: number;
  paused: boolean;
  callback: ((timestamp: number) => void) | null;
  cancelled: number;
  play(): Promise<void>;
  pause(): void;
  requestVideoFrameCallback(cb: (timestamp: number) => void): number;
  cancelVideoFrameCallback(handle: number): void;
}
function fakeVideo(): FakeVideo {
  const video: FakeVideo = {
    muted: false,
    playsInline: false,
    srcObject: null,
    videoWidth: 640,
    videoHeight: 480,
    paused: true,
    callback: null,
    cancelled: 0,
    play: () => {
      video.paused = false;
      return Promise.resolve();
    },
    pause: () => {
      video.paused = true;
    },
    requestVideoFrameCallback: (cb) => {
      video.callback = cb;
      return 1;
    },
    cancelVideoFrameCallback: () => {
      video.cancelled += 1;
      video.callback = null;
    },
  };
  return video;
}

interface Rig {
  deps: CameraDeps;
  clock: { t: number };
  video: FakeVideo;
  media: { stream: MediaStream; tracks: FakeTrack[] }[];
  closed: { count: number }[];
  calls: { getUserMedia: number; loadTrackers: number; constraints: unknown[] };
  face: { result: unknown; throws: boolean };
  fire(timestamp: number): void;
}

function makeRig(options: { refuse?: boolean; loadFails?: boolean; noCamera?: boolean } = {}): Rig {
  const video = fakeVideo();
  vi.stubGlobal('document', { createElement: () => video });
  const clock = { t: 0 };
  const media: Rig['media'] = [];
  const closed: Rig['closed'] = [];
  const calls = { getUserMedia: 0, loadTrackers: 0, constraints: [] as unknown[] };
  const face = { result: DETECTOR_RESULT as unknown, throws: false };
  const deps: CameraDeps = {
    now: () => clock.t,
    getUserMedia: (constraints) => {
      calls.getUserMedia += 1;
      calls.constraints.push(constraints);
      if (options.noCamera) throw new Error('no camera API');
      if (options.refuse) return Promise.reject(new Error('refused'));
      const made = fakeStream();
      media.push(made);
      return Promise.resolve(made.stream);
    },
    loadTrackers: () => {
      calls.loadTrackers += 1;
      if (options.loadFails) return Promise.reject(new Error('load failed'));
      const counter = { count: 0 };
      closed.push(counter);
      const trackers = {
        faceModel: 'detector',
        face: {
          detectForVideo: () => {
            if (face.throws) throw new Error('tracker failed');
            return face.result;
          },
        },
        hand: { detectForVideo: () => HAND_RESULT },
        close: () => {
          counter.count += 1;
        },
      } as unknown as Trackers;
      return Promise.resolve(trackers);
    },
  };
  return {
    deps,
    clock,
    video,
    media,
    closed,
    calls,
    face,
    fire(timestamp) {
      const cb = video.callback;
      if (cb === null) throw new Error('no frame callback is waiting');
      video.callback = null;
      cb(timestamp);
    },
  };
}

/** Feeds `n` frames, 100 ms apart, starting after `from` ms. Moves the fake clock with them. */
function feed(rig: Rig, n: number, from = 0): number {
  let at = from;
  for (let i = 0; i < n; i += 1) {
    at += 100;
    rig.clock.t = at;
    rig.fire(at);
  }
  return at;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('cameraSourceLifecycle', () => {
  it('asks for the front camera with no audio, and answers ready when the stream plays', async () => {
    const rig = makeRig();
    const source = createCameraSignalSource(rig.deps);
    expect(await source.start()).toBe('ready');
    expect(rig.calls.constraints).toEqual([{ video: { facingMode: 'user' }, audio: false }]);
    expect(rig.video.paused).toBe(false);
    expect(rig.video.muted).toBe(true);
  });

  it('answers unavailable when the camera is refused, and does not ask again', async () => {
    const rig = makeRig({ refuse: true });
    const source = createCameraSignalSource(rig.deps);
    expect(await source.start()).toBe('unavailable');
    expect(await source.start()).toBe('unavailable');
    expect(rig.calls.getUserMedia).toBe(1);
    expect(source.latest()).toBeNull();
    // The trackers that loaded in parallel are released.
    expect(rig.closed.every((c) => c.count === 1)).toBe(true);
  });

  it('answers unavailable when the models fail to load, releases the camera, and does not ask again', async () => {
    const rig = makeRig({ loadFails: true });
    const source = createCameraSignalSource(rig.deps);
    expect(await source.start()).toBe('unavailable');
    expect(rig.media[0].tracks.every((t) => t.stopped === 1)).toBe(true);
    expect(await source.start()).toBe('unavailable');
    expect(rig.calls.getUserMedia).toBe(1);
  });

  it('answers unavailable when there is no camera API, without throwing', async () => {
    const rig = makeRig({ noCamera: true });
    const source = createCameraSignalSource(rig.deps);
    await expect(source.start()).resolves.toBe('unavailable');
    await expect(source.start()).resolves.toBe('unavailable');
    expect(rig.calls.getUserMedia).toBe(1);
  });

  it('stop() stops every track, closes the trackers and cancels the frame callback', async () => {
    const rig = makeRig();
    const source = createCameraSignalSource(rig.deps);
    await source.start();
    source.stop();
    expect(rig.media[0].tracks.map((t) => t.stopped)).toEqual([1, 1]);
    expect(rig.closed[0].count).toBe(1);
    expect(rig.video.cancelled).toBe(1);
    expect(rig.video.callback).toBeNull();
    expect(rig.video.srcObject).toBeNull();
    expect(source.latest()).toBeNull();
    expect(source.latestDraw()).toBeNull();
  });

  it('stop() is safe to call twice, and before start()', async () => {
    const rig = makeRig();
    const source = createCameraSignalSource(rig.deps);
    expect(() => source.stop()).not.toThrow();
    await source.start();
    source.stop();
    expect(() => source.stop()).not.toThrow();
    expect(rig.media[0].tracks.map((t) => t.stopped)).toEqual([1, 1]);
    expect(rig.closed[0].count).toBe(1);
  });

  it('stop() during start() releases the camera and the trackers on arrival', async () => {
    const rig = makeRig();
    const source = createCameraSignalSource(rig.deps);
    const starting = source.start();
    source.stop();
    expect(await starting).toBe('unavailable');
    expect(rig.media[0].tracks.map((t) => t.stopped)).toEqual([1, 1]);
    expect(rig.closed[0].count).toBe(1);
    expect(source.latest()).toBeNull();
    expect(rig.video.callback).toBeNull();
  });

  it('latest() is null before ready, after stop() and during a restart', async () => {
    const rig = makeRig();
    const source = createCameraSignalSource(rig.deps);
    expect(source.latest()).toBeNull();
    const starting = source.start();
    expect(source.latest()).toBeNull();
    await starting;
    feed(rig, 6);
    expect(source.latest()).not.toBeNull();
    source.stop();
    expect(source.latest()).toBeNull();
    const restarting = source.start();
    expect(source.latest()).toBeNull();
    await restarting;
  });

  it('a restart after stop() works and asks the browser for the camera again', async () => {
    const rig = makeRig();
    const source = createCameraSignalSource(rig.deps);
    await source.start();
    source.stop();
    expect(await source.start()).toBe('ready');
    expect(rig.calls.getUserMedia).toBe(2);
    expect(rig.closed[0].count).toBe(1);
    expect(rig.closed[1].count).toBe(0);
    const at = feed(rig, 6);
    expect(source.latest()).not.toBeNull();
    expect(at).toBeGreaterThan(0);
  });

  it('latest() gives the signal of the last second and then empties the frames', async () => {
    const rig = makeRig();
    const source = createCameraSignalSource(rig.deps);
    await source.start();
    feed(rig, 6);
    const signal = source.latest();
    expect(signal).not.toBeNull();
    expect(signal!.handNearMouth).toBe(true);
    expect(Object.keys(signal!).sort()).toEqual(['handNearMouth', 'level', 'moving', 'side']);
    expect(source.latest()).toBeNull(); // the frames were emptied: fewer than 5 are left
  });

  it('a stalled tracker gives null', async () => {
    const rig = makeRig();
    const source = createCameraSignalSource(rig.deps);
    await source.start();
    const at = feed(rig, 8);
    rig.clock.t = at + 2000; // no frame for two seconds
    expect(source.latest()).toBeNull();
  });

  it('too few frames in a second gives null', async () => {
    const rig = makeRig();
    const source = createCameraSignalSource(rig.deps);
    await source.start();
    feed(rig, 3);
    expect(source.latest()).toBeNull();
  });

  it('sends a frame to the trackers at most every TRACK_MIN_INTERVAL_MS', async () => {
    const rig = makeRig();
    const source = createCameraSignalSource(rig.deps);
    await source.start();
    // Twenty callbacks, 10 ms apart: only about two of them reach the trackers.
    for (let i = 1; i <= 20; i += 1) {
      rig.clock.t = i * 10;
      rig.fire(i * 10);
    }
    expect(source.latest()).toBeNull(); // far fewer than 5 frames were taken
  });

  it('skips a frame that throws, and keeps going', async () => {
    const rig = makeRig();
    const source = createCameraSignalSource(rig.deps);
    await source.start();
    rig.face.throws = true;
    const at = feed(rig, 2);
    rig.face.throws = false;
    feed(rig, 6, at);
    const signal = source.latest();
    expect(signal).not.toBeNull();
    expect(rig.video.callback).not.toBeNull();
  });

  it('gives draw values while a face is seen, and clears them when it is lost or on stop()', async () => {
    const rig = makeRig();
    const source = createCameraSignalSource(rig.deps);
    const seen: (number | null)[] = [];
    const unsubscribe = source.onDraw((value) => seen.push(value === null ? null : value.faceWidth));
    await source.start();
    const at = feed(rig, 1);
    const draw = source.latestDraw();
    expect(draw).not.toBeNull();
    expect(draw!.mouth).toEqual({ x: 0.5, y: 0.6 });
    expect(draw!.faceWidth).toBeCloseTo(0.2, 9);
    expect(draw!.roll).toBeCloseTo(0, 9);

    rig.face.result = NO_FACE_RESULT;
    feed(rig, 1, at);
    expect(source.latestDraw()).toBeNull();
    expect(seen.at(-1)).toBeNull();

    rig.face.result = DETECTOR_RESULT;
    feed(rig, 1, at + 100);
    expect(source.latestDraw()).not.toBeNull();
    source.stop();
    expect(source.latestDraw()).toBeNull();
    expect(seen.at(-1)).toBeNull();

    unsubscribe();
    const count = seen.length;
    await source.start();
    feed(rig, 1);
    expect(seen.length).toBe(count);
  });

  it('shows the same stream in an attached video, and lets it go on stop()', async () => {
    const rig = makeRig();
    const source = createCameraSignalSource(rig.deps);
    const preview = fakeVideo();
    source.attachVideo(preview as unknown as HTMLVideoElement);
    expect(preview.srcObject).toBeNull(); // nothing to show before the stream is ready
    await source.start();
    expect(preview.srcObject).toBe(rig.media[0].stream);
    expect(preview.paused).toBe(false);
    source.stop();
    expect(preview.srcObject).toBeNull();
    await source.start();
    expect(preview.srcObject).toBe(rig.media[1].stream);
  });

  it('keeps no frames after stop(): a restarted source starts with an empty window', async () => {
    const rig = makeRig();
    const source = createCameraSignalSource(rig.deps);
    await source.start();
    const at = feed(rig, 6);
    source.stop();
    await source.start();
    rig.clock.t = at + 10;
    expect(source.latest()).toBeNull();
  });
});
