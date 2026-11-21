import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DAMAGE_PER_SECOND,
  H_MAX,
  KIND_FLOOR,
  RESCUE_THRESHOLD,
  SESSION_DURATION,
  TIMER_ONLY_DAMAGE,
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

  it('DAMAGE_PER_SECOND is 4 and defeats a camera-mode monster in 15 counted seconds', () => {
    expect(DAMAGE_PER_SECOND).toBe(4);
    expect(H_MAX / DAMAGE_PER_SECOND).toBe(15);
  });

  it('TIMER_ONLY_DAMAGE is its own value, 3, and defeats a monster in 20 s', () => {
    expect(TIMER_ONLY_DAMAGE).toBe(3);
    expect(H_MAX / TIMER_ONLY_DAMAGE).toBe(20);
    // Not derived from DAMAGE_PER_SECOND: the source gives it a literal.
    const source = readFileSync(join(__dirname, '../src/logic/constants.ts'), 'utf8');
    expect(source).toMatch(/export const TIMER_ONLY_DAMAGE = 3;/);
  });

  it('ZONE_ORDER is upper-right, upper-left, lower-left, lower-right', () => {
    expect([...ZONE_ORDER]).toEqual(['upper-right', 'upper-left', 'lower-left', 'lower-right']);
  });
});
