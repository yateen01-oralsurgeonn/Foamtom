// Every number used by tracking classification (design 5.5, req 3.7).
// Starting values, tuned on the debug page. None is a dental rule.
import type { HandPointKind } from './types';

/**
 * Distance from the mouth centre within which a hand point counts as at the mouth. Unit: face widths.
 * Tuned 21 Nov 2026 on the debug page (was 0.7): the palm sat 0.93-0.95 away for front teeth.
 */
export const NEAR_MOUTH_FACE_WIDTHS = 1.1;

/** Sideways distance from the mouth centre line inside which side is unknown. Unit: face widths. */
export const SIDE_DEAD_ZONE = 0.1;

/** Distance above or below mouth height inside which level is unknown. Unit: face widths. */
export const LEVEL_DEAD_ZONE = 0.1;

/** Fewer frames than this in one second gives a null signal. Unit: frames. */
export const MIN_FRAMES_PER_SECOND = 5;

/** A face seen in fewer than this fraction of the frames gives a null signal. Unit: fraction of frames. */
export const MIN_FACE_FRACTION = 0.5;

/**
 * Hand path length above this in one second counts as moving. Unit: face widths per second.
 * Dr. Yatin's decision of 21 Nov 2026 (evening; a clinical decision): 0.2, was 0.3, so gentle
 * short strokes count as brushing (hand-tracking Decision 4).
 */
export const MOVING_MIN_TRAVEL = 0.2;

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

/**
 * Hand landmarks averaged for the 'palm' hand point. Unit: hand landmark indices.
 * Follows the MediaPipe hand landmark order. Fixed by the library, not tuned.
 */
export const PALM_LANDMARKS: readonly number[] = [0, 5, 9, 13, 17];

/**
 * Hand landmark used for the 'wrist' hand point. Unit: hand landmark index.
 * Follows the MediaPipe hand landmark order. Fixed by the library, not tuned.
 */
export const WRIST_LANDMARK = 0;

/**
 * Hand landmarks averaged for the 'fingertips' hand point. Unit: hand landmark indices.
 * Follows the MediaPipe hand landmark order. Fixed by the library, not tuned.
 */
export const FINGERTIP_LANDMARKS: readonly number[] = [4, 8, 12, 16, 20];


/**
 * How far past the index knuckle the 'brush-head' hand point is estimated, along the line from
 * the little-finger knuckle to the index knuckle. Unit: the hand's knuckle width (the distance
 * from landmark 17 to landmark 5). A starting value for the debug page experiment of 26 Nov 2026,
 * not a dental rule. The game does not use it: HAND_POINT stays 'palm'.
 */
export const BRUSH_HEAD_REACH = 1.0;

/**
 * Hand landmark the 'brush-head' estimate starts from (the index knuckle). Unit: hand landmark index.
 * Follows the MediaPipe hand landmark order. Fixed by the library, not tuned.
 */
export const BRUSH_HEAD_START_LANDMARK = 5;

/**
 * Hand landmark that gives the 'brush-head' direction with the start landmark (the little-finger
 * knuckle). Unit: hand landmark index. Follows the MediaPipe hand landmark order. Fixed by the library.
 */
export const BRUSH_HEAD_BACK_LANDMARK = 17;
