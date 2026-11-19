import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { H_MAX, KIND_FLOOR, MISS_WINDOW, ZONE_ORDER } from '../src/logic/constants';
import { computeMissScores, startingHealth } from '../src/logic/miss-score';
import type { MissScores, SessionMode, SessionResult, Zone, ZoneResult } from '../src/logic/types';

// Helpers live in this file (no shared helper file).
const zones: readonly Zone[] = ZONE_ORDER.map((id, index) => {
  const [level, side] = id.split('-') as ['upper' | 'lower', 'left' | 'right'];
  return { id, side, level, index, label: `${level} ${side}` };
});

const zoneResultArb = (zoneId: (typeof ZONE_ORDER)[number]): fc.Arbitrary<ZoneResult> =>
  fc
    .record({
      brushed: fc.integer({ min: 0, max: 30 }),
      untracked: fc.integer({ min: 0, max: 30 }),
      verified: fc.boolean(),
    })
    .map(({ brushed, untracked, verified }) => {
      const b = brushed;
      const u = Math.min(untracked, 30 - b);
      return {
        zoneId,
        monsterId: 'm',
        secondsBrushed: b,
        secondsUntracked: u,
        verified,
        monsterOutcome: 'trapped' as const,
      };
    });

const sessionArb = (mode?: SessionMode): fc.Arbitrary<SessionResult> =>
  fc
    .record({
      mode: mode ? fc.constant(mode) : fc.constantFrom<SessionMode>('camera', 'timer-only'),
      startedAt: fc.integer({ min: 0, max: 1_000_000 }),
      zr: fc.tuple(...ZONE_ORDER.map(zoneResultArb)),
    })
    .map(({ mode: m, startedAt, zr }) => ({
      date: '2026-11-19',
      timeOfDay: 'morning' as const,
      mode: m,
      zoneResults: zr,
      monstersEarned: [],
      startedAt,
      durationSeconds: 120,
    }));

// Sessions with distinct startedAt so "7 most recent" is unambiguous.
const sessionsArb = (mode?: SessionMode) =>
  fc
    .array(sessionArb(mode), { maxLength: 14 })
    .map((list) => list.map((s, i) => ({ ...s, startedAt: s.startedAt * 20 + i })));

const cameraSession = (
  startedAt: number,
  perZone: { b: number; u: number; verified: boolean },
): SessionResult => ({
  date: '2026-11-19',
  timeOfDay: 'morning',
  mode: 'camera',
  zoneResults: ZONE_ORDER.map((zoneId) => ({
    zoneId,
    monsterId: 'm',
    secondsBrushed: perZone.b,
    secondsUntracked: perZone.u,
    verified: perZone.verified,
    monsterOutcome: 'trapped' as const,
  })),
  monstersEarned: [],
  startedAt,
  durationSeconds: 120,
});

function recentVerifiedCamera(sessions: readonly SessionResult[]): SessionResult[] {
  return sessions
    .filter((s) => s.mode === 'camera')
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, MISS_WINDOW);
}

describe('missScoreSources', () => {
  it('matches the formula over verified zones of the 7 most recent camera sessions; every score is in [0, 1]', () => {
    fc.assert(
      fc.property(sessionsArb(), (sessions) => {
        const scores = computeMissScores(sessions);
        const recent = recentVerifiedCamera(sessions);
        for (const id of ZONE_ORDER) {
          let miss = 0;
          let n = 0;
          for (const s of recent) {
            for (const zr of s.zoneResults) {
              if (zr.zoneId === id && zr.verified) {
                miss += Math.max(0, 30 - zr.secondsBrushed - zr.secondsUntracked);
                n += 1;
              }
            }
          }
          const expected = n > 0 ? miss / (30 * n) : 0;
          expect(scores[id]).toBeCloseTo(expected, 10);
          expect(scores[id]).toBeGreaterThanOrEqual(0);
          expect(scores[id]).toBeLessThanOrEqual(1);
        }
      }),
    );
  });

  it('adding timer-only sessions changes nothing', () => {
    fc.assert(
      fc.property(sessionsArb('camera'), sessionsArb('timer-only'), (camera, timer) => {
        expect(computeMissScores([...camera, ...timer])).toEqual(computeMissScores(camera));
      }),
    );
  });

  it('adding unverified zones changes nothing', () => {
    fc.assert(
      fc.property(sessionsArb('camera'), fc.integer({ min: 0, max: 30 }), (camera, b) => {
        const extra = cameraSession(2_000_000_000, { b, u: 0, verified: false });
        // Place the extra session among the recent ones: it must still contribute nothing.
        const base = camera.filter((s) => s.startedAt < 2_000_000_000);
        const withExtra = computeMissScores([...base, extra]);
        // The extra session takes a window slot, so compare with the same window minus the oldest.
        const expectedBase = computeMissScores(
          [...base].sort((a, b2) => b2.startedAt - a.startedAt).slice(0, MISS_WINDOW - 1),
        );
        expect(withExtra).toEqual(expectedBase);
      }),
    );
  });

  it('sessions older than the 7 most recent camera sessions change nothing', () => {
    fc.assert(
      fc.property(sessionsArb('camera'), sessionsArb('camera'), (recentList, olderList) => {
        const recent = recentList.map((s) => ({ ...s, startedAt: s.startedAt + 100_000_000 }));
        const older = olderList.map((s) => ({ ...s, startedAt: s.startedAt }));
        const top = recentVerifiedCamera(recent);
        // Only meaningful when the recent list fills the window.
        fc.pre(recent.length >= MISS_WINDOW);
        expect(computeMissScores([...recent, ...older])).toEqual(computeMissScores(top));
      }),
    );
  });

  it('a zone never seen verified scores 0; a never-brushed zone scores 1; a fully brushed zone scores 0', () => {
    expect(computeMissScores([])).toEqual({
      'upper-right': 0,
      'upper-left': 0,
      'lower-left': 0,
      'lower-right': 0,
    });
    expect(computeMissScores([cameraSession(1, { b: 0, u: 0, verified: true })])['upper-left']).toBe(1);
    expect(computeMissScores([cameraSession(1, { b: 30, u: 0, verified: true })])['upper-left']).toBe(0);
    expect(computeMissScores([cameraSession(1, { b: 0, u: 0, verified: false })])['upper-left']).toBe(0);
  });
});

describe('startingHealthBounds', () => {
  it('is a whole number from 36 to 60 for any past sessions', () => {
    fc.assert(
      fc.property(sessionsArb(), (sessions) => {
        const scores = computeMissScores(sessions);
        for (const zone of zones) {
          const h = startingHealth(zone, scores);
          expect(Number.isInteger(h)).toBe(true);
          expect(h).toBeGreaterThanOrEqual(KIND_FLOOR);
          expect(h).toBeLessThanOrEqual(H_MAX);
        }
      }),
    );
  });

  it('follows the design table: 0 -> 60, 0.25 -> 54, 0.5 -> 48, 1 -> 36', () => {
    const at = (score: number): number => {
      const scores: MissScores = {
        'upper-right': score,
        'upper-left': score,
        'lower-left': score,
        'lower-right': score,
      };
      return startingHealth(zones[0], scores);
    };
    expect(at(0)).toBe(60);
    expect(at(0.25)).toBe(54);
    expect(at(0.5)).toBe(48);
    expect(at(1)).toBe(36);
  });
});
