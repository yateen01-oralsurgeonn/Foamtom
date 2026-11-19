import type { TimeOfDay } from './types';

/**
 * Classify the session start hour (0–23, local time).
 * morning = 04:00–11:59, night = 17:00–23:59, neither = 00:00–03:59 or 12:00–16:59.
 */
export function classifyTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 4 && hour <= 11) return 'morning';
  if (hour >= 17 && hour <= 23) return 'night';
  return 'neither';
}
