// Turns MediaPipe-shaped result objects into FaceInput[] and HandInput[] (design 8.1, req 5, 6.2).
// Pure: takes plain objects, so it is tested with hand-written results.
// Point orders follow docs/review/MEDIAPIPE-DOC-CHECK.md (installed @mediapipe/tasks-vision 1.2.3).
import type { FaceInput, HandInput, Point } from './types';

/** Face detector (BlazeFace short range) keypoint index of the mouth centre. */
const DETECTOR_MOUTH = 3;
/** Face detector keypoint indices of the two ear points. They are not read as left or right. */
const DETECTOR_EDGE_A = 4;
const DETECTOR_EDGE_B = 5;

/** Face mesh indices of the inner upper lip and inner lower lip; the mouth centre is their midpoint. */
const MESH_LIP_UPPER = 13;
const MESH_LIP_LOWER = 14;
/** Face mesh indices of the two points on the face outline at the sides. Not read as left or right. */
const MESH_EDGE_A = 234;
const MESH_EDGE_B = 454;

/** Number of landmarks MediaPipe gives for one hand. */
const HAND_LANDMARK_COUNT = 21;

/** Shape of a MediaPipe face detector result (only the parts used). */
export interface DetectorResultLike {
  readonly detections: readonly { readonly keypoints: readonly Point[] }[];
}

/** Shape of a MediaPipe face landmarker result (only the parts used). */
export interface MeshResultLike {
  readonly faceLandmarks: readonly (readonly Point[])[];
}

/** Shape of a MediaPipe hand landmarker result (only the parts used). */
export interface HandResultLike {
  readonly landmarks: readonly (readonly Point[])[];
  /** One list of categories per detected hand, in the same order as `landmarks`. Optional. */
  readonly handedness?: readonly (readonly { readonly categoryName: string }[])[];
}

function plain(p: Point): Point {
  return { x: p.x, y: p.y };
}

function isPoint(p: Point | undefined): p is Point {
  return p !== undefined && Number.isFinite(p.x) && Number.isFinite(p.y);
}

/** Faces from the face detector. A detection without the three needed keypoints is dropped. */
export function adaptDetectorFaces(result: DetectorResultLike | null | undefined): FaceInput[] {
  const faces: FaceInput[] = [];
  for (const detection of result?.detections ?? []) {
    const mouth = detection.keypoints[DETECTOR_MOUTH];
    const edgeA = detection.keypoints[DETECTOR_EDGE_A];
    const edgeB = detection.keypoints[DETECTOR_EDGE_B];
    if (!isPoint(mouth) || !isPoint(edgeA) || !isPoint(edgeB)) continue;
    faces.push({ mouth: plain(mouth), edgeA: plain(edgeA), edgeB: plain(edgeB) });
  }
  return faces;
}

/** Faces from the face mesh. A face without the four needed landmarks is dropped. */
export function adaptMeshFaces(result: MeshResultLike | null | undefined): FaceInput[] {
  const faces: FaceInput[] = [];
  for (const landmarks of result?.faceLandmarks ?? []) {
    const upper = landmarks[MESH_LIP_UPPER];
    const lower = landmarks[MESH_LIP_LOWER];
    const edgeA = landmarks[MESH_EDGE_A];
    const edgeB = landmarks[MESH_EDGE_B];
    if (!isPoint(upper) || !isPoint(lower) || !isPoint(edgeA) || !isPoint(edgeB)) continue;
    faces.push({
      mouth: { x: (upper.x + lower.x) / 2, y: (upper.y + lower.y) / 2 },
      edgeA: plain(edgeA),
      edgeB: plain(edgeB),
    });
  }
  return faces;
}

/**
 * Hands from the hand landmarker. A hand without all 21 landmarks is dropped. The handedness
 * label ('Left' or 'Right') is added when MediaPipe gives one; the game never reads it.
 */
export function adaptHands(result: HandResultLike | null | undefined): HandInput[] {
  const hands: HandInput[] = [];
  const all = result?.landmarks ?? [];
  for (let index = 0; index < all.length; index++) {
    const landmarks = all[index];
    if (landmarks.length < HAND_LANDMARK_COUNT || !landmarks.every(isPoint)) continue;
    const label = result?.handedness?.[index]?.[0]?.categoryName;
    const base = { landmarks: landmarks.slice(0, HAND_LANDMARK_COUNT).map(plain) };
    hands.push(label === 'Left' || label === 'Right' ? { ...base, handedness: label } : base);
  }
  return hands;
}
