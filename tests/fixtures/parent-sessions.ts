// Shared test helpers for the parent screen (parent-screen design section 8).
import fc from 'fast-check';
import { SESSION_DURATION, ZONE_DURATION, ZONE_ORDER } from '../../src/logic/constants';
import type { SessionResult, ZoneResult } from '../../src/logic/types';
import type { StorageBackend } from '../../src/storage/storage';

const MONSTER_IDS = ['plaque-puff', 'sugar-sprite', 'gummy-gloop', 'fuzzlefang', 'crumb-goblin'];

const zoneResultArb = (zoneId: ZoneResult['zoneId']): fc.Arbitrary<ZoneResult> =>
  fc
    .record({
      brushed: fc.integer({ min: 0, max: ZONE_DURATION }),
      untrackedPick: fc.integer({ min: 0, max: ZONE_DURATION }),
      verified: fc.boolean(),
      monsterId: fc.constantFrom(...MONSTER_IDS),
      monsterOutcome: fc.constantFrom('defeated', 'fled', 'trapped'),
    })
    .map(({ brushed, untrackedPick, verified, monsterId, monsterOutcome }) => ({
      zoneId,
      monsterId,
      secondsBrushed: brushed,
      secondsUntracked: untrackedPick % (ZONE_DURATION - brushed + 1),
      verified,
      monsterOutcome,
    }));

/**
 * A valid stored session: any mode, time of day and verified flags, four zones in `ZONE_ORDER`,
 * brushed plus untracked at most 30 per zone, `durationSeconds` 120, and a `date` drawn from `dates`
 * (the caller passes the window, the days just outside it and a future day).
 */
export function sessionArb(dates: readonly string[]): fc.Arbitrary<SessionResult> {
  return fc
    .record({
      date: fc.constantFrom(...dates),
      timeOfDay: fc.constantFrom('morning', 'night', 'neither'),
      mode: fc.constantFrom('camera', 'timer-only'),
      zoneResults: fc.tuple(...ZONE_ORDER.map(zoneResultArb)),
      startedAt: fc.integer({ min: 1_700_000_000_000, max: 1_800_000_000_000 }),
    })
    .map(({ date, timeOfDay, mode, zoneResults, startedAt }) => ({
      date,
      timeOfDay,
      mode,
      zoneResults,
      monstersEarned: zoneResults.map((z) => z.monsterId),
      startedAt,
      durationSeconds: SESSION_DURATION,
    }));
}

type Plain = Record<string, unknown>;

function clone(session: SessionResult): Plain {
  return JSON.parse(JSON.stringify(session)) as Plain;
}

function zones(plain: Plain): Plain[] {
  return plain.zoneResults as Plain[];
}

const TOP_LEVEL_FIELDS = [
  'date',
  'timeOfDay',
  'mode',
  'zoneResults',
  'monstersEarned',
  'startedAt',
  'durationSeconds',
] as const;

const ZONE_FIELDS = ['zoneId', 'monsterId', 'secondsBrushed', 'secondsUntracked', 'verified', 'monsterOutcome'] as const;

/** One defect applied to a valid session. Each function gives a value the parent screen must skip. */
const DEFECTS: ReadonlyArray<(plain: Plain, i: number, n: number) => unknown> = [
  // a second count below 0
  (p, i) => ((zones(p)[i].secondsBrushed = -1 - (i % 3)), p),
  (p, i) => ((zones(p)[i].secondsUntracked = -1), p),
  // a second count above 30
  (p, i, n) => ((zones(p)[i].secondsBrushed = ZONE_DURATION + 1 + n), p),
  (p, i, n) => ((zones(p)[i].secondsUntracked = ZONE_DURATION + 1 + n), p),
  // a missing top-level field
  (p, _i, n) => (delete p[TOP_LEVEL_FIELDS[n % TOP_LEVEL_FIELDS.length]], p),
  // a missing zone field
  (p, i, n) => (delete zones(p)[i][ZONE_FIELDS[n % ZONE_FIELDS.length]], p),
  // a negative durationSeconds
  (p, _i, n) => ((p.durationSeconds = -1 - n), p),
  // zone seconds above durationSeconds
  (p, i, n) => {
    zones(p)[i].secondsBrushed = ZONE_DURATION;
    p.durationSeconds = n % ZONE_DURATION;
    return p;
  },
  // durationSeconds above the session length
  (p, _i, n) => ((p.durationSeconds = SESSION_DURATION + 1 + n), p),
  // a repeated zone
  (p, i) => {
    const list = zones(p);
    list[(i + 1) % list.length] = { ...list[i] };
    return p;
  },
  // a missing zone
  (p, i) => (zones(p).splice(i, 1), p),
  // an extra zone
  (p, i) => (zones(p).push({ ...zones(p)[i] }), p),
  // a bad date
  (p, _i, n) => ((p.date = ['', '2026-02-30', '2026-13-01', '2026-1-1', 'tomorrow', '22-11-2026'][n % 6]), p),
  (p) => ((p.date = 20261122), p),
  // a bad time of day or mode
  (p) => ((p.timeOfDay = 'noon'), p),
  (p) => ((p.mode = 'both'), p),
  // a non-whole number
  (p, i) => ((zones(p)[i].secondsBrushed = 0.5), p),
  (p, i) => ((zones(p)[i].secondsUntracked = 1.5), p),
  (p, _i, n) => ((p.durationSeconds = 10.5 + (n % 100)), p),
  // not a number where one is needed
  (p) => ((p.startedAt = 'now'), p),
  (p) => ((p.monstersEarned = 'plaque-puff'), p),
  (p, i) => ((zones(p)[i].verified = 'yes'), p),
  (p, i) => ((zones(p)[i].monsterOutcome = 'pending'), p),
  (p) => ((p.zoneResults = null), p),
];

const NOT_OBJECTS: readonly unknown[] = [null, undefined, 0, 7, -3, 'session', '', true, false, [], [1, 2, 3]];

const BASE_DATES = ['2026-11-20', '2026-11-21', '2026-11-22'];

/** Values the parent screen must skip: a valid session with one defect, or a value that is not an object. */
export const oddSessionArb: fc.Arbitrary<unknown> = fc.oneof(
  fc
    .record({
      session: sessionArb(BASE_DATES),
      defect: fc.integer({ min: 0, max: DEFECTS.length - 1 }),
      zone: fc.integer({ min: 0, max: ZONE_ORDER.length - 1 }),
      n: fc.nat({ max: 50 }),
    })
    .map(({ session, defect, zone, n }) => DEFECTS[defect](clone(session), zone, n)),
  fc.constantFrom(...NOT_OBJECTS),
);

/** Days around month ends, a leap day, a century that is not a leap year, and a year end. */
export const todayArb: fc.Arbitrary<string> = fc.constantFrom(
  '2026-11-22',
  '2026-11-30',
  '2026-12-01',
  '2026-12-31',
  '2027-01-01',
  '2026-02-28',
  '2026-03-01',
  '2028-02-29',
  '2028-03-01',
  '2024-02-29',
  '2100-03-01',
  '2000-02-29',
  '2026-07-04',
);

export interface FakeBackend {
  readonly backend: StorageBackend;
  readonly data: Map<string, string>;
  /** Switch a method to throw. */
  readonly fail: { getItem: boolean; setItem: boolean; removeItem: boolean };
}

/** A Map-backed `StorageBackend` with switches that make each method throw. */
export function fakeBackend(): FakeBackend {
  const data = new Map<string, string>();
  const fail = { getItem: false, setItem: false, removeItem: false };
  const backend: StorageBackend = {
    getItem(key) {
      if (fail.getItem) throw new Error('getItem blocked');
      return data.get(key) ?? null;
    },
    setItem(key, value) {
      if (fail.setItem) throw new Error('setItem blocked');
      data.set(key, value);
    },
    removeItem(key) {
      if (fail.removeItem) throw new Error('removeItem blocked');
      data.delete(key);
    },
  };
  return { backend, data, fail };
}
