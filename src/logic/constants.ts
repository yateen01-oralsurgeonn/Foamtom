// Every constant from design section 6, plus ZONE_ORDER (req 3.2).
import type { ZoneId } from './types';

/** Seconds per zone (req 2.1). */
export const ZONE_DURATION = 30;
/** Zones per session. */
export const ZONE_COUNT = 4;
/** Total session length in seconds (req 2.1). */
export const SESSION_DURATION = 120;
/** Normal monster health (max). */
export const H_MAX = 60;
/** Camera-mode damage per second of correct brushing. */
export const DAMAGE_PER_SECOND = 3;
/** Kind-proximity floor: starting health is at least this share of H_MAX (req 14.2). */
export const KIND_FLOOR_RATIO = 0.6;
/** KIND_FLOOR_RATIO × H_MAX. */
export const KIND_FLOOR = Math.round(KIND_FLOOR_RATIO * H_MAX);
/** A monster at or below this health at zone end is rescued (15% of H_MAX) (req 14.3). */
export const RESCUE_THRESHOLD = 9;
/** Health lost per second when the signal is null (req 7.7): H_MAX / ZONE_DURATION. */
export const UNTRACKED_DRAIN = 2;
/** A camera-mode zone with more untracked seconds than this is unverified (req 9.3). */
export const UNTRACKED_LIMIT = 10;
/** Number of most recent camera-mode sessions used for miss scores (req 14.1). */
export const MISS_WINDOW = 7;
/** When false, level is ignored and only side is checked (req 5.7). */
export const REQUIRE_LEVEL_MATCH = true;

/** Zones in session order: upper right, upper left, lower left, lower right (req 3.2). */
export const ZONE_ORDER: readonly ZoneId[] = [
  'upper-right',
  'upper-left',
  'lower-left',
  'lower-right',
];
