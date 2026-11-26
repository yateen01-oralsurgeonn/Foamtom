// Debug page for the hand-tracking feasibility test (developer and Dr. Yatin only).
// Uses the same functions and constants as the game; defines no threshold of its own.
// Nothing is stored, sent, logged or exported. The camera stops when the tab is hidden.
import type { BrushingSignal } from '../src/logic/types';
import { aggregateSecond } from '../src/tracking/aggregate-second';
import { classifyFrame } from '../src/tracking/classify-frame';
import { framesInLastSecond } from '../src/tracking/frame-window';
import { adaptDetectorFaces, adaptHands, adaptMeshFaces } from '../src/tracking/landmark-adapters';
import { loadTrackers, type Trackers } from '../src/tracking/mediapipe-loader';
import { FACE_MODEL, HAND_POINT, TRACK_MIN_INTERVAL_MS, WINDOW_MS } from '../src/tracking/thresholds';
import type { FrameInput, HandPointKind, TimedFrame } from '../src/tracking/types';
import { clearDrawing, drawLandmarks } from './debug-draw';

const KINDS: readonly HandPointKind[] = ['palm', 'wrist', 'fingertips', 'brush-head'];

function byId(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) throw new Error('missing page element');
  return element;
}

const stage = byId('stage');
const readout = byId('readout');
const points = byId('points');

// ---- layout (set from script because the policy allows no inline style) ----
document.body.style.margin = '0';
document.body.style.padding = '8px';
document.body.style.background = '#111';
document.body.style.color = '#fff';
document.body.style.fontFamily = 'monospace';

// The stage holds the video and the canvas. It is mirrored by CSS only; the readout is outside it.
stage.style.position = 'relative';
stage.style.width = '100%';
stage.style.maxWidth = '640px';
stage.style.transform = 'scaleX(-1)';

const video = document.createElement('video');
video.playsInline = true;
video.muted = true;
video.style.display = 'block';
video.style.width = '100%';
video.style.height = 'auto';
stage.appendChild(video);

const canvas = document.createElement('canvas');
canvas.style.position = 'absolute';
canvas.style.left = '0';
canvas.style.top = '0';
canvas.style.width = '100%';
canvas.style.height = '100%';
stage.appendChild(canvas);

readout.style.fontSize = '2.5rem';
readout.style.lineHeight = '1.2';
readout.style.margin = '8px 0';
points.style.fontSize = '1.5rem';
points.style.lineHeight = '1.2';
points.style.margin = '8px 0';

// ---- state ----
const faceParam = new URLSearchParams(window.location.search).get('face');
const faceModel: 'detector' | 'mesh' = faceParam === 'mesh' || faceParam === 'detector' ? faceParam : FACE_MODEL;

let generation = 0;
let stream: MediaStream | null = null;
let trackers: Trackers | null = null;
let cancelPump: (() => void) | null = null;
let lastSentMs = Number.NEGATIVE_INFINITY;
const lists: Record<HandPointKind, TimedFrame[]> = { palm: [], wrist: [], fingertips: [], 'brush-head': [] };

function header(): string {
  return `face model: ${faceModel}   hand point: ${HAND_POINT}\n`;
}

function showStatus(text: string): void {
  readout.textContent = header() + text;
  points.textContent = '';
}

function signalText(signal: BrushingSignal | null): string {
  if (signal === null) return 'null';
  return (
    `handNearMouth: ${signal.handNearMouth}\n` +
    `side: ${signal.side}\n` +
    `level: ${signal.level}\n` +
    `moving: ${signal.moving}`
  );
}

function show(nowMs: number): void {
  const signals = {} as Record<HandPointKind, BrushingSignal | null>;
  for (const kind of KINDS) signals[kind] = aggregateSecond(framesInLastSecond(lists[kind], nowMs));
  readout.textContent = header() + signalText(signals[HAND_POINT]);
  points.textContent = KINDS.map((kind) => {
    const s = signals[kind];
    return `${kind}:  near: ${s ? s.handNearMouth : 'null'}   side: ${s ? s.side : 'null'}   level: ${s ? s.level : 'null'}`;
  }).join('\n');
}

function step(nowMs: number): void {
  if (!trackers || video.videoWidth === 0 || video.videoHeight === 0) return;
  if (nowMs - lastSentMs < TRACK_MIN_INTERVAL_MS) return;
  lastSentMs = nowMs;
  try {
    const faces =
      trackers.faceModel === 'mesh'
        ? adaptMeshFaces(trackers.face.detectForVideo(video, nowMs))
        : adaptDetectorFaces(trackers.face.detectForVideo(video, nowMs));
    const hands = adaptHands(trackers.hand.detectForVideo(video, nowMs));
    const input: FrameInput = { aspect: video.videoWidth / video.videoHeight, faces, hands };
    for (const kind of KINDS) {
      const kept = lists[kind].filter((entry) => entry.t > nowMs - WINDOW_MS);
      kept.push({ t: nowMs, frame: classifyFrame(input, kind) });
      lists[kind] = kept;
    }
    drawLandmarks(canvas, { width: video.videoWidth, height: video.videoHeight }, faces, hands, KINDS);
    show(nowMs);
  } catch {
    // This frame is skipped, as the game does.
  }
}

function pump(session: number): void {
  const onFrame = (nowMs: number): void => {
    if (session !== generation) return;
    step(nowMs);
    pump(session);
  };
  if ('requestVideoFrameCallback' in video) {
    const handle = video.requestVideoFrameCallback(onFrame);
    cancelPump = () => video.cancelVideoFrameCallback(handle);
  } else {
    const handle = requestAnimationFrame(onFrame);
    cancelPump = () => cancelAnimationFrame(handle);
  }
}

function release(camera: MediaStream | null, loaded: Trackers | null): void {
  if (camera) for (const track of camera.getTracks()) track.stop();
  if (loaded) loaded.close();
}

function stop(): void {
  generation += 1;
  if (cancelPump) cancelPump();
  cancelPump = null;
  release(stream, trackers);
  stream = null;
  trackers = null;
  video.srcObject = null;
  clearDrawing(canvas);
  for (const kind of KINDS) lists[kind] = [];
}

async function openCamera(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
}

async function start(): Promise<void> {
  // Release anything a running session still holds, so a second start() can never leave two cameras open.
  stop();
  const mine = (generation += 1);
  showStatus('starting...');
  const [cameraResult, trackersResult] = await Promise.allSettled([openCamera(), loadTrackers(faceModel)]);
  const camera = cameraResult.status === 'fulfilled' ? cameraResult.value : null;
  const loaded = trackersResult.status === 'fulfilled' ? trackersResult.value : null;
  if (mine !== generation || !camera || !loaded) {
    release(camera, loaded);
    if (mine === generation) showStatus('camera or models not available');
    return;
  }
  video.srcObject = camera;
  try {
    await video.play();
  } catch {
    release(camera, loaded);
    // A newer start may own the video by now; only clear it if it still holds this camera.
    if (video.srcObject === camera) video.srcObject = null;
    if (mine === generation) showStatus('camera not available');
    return;
  }
  if (mine !== generation) {
    release(camera, loaded);
    if (video.srcObject === camera) video.srcObject = null;
    return;
  }
  stream = camera;
  trackers = loaded;
  lastSentMs = Number.NEGATIVE_INFINITY;
  pump(mine);
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stop();
    showStatus('camera stopped (tab hidden)');
  } else {
    void start();
  }
});

void start();
