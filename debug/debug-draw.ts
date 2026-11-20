// Debug page drawing (developer only). Draws raw landmark positions on a canvas that sits over
// the video. The stage that holds both is mirrored by CSS in tracking-debug.ts; nothing here
// flips a coordinate. Nothing is read back from the canvas or exported.
import { selectHandPoint } from '../src/tracking/classify-frame';
import type { FaceInput, HandInput, HandPointKind, Point } from '../src/tracking/types';

// Drawing sizes, written as products of 1 and 2 so this file holds no threshold-like number.
const DOT_RADIUS = 2 * 2;
const HAND_POINT_RADIUS = 2 * 2 * 2;
const LINE_WIDTH = 2;
const FULL_TURN = 2 * Math.PI;

const FACE_COLOUR = 'lime';
const LANDMARK_COLOUR = 'white';
const POINT_COLOURS: Record<HandPointKind, string> = {
  palm: 'yellow',
  wrist: 'cyan',
  fingertips: 'magenta',
};

function dot(ctx: CanvasRenderingContext2D, p: Point, radius: number, colour: string): void {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(p.x * ctx.canvas.width, p.y * ctx.canvas.height, radius, 0, FULL_TURN);
  ctx.fill();
}

/**
 * Draws the face points, the 21 landmarks of each hand and the three hand points
 * (palm, wrist, fingertips) of each hand. `size` is the video's own pixel size.
 */
export function drawLandmarks(
  canvas: HTMLCanvasElement,
  size: { readonly width: number; readonly height: number },
  faces: readonly FaceInput[],
  hands: readonly HandInput[],
  kinds: readonly HandPointKind[],
): void {
  if (canvas.width !== size.width) canvas.width = size.width;
  if (canvas.height !== size.height) canvas.height = size.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const face of faces) {
    ctx.strokeStyle = FACE_COLOUR;
    ctx.lineWidth = LINE_WIDTH;
    ctx.beginPath();
    ctx.moveTo(face.edgeA.x * canvas.width, face.edgeA.y * canvas.height);
    ctx.lineTo(face.edgeB.x * canvas.width, face.edgeB.y * canvas.height);
    ctx.stroke();
    dot(ctx, face.edgeA, DOT_RADIUS, FACE_COLOUR);
    dot(ctx, face.edgeB, DOT_RADIUS, FACE_COLOUR);
    dot(ctx, face.mouth, HAND_POINT_RADIUS, FACE_COLOUR);
  }

  for (const hand of hands) {
    for (const landmark of hand.landmarks) dot(ctx, landmark, DOT_RADIUS, LANDMARK_COLOUR);
    for (const kind of kinds) dot(ctx, selectHandPoint(hand, kind), HAND_POINT_RADIUS, POINT_COLOURS[kind]);
  }
}

/** Clears the drawing. */
export function clearDrawing(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
}
