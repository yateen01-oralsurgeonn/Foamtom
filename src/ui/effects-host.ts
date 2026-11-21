// Effects host: writes the loop-cycle CSS variables, follows the reduced-motion setting and
// pauses the loops while the tab is hidden. Event listeners only: no timer, no camera.
import { effectClasses, effectsFor, LOOP_CYCLES_MS } from './effects';
import type { LoopId } from './effects';

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
export const PAUSED_CLASS = 'fx-paused';

export interface EffectsRoot {
  readonly classList: {
    add(name: string): void;
    remove(name: string): void;
    contains(name: string): boolean;
  };
  readonly style: { setProperty(name: string, value: string): void };
}

export interface MediaQueryLike {
  readonly matches: boolean;
  addEventListener(type: 'change', listener: () => void): void;
  removeEventListener(type: 'change', listener: () => void): void;
}

export interface EffectsVisibility {
  isHidden(): boolean;
  /** Returns an unsubscribe function. */
  subscribe(listener: (hidden: boolean) => void): () => void;
}

export interface EffectsDeps {
  readonly root: EffectsRoot;
  readonly matchMedia?: (query: string) => MediaQueryLike;
  readonly visibility?: EffectsVisibility;
}

/** Every class this host may put on the root, so one can be cleared before the next is set. */
const ALL_EFFECT_CLASSES = effectClasses(effectsFor(true));

/** `flameActive` becomes `--cycle-flame-active`. */
export function cycleVariableName(id: LoopId): string {
  return `--cycle-${id.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
}

export function startEffects(deps: EffectsDeps): () => void {
  const { root } = deps;

  for (const id of Object.keys(LOOP_CYCLES_MS) as LoopId[]) {
    root.style.setProperty(cycleVariableName(id), `${LOOP_CYCLES_MS[id]}ms`);
  }

  let query: MediaQueryLike | null = null;
  try {
    query = deps.matchMedia ? deps.matchMedia(REDUCED_MOTION_QUERY) : null;
  } catch {
    query = null;
  }

  const applyMotion = (): void => {
    let reduced = false;
    try {
      reduced = query?.matches === true;
    } catch {
      reduced = false;
    }
    const wanted = effectClasses(effectsFor(reduced));
    for (const name of ALL_EFFECT_CLASSES) {
      if (wanted.includes(name)) root.classList.add(name);
      else root.classList.remove(name);
    }
  };
  applyMotion();

  let unlistenMotion: (() => void) | null = null;
  if (query) {
    const listening = query;
    try {
      listening.addEventListener('change', applyMotion);
      unlistenMotion = () => listening.removeEventListener('change', applyMotion);
    } catch {
      unlistenMotion = null;
    }
  }

  const applyHidden = (hidden: boolean): void => {
    if (hidden) root.classList.add(PAUSED_CLASS);
    else root.classList.remove(PAUSED_CLASS);
  };

  let unlistenVisibility: (() => void) | null = null;
  if (deps.visibility) {
    applyHidden(deps.visibility.isHidden());
    unlistenVisibility = deps.visibility.subscribe(applyHidden);
  }

  return () => {
    unlistenMotion?.();
    unlistenVisibility?.();
  };
}
