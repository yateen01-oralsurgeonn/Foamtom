// Where the monster is drawn on the live preview (design 9.2, req 8.2, 8.4). Pure.
// Drawing choices only: they are not dental rules and not numbers a parent sees.
import type { Zone } from '../logic/types';
import type { DrawValue } from '../tracking/draw-value';
import { rawToChildSide } from '../tracking/side';

/** How far the monster sits from the mouth along the face axis, in face widths. */
export const CHEEK_OFFSET = 0.45;
/** How far the monster is moved toward the chin (lower zone) or away from it (upper zone), in face widths. */
export const LEVEL_LIFT = 0.15;
/** Monster size as a fraction of face width. */
export const MONSTER_SIZE = 0.4;

/**
 * Placement inside the stage. `x` and `y` are the monster centre and `size` is the monster width
 * and height, all as fractions of the stage (0 to 1). `rotate` is in radians.
 */
export interface Anchor {
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly rotate: number;
}

// Keeps the whole monster inside the stage; a monster larger than the stage is centred.
function clampCentre(centre: number, size: number): number {
  const half = size / 2;
  if (half >= 0.5) return 0.5;
  return Math.min(1 - half, Math.max(half, centre));
}

/**
 * `null` in gives `null` out: the caller then shows the monster where the plain session screen
 * puts it, with no message (req 8.4).
 * The stage is treated as square for the offsets: the draw value carries face width as a fraction of
 * image width only, so the same fraction is used on the y axis.
 */
export function monsterAnchor(draw: DrawValue | null, zone: Zone): Anchor | null {
  if (draw === null) return null;
  // +1 moves toward the raw right of the image (the face axis); -1 toward the raw left.
  const dir = rawToChildSide('raw-right') === zone.side ? 1 : -1;
  const lift = zone.level === 'lower' ? LEVEL_LIFT : -LEVEL_LIFT;
  const along = dir * CHEEK_OFFSET * draw.faceWidth; // along the face axis
  const down = lift * draw.faceWidth; // toward the chin
  const cos = Math.cos(draw.roll);
  const sin = Math.sin(draw.roll);
  const size = MONSTER_SIZE * draw.faceWidth;
  return {
    x: clampCentre(draw.mouth.x + along * cos - down * sin, size),
    y: clampCentre(draw.mouth.y + along * sin + down * cos, size),
    size,
    rotate: draw.roll,
  };
}
