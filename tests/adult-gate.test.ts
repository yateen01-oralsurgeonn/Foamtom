import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import {
  GATE_START,
  gateAdvance,
  gateCancel,
  gatePress,
  gateProgress,
  gateRelease,
  type GateState,
  type HoldSource,
} from '../src/ui/adult-gate';
import { GATE_HOLD_SECONDS } from '../src/ui/parent-constants';

// Design tests 11 (adultGate) and 12 (gateProgressMark, state part). Requirements 2.1-2.7, 14.11.

const HOLD = GATE_HOLD_SECONDS;
const HOLD_MS = HOLD * 1000;

type Ev =
  | { kind: 'press'; src: HoldSource; dt: number }
  | { kind: 'release'; src: HoldSource; dt: number }
  | { kind: 'cancel'; dt: number }
  | { kind: 'advance'; dt: number };

const srcArb = fc.constantFrom<HoldSource>('pointer', 'key');
const dtArb = fc.integer({ min: 0, max: 2500 });
const evArb: fc.Arbitrary<Ev> = fc.oneof(
  fc.record({ kind: fc.constant('press' as const), src: srcArb, dt: dtArb }),
  fc.record({ kind: fc.constant('release' as const), src: srcArb, dt: dtArb }),
  fc.record({ kind: fc.constant('cancel' as const), dt: dtArb }),
  fc.record({ kind: fc.constant('advance' as const), dt: dtArb }),
);

function apply(s: GateState, e: Ev, t: number): GateState {
  switch (e.kind) {
    case 'press':
      return gatePress(s, e.src, t);
    case 'release':
      return gateRelease(s, e.src);
    case 'cancel':
      return gateCancel(s);
    case 'advance':
      return gateAdvance(s, t, HOLD);
  }
}

// Independent oracle: plain variables, no gate functions.
function oracle(events: readonly Ev[]): boolean {
  let start: number | null = null;
  let src: HoldSource | null = null;
  let passed = false;
  let t = 0;
  for (const e of events) {
    t += e.dt;
    if (passed) continue;
    if (e.kind === 'press') {
      if (start === null) {
        start = t;
        src = e.src;
      }
    } else if (e.kind === 'release') {
      if (src === e.src) {
        start = null;
        src = null;
      }
    } else if (e.kind === 'cancel') {
      start = null;
      src = null;
    } else if (start !== null && t - start >= HOLD_MS) {
      passed = true;
    }
  }
  return passed;
}

describe('adultGate', () => {
  it('uses a three second hold', () => {
    expect(HOLD).toBe(3);
  });

  it('passes exactly when one unbroken hold of 3000 ms has been advanced past', () => {
    fc.assert(
      fc.property(fc.array(evArb, { maxLength: 40 }), (events) => {
        let s = GATE_START;
        let t = 0;
        for (const e of events) {
          t += e.dt;
          s = apply(s, e, t);
        }
        expect(s.passed).toBe(oracle(events));
      }),
      { numRuns: 300 },
    );
  });

  it('does not pass at 2999 ms and passes at 3000 ms', () => {
    const held = gatePress(GATE_START, 'pointer', 1000);
    expect(gateAdvance(held, 1000 + HOLD_MS - 1, HOLD).passed).toBe(false);
    expect(gateAdvance(held, 1000 + HOLD_MS, HOLD).passed).toBe(true);
  });

  it('passes when advanced at 3001 ms and then released', () => {
    const held = gatePress(GATE_START, 'pointer', 0);
    const advanced = gateAdvance(held, 3001, HOLD);
    expect(gateRelease(advanced, 'pointer').passed).toBe(true);
  });

  it('resets to GATE_START on an early release', () => {
    const held = gatePress(GATE_START, 'pointer', 0);
    expect(gateRelease(held, 'pointer')).toEqual(GATE_START);
    expect(gateCancel(held)).toEqual(GATE_START);
  });

  it('never passes on several short holds', () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 0, max: 2999 }), { minLength: 1, maxLength: 30 }), (holds) => {
        let s = GATE_START;
        let t = 0;
        for (const h of holds) {
          s = gatePress(s, 'pointer', t);
          t += h;
          s = gateAdvance(s, t, HOLD);
          s = gateRelease(s, 'pointer');
          t += 10;
        }
        expect(s.passed).toBe(false);
      }),
    );
  });

  it('a key up does not end a pointer hold and a pointer up does not end a key hold', () => {
    const pointer = gatePress(GATE_START, 'pointer', 0);
    expect(gateRelease(pointer, 'key')).toBe(pointer);
    expect(gateAdvance(gateRelease(pointer, 'key'), HOLD_MS, HOLD).passed).toBe(true);
    const key = gatePress(GATE_START, 'key', 0);
    expect(gateRelease(key, 'pointer')).toBe(key);
    expect(gateAdvance(gateRelease(key, 'pointer'), HOLD_MS, HOLD).passed).toBe(true);
  });

  it('Space and Enter holds behave as a pointer hold', () => {
    // Both keys use source 'key'; the state machine sees one source for them.
    const k = gatePress(GATE_START, 'key', 500);
    expect(gateAdvance(k, 500 + HOLD_MS - 1, HOLD).passed).toBe(false);
    expect(gateAdvance(k, 500 + HOLD_MS, HOLD).passed).toBe(true);
    expect(gateRelease(k, 'key')).toEqual(GATE_START);
  });

  it('after passed, release and cancel change nothing', () => {
    const passed = gateAdvance(gatePress(GATE_START, 'pointer', 0), HOLD_MS, HOLD);
    expect(passed.passed).toBe(true);
    expect(gateRelease(passed, 'pointer')).toBe(passed);
    expect(gateRelease(passed, 'key')).toBe(passed);
    expect(gateCancel(passed)).toBe(passed);
    expect(gatePress(passed, 'key', 99999)).toBe(passed);
  });

  it('a clock that moves backwards never passes', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100000 }), fc.integer({ min: 0, max: 100000 }), (start, back) => {
        const held = gatePress(GATE_START, 'pointer', start);
        expect(gateAdvance(held, start - back, HOLD).passed).toBe(false);
        expect(gateProgress(held, start - back, HOLD).elapsedMs).toBe(0);
      }),
    );
  });

  it('a second press during a hold changes nothing', () => {
    const held = gatePress(GATE_START, 'pointer', 100);
    expect(gatePress(held, 'pointer', 2000)).toBe(held);
    expect(gatePress(held, 'key', 2000)).toBe(held);
  });

  it('holds no total across holds', () => {
    fc.assert(
      fc.property(fc.array(evArb, { maxLength: 40 }), (events) => {
        let s = GATE_START;
        let t = 0;
        for (const e of events) {
          t += e.dt;
          s = apply(s, e, t);
        }
        expect(Object.keys(s).sort()).toEqual(['heldSince', 'passed', 'source']);
        if (s.heldSince !== null) expect(s.heldSince).toBeLessThanOrEqual(t);
      }),
    );
  });

  it('has no storage or clock reads in the gate file', () => {
    const src = readFileSync('src/ui/adult-gate.ts', 'utf8');
    for (const word of ['localStorage', 'sessionStorage', 'cookie', 'Date', 'performance', 'Math.random', 'import ']) {
      expect(src.includes(word), word).toBe(false);
    }
  });
});

describe('gateProgressMark', () => {
  it('keeps step and fraction in range and never lowers them while a hold lasts', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100000 }),
        fc.array(fc.integer({ min: 0, max: 2000 }), { maxLength: 30 }),
        (start, deltas) => {
          const held = gatePress(GATE_START, 'pointer', start);
          let t = start;
          let lastStep = 0;
          let lastFraction = 0;
          for (const d of deltas) {
            t += d;
            const p = gateProgress(held, t, HOLD);
            expect(p.step).toBeGreaterThanOrEqual(0);
            expect(p.step).toBeLessThanOrEqual(HOLD);
            expect(p.fraction).toBeGreaterThanOrEqual(0);
            expect(p.fraction).toBeLessThanOrEqual(1);
            expect(p.step).toBeGreaterThanOrEqual(lastStep);
            expect(p.fraction).toBeGreaterThanOrEqual(lastFraction);
            lastStep = p.step;
            lastFraction = p.fraction;
          }
        },
      ),
    );
  });

  it('is 0 when not held', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1000000 }), (t) => {
        expect(gateProgress(GATE_START, t, HOLD)).toEqual({ elapsedMs: 0, step: 0, fraction: 0 });
      }),
    );
  });

  it('step equals floor(elapsed / 1000) while a hold lasts', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100000 }), fc.integer({ min: 0, max: 10000 }), (start, d) => {
        const held = gatePress(GATE_START, 'key', start);
        const p = gateProgress(held, start + d, HOLD);
        expect(p.step).toBe(Math.floor(p.elapsedMs / 1000));
        expect(p.elapsedMs).toBe(Math.min(HOLD_MS, d));
      }),
    );
  });

  it('is full once passed', () => {
    const passed = gateAdvance(gatePress(GATE_START, 'pointer', 0), HOLD_MS, HOLD);
    expect(gateProgress(passed, HOLD_MS + 5000, HOLD)).toEqual({ elapsedMs: HOLD_MS, step: HOLD, fraction: 1 });
  });
});
