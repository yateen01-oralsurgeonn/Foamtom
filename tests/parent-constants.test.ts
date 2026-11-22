import { describe, expect, it } from 'vitest';
import {
  GATE_HOLD_SECONDS,
  NUDGE_MIN_NIGHTS,
  PARENT_TAP_TARGETS,
  PARENT_VIEW_CONSTANTS,
  WINDOW_DAYS,
  ZONE_FACT_MIN_CAMERA_SESSIONS,
} from '../src/ui/parent-constants';
import {
  REQUIRE_LEVEL_MATCH,
  REQUIRE_SIDE_MATCH,
  SESSION_DURATION,
  ZONE_DURATION,
  ZONE_ORDER,
} from '../src/logic/constants';

// parent-screen task 2.4: the constants.

describe('parentConstants', () => {
  it('the named values are 3, 3, 2 and 7', () => {
    expect(GATE_HOLD_SECONDS).toBe(3);
    expect(ZONE_FACT_MIN_CAMERA_SESSIONS).toBe(3);
    expect(NUDGE_MIN_NIGHTS).toBe(2);
    expect(WINDOW_DAYS).toBe(7);
  });

  it('every tap target is at least 48 x 48, and the sizes are the designed ones', () => {
    for (const [id, size] of Object.entries(PARENT_TAP_TARGETS)) {
      expect(size.minWidthPx, id).toBeGreaterThanOrEqual(48);
      expect(size.minHeightPx, id).toBeGreaterThanOrEqual(48);
    }
    expect(PARENT_TAP_TARGETS.gate).toEqual({ minWidthPx: 160, minHeightPx: 72 });
    expect(PARENT_TAP_TARGETS.clear).toEqual({ minWidthPx: 160, minHeightPx: 56 });
    expect(PARENT_TAP_TARGETS.confirmClear).toEqual({ minWidthPx: 96, minHeightPx: 48 });
    expect(PARENT_TAP_TARGETS.keep).toEqual({ minWidthPx: 96, minHeightPx: 48 });
  });

  it('PARENT_VIEW_CONSTANTS core values equal those in src/logic/constants.ts', () => {
    expect(PARENT_VIEW_CONSTANTS.ZONE_DURATION).toBe(ZONE_DURATION);
    expect(PARENT_VIEW_CONSTANTS.SESSION_DURATION).toBe(SESSION_DURATION);
    expect(PARENT_VIEW_CONSTANTS.ZONE_ORDER).toEqual(ZONE_ORDER);
    expect(PARENT_VIEW_CONSTANTS.REQUIRE_SIDE_MATCH).toBe(REQUIRE_SIDE_MATCH);
    expect(PARENT_VIEW_CONSTANTS.REQUIRE_LEVEL_MATCH).toBe(REQUIRE_LEVEL_MATCH);
    expect(PARENT_VIEW_CONSTANTS.ZONE_FACT_MIN_CAMERA_SESSIONS).toBe(ZONE_FACT_MIN_CAMERA_SESSIONS);
    expect(PARENT_VIEW_CONSTANTS.NUDGE_MIN_NIGHTS).toBe(NUDGE_MIN_NIGHTS);
  });
});
