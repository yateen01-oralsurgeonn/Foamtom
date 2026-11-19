import { describe, expect, it } from 'vitest';
import { classifyTimeOfDay } from '../src/logic/time-of-day';

describe('timeOfDayAllHours', () => {
  it('classifies all 24 hours per the stated ranges', () => {
    for (let hour = 0; hour <= 23; hour++) {
      const expected =
        hour >= 4 && hour <= 11 ? 'morning' : hour >= 17 && hour <= 23 ? 'night' : 'neither';
      expect(classifyTimeOfDay(hour), `hour ${hour}`).toBe(expected);
    }
  });

  it('pins the boundary hours', () => {
    expect(classifyTimeOfDay(3)).toBe('neither');
    expect(classifyTimeOfDay(4)).toBe('morning');
    expect(classifyTimeOfDay(11)).toBe('morning');
    expect(classifyTimeOfDay(12)).toBe('neither');
    expect(classifyTimeOfDay(16)).toBe('neither');
    expect(classifyTimeOfDay(17)).toBe('night');
    expect(classifyTimeOfDay(23)).toBe('night');
    expect(classifyTimeOfDay(0)).toBe('neither');
  });
});
