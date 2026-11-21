// The one extra value the tracker gives the UI, for drawing only (design 5.7, req 8.3).
// Pure. It is never stored, logged, sent or given to src/logic/.
import type { FaceInput, Point } from './types';

export interface DrawValue {
  readonly mouth: Point; // raw image coordinates, 0 to 1
  readonly faceWidth: number; // as a fraction of image width
  readonly roll: number; // radians; angle of the face axis, so the monster follows a tilted head
}

/**
 * Where to draw for one face. `aspect` is image width / image height, so that x and y use one unit.
 * A face of width zero, or a bad aspect, gives null (nothing to draw).
 */
export function toDrawValue(face: FaceInput, aspect: number): DrawValue | null {
  if (!(aspect > 0) || !Number.isFinite(aspect)) return null;
  // The edge points carry no labels: the one with the smaller x is taken first, so the roll
  // does not depend on which edge the model listed first.
  const first = face.edgeA.x > face.edgeB.x ? face.edgeB : face.edgeA;
  const second = face.edgeA.x > face.edgeB.x ? face.edgeA : face.edgeB;
  const dx = (second.x - first.x) * aspect; // image-height units
  const dy = second.y - first.y;
  const widthInHeights = Math.hypot(dx, dy);
  if (!(widthInHeights > 0) || !Number.isFinite(widthInHeights)) return null;
  return {
    mouth: { x: face.mouth.x, y: face.mouth.y },
    faceWidth: widthInHeights / aspect,
    roll: Math.atan2(dy, dx),
  };
}
