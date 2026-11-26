// Per-frame classification (design 5.2 and 5.3, req 3 and 5). Pure: no DOM, no camera, no clock.
// Every distance is in face widths along the face's own axes. The only left and right swap
// is the call to rawToChildSide. Every number comes from thresholds.ts.
import {
  FINGERTIP_LANDMARKS,
  BRUSH_HEAD_BACK_LANDMARK,
  BRUSH_HEAD_REACH,
  BRUSH_HEAD_START_LANDMARK,
  HAND_POINT,
  LEVEL_DEAD_ZONE,
  NEAR_MOUTH_FACE_WIDTHS,
  PALM_LANDMARKS,
  SIDE_DEAD_ZONE,
  WRIST_LANDMARK,
} from './thresholds';
import { rawToChildSide } from './side';
import type { FaceInput, FrameInput, FrameResult, HandInput, HandPointKind, Point } from './types';

const NO_FACE: FrameResult = {
  faceSeen: false,
  handNearMouth: false,
  side: 'unknown',
  level: 'unknown',
  handRel: null,
};

/** Width of a face: distance between its two edge points, with x scaled by the image aspect. */
function faceWidth(face: FaceInput, aspect: number): number {
  return Math.hypot((face.edgeA.x - face.edgeB.x) * aspect, face.edgeA.y - face.edgeB.y);
}

/** The face with the largest width. A tie goes to the first. No face gives null (design 5.2). */
export function pickLargestFace(faces: readonly FaceInput[], aspect = 1): FaceInput | null {
  let best: FaceInput | null = null;
  let bestWidth = 0;
  for (const face of faces) {
    const width = faceWidth(face, aspect);
    if (best === null || width > bestWidth) {
      best = face;
      bestWidth = width;
    }
  }
  return best;
}

function meanOf(landmarks: readonly Point[], indices: readonly number[]): Point {
  let sumX = 0;
  let sumY = 0;
  for (const index of indices) {
    sumX += landmarks[index].x;
    sumY += landmarks[index].y;
  }
  return { x: sumX / indices.length, y: sumY / indices.length };
}

/**
 * One point of a hand: palm centre, wrist, the mean of the fingertips (design 5.2), or the
 * estimated brush head (debug experiment, requirements "Experiment, 26 Nov 2026").
 * `aspect` (image width / height) is used only by 'brush-head': the direction is worked out in
 * the one unit (x times aspect) and the point is returned in raw coordinates.
 */
export function selectHandPoint(hand: HandInput, kind: HandPointKind, aspect = 1): Point {
  if (kind === 'brush-head') {
    const start = hand.landmarks[BRUSH_HEAD_START_LANDMARK];
    const back = hand.landmarks[BRUSH_HEAD_BACK_LANDMARK];
    const startX = start.x * aspect; // the one unit: x times aspect, y as it is
    const backX = back.x * aspect;
    const headX = startX + BRUSH_HEAD_REACH * (startX - backX);
    return {
      x: headX / aspect, // back to raw coordinates
      y: start.y + BRUSH_HEAD_REACH * (start.y - back.y),
    };
  }
  if (kind === 'wrist') return hand.landmarks[WRIST_LANDMARK];
  if (kind === 'fingertips') return meanOf(hand.landmarks, FINGERTIP_LANDMARKS);
  return meanOf(hand.landmarks, PALM_LANDMARKS);
}

/** Classifies one camera frame (design 5.3). */
export function classifyFrame(input: FrameInput, handPoint: HandPointKind = HAND_POINT): FrameResult {
  const aspect = input.aspect;
  const face = pickLargestFace(input.faces, aspect);
  if (face === null || !(faceWidth(face, aspect) > 0)) return NO_FACE;

  // One unit for both axes: x is multiplied by aspect, y is not.
  const inUnit = (p: Point): Point => ({ x: p.x * aspect, y: p.y });
  const mouth = inUnit(face.mouth);
  const first = inUnit(face.edgeA);
  const second = inUnit(face.edgeB);
  // The edge points carry no labels: the one with the smaller x is taken first.
  const a = first.x > second.x ? second : first;
  const b = first.x > second.x ? first : second;
  const width = Math.hypot(b.x - a.x, b.y - a.y);
  const ux = (b.x - a.x) / width; // unit vector toward the raw right
  const uy = (b.y - a.y) / width;
  const vx = -uy; // unit vector toward the chin
  const vy = ux;

  const hands = input.hands
    .map((hand) => {
      const point = inUnit(selectHandPoint(hand, handPoint, aspect));
      return { point, d: Math.hypot(point.x - mouth.x, point.y - mouth.y) / width };
    })
    .sort((p, q) => p.d - q.d);

  const seen = { ...NO_FACE, faceSeen: true };
  if (hands.length === 0) return seen;
  const nearest = hands[0];
  if (nearest.d > NEAR_MOUTH_FACE_WIDTHS) return seen;

  const offX = nearest.point.x - mouth.x;
  const offY = nearest.point.y - mouth.y;
  const rel: Point = {
    x: (offX * ux + offY * uy) / width,
    y: (offX * vx + offY * vy) / width,
  };

  if (hands.length >= 2 && hands[1].d <= NEAR_MOUTH_FACE_WIDTHS) {
    return { faceSeen: true, handNearMouth: true, side: 'unknown', level: 'unknown', handRel: rel };
  }

  const side =
    Math.abs(rel.x) < SIDE_DEAD_ZONE
      ? 'unknown'
      : rawToChildSide(rel.x > 0 ? 'raw-right' : 'raw-left');
  const level = Math.abs(rel.y) < LEVEL_DEAD_ZONE ? 'unknown' : rel.y > 0 ? 'lower' : 'upper';
  return { faceSeen: true, handNearMouth: true, side, level, handRel: rel };
}
