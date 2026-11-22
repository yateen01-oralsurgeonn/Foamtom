import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { ZONE_DURATION, ZONE_ORDER } from '../src/logic/constants';
import type { SessionResult, ZoneId } from '../src/logic/types';
import { PARENT_VIEW_CONSTANTS } from '../src/ui/parent-constants';
import { nightsPerZone, nudge } from '../src/ui/parent-nudge';
import { sessionArb } from './fixtures/parent-sessions';

// Parent-screen task 5 (parentViewNudge): requirements 5.7, 7.1 to 7.8, 13.4, 14.3.

const C = PARENT_VIEW_CONSTANTS;
const MIN = C.NUDGE_MIN_NIGHTS;
const DATES = ['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22'];

/** Sessions where many zone results saw no brushing, so that nights actually occur. */
const sessionsArb: fc.Arbitrary<SessionResult[]> = fc
  .array(
    fc.tuple(sessionArb(DATES), fc.array(fc.boolean(), { minLength: 4, maxLength: 4 }), fc.boolean()),
    { maxLength: 24 },
  )
  .map((list) =>
    list.map(([s, zero, forceNight]) => ({
      ...s,
      timeOfDay: forceNight ? ('night' as const) : s.timeOfDay,
      mode: forceNight && s.mode === 'timer-only' && zero[0] ? ('camera' as const) : s.mode,
      zoneResults: s.zoneResults.map((zr, i) =>
        zero[i] ? { ...zr, secondsBrushed: 0, secondsUntracked: zr.secondsUntracked } : zr,
      ),
    })),
  );

function session(
  date: string,
  over: Partial<SessionResult> = {},
  zone: Partial<Record<ZoneId, { brushed?: number; untracked?: number; verified?: boolean }>> = {},
): SessionResult {
  return {
    date,
    timeOfDay: 'night',
    mode: 'camera',
    zoneResults: ZONE_ORDER.map((zoneId) => ({
      zoneId,
      monsterId: 'plaque-puff',
      secondsBrushed: zone[zoneId]?.brushed ?? ZONE_DURATION,
      secondsUntracked: zone[zoneId]?.untracked ?? 0,
      verified: zone[zoneId]?.verified ?? true,
      monsterOutcome: 'defeated' as const,
    })),
    monstersEarned: ['plaque-puff', 'plaque-puff', 'plaque-puff', 'plaque-puff'],
    startedAt: 1_700_000_000_000,
    durationSeconds: 120,
    ...over,
  };
}

/** Independent oracle with plain loops, written without calling the code under test. */
function oracleNights(sessions: readonly SessionResult[], zone: ZoneId): number {
  let nights = 0;
  const seenDates: string[] = [];
  for (const s of sessions) if (!seenDates.includes(s.date)) seenDates.push(s.date);
  for (const date of seenDates) {
    let qualifying = 0;
    let anyBrushing = false;
    for (const s of sessions) {
      if (s.date !== date || s.mode !== 'camera' || s.timeOfDay !== 'night') continue;
      for (const zr of s.zoneResults) {
        if (zr.zoneId !== zone || zr.verified !== true) continue;
        qualifying += 1;
        if (zr.secondsBrushed > 0) anyBrushing = true;
      }
    }
    if (qualifying > 0 && !anyBrushing) nights += 1;
  }
  return nights;
}

function oracleNudge(sessions: readonly SessionResult[]): { zone: ZoneId; nights: number } | null {
  let best: { zone: ZoneId; nights: number } | null = null;
  for (const zone of ZONE_ORDER) {
    const n = oracleNights(sessions, zone);
    if (best === null || n > best.nights) best = { zone, nights: n };
  }
  return best !== null && best.nights >= MIN ? best : null;
}

const run = (sessions: readonly SessionResult[]) => nudge(nightsPerZone(sessions, C), C);

const sentence = (zone: string, n: number) =>
  `During the ${zone} turn, brushing was not seen on ${n} nights. Try brushing it first tonight.`;

describe('parentViewNudge', () => {
  it('matches an independent oracle in zone and number', () => {
    fc.assert(
      fc.property(sessionsArb, (sessions) => {
        const got = run(sessions);
        const expected = oracleNudge(sessions);
        if (expected === null) {
          expect(got).toBeNull();
        } else {
          expect(got).not.toBeNull();
          expect(got!.zone).toBe(expected.zone);
          expect(got!.nights).toBe(expected.nights);
        }
      }),
      { numRuns: 300 },
    );
  });

  it('actually produces nudges in the generated data (the generator is not vacuous)', () => {
    let seen = 0;
    fc.assert(
      fc.property(sessionsArb, (sessions) => {
        if (run(sessions) !== null) seen += 1;
      }),
      { numRuns: 300 },
    );
    expect(seen).toBeGreaterThan(0);
  });

  it('never returns fewer than NUDGE_MIN_NIGHTS nights, and names the zone with the most nights', () => {
    fc.assert(
      fc.property(sessionsArb, (sessions) => {
        const got = run(sessions);
        fc.pre(got !== null);
        expect(got!.nights).toBeGreaterThanOrEqual(MIN);
        const counts = ZONE_ORDER.map((z) => oracleNights(sessions, z));
        const top = Math.max(...counts);
        expect(got!.nights).toBe(top);
        expect(got!.zone).toBe(ZONE_ORDER[counts.indexOf(top)]); // first in ZONE_ORDER on a tie
      }),
      { numRuns: 300 },
    );
  });

  it('gives a tie to the first zone in ZONE_ORDER', () => {
    const sessions = [
      session('2026-11-20', {}, { 'lower-right': { brushed: 0 }, 'upper-left': { brushed: 0 } }),
      session('2026-11-21', {}, { 'lower-right': { brushed: 0 }, 'upper-left': { brushed: 0 } }),
    ];
    const got = run(sessions)!;
    expect(got.zone).toBe('upper-left');
    expect(got.nights).toBe(2);
  });

  it('writes the approved sentence with only the zone name and the number replaced', () => {
    fc.assert(
      fc.property(sessionsArb, (sessions) => {
        const got = run(sessions);
        fc.pre(got !== null);
        expect(got!.text).toBe(sentence(got!.zone, got!.nights));
      }),
      { numRuns: 300 },
    );
    expect(run([session('2026-11-21', {}, { 'upper-right': { brushed: 0 } }), session('2026-11-22', {}, { 'upper-right': { brushed: 0 } })])!.text).toBe(
      sentence('upper-right', 2),
    );
  });

  it('returns null below two nights', () => {
    expect(run([session('2026-11-22', {}, { 'upper-right': { brushed: 0 } })])).toBeNull();
    expect(run([])).toBeNull();
  });

  it('counts two night sessions on one day as at most one night', () => {
    const z = { 'upper-right': { brushed: 0 } };
    const sessions = [session('2026-11-22', {}, z), session('2026-11-22', {}, z), session('2026-11-22', {}, z)];
    expect(nightsPerZone(sessions, C)['upper-right']).toBe(1);
    expect(run(sessions)).toBeNull();
  });

  it('does not count a day where any verified night session saw brushing in the zone', () => {
    const sessions = [
      session('2026-11-21', {}, { 'upper-right': { brushed: 0 } }),
      session('2026-11-22', {}, { 'upper-right': { brushed: 0 } }),
      session('2026-11-22', {}, { 'upper-right': { brushed: 1 } }),
    ];
    expect(nightsPerZone(sessions, C)['upper-right']).toBe(1);
    expect(run(sessions)).toBeNull();
  });

  it('lets an unverified night session neither count nor block', () => {
    const sessions = [
      session('2026-11-21', {}, { 'upper-right': { brushed: 0 } }),
      session('2026-11-22', {}, { 'upper-right': { brushed: 0 } }),
      session('2026-11-22', {}, { 'upper-right': { brushed: 20, verified: false } }),
    ];
    expect(nightsPerZone(sessions, C)['upper-right']).toBe(2);
    expect(run(sessions)!.zone).toBe('upper-right');
  });

  it('never counts a day with only unverified night sessions for the zone', () => {
    const z = { 'upper-right': { brushed: 0, verified: false } };
    const sessions = [session('2026-11-21', {}, z), session('2026-11-22', {}, z), session('2026-11-20', {}, z)];
    expect(nightsPerZone(sessions, C)['upper-right']).toBe(0);
    expect(run(sessions)).toBeNull();
  });

  it('never makes a night from untracked seconds when seconds were brushed', () => {
    const z = { 'upper-right': { brushed: 5, untracked: 25 } };
    const sessions = [session('2026-11-21', {}, z), session('2026-11-22', {}, z)];
    expect(nightsPerZone(sessions, C)['upper-right']).toBe(0);
    expect(run(sessions)).toBeNull();
  });

  it('never reads timer-only, morning or neither sessions', () => {
    const z = { 'upper-right': { brushed: 0 } };
    for (const over of [
      { mode: 'timer-only' as const },
      { timeOfDay: 'morning' as const },
      { timeOfDay: 'neither' as const },
    ]) {
      const sessions = [session('2026-11-21', over, z), session('2026-11-22', over, z), session('2026-11-20', over, z)];
      expect(nightsPerZone(sessions, C)['upper-right']).toBe(0);
      expect(run(sessions)).toBeNull();
    }
  });

  it('gives the same result whatever the number of camera sessions', () => {
    const z = { 'lower-left': { brushed: 0 } };
    const two = [session('2026-11-21', {}, z), session('2026-11-22', {}, z)];
    expect(two.filter((s) => s.mode === 'camera').length).toBeLessThan(C.ZONE_FACT_MIN_CAMERA_SESSIONS);
    expect(run(two)!.zone).toBe('lower-left');
    const many = [...two, session('2026-11-19'), session('2026-11-18'), session('2026-11-17')];
    expect(run(many)!.zone).toBe('lower-left');
    expect(run(many)!.nights).toBe(2);
  });

  it('is not changed by the order of the sessions', () => {
    fc.assert(
      fc.property(sessionsArb, (sessions) => {
        expect(run([...sessions].reverse())).toEqual(run(sessions));
      }),
    );
  });

  it('never says missed, skipped or a side', () => {
    fc.assert(
      fc.property(sessionsArb, (sessions) => {
        const got = run(sessions);
        fc.pre(got !== null);
        const text = got!.text.toLowerCase();
        expect(text).not.toContain('missed');
        expect(text).not.toContain('skipped');
      }),
    );
  });
});
