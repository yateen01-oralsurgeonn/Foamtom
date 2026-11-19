// hand-written
// Plain numbers written by hand. Nothing here comes from a camera.
// The face is 0.4 wide with the mouth below the edge points, in a square image.
import type { FaceInput, FrameInput, HandInput } from '../../../src/tracking/types';

const FACE: FaceInput = {
  mouth: { x: 0.5, y: 0.6 },
  edgeA: { x: 0.3, y: 0.5 },
  edgeB: { x: 0.7, y: 0.5 },
};

// A much smaller face somewhere else in the picture.
const SMALL_FACE: FaceInput = {
  mouth: { x: 0.15, y: 0.3 },
  edgeA: { x: 0.1, y: 0.28 },
  edgeB: { x: 0.2, y: 0.28 },
};

/** A hand whose 21 landmarks all sit at one point. */
function handAt(x: number, y: number): HandInput {
  const landmarks = [];
  for (let i = 0; i < 21; i += 1) landmarks.push({ x, y });
  return { landmarks };
}

function frame(faces: FaceInput[], hands: HandInput[]): FrameInput {
  return { aspect: 1, faces, hands };
}

// Hand on the raw right of the mouth (the child's left), a little below the mouth line.
export const handRawRightCheek: FrameInput = frame([FACE], [handAt(0.7, 0.7)]);

// Hand on the raw left of the mouth (the child's right), a little below the mouth line.
export const handRawLeftCheek: FrameInput = frame([FACE], [handAt(0.3, 0.7)]);

// Hand straight above the mouth.
export const handAbove: FrameInput = frame([FACE], [handAt(0.5, 0.4)]);

// Hand straight below the mouth.
export const handBelow: FrameInput = frame([FACE], [handAt(0.5, 0.8)]);

// Hand in the far corner of the picture.
export const handFarAway: FrameInput = frame([FACE], [handAt(0.95, 0.95)]);

// A face and no hand.
export const faceNoHand: FrameInput = frame([FACE], []);

// A hand and no face.
export const handNoFace: FrameInput = frame([], [handAt(0.7, 0.7)]);

// Nothing in the picture.
export const emptyFrame: FrameInput = frame([], []);

// One hand on each cheek, both near the mouth.
export const twoHandsNear: FrameInput = frame([FACE], [handAt(0.7, 0.7), handAt(0.3, 0.7)]);

// The main face with a hand on the raw right, plus a second smaller face listed first.
export const secondFace: FrameInput = frame([SMALL_FACE, FACE], [handAt(0.7, 0.7)]);
