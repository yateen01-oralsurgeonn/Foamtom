import { describe, expect, it } from 'vitest';
import * as thresholds from '../src/tracking/thresholds';

describe('thresholdsExported', () => {
  it('exports every constant of design 5.5 with the right type', () => {
    const numbers = [
      'NEAR_MOUTH_FACE_WIDTHS',
      'SIDE_DEAD_ZONE',
      'LEVEL_DEAD_ZONE',
      'MIN_FRAMES_PER_SECOND',
      'MIN_FACE_FRACTION',
      'MOVING_MIN_TRAVEL',
      'MOVE_JITTER_STEP',
      'WINDOW_MS',
      'TRACK_MIN_INTERVAL_MS',
    ] as const;
    const record = thresholds as Record<string, unknown>;
    for (const name of numbers) {
      expect(typeof record[name], name).toBe('number');
    }
    expect(['palm', 'wrist', 'fingertips']).toContain(thresholds.HAND_POINT);
    expect(['detector', 'mesh']).toContain(thresholds.FACE_MODEL);
  });

  it('exports the three MediaPipe hand landmark index constants', () => {
    const record = thresholds as Record<string, unknown>;
    expect(typeof record.WRIST_LANDMARK).toBe('number');
    for (const name of ['PALM_LANDMARKS', 'FINGERTIP_LANDMARKS']) {
      const value = record[name];
      expect(Array.isArray(value), name).toBe(true);
      expect((value as unknown[]).every((n) => typeof n === 'number'), name).toBe(true);
    }
  });

  it('MOVING_MIN_TRAVEL is 0.2 face widths per second (Dr. Yatin, 21 Nov 2026)', () => {
    expect(thresholds.MOVING_MIN_TRAVEL).toBe(0.2);
  });

  it('pins only the two values that requirements 4.2 and 4.3 name', () => {
    expect(thresholds.MIN_FRAMES_PER_SECOND).toBe(5);
    expect(thresholds.MIN_FACE_FRACTION).toBe(0.5);
  });
});
