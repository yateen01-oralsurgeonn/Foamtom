// Debug page for the hand-tracking feasibility test (developer and Dr. Yatin only).
// Uses the same functions and constants as the game; defines no threshold of its own.
// Nothing is stored, sent, logged or exported. The camera stops when the tab is hidden.
import type { BrushingSignal } from '../src/logic/types';
import { aggregateSecond } from '../src/tracking/aggregate-second';
import {
  CALIBRATION_ZONES,
  classifyByCalibration,
  handFeatures,
  zoneOverWindow,
  type CalibrationEntry,
  type CalibrationVote,
  type ZoneId,
} from '../src/tracking/calibration';
import { classifyFrame } from '../src/tracking/classify-frame';
import { framesInLastSecond } from '../src/tracking/frame-window';
import { adaptDetectorFaces, adaptHands, adaptMeshFaces } from '../src/tracking/landmark-adapters';
import { loadTrackers, type Trackers } from '../src/tracking/mediapipe-loader';
import {
  CALIBRATION_K,
  CALIBRATION_LEAD_IN_SECONDS,
  CALIBRATION_SECONDS_PER_ZONE,
  FACE_MODEL,
  HAND_POINT,
  TRACK_MIN_INTERVAL_MS,
  WINDOW_MS,
} from '../src/tracking/thresholds';
import type { FrameInput, HandPointKind, TimedFrame } from '../src/tracking/types';
import { clearDrawing, drawLandmarks } from './debug-draw';

const KINDS: readonly HandPointKind[] = ['palm', 'wrist', 'fingertips', 'brush-head'];
// The brush-head estimate failed (26 Nov 2026): its code stays, but its point is no longer drawn.
const DRAWN_KINDS: readonly HandPointKind[] = KINDS.filter((kind) => kind !== 'brush-head');

function byId(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) throw new Error('missing page element');
  return element;
}

const layout = byId('layout');
const stage = byId('stage');
const side = byId('side');
const buttons = byId('buttons');
const calibrationText = byId('calibration');
const readout = byId('readout');
const points = byId('points');

// ---- layout (set from script because the policy allows no inline style) ----
document.body.style.margin = '0';
document.body.style.padding = '8px';
document.body.style.background = '#111';
document.body.style.color = '#fff';
document.body.style.fontFamily = 'monospace';

// Picture on the left, readout on the right, so a 1366x768 screen needs no scrolling.
layout.style.display = 'flex';
layout.style.flexWrap = 'wrap';
layout.style.gap = '12px';
layout.style.alignItems = 'flex-start';
side.style.flex = '1 1 360px';
side.style.minWidth = '0';

// The stage holds the video and the canvas. It is mirrored by CSS only; the readout is outside it.
stage.style.position = 'relative';
stage.style.flex = '0 1 640px';
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

calibrationText.style.fontSize = '2.2rem';
calibrationText.style.lineHeight = '1.15';
calibrationText.style.margin = '6px 0';
calibrationText.style.whiteSpace = 'pre-wrap';
readout.style.fontSize = '1.1rem';
readout.style.lineHeight = '1.15';
readout.style.margin = '6px 0';
points.style.fontSize = '0.9rem';
points.style.lineHeight = '1.15';
points.style.margin = '6px 0';

// ---- state ----
const faceParam = new URLSearchParams(window.location.search).get('face');
const faceModel: 'detector' | 'mesh' = faceParam === 'mesh' || faceParam === 'detector' ? faceParam : FACE_MODEL;

let generation = 0;
let stream: MediaStream | null = null;
let trackers: Trackers | null = null;
let cancelPump: (() => void) | null = null;
let lastSentMs = Number.NEGATIVE_INFINITY;
const lists: Record<HandPointKind, TimedFrame[]> = { palm: [], wrist: [], fingertips: [], 'brush-head': [] };

// ---- calibration experiment (memory only: dropped by Reset or when the tab closes) ----
interface CalibrationStep {
  readonly zone: ZoneId;
  readonly brushing: boolean;
  readonly seconds: number;
}
interface CalibrationRound {
  readonly steps: readonly CalibrationStep[];
  index: number;
  startMs: number | null;
  readonly staged: CalibrationEntry[];
}

let learned: CalibrationEntry[] = [];
let round: CalibrationRound | null = null;
let live: { t: number; result: CalibrationVote | null }[] = [];

function zoneName(zone: ZoneId): string {
  return zone.replace('-', ' ').toUpperCase();
}

function zoneInitials(zone: ZoneId): string {
  return zone
    .split('-')
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

function buildSteps(): CalibrationStep[] {
  const steps: CalibrationStep[] = [];
  for (const zone of CALIBRATION_ZONES) {
    steps.push({ zone, brushing: false, seconds: CALIBRATION_LEAD_IN_SECONDS });
    steps.push({ zone, brushing: true, seconds: CALIBRATION_SECONDS_PER_ZONE });
  }
  return steps;
}

/** Speaks with a voice that runs on this device. No local voice: nothing is spoken (captions stay). */
function speak(text: string): void {
  if (!('speechSynthesis' in window)) return;
  const voices = window.speechSynthesis.getVoices().filter((voice) => voice.localService);
  const voice = voices.find((v) => v.lang.toLowerCase().startsWith('en')) ?? voices[0];
  if (!voice) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

function stopSpeech(): void {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

function announce(current: CalibrationStep): void {
  speak(current.brushing ? 'Brush now' : `Get ready. Brush ${zoneName(current.zone).toLowerCase()}`);
}

/** Moves the guided sequence on by the frame clock. A finished round joins the learned set. */
function advanceRound(nowMs: number): void {
  const r = round;
  if (r === null) return;
  if (r.startMs === null) {
    r.startMs = nowMs;
    announce(r.steps[r.index]);
  }
  while (nowMs - r.startMs >= r.steps[r.index].seconds * WINDOW_MS) {
    r.startMs += r.steps[r.index].seconds * WINDOW_MS;
    r.index += 1;
    if (r.index >= r.steps.length) {
      learned = learned.concat(r.staged);
      round = null;
      return;
    }
    announce(r.steps[r.index]);
  }
}

function learnedCounts(): string {
  return CALIBRATION_ZONES.map(
    (zone) => `${zoneInitials(zone)} ${learned.filter((entry) => entry.zone === zone).length}`,
  ).join('  ');
}

function header(): string {
  return `face model: ${faceModel}   hand point: ${HAND_POINT}\nlearned frames: ${learnedCounts()}\n`;
}

function showStatus(text: string): void {
  readout.textContent = header() + text;
  calibrationText.textContent = '';
  points.textContent = '';
}

function palmText(signal: BrushingSignal | null): string {
  return `palm side: ${signal ? signal.side : 'null'}   level: ${signal ? signal.level : 'null'}`;
}

function calibrationReadout(nowMs: number, signal: BrushingSignal | null): string {
  const r = round;
  if (r !== null && r.startMs !== null) {
    const current = r.steps[r.index];
    const left = Math.max(0, Math.ceil((current.seconds * WINDOW_MS - (nowMs - r.startMs)) / WINDOW_MS));
    if (!current.brushing) return `Get ready: brush ${zoneName(current.zone)}\n${left}`;
    const count = r.staged.filter((entry) => entry.zone === current.zone).length;
    return `Brushing ${zoneName(current.zone)}\n${left}s   frames: ${count}`;
  }
  if (learned.length === 0) return `calibrate first\n${palmText(signal)}`;
  const answer = zoneOverWindow(live.map((entry) => entry.result));
  const zoneLine = answer
    ? `${zoneName(answer.zone)} ${answer.agree}/${answer.total}`
    : learned.length < CALIBRATION_K
      ? 'too few learned frames'
      : 'no hand at the mouth';
  return `${zoneLine}\n${palmText(signal)}`;
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
  calibrationText.textContent = calibrationReadout(nowMs, signals[HAND_POINT]);
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

    // Calibration: learn while a guided round brushes a zone, otherwise compare with what was learned.
    advanceRound(nowMs);
    const features = handFeatures(input);
    const r = round;
    if (r !== null) {
      const current = r.steps[r.index];
      if (current.brushing && features !== null) r.staged.push({ zone: current.zone, features });
      live = [];
    } else {
      const kept = live.filter((entry) => entry.t > nowMs - WINDOW_MS);
      const result =
        features !== null && learned.length > 0 ? classifyByCalibration(learned, features, CALIBRATION_K) : null;
      kept.push({ t: nowMs, result });
      live = kept;
    }

    drawLandmarks(canvas, { width: video.videoWidth, height: video.videoHeight }, faces, hands, DRAWN_KINDS);
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
  // A round in progress is dropped (its frames were only staged); what was learned stays in memory.
  round = null;
  live = [];
  stopSpeech();
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

function addButton(label: string, onClick: () => void): void {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.style.minHeight = '48px';
  button.style.minWidth = '120px';
  button.style.fontSize = '1.2rem';
  button.style.marginRight = '8px';
  button.addEventListener('click', onClick);
  buttons.appendChild(button);
}

// Calibrate adds another round (for example with the other hand). Reset drops everything learned.
addButton('Calibrate', () => {
  if (round !== null || !trackers) return;
  round = { steps: buildSteps(), index: 0, startMs: null, staged: [] };
  live = [];
});
addButton('Reset', () => {
  round = null;
  learned = [];
  live = [];
  stopSpeech();
  readout.textContent = header();
  calibrationText.textContent = 'calibrate first';
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stop();
    showStatus('camera stopped (tab hidden)');
  } else {
    void start();
  }
});

void start();
