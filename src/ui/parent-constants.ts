// Constants of the parent screen (parent-screen design section 4).
// Pure: no DOM, no clock. The core values come from src/logic/constants.ts and are not
// repeated here as numbers.
import {
  REQUIRE_LEVEL_MATCH,
  REQUIRE_SIDE_MATCH,
  SESSION_DURATION,
  ZONE_DURATION,
  ZONE_ORDER,
} from '../logic/constants';
import type { ZoneId } from '../logic/types';

/** Seconds the adult gate must be held (req 2.1). */
export const GATE_HOLD_SECONDS = 3;
/** Camera-mode sessions in the window needed before the zone fact is shown (req 6.2). */
export const ZONE_FACT_MIN_CAMERA_SESSIONS = 3;
/** Nights needed for the nudge to appear (req 7.3). */
export const NUDGE_MIN_NIGHTS = 2;
/** Calendar days in the window, today included (req 3.1). */
export const WINDOW_DAYS = 7;

/** Passed to parentView so tests can vary them (req 13.2). */
export interface ParentViewConstants {
  readonly ZONE_DURATION: number;
  readonly SESSION_DURATION: number;
  readonly ZONE_ORDER: readonly ZoneId[];
  readonly REQUIRE_SIDE_MATCH: boolean;
  readonly REQUIRE_LEVEL_MATCH: boolean;
  readonly ZONE_FACT_MIN_CAMERA_SESSIONS: number;
  readonly NUDGE_MIN_NIGHTS: number;
}

export const PARENT_VIEW_CONSTANTS: ParentViewConstants = {
  ZONE_DURATION,
  SESSION_DURATION,
  ZONE_ORDER,
  REQUIRE_SIDE_MATCH,
  REQUIRE_LEVEL_MATCH,
  ZONE_FACT_MIN_CAMERA_SESSIONS,
  NUDGE_MIN_NIGHTS,
};

export interface TapSize {
  readonly minWidthPx: number;
  readonly minHeightPx: number;
}

/** Back reuses TAP_TARGETS.bookBack, so it is not listed here. */
export type ParentTapTargetId = 'gate' | 'clear' | 'confirmClear' | 'keep';

export const PARENT_TAP_TARGETS: Readonly<Record<ParentTapTargetId, TapSize>> = {
  gate: { minWidthPx: 160, minHeightPx: 72 },
  clear: { minWidthPx: 160, minHeightPx: 56 },
  confirmClear: { minWidthPx: 96, minHeightPx: 48 },
  keep: { minWidthPx: 96, minHeightPx: 48 },
};
