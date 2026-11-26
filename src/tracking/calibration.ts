// Per-child calibration experiment (requirements "Experiment 2, 26 Nov 2026").
// Pure functions: no DOM, no clock, no randomness. Used by the debug page only; the game does not
// import this file. Everything here lives in memory and is never stored, sent or logged.
import type { ZoneId } from '../logic/types';
import { pickLargestFace, selectHandPoint } from './classify-frame';
import { CALIBRATION_LANDMARKS, HAND_POINT, NEAR_MOUTH_FACE_WIDTHS } from './thresholds';
import type { FrameInput, Point } from './types';

export type { ZoneId };

/** The zones in the game's order: upper right, upper left, lower left, lower right. */
export const CALIBRATION_ZONES: readonly ZoneId[] = ['upper-right', 'upper-left', 'lower-left', 'lower-right'];

/** One learned frame: the zone the child was told to brush, and what the hand looked like. */
export interface CalibrationEntry {
  readonly zone: ZoneId;
  readonly features: readonly number[];
}

export type CalibrationSet = readonly CalibrationEntry[];

export interface CalibrationVote {
  readonly zone: ZoneId;
  readonly votes: number;
}

export interface WindowZone {
  readonly zone: ZoneId;
  /** Fraction of the classified frames that agree, 0 to 1. */
  readonly share: number;
  readonly agree: number;
  readonly total: number;
}

function zoneRank(zone: ZoneId): number {
  return CALIBRATION_ZONES.indexOf(zone);
}

/**
 * What the hand looks like in one frame, or null when there is no face, no hand, or the hand is
 * not near the mouth. For the largest face and the hand nearest the mouth (the choices
 * `classifyFrame` makes, with its `pickLargestFace` and `selectHandPoint`), the positions of
 * landmarks CALIBRATION_LANDMARKS, each relative to the mouth centre and divided by the face
 * width, along the face's own axes (x toward the face edge on the raw right, y toward the chin).
 * Then the handedness MediaPipe reports: +1 Right, -1 Left, 0 when it gives none.
 * `aspect` is image width / height; it defaults to the frame's own.
 */
export function handFeatures(input: FrameInput, aspect: number = input.aspect): number[] | null {
  const face = pickLargestFace(input.faces, aspect);
  if (face === null) return null;

  // The same frame as classifyFrame: one unit for both axes (x times aspect), unlabelled edge
  // points ordered by x.
  const inUnit = (p: Point): Point => ({ x: p.x * aspect, y: p.y });
  const mouth = inUnit(face.mouth);
  const first = inUnit(face.edgeA);
  const second = inUnit(face.edgeB);
  const a = first.x > second.x ? second : first;
  const b = first.x > second.x ? first : second;
  const width = Math.hypot(b.x - a.x, b.y - a.y);
  if (!(width > 0)) return null;
  const ux = (b.x - a.x) / width;
  const uy = (b.y - a.y) / width;
  const vx = -uy;
  const vy = ux;

  let nearest: (typeof input.hands)[number] | null = null;
  let nearestD = Number.POSITIVE_INFINITY;
  for (const hand of input.hands) {
    const point = inUnit(selectHandPoint(hand, HAND_POINT, aspect));
    const d = Math.hypot(point.x - mouth.x, point.y - mouth.y) / width;
    if (d < nearestD) {
      nearest = hand;
      nearestD = d;
    }
  }
  if (nearest === null || nearestD > NEAR_MOUTH_FACE_WIDTHS) return null;

  const features: number[] = [];
  for (const index of CALIBRATION_LANDMARKS) {
    const p = inUnit(nearest.landmarks[index]);
    const offX = p.x - mouth.x;
    const offY = p.y - mouth.y;
    features.push((offX * ux + offY * uy) / width, (offX * vx + offY * vy) / width);
  }
  features.push(nearest.handedness === 'Right' ? 1 : nearest.handedness === 'Left' ? -1 : 0);
  return features;
}

function distance(p: readonly number[], q: readonly number[]): number {
  let sum = 0;
  for (let i = 0; i < p.length; i++) sum += (p[i] - q[i]) * (p[i] - q[i]);
  return Math.sqrt(sum);
}

/**
 * k nearest neighbours (Euclidean) over every learned frame. Returns the zone with the most votes
 * among the k nearest and its vote count. A tie in votes goes to the zone whose voters are
 * nearer in total, then to the earlier zone in the game's order, so the answer never depends on
 * the order of the set. Returns null when fewer than k learned frames can be compared.
 */
export function classifyByCalibration(
  set: CalibrationSet,
  features: readonly number[],
  k: number,
): CalibrationVote | null {
  if (!(k >= 1)) return null;
  const scored = set
    .filter((entry) => entry.features.length === features.length)
    .map((entry) => ({ zone: entry.zone, d: distance(entry.features, features) }));
  if (scored.length < k) return null;
  scored.sort((p, q) => p.d - q.d || zoneRank(p.zone) - zoneRank(q.zone));

  const votes = new Map<ZoneId, number>();
  const total = new Map<ZoneId, number>();
  for (const { zone, d } of scored.slice(0, k)) {
    votes.set(zone, (votes.get(zone) ?? 0) + 1);
    total.set(zone, (total.get(zone) ?? 0) + d);
  }
  let best: ZoneId | null = null;
  for (const zone of CALIBRATION_ZONES) {
    const v = votes.get(zone) ?? 0;
    if (v === 0) continue;
    if (best === null) {
      best = zone;
      continue;
    }
    const bestVotes = votes.get(best) ?? 0;
    if (v > bestVotes || (v === bestVotes && (total.get(zone) ?? 0) < (total.get(best) ?? 0))) best = zone;
  }
  if (best === null) return null;
  return { zone: best, votes: votes.get(best) ?? 0 };
}

/**
 * The zone most frames of the last second agree on, and how many agree. `results` holds the
 * per-frame answers of that second; null entries (no hand at the mouth, set too small) are not
 * counted. A tie goes to the earlier zone in the game's order. Null when no frame has an answer.
 */
export function zoneOverWindow(results: readonly (CalibrationVote | null)[]): WindowZone | null {
  const counts = new Map<ZoneId, number>();
  let total = 0;
  for (const result of results) {
    if (result === null) continue;
    counts.set(result.zone, (counts.get(result.zone) ?? 0) + 1);
    total += 1;
  }
  if (total === 0) return null;
  let best: ZoneId = CALIBRATION_ZONES[0];
  let bestCount = 0;
  for (const zone of CALIBRATION_ZONES) {
    const count = counts.get(zone) ?? 0;
    if (count > bestCount) {
      best = zone;
      bestCount = count;
    }
  }
  return { zone: best, share: bestCount / total, agree: bestCount, total };
}
