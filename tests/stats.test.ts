import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { ZONE_ORDER } from '../src/logic/constants';
import { computeVerifiedTime, zoneMostMissed } from '../src/logic/stats';
import type { SessionMode, SessionResult, ZoneId, ZoneResult } from '../src/logic/types';

// Helpers live in this file (no shared helper file).
const zoneResultArb = (zoneId: ZoneId): fc.Arbitrary<ZoneResult> =>
  fc
    .record({
      brushed: fc.integer({ min: 0, max: 30 }),
      untracked: fc.integer({ min: 0, max: 30 }),
      verified: fc.boolean(),
    })
    .map(({ brushed, untracked, verified }) => ({
      zoneId,
      monsterId: 'm',
      secondsBrushed: brushed,
      secondsUntracked: Math.min(untracked, 30 - brushed),
      verified,
      monsterOutcome: 'trapped' as const,
    }));

const sessionArb: fc.Arbitrary<SessionResult> = fc
  .record({
    mode: fc.constantFrom<SessionMode>('camera', 'timer-only'),
    startedAt: fc.integer({ min: 0, max: 1_000_000 }),
    zr: fc.tuple(...ZONE_ORDER.map(zoneResultArb)),
  })
  .map(({ mode, startedAt, zr }) => ({
    date: '2026-11-19',
    timeOfDay: 'morning' as const,
    mode,
    zoneResults: zr,
    monstersEarned: [],
    startedAt,
    durationSeconds: 120,
  }));

const sessionsArb = fc.array(sessionArb, { maxLength: 20 });

const session = (
  mode: SessionMode,
  perZone: Partial<Record<ZoneId, { b: number; u?: number; verified: boolean }>>,
): SessionResult => ({
  date: '2026-11-19',
  timeOfDay: 'morning',
  mode,
  zoneResults: ZONE_ORDER.map((zoneId) => {
    const z = perZone[zoneId] ?? { b: 30, u: 0, verified: true };
    return {
      zoneId,
      monsterId: 'm',
      secondsBrushed: z.b,
      secondsUntracked: z.u ?? 0,
      verified: z.verified,
      monsterOutcome: 'trapped' as const,
    };
  }),
  monstersEarned: [],
  startedAt: 0,
  durationSeconds: 120,
});

describe('statsCeiling', () => {
  it('verified time is at most 30 per zone and 120 per session; timer-only and unverified add 0', () => {
    fc.assert(
      fc.property(sessionsArb, (sessions) => {
        const total = computeVerifiedTime(sessions);

        let zoneCap = 0;
        let sessionCap = 0;
        for (const s of sessions) {
          if (s.mode !== 'camera') continue;
          const verifiedZones = s.zoneResults.filter((z) => z.verified).length;
          zoneCap += verifiedZones * 30;
          sessionCap += 120;
        }
        expect(total).toBeGreaterThanOrEqual(0);
        expect(total).toBeLessThanOrEqual(zoneCap);
        expect(total).toBeLessThanOrEqual(sessionCap);

        // Each session on its own is at most 120, and timer-only adds nothing.
        for (const s of sessions) {
          const t = computeVerifiedTime([s]);
          expect(t).toBeLessThanOrEqual(120);
          if (s.mode === 'timer-only') expect(t).toBe(0);
        }

        // Unverified zones add 0.
        const onlyUnverified = sessions.map((s) => ({
          ...s,
          zoneResults: s.zoneResults.map((z) => ({ ...z, verified: false })),
        }));
        expect(computeVerifiedTime(onlyUnverified)).toBe(0);
      }),
    );
  });

  it('counts secondsBrushed only, not untracked seconds', () => {
    const s = session('camera', {
      'upper-right': { b: 10, u: 20, verified: false },
      'upper-left': { b: 20, u: 10, verified: true },
      'lower-left': { b: 30, u: 0, verified: true },
      'lower-right': { b: 5, u: 10, verified: true },
    });
    expect(computeVerifiedTime([s])).toBe(55);
  });
});

describe('zoneMostMissed', () => {
  it('uses verified zones only', () => {
    // upper-right is hugely missed but unverified; lower-left is the only verified miss.
    const s = session('camera', {
      'upper-right': { b: 0, u: 0, verified: false },
      'lower-left': { b: 20, u: 0, verified: true },
    });
    expect(zoneMostMissed([s])).toBe('lower-left');
  });

  it('ignores timer-only sessions', () => {
    const s = session('timer-only', { 'lower-right': { b: 0, u: 0, verified: true } });
    expect(zoneMostMissed([s])).toBeNull();
  });

  it('returns null when there is no verified camera data', () => {
    expect(zoneMostMissed([])).toBeNull();
    const s = session('camera', {
      'upper-right': { b: 0, verified: false },
      'upper-left': { b: 0, verified: false },
      'lower-left': { b: 0, verified: false },
      'lower-right': { b: 0, verified: false },
    });
    expect(zoneMostMissed([s])).toBeNull();
  });

  it('a tie goes to the first zone in ZONE_ORDER', () => {
    const s = session('camera', {
      'upper-left': { b: 20, verified: true },
      'lower-left': { b: 20, verified: true },
      'lower-right': { b: 20, verified: true },
    });
    // upper-right is fully brushed (miss 0), the other three tie at 10.
    expect(zoneMostMissed([s])).toBe('upper-left');
  });

  it('averages over verified zones and uses all stored sessions (no 7-session window)', () => {
    const old = session('camera', { 'upper-right': { b: 0, verified: true } });
    const rest = Array.from({ length: 9 }, (_, i) => ({
      ...session('camera', {}),
      startedAt: i + 1,
    }));
    // Average miss for upper-right = 30/10 = 3, all others 0.
    expect(zoneMostMissed([old, ...rest])).toBe('upper-right');
  });

  it('returns a zone with the maximum average miss', () => {
    fc.assert(
      fc.property(sessionsArb, (sessions) => {
        const result = zoneMostMissed(sessions);
        const avg = (id: ZoneId): number | null => {
          let sum = 0;
          let n = 0;
          for (const s of sessions) {
            if (s.mode !== 'camera') continue;
            for (const z of s.zoneResults) {
              if (z.zoneId !== id || !z.verified) continue;
              sum += Math.max(0, 30 - z.secondsBrushed - z.secondsUntracked);
              n += 1;
            }
          }
          return n === 0 ? null : sum / n;
        };
        const avgs = ZONE_ORDER.map((id) => ({ id, a: avg(id) })).filter((x) => x.a !== null) as {
          id: ZoneId;
          a: number;
        }[];
        if (avgs.length === 0) {
          expect(result).toBeNull();
          return;
        }
        const max = Math.max(...avgs.map((x) => x.a));
        const expected = avgs.find((x) => Math.abs(x.a - max) < 1e-9)!.id;
        expect(result).toBe(expected);
      }),
    );
  });
});
