import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { ZONE_DURATION, ZONE_ORDER } from '../src/logic/constants';
import { zoneMostMissed } from '../src/logic/stats';
import type { SessionResult, ZoneId } from '../src/logic/types';
import { PARENT_VIEW_CONSTANTS } from '../src/ui/parent-constants';
import { zoneFact } from '../src/ui/parent-zone-fact';
import { sessionArb } from './fixtures/parent-sessions';

// Parent-screen task 4 (parentViewZoneFact): requirements 5.1 to 5.8, 6.2, 6.3, 10.4, 13.3, 14.5, 14.6.

const C = PARENT_VIEW_CONSTANTS;
const MIN = C.ZONE_FACT_MIN_CAMERA_SESSIONS;
const DATES = ['2026-11-20', '2026-11-21', '2026-11-22'];

const ROW12 = 'Not enough camera sessions yet.';
const ROW11 = 'Brushing was seen in every turn.';

const sessionsArb = fc.array(sessionArb(DATES), { maxLength: 12 });
const cameraArb = fc.array(sessionArb(DATES), { maxLength: 12 }).map((l) => l.filter((s) => s.mode === 'camera'));

/** A hand-built camera session: `unseen[zone]` unseen seconds in each zone, all verified by default. */
function build(unseen: Record<ZoneId, number>, verified: Partial<Record<ZoneId, boolean>> = {}): SessionResult {
  return {
    date: '2026-11-22',
    timeOfDay: 'night',
    mode: 'camera',
    zoneResults: ZONE_ORDER.map((zoneId) => ({
      zoneId,
      monsterId: 'plaque-puff',
      secondsBrushed: ZONE_DURATION - unseen[zoneId],
      secondsUntracked: 0,
      verified: verified[zoneId] ?? true,
      monsterOutcome: 'defeated' as const,
    })),
    monstersEarned: ['plaque-puff', 'plaque-puff', 'plaque-puff', 'plaque-puff'],
    startedAt: 1_700_000_000_000,
    durationSeconds: 120,
  };
}

const none = (): Record<ZoneId, number> => ({
  'upper-right': 0,
  'upper-left': 0,
  'lower-left': 0,
  'lower-right': 0,
});

/** Independent oracle with plain loops: the zones with the highest average unseen time, or null. */
function oracle(sessions: readonly SessionResult[]): { zones: ZoneId[]; best: number } | null {
  const avg: Partial<Record<ZoneId, number>> = {};
  for (const zone of ZONE_ORDER) {
    let total = 0;
    let n = 0;
    for (const s of sessions) {
      if (s.mode !== 'camera') continue;
      for (const zr of s.zoneResults) {
        if (zr.zoneId !== zone || !zr.verified) continue;
        let unseen = ZONE_DURATION - zr.secondsBrushed - zr.secondsUntracked;
        if (unseen < 0) unseen = 0;
        total += unseen;
        n += 1;
      }
    }
    if (n > 0) avg[zone] = total / n; // sums of whole numbers over small counts: exact enough for equality here
  }
  let best = -1;
  for (const zone of ZONE_ORDER) {
    const a = avg[zone];
    if (a !== undefined && a > best) best = a;
  }
  if (best < 0) return null;
  const zones: ZoneId[] = [];
  for (const zone of ZONE_ORDER) {
    const a = avg[zone];
    // Compare with a small tolerance: averages are k/n for n up to 12, so distinct values differ by >= 1/132.
    if (a !== undefined && Math.abs(a - best) < 1e-9) zones.push(zone);
  }
  return { zones, best };
}

describe('parentViewZoneFact', () => {
  it('gives row 12 and no zone with fewer than 3 camera sessions', () => {
    fc.assert(
      fc.property(cameraArb, (list) => {
        const few = list.slice(0, MIN - 1);
        const fact = zoneFact(few, C);
        expect(fact.kind).toBe('not-enough');
        expect(fact.zones).toEqual([]);
        expect(fact.text).toBe(ROW12);
      }),
    );
  });

  it('gives row 12 and no zone with 3 or more camera sessions and no verified result', () => {
    fc.assert(
      fc.property(cameraArb, (list) => {
        const sessions = list.map((s) => ({
          ...s,
          zoneResults: s.zoneResults.map((zr) => ({ ...zr, verified: false })),
        }));
        while (sessions.length < MIN) sessions.push(build(none(), { 'upper-right': false, 'upper-left': false, 'lower-left': false, 'lower-right': false }));
        const fact = zoneFact(sessions, C);
        expect(fact.kind).toBe('not-enough');
        expect(fact.zones).toEqual([]);
        expect(fact.text).toBe(ROW12);
      }),
    );
  });

  it('gives row 11 and no zone when every verified result was fully seen', () => {
    const sessions = [build(none()), build(none()), build(none())];
    const fact = zoneFact(sessions, C);
    expect(fact.kind).toBe('every');
    expect(fact.zones).toEqual([]);
    expect(fact.text).toBe(ROW11);
  });

  it('names exactly the zones with the highest average of unseen seconds', () => {
    fc.assert(
      fc.property(cameraArb, (list) => {
        fc.pre(list.length >= MIN);
        const fact = zoneFact(list, C);
        const expected = oracle(list);
        if (expected === null) {
          expect(fact.kind).toBe('not-enough');
          expect(fact.zones).toEqual([]);
        } else if (expected.best === 0) {
          expect(fact.kind).toBe('every');
          expect(fact.zones).toEqual([]);
        } else {
          expect(fact.kind).toBe('least');
          expect(fact.zones).toEqual(expected.zones);
        }
      }),
    );
  });

  it('agrees with zoneMostMissed when one zone has the highest positive average', () => {
    fc.assert(
      fc.property(cameraArb, (list) => {
        fc.pre(list.length >= MIN);
        const fact = zoneFact(list, C);
        fc.pre(fact.kind === 'least' && fact.zones.length === 1);
        expect(fact.zones[0]).toBe(zoneMostMissed(list));
      }),
    );
  });

  it('writes the approved forms for ties of two, three and four zones', () => {
    const three = (u: Partial<Record<ZoneId, number>>): SessionResult[] => {
      const base = { ...none(), ...u };
      return [build(base), build(base), build(base)];
    };
    const one = zoneFact(three({ 'lower-left': 10 }), C);
    expect(one.text).toBe('Brushing was seen least during the lower-left turn.');
    expect(one.zones).toEqual(['lower-left']);

    const two = zoneFact(three({ 'upper-left': 10, 'lower-left': 10 }), C);
    expect(two.zones).toEqual(['upper-left', 'lower-left']);
    expect(two.text).toBe('Brushing was seen least during the upper-left and lower-left turns.');

    const triple = zoneFact(three({ 'upper-right': 5, 'upper-left': 5, 'lower-left': 5 }), C);
    expect(triple.zones).toEqual(['upper-right', 'upper-left', 'lower-left']);
    expect(triple.text).toBe('Brushing was seen least during the upper-right, upper-left and lower-left turns.');

    const four = zoneFact(
      three({ 'upper-right': 7, 'upper-left': 7, 'lower-left': 7, 'lower-right': 7 }),
      C,
    );
    expect(four.zones).toEqual([...ZONE_ORDER]);
    expect(four.text).toBe(
      'Brushing was seen least during the upper-right, upper-left, lower-left and lower-right turns.',
    );
  });

  it('decides ties by cross-multiplication, not by rounding', () => {
    // upper-left: unseen 10, 10, 11 = 31 / 3; lower-left: unseen 10, 10, 10, 11 over 4 sessions would differ.
    // Here two zones have the same exact average 31/3 from different data.
    const a = build({ ...none(), 'upper-left': 10, 'lower-left': 9 });
    const b = build({ ...none(), 'upper-left': 10, 'lower-left': 10 });
    const c = build({ ...none(), 'upper-left': 11, 'lower-left': 12 });
    const fact = zoneFact([a, b, c], C);
    expect(fact.zones).toEqual(['upper-left', 'lower-left']);
  });

  it('never names a zone whose average is 0', () => {
    fc.assert(
      fc.property(cameraArb, (list) => {
        const fact = zoneFact(list, C);
        for (const zone of fact.zones) {
          const found = oracle(list);
          expect(found).not.toBeNull();
          expect(found!.best).toBeGreaterThan(0);
          expect(found!.zones).toContain(zone);
        }
      }),
    );
  });

  it('is not changed by timer-only sessions or by unverified results', () => {
    fc.assert(
      fc.property(sessionsArb, (all) => {
        const camera = all.filter((s) => s.mode === 'camera');
        const timer = all.filter((s) => s.mode === 'timer-only');
        // Timer-only sessions mixed in change nothing.
        expect(zoneFact([...camera, ...timer], C)).toEqual(zoneFact(camera, C));
        // An extra unverified camera session adds nothing to the averages, only to the count.
        const unverified: SessionResult = build(none(), {
          'upper-right': false,
          'upper-left': false,
          'lower-left': false,
          'lower-right': false,
        });
        const withExtra = zoneFact([...camera, unverified], C);
        const base = zoneFact(camera, C);
        if (camera.length >= MIN) expect(withExtra).toEqual(base);
      }),
    );
  });

  it('never says missed, skipped or not brushed', () => {
    fc.assert(
      fc.property(sessionsArb, (all) => {
        const text = zoneFact(all, C).text.toLowerCase();
        expect(text).not.toContain('missed');
        expect(text).not.toContain('skipped');
        expect(text).not.toContain('not brushed');
      }),
    );
  });
});
