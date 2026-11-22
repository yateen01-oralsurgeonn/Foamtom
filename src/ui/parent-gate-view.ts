// The adult gate button (parent-screen design 5.2). A painter: it builds one button, listens for
// pointer and key events, and hands every decision to the pure state machine in adult-gate.ts.
// It reads time only from the injected clock and asks the injected scheduler for each frame.
// It stores nothing, speaks nothing and sends nothing, and shows nothing on an early release.
import type { VisibilitySource } from './game-loop';
import {
  GATE_START,
  gateAdvance,
  gateCancel,
  gatePress,
  gateProgress,
  gateRelease,
  type GateState,
  type HoldSource,
} from './adult-gate';
import { GATE_HOLD_SECONDS, PARENT_TAP_TARGETS } from './parent-constants';
import { PARENT_TEXT } from './parent-text';

/** main.ts adapts the browser's frame callback to this. */
export interface FrameScheduler {
  /** Asks for one callback on the next frame. Returns a function that cancels the request. */
  request(callback: () => void): () => void;
}

export interface GateViewDeps {
  /** Monotonic milliseconds. The only clock the gate reads. */
  readonly now: () => number;
  readonly frames: FrameScheduler;
  readonly visibility: VisibilitySource;
  /** Called once, when one unbroken hold has lasted the full time. */
  readonly onPassed: () => void;
}

export interface GateView {
  /** The gate section: the instruction line and the button. The caller puts it on the screen. */
  readonly element: HTMLElement;
  readonly button: HTMLButtonElement;
  /** Cancels the frame request and removes every listener, including the visibility one. */
  destroy(): void;
}

const INSTRUCTION_ID = 'gate-instruction';
const LABEL_ID = 'gate-label';

/** Space and Enter hold the gate. Anything else is ignored. */
function isHoldKey(key: string): boolean {
  return key === ' ' || key === 'Spacebar' || key === 'Enter';
}

export function createGateView(deps: GateViewDeps): GateView {
  const { now, frames, visibility, onPassed } = deps;

  let state: GateState = GATE_START;
  let cancelFrame: (() => void) | null = null;
  let finished = false;

  const section = document.createElement('section');
  section.className = 'parent-gate';
  section.setAttribute('aria-labelledby', INSTRUCTION_ID);

  const instruction = document.createElement('p');
  instruction.id = INSTRUCTION_ID;
  instruction.textContent = PARENT_TEXT['gate-instruction'].text;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'gate-button';
  button.setAttribute('aria-labelledby', `${LABEL_ID} ${INSTRUCTION_ID}`);
  button.style.minWidth = `${PARENT_TAP_TARGETS.gate.minWidthPx}px`;
  button.style.minHeight = `${PARENT_TAP_TARGETS.gate.minHeightPx}px`;
  button.setAttribute('data-step', '0');

  // Children in this order: ring, three dots, label, icon (the CSS counts the dots as 2, 3, 4).
  const ring = document.createElement('span');
  ring.className = 'gate__ring';
  ring.setAttribute('aria-hidden', 'true');
  const dots: HTMLElement[] = [];
  for (let i = 0; i < GATE_HOLD_SECONDS; i += 1) {
    const dot = document.createElement('span');
    dot.className = 'gate__dot';
    dot.setAttribute('aria-hidden', 'true');
    dots.push(dot);
  }
  const label = document.createElement('span');
  label.id = LABEL_ID;
  label.textContent = PARENT_TEXT['gate-label'].text;
  const icon = document.createElement('span');
  icon.className = 'gate__icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '\u270B';
  button.append(ring, ...dots, label, icon);

  section.append(instruction, button);

  function paint(): void {
    const progress = gateProgress(state, now(), GATE_HOLD_SECONDS);
    button.setAttribute('data-step', String(progress.step));
    button.style.setProperty('--gate-fraction', String(progress.fraction));
  }

  function stopFrames(): void {
    if (cancelFrame !== null) {
      cancelFrame();
      cancelFrame = null;
    }
  }

  function finish(): void {
    if (finished) return;
    finished = true;
    stopFrames();
    removeListeners();
    onPassed();
  }

  function onFrame(): void {
    cancelFrame = null;
    if (finished) return;
    state = gateAdvance(state, now(), GATE_HOLD_SECONDS);
    paint();
    if (state.passed) {
      finish();
      return;
    }
    if (state.heldSince !== null) cancelFrame = frames.request(onFrame);
  }

  function press(source: HoldSource): void {
    if (finished) return;
    state = gatePress(state, source, now());
    paint();
    if (state.heldSince !== null && cancelFrame === null) cancelFrame = frames.request(onFrame);
  }

  function release(source: HoldSource): void {
    if (finished) return;
    // A hold that already lasted the full time counts, even if the finger lifts before the next frame.
    state = gateAdvance(state, now(), GATE_HOLD_SECONDS);
    state = gateRelease(state, source);
    if (state.passed) {
      paint();
      finish();
      return;
    }
    if (state.heldSince === null) stopFrames();
    paint();
  }

  function cancel(): void {
    if (finished) return;
    state = gateCancel(state);
    if (state.heldSince === null) stopFrames();
    paint();
  }

  const onPointerDown = (event: PointerEvent): void => {
    if (!event.isPrimary || event.button !== 0) return;
    // Let pointerleave fire if the finger slides off the button.
    if (button.hasPointerCapture(event.pointerId)) button.releasePointerCapture(event.pointerId);
    press('pointer');
  };
  const onPointerEnd = (event: PointerEvent): void => {
    if (!event.isPrimary) return;
    release('pointer');
  };
  const onContextMenu = (event: Event): void => {
    event.preventDefault();
  };
  const onKeyDown = (event: KeyboardEvent): void => {
    if (!isHoldKey(event.key)) return;
    event.preventDefault();
    if (event.repeat) return;
    press('key');
  };
  const onKeyUp = (event: KeyboardEvent): void => {
    if (!isHoldKey(event.key)) return;
    event.preventDefault();
    release('key');
  };
  const onBlur = (): void => {
    cancel();
  };

  button.addEventListener('pointerdown', onPointerDown);
  button.addEventListener('pointerup', onPointerEnd);
  button.addEventListener('pointercancel', onPointerEnd);
  button.addEventListener('pointerleave', onPointerEnd);
  button.addEventListener('contextmenu', onContextMenu);
  button.addEventListener('keydown', onKeyDown);
  button.addEventListener('keyup', onKeyUp);
  button.addEventListener('blur', onBlur);
  const unsubscribeVisibility = visibility.subscribe((hidden) => {
    if (hidden) cancel();
  });

  function removeListeners(): void {
    button.removeEventListener('pointerdown', onPointerDown);
    button.removeEventListener('pointerup', onPointerEnd);
    button.removeEventListener('pointercancel', onPointerEnd);
    button.removeEventListener('pointerleave', onPointerEnd);
    button.removeEventListener('contextmenu', onContextMenu);
    button.removeEventListener('keydown', onKeyDown);
    button.removeEventListener('keyup', onKeyUp);
    button.removeEventListener('blur', onBlur);
    unsubscribeVisibility();
  }

  return {
    element: section,
    button,
    destroy(): void {
      if (finished) return;
      finished = true;
      stopFrames();
      removeListeners();
    },
  };
}
