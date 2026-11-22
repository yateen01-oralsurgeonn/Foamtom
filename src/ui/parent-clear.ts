// "Clear all data" logic for the parent screen (parent-screen design section 5.7).
// Pure: no DOM, no clock. The painter calls this only after the confirmation.
import type { Storage } from '../storage/storage';
import { PARENT_TEXT } from './parent-text';

export type ClearOutcome = 'cleared' | 'failed';

/** Clears everything, then reads again. `'failed'` only if sessions can still be read. Never throws. */
export function clearAllData(storage: Pick<Storage, 'clearAll' | 'loadSessions'>): ClearOutcome {
  try {
    storage.clearAll();
  } catch {
    // clearAll does not throw; this is a second net.
  }
  let remaining = 0;
  try {
    remaining = storage.loadSessions().length;
  } catch {
    remaining = 0;
  }
  return remaining > 0 ? 'failed' : 'cleared';
}

/** Row 24 for `'failed'`, otherwise `null`. */
export function clearNotice(outcome: ClearOutcome): string | null {
  return outcome === 'failed' ? PARENT_TEXT['clear-failed'].text : null;
}
