// Which stored sessions count on the parent screen (parent-screen design 5.3, requirement 13.7).
// Pure: no DOM, no clock, no storage. A skipped session counts nowhere.
import type { SessionResult } from '../logic/types';
import type { ParentViewConstants } from './parent-constants';
import { parseDate } from './calendar-days';

const TIMES_OF_DAY: readonly unknown[] = ['morning', 'night', 'neither'];
const MODES: readonly unknown[] = ['camera', 'timer-only'];
const OUTCOMES: readonly unknown[] = ['defeated', 'fled', 'trapped'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** A whole number from 0 to `max`. */
function isWholeIn(value: unknown, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= max;
}

/**
 * True only when `value` is a stored session that passes all six rules of design section 5.3.
 * Never throws and never changes `value`.
 */
export function acceptSession(value: unknown, constants: ParentViewConstants): value is SessionResult {
  if (!isRecord(value)) return false;
  if (typeof value.date !== 'string' || parseDate(value.date) === null) return false;
  if (!TIMES_OF_DAY.includes(value.timeOfDay) || !MODES.includes(value.mode)) return false;
  if (typeof value.startedAt !== 'number' || !Number.isFinite(value.startedAt)) return false;
  if (!Array.isArray(value.monstersEarned) || !value.monstersEarned.every((id) => typeof id === 'string')) {
    return false;
  }
  if (!isWholeIn(value.durationSeconds, constants.SESSION_DURATION)) return false;
  const duration = value.durationSeconds;

  const results: unknown = value.zoneResults;
  if (!Array.isArray(results) || results.length !== constants.ZONE_ORDER.length) return false;
  const seen = new Set<string>();
  let counted = 0;
  for (const entry of results as unknown[]) {
    if (!isRecord(entry)) return false;
    const zoneId = entry.zoneId;
    if (typeof zoneId !== 'string' || !constants.ZONE_ORDER.includes(zoneId as never) || seen.has(zoneId)) {
      return false;
    }
    seen.add(zoneId);
    if (typeof entry.monsterId !== 'string') return false;
    if (typeof entry.verified !== 'boolean') return false;
    if (!OUTCOMES.includes(entry.monsterOutcome)) return false;
    if (!isWholeIn(entry.secondsBrushed, constants.ZONE_DURATION)) return false;
    if (!isWholeIn(entry.secondsUntracked, constants.ZONE_DURATION)) return false;
    counted += entry.secondsBrushed + entry.secondsUntracked;
  }
  return counted <= duration;
}

/** The accepted sessions of `values`, in their original order. */
export function acceptedSessions(values: readonly unknown[], constants: ParentViewConstants): SessionResult[] {
  const out: SessionResult[] = [];
  for (const value of values) {
    if (acceptSession(value, constants)) out.push(value);
  }
  return out;
}
