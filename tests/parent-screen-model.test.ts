import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import { GATE_START, type GateState } from '../src/ui/adult-gate';
import {
  afterClear,
  askToClear,
  closeScreen,
  keepData,
  openScreen,
  showsContents,
  withGate,
  type ParentScreenState,
} from '../src/ui/parent-screen-model';
import { parentView } from '../src/ui/parent-view';
import { PARENT_VIEW_CONSTANTS } from '../src/ui/parent-constants';
import { PARENT_TEXT } from '../src/ui/parent-text';

// Design test 15 (parentScreenModel). Requirements 1.2, 1.6, 2.2, 9.2, 9.4-9.6, 14.11, 14.13.

const VIEW = parentView([], PARENT_VIEW_CONSTANTS, '2026-11-22');
const OTHER_VIEW = parentView([{}], PARENT_VIEW_CONSTANTS, '2026-11-22');
const PASSED: GateState = { heldSince: 0, source: 'pointer', passed: true };
const HELD: GateState = { heldSince: 5, source: 'key', passed: false };

type Step =
  | { k: 'open' }
  | { k: 'gate'; passed: boolean }
  | { k: 'ask' }
  | { k: 'keep' }
  | { k: 'clearOk' }
  | { k: 'clearFail' }
  | { k: 'close' };

const stepArb: fc.Arbitrary<Step> = fc.oneof(
  fc.constant<Step>({ k: 'open' }),
  fc.boolean().map<Step>((passed) => ({ k: 'gate', passed })),
  fc.constant<Step>({ k: 'ask' }),
  fc.constant<Step>({ k: 'keep' }),
  fc.constant<Step>({ k: 'clearOk' }),
  fc.constant<Step>({ k: 'clearFail' }),
  fc.constant<Step>({ k: 'close' }),
);

function apply(s: ParentScreenState, st: Step): ParentScreenState {
  switch (st.k) {
    case 'open':
      return openScreen(VIEW);
    case 'gate':
      return withGate(s, st.passed ? PASSED : HELD);
    case 'ask':
      return askToClear(s);
    case 'keep':
      return keepData(s);
    case 'clearOk':
      return afterClear(s, 'cleared', OTHER_VIEW);
    case 'clearFail':
      return afterClear(s, 'failed', VIEW);
    case 'close':
      return closeScreen();
  }
}

describe('parentScreenModel', () => {
  it('openScreen gives a gated phase, a fresh gate, no notice and no confirmation', () => {
    const s = openScreen(VIEW);
    expect(s.phase).toBe('gated');
    expect(s.view).toBe(VIEW);
    expect(s.gate).toEqual(GATE_START);
    expect(s.notice).toBeNull();
    expect(s.confirming).toBe(false);
    expect(showsContents(s)).toBe(false);
  });

  it('any sequence of steps follows the rules', () => {
    fc.assert(
      fc.property(fc.array(stepArb, { maxLength: 40 }), (steps) => {
        let s = closeScreen();
        for (const st of steps) {
          const before = s;
          s = apply(s, st);

          // Contents are shown only when unlocked; unlocked needs a passed gate.
          expect(showsContents(s)).toBe(s.phase === 'unlocked');
          if (s.phase === 'unlocked') expect(s.gate.passed).toBe(true);
          // Confirmation and notice exist only while unlocked.
          if (s.confirming || s.notice !== null) expect(s.phase).toBe('unlocked');
          // Closed means no view, a fresh gate, no notice, no confirmation.
          if (s.phase === 'closed') {
            expect(s).toEqual(closeScreen());
            expect(s.view).toBeNull();
          } else {
            expect(s.view).not.toBeNull();
          }
          // The clear question can only start from unlocked.
          if (st.k === 'ask' && before.phase !== 'unlocked') expect(s).toBe(before);
          if (st.k === 'ask' && before.phase === 'unlocked') expect(s.confirming).toBe(true);
          // afterClear ends the confirmation; notice only for a failed clear.
          if (st.k === 'clearOk' && before.phase === 'unlocked') {
            expect(s.confirming).toBe(false);
            expect(s.notice).toBeNull();
          }
          if (st.k === 'clearFail' && before.phase === 'unlocked') {
            expect(s.confirming).toBe(false);
            expect(s.notice).toBe(PARENT_TEXT['clear-failed'].text);
          }
          // Opening and closing always reset.
          if (st.k === 'open') expect(s).toEqual(openScreen(VIEW));
        }
      }),
    );
  });

  it('never shows contents before the gate passes', () => {
    let s = openScreen(VIEW);
    expect(showsContents(s)).toBe(false);
    s = withGate(s, HELD);
    expect(showsContents(s)).toBe(false);
    s = askToClear(s);
    expect(s.confirming).toBe(false);
    expect(s.phase).toBe('gated');
    s = withGate(s, PASSED);
    expect(s.phase).toBe('unlocked');
    expect(showsContents(s)).toBe(true);
  });

  it('closeScreen drops the view and the gate whatever came before', () => {
    let s = withGate(openScreen(VIEW), PASSED);
    s = afterClear(askToClear(s), 'failed', VIEW);
    expect(s.notice).not.toBeNull();
    const c = closeScreen();
    expect(c.phase).toBe('closed');
    expect(c.view).toBeNull();
    expect(c.gate).toEqual(GATE_START);
    expect(c.notice).toBeNull();
    expect(c.confirming).toBe(false);
  });

  it('reopening always starts gated', () => {
    let s = withGate(openScreen(VIEW), PASSED);
    s = askToClear(s);
    s = closeScreen();
    s = openScreen(VIEW);
    expect(s.phase).toBe('gated');
    expect(s.gate.passed).toBe(false);
    expect(s.confirming).toBe(false);
  });

  it('keepData removes nothing and calls nothing', () => {
    const s = askToClear(withGate(openScreen(VIEW), PASSED));
    expect(s.confirming).toBe(true);
    const kept = keepData(s);
    expect(kept.confirming).toBe(false);
    expect(kept.view).toBe(s.view);
    expect(kept.notice).toBe(s.notice);
    expect(kept.phase).toBe('unlocked');
    expect(kept.gate).toBe(s.gate);
    // The model takes no storage, so it cannot remove anything.
    expect(keepData.length).toBe(1);
  });

  it('afterClear swaps in the re-read view', () => {
    const s = askToClear(withGate(openScreen(VIEW), PASSED));
    const done = afterClear(s, 'cleared', OTHER_VIEW);
    expect(done.view).toBe(OTHER_VIEW);
    expect(done.confirming).toBe(false);
    expect(done.notice).toBeNull();
  });
});
