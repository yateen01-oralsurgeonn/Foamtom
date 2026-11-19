import { describe, expect, it } from 'vitest';
import {
  H_MAX,
  KIND_FLOOR,
  RESCUE_THRESHOLD,
  SESSION_DURATION,
  UNTRACKED_DRAIN,
  ZONE_COUNT,
  ZONE_DURATION,
  ZONE_ORDER,
} from '../src/logic/constants';

describe('constants', () => {
  it('ZONE_COUNT × ZONE_DURATION == SESSION_DURATION', () => {
    expect(ZONE_COUNT * ZONE_DURATION).toBe(SESSION_DURATION);
  });

  it('KIND_FLOOR == 36', () => {
    expect(KIND_FLOOR).toBe(36);
  });

  it('RESCUE_THRESHOLD == 9', () => {
    expect(RESCUE_THRESHOLD).toBe(9);
  });

  it('UNTRACKED_DRAIN × ZONE_DURATION == H_MAX', () => {
    expect(UNTRACKED_DRAIN * ZONE_DURATION).toBe(H_MAX);
  });

  it('ZONE_ORDER is upper-right, upper-left, lower-left, lower-right', () => {
    expect([...ZONE_ORDER]).toEqual(['upper-right', 'upper-left', 'lower-left', 'lower-right']);
  });
});
