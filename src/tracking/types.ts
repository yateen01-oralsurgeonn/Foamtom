// Plain data types for tracking (design section 4). No logic.
import type { BrushingSignal, Level, Side } from '../logic/types';

// A point in normalised image coordinates: x and y are each 0 to 1 of the image width / height.
export interface Point {
  readonly x: number;
  readonly y: number;
}

// Model-neutral face. Two edge points and the mouth centre; the edge points are NOT labelled
// left or right, so mirroring the input cannot change which is which (req 11.4b).
export interface FaceInput {
  readonly mouth: Point; // centre of the mouth
  readonly edgeA: Point; // one side of the face at about eye-to-mouth height
  readonly edgeB: Point; // the other side
}

// One hand: the 21 MediaPipe hand landmarks, in the library's order.
export interface HandInput {
  readonly landmarks: readonly Point[];
  // MediaPipe's handedness label when it gives one. Only the debug page's calibration reads it.
  readonly handedness?: 'Left' | 'Right';
}

// What one camera frame gives the classifier. Plain numbers only (req 3.1).
export interface FrameInput {
  readonly aspect: number; // image width / image height, so x and y use one unit (req 3.2)
  readonly faces: readonly FaceInput[]; // 0 or more
  readonly hands: readonly HandInput[]; // 0 to 2
}

export type HandPointKind = 'palm' | 'wrist' | 'fingertips' | 'brush-head';

// What one frame says. Lives in memory for at most one second (req 4.7).
export interface FrameResult {
  readonly faceSeen: boolean;
  readonly handNearMouth: BrushingSignal['handNearMouth'];
  readonly side: Side | 'unknown'; // always 'unknown' when handNearMouth is false (req 3.6)
  readonly level: Level | 'unknown'; // always 'unknown' when handNearMouth is false (req 3.6)
  // Hand point relative to the mouth, in face widths, along the face's own axes
  // (x: toward the face edge that is on the raw right, y: toward the chin). null unless handNearMouth.
  readonly handRel: Point | null;
}

// t in ms from an injected clock.
export interface TimedFrame {
  readonly t: number;
  readonly frame: FrameResult;
}
