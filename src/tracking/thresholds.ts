// Every number used by tracking classification (design 5.5, req 3.7).
// Starting values, tuned later on the debug page. None is a dental rule.
import type { HandPointKind } from './types';

/** Distance from the mouth centre within which a hand point counts as at the mouth. Unit: face widths. */
export const NEAR_MOUTH_FACE_WIDTHS = 0.7;

/** Sideways distance from the mouth centre line inside which side is unknown. Unit: face widths. */
export const SIDE_DEAD_ZONE = 0.1;

/** Distance above or below mouth height inside which level is unknown. Unit: face widths. */
export const LEVEL_DEAD_ZONE = 0.1;

/** Fewer frames than this in one second gives a null signal. Unit: frames. */
export const MIN_FRAMES_PER_SECOND = 5;

/** A face seen in fewer than this fraction of the frames gives a null signal. Unit: fraction of frames. */
export const MIN_FACE_FRACTION = 0.5;

/** Hand path length above this in one second counts as moving. Unit: face widths per second. */
export const MOVING_MIN_TRAVEL = 0.3;

/** A step between two frames smaller than this is camera noise and adds no travel. Unit: face widths. */
export const MOVE_JITTER_STEP = 0.01;

/** Length of the window that the signal looks at. Unit: milliseconds. */
export const WINDOW_MS = 1000;

/** Least time between two frames sent to the tracker. Unit: milliseconds. */
export const TRACK_MIN_INTERVAL_MS = 100;

/** Which point of the hand is used. Unit: kind of hand point. */
export const HAND_POINT: HandPointKind = 'palm';

/** Which face model feeds the classifier. Unit: kind of face model. */
export const FACE_MODEL: 'detector' | 'mesh' = 'detector';
