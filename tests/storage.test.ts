import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import { createStorage, STORAGE_KEY } from '../src/storage/storage';
import type { StorageBackend } from '../src/storage/storage';
import type { SessionResult } from '../src/logic/types';

// Design test 13 (storageRoundTrip). Requirements 9.4-9.7, 14.7.

function mapBackend(): StorageBackend & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
  };
}

const throwingBackend: StorageBackend = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('full');
  },
  removeItem: () => {
    throw new Error('blocked');
  },
};

const zoneIdArb = fc.constantFrom('upper-right', 'upper-left', 'lower-left', 'lower-right' as const);

const zoneResultArb = fc.record({
  zoneId: zoneIdArb,
  monsterId: fc.string({ minLength: 1, maxLength: 12 }),
  secondsBrushed: fc.integer({ min: 0, max: 30 }),
  secondsUntracked: fc.integer({ min: 0, max: 30 }),
  verified: fc.boolean(),
  monsterOutcome: fc.constantFrom('defeated', 'fled', 'trapped' as const),
});

const sessionArb: fc.Arbitrary<SessionResult> = fc.record({
  date: fc.constantFrom('2026-11-17', '2026-11-18', '2026-11-19'),
  timeOfDay: fc.constantFrom('morning', 'night', 'neither' as const),
  mode: fc.constantFrom('camera', 'timer-only' as const),
  zoneResults: fc.array(zoneResultArb, { minLength: 4, maxLength: 4 }),
  monstersEarned: fc.array(fc.string({ minLength: 1, maxLength: 12 }), { maxLength: 4 }),
  startedAt: fc.integer({ min: 0, max: 4_000_000_000_000 }),
  durationSeconds: fc.constant(120),
});

const SESSION_KEYS = ['date', 'durationSeconds', 'mode', 'monstersEarned', 'startedAt', 'timeOfDay', 'zoneResults'];
const ZONE_KEYS = ['monsterId', 'monsterOutcome', 'secondsBrushed', 'secondsUntracked', 'verified', 'zoneId'];

describe('storageRoundTrip', () => {
  it('load after save returns the same sessions in order', () => {
    fc.assert(
      fc.property(fc.array(sessionArb, { maxLength: 8 }), (sessions) => {
        const storage = createStorage(mapBackend());
        for (const s of sessions) storage.saveSession(s);
        expect(storage.loadSessions()).toEqual(sessions);
      }),
    );
  });

  it('stores only the allowed keys under the key foamtom:v1', () => {
    fc.assert(
      fc.property(fc.array(sessionArb, { minLength: 1, maxLength: 5 }), (sessions) => {
        const backend = mapBackend();
        const storage = createStorage(backend);
        for (const s of sessions) storage.saveSession(s);
        expect([...backend.map.keys()]).toEqual(['foamtom:v1']);
        const data = JSON.parse(backend.map.get(STORAGE_KEY) as string);
        expect(Object.keys(data).sort()).toEqual(['sessions', 'version']);
        expect(data.version).toBe(1);
        for (const s of data.sessions) {
          expect(Object.keys(s).sort()).toEqual(SESSION_KEYS);
          for (const z of s.zoneResults) expect(Object.keys(z).sort()).toEqual(ZONE_KEYS);
        }
      }),
    );
  });

  it('a throwing backend never throws out of save, load or clear', () => {
    fc.assert(
      fc.property(sessionArb, (s) => {
        const storage = createStorage(throwingBackend);
        expect(() => storage.saveSession(s)).not.toThrow();
        expect(storage.loadSessions()).toEqual([]);
        expect(() => storage.clearAll()).not.toThrow();
      }),
    );
  });

  it('missing, unreadable or other-version data loads as no sessions', () => {
    const cases = [
      null,
      '',
      'not json',
      '[]',
      'null',
      '{"version":2,"sessions":[]}',
      '{"sessions":[]}',
      '{"version":1}',
      '{"version":1,"sessions":"x"}',
      '{"version":1,"sessions":[1]}',
    ];
    for (const raw of cases) {
      const backend = mapBackend();
      if (raw !== null) backend.map.set(STORAGE_KEY, raw);
      expect(createStorage(backend).loadSessions()).toEqual([]);
    }
  });

  it('clearAll removes the key and the sessions', () => {
    fc.assert(
      fc.property(fc.array(sessionArb, { minLength: 1, maxLength: 4 }), (sessions) => {
        const backend = mapBackend();
        const storage = createStorage(backend);
        for (const s of sessions) storage.saveSession(s);
        storage.clearAll();
        expect(backend.map.has(STORAGE_KEY)).toBe(false);
        expect(storage.loadSessions()).toEqual([]);
      }),
    );
  });
});
