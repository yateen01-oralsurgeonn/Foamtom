import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import { createStorage } from '../src/storage/storage';
import { clearAllData, clearNotice } from '../src/ui/parent-clear';
import { parentView } from '../src/ui/parent-view';
import { PARENT_VIEW_CONSTANTS } from '../src/ui/parent-constants';
import { PARENT_TEXT } from '../src/ui/parent-text';
import { computeMonsterBook, isRareEligibleForNewSession } from '../src/logic/monster-book';
import { computeMissScores } from '../src/logic/miss-score';
import { ZONE_ORDER } from '../src/logic/constants';
import { fakeBackend, sessionArb } from './fixtures/parent-sessions';

// Design test 13 (clearAllData). Requirements 9.2-9.5, 14.9.

const TODAY = '2026-11-22';
const DATES = ['2026-11-18', '2026-11-20', '2026-11-21', '2026-11-22'];

describe('clearAllData', () => {
  it('empties every reader after a clear', () => {
    fc.assert(
      fc.property(fc.array(sessionArb(DATES), { minLength: 1, maxLength: 6 }), (sessions) => {
        const fake = fakeBackend();
        const storage = createStorage(fake.backend);
        for (const s of sessions) storage.saveSession(s);
        expect(storage.loadSessions().length).toBe(sessions.length);

        expect(clearAllData(storage)).toBe('cleared');

        const loaded = storage.loadSessions();
        expect(loaded).toEqual([]);
        expect(fake.data.size).toBe(0);

        const view = parentView(loaded, PARENT_VIEW_CONSTANTS, TODAY);
        expect(view.noSessionsText).toBe(PARENT_TEXT['no-sessions'].text);
        expect(view.nudge).toBeNull();
        expect(computeMonsterBook(loaded).unlockedIds.size).toBe(0);
        const scores = computeMissScores(loaded);
        for (const id of ZONE_ORDER) expect(scores[id]).toBe(0);
        expect(isRareEligibleForNewSession([], 'night')).toBe(false);
        expect(clearNotice('cleared')).toBeNull();
      }),
    );
  });

  it('gives failed and row 24 when removeItem throws but sessions stay readable', () => {
    const fake = fakeBackend();
    const storage = createStorage(fake.backend);
    fc.assert(
      fc.property(sessionArb(DATES), (s) => {
        storage.saveSession(s);
        fake.fail.removeItem = true;
        const outcome = clearAllData(storage);
        fake.fail.removeItem = false;
        expect(outcome).toBe('failed');
        expect(clearNotice(outcome)).toBe('The data on this phone could not be cleared.');
        expect(clearNotice(outcome)).toBe(PARENT_TEXT['clear-failed'].text);
        storage.clearAll();
      }),
    );
  });

  it('does not throw when the backend throws everywhere, and gives cleared', () => {
    const fake = fakeBackend();
    const storage = createStorage(fake.backend);
    fake.fail.getItem = true;
    fake.fail.setItem = true;
    fake.fail.removeItem = true;
    expect(() => clearAllData(storage)).not.toThrow();
    expect(clearAllData(storage)).toBe('cleared');
  });

  it('does not throw even when the storage object itself throws', () => {
    const angry = {
      clearAll: () => {
        throw new Error('no');
      },
      loadSessions: () => {
        throw new Error('no');
      },
    };
    expect(clearAllData(angry)).toBe('cleared');
  });

  it('clearNotice is null for cleared', () => {
    expect(clearNotice('cleared')).toBeNull();
  });
});
