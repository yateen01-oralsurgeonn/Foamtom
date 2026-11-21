// Browser only. The camera SignalSource (design section 6, req 6 and 7).
// Only the per-second signal and the one DrawValue ever leave this module. Frames are read by
// the trackers inside the browser; nothing here copies, stores, exports or prints a frame.
import type { BrushingSignal } from '../logic/types';
import { aggregateSecond } from './aggregate-second';
import { classifyFrame, pickLargestFace } from './classify-frame';
import { type DrawValue, toDrawValue } from './draw-value';
import { framesInLastSecond } from './frame-window';
import { adaptDetectorFaces, adaptHands, adaptMeshFaces } from './landmark-adapters';
import type { Trackers } from './mediapipe-loader';
import type { SignalSource } from './signal-source';
import { TRACK_MIN_INTERVAL_MS, WINDOW_MS } from './thresholds';
import type { FaceInput, TimedFrame } from './types';

export interface CameraSignalSource extends SignalSource {
  /** Drawing only (req 8.3). Null when no face is seen or the source is not running. */
  latestDraw(): DrawValue | null;
  /** Calls the listener with each new draw value (null when the face is lost). Returns an unsubscribe function. */
  onDraw(listener: (value: DrawValue | null) => void): () => void;
  /** The preview shows this camera stream in the given video element. */
  attachVideo(video: HTMLVideoElement): void;
}

export interface CameraDeps {
  /** Injected clock, for frame times only. */
  now(): number;
  getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream>;
  /** Loads the trackers from this site's own files (mediapipe-loader). May reject. */
  loadTrackers(): Promise<Trackers>;
}

type State = 'idle' | 'starting' | 'running';

export function createCameraSignalSource(deps: CameraDeps): CameraSignalSource {
  let state: State = 'idle';
  // Bumped by every start() and every stop(). A start whose number is old releases what it gets.
  let generation = 0;
  // Set when a start fails or the camera is refused. The camera is then not asked for again
  // from this source (req 7.1). It is not set when stop() interrupts a start.
  let blocked = false;
  let pendingStart: Promise<'ready' | 'unavailable'> | null = null;

  let stream: MediaStream | null = null;
  let trackers: Trackers | null = null;
  let trackVideo: HTMLVideoElement | null = null;
  let attached: HTMLVideoElement | null = null;
  let cancelPending: (() => void) | null = null;
  let lastSentAt = Number.NEGATIVE_INFINITY;

  let frames: TimedFrame[] = [];
  let draw: DrawValue | null = null;
  const listeners = new Set<(value: DrawValue | null) => void>();

  function publish(value: DrawValue | null): void {
    draw = value;
    for (const listener of [...listeners]) listener(value);
  }

  function stopStream(media: MediaStream | null): void {
    if (media === null) return;
    try {
      for (const track of media.getTracks()) track.stop();
    } catch {
      // Nothing more to release.
    }
  }

  function closeTrackers(t: Trackers | null): void {
    if (t === null) return;
    try {
      t.close();
    } catch {
      // Nothing more to release.
    }
  }

  function bindAttached(): void {
    if (attached === null) return;
    attached.srcObject = stream;
    if (stream !== null) {
      const playing = attached.play();
      if (playing !== undefined) playing.catch(() => {});
    }
  }

  function schedule(video: HTMLVideoElement, gen: number): void {
    const onCallback = (timestamp: number): void => onFrame(timestamp, gen);
    if (typeof video.requestVideoFrameCallback === 'function') {
      const handle = video.requestVideoFrameCallback((timestamp) => onCallback(timestamp));
      cancelPending = () => video.cancelVideoFrameCallback(handle);
    } else {
      const handle = requestAnimationFrame((timestamp) => onCallback(timestamp));
      cancelPending = () => cancelAnimationFrame(handle);
    }
  }

  function onFrame(timestamp: number, gen: number): void {
    cancelPending = null;
    const video = trackVideo;
    const current = trackers;
    if (gen !== generation || state !== 'running' || video === null || current === null) return;
    try {
      if (timestamp - lastSentAt >= TRACK_MIN_INTERVAL_MS) {
        lastSentAt = timestamp;
        const aspect = video.videoWidth / video.videoHeight;
        if (aspect > 0 && Number.isFinite(aspect)) {
          const faces: FaceInput[] =
            current.faceModel === 'mesh'
              ? adaptMeshFaces(current.face.detectForVideo(video, timestamp))
              : adaptDetectorFaces(current.face.detectForVideo(video, timestamp));
          const hands = adaptHands(current.hand.detectForVideo(video, timestamp));
          const result = classifyFrame({ aspect, faces, hands });
          const at = deps.now();
          frames.push({ t: at, frame: result });
          frames = frames.filter((item) => item.t > at - WINDOW_MS);
          const largest = pickLargestFace(faces, aspect);
          publish(largest === null ? null : toDrawValue(largest, aspect));
        }
      }
    } catch {
      // This frame is skipped. Too few frames in the second gives a null signal by the normal rule.
    }
    if (gen === generation && state === 'running') schedule(video, gen);
  }

  function release(): void {
    if (cancelPending !== null) cancelPending();
    cancelPending = null;
    stopStream(stream);
    closeTrackers(trackers);
    if (trackVideo !== null) {
      trackVideo.srcObject = null;
      try {
        trackVideo.pause();
      } catch {
        // Nothing more to release.
      }
    }
    if (attached !== null) attached.srcObject = null;
    stream = null;
    trackers = null;
    trackVideo = null;
    frames = [];
  }

  async function run(gen: number): Promise<'ready' | 'unavailable'> {
    let media: MediaStream | null = null;
    let loaded: Trackers | null = null;
    let failed = false;
    try {
      const [cameraAnswer, trackerAnswer] = await Promise.allSettled([
        Promise.resolve().then(() =>
          deps.getUserMedia({ video: { facingMode: 'user' }, audio: false }),
        ),
        Promise.resolve().then(() => deps.loadTrackers()),
      ]);
      media = cameraAnswer.status === 'fulfilled' ? cameraAnswer.value : null;
      loaded = trackerAnswer.status === 'fulfilled' ? trackerAnswer.value : null;
      failed = media === null || loaded === null;

      if (gen !== generation) {
        // stop() was called while waiting: release at once. This is not a failure.
        stopStream(media);
        closeTrackers(loaded);
        return 'unavailable';
      }
      if (failed || media === null || loaded === null) {
        stopStream(media);
        closeTrackers(loaded);
        blocked = true;
        state = 'idle';
        return 'unavailable';
      }

      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.srcObject = media;
      await video.play();

      if (gen !== generation) {
        video.srcObject = null;
        stopStream(media);
        closeTrackers(loaded);
        return 'unavailable';
      }
      stream = media;
      trackers = loaded;
      trackVideo = video;
      frames = [];
      lastSentAt = Number.NEGATIVE_INFINITY;
      state = 'running';
      bindAttached();
      schedule(video, gen);
      return 'ready';
    } catch {
      // The error text is not kept (req 9.2).
      stopStream(media);
      closeTrackers(loaded);
      if (gen === generation) {
        blocked = true;
        state = 'idle';
      }
      return 'unavailable';
    }
  }

  return {
    start(): Promise<'ready' | 'unavailable'> {
      if (state === 'running') return Promise.resolve('ready');
      if (state === 'starting' && pendingStart !== null) return pendingStart;
      if (blocked) return Promise.resolve('unavailable');
      generation += 1;
      state = 'starting';
      const started = run(generation);
      pendingStart = started;
      void started.then(() => {
        if (pendingStart === started) pendingStart = null;
      });
      return started;
    },

    latest(): BrushingSignal | null {
      if (state !== 'running') return null;
      const signal = aggregateSecond(framesInLastSecond(frames, deps.now()));
      frames = [];
      return signal;
    },

    stop(): void {
      generation += 1;
      const hadDraw = draw !== null;
      state = 'idle';
      pendingStart = null;
      release();
      if (hadDraw) publish(null);
    },

    latestDraw(): DrawValue | null {
      return draw;
    },

    onDraw(listener: (value: DrawValue | null) => void): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    attachVideo(video: HTMLVideoElement): void {
      attached = video;
      bindAttached();
    },
  };
}
