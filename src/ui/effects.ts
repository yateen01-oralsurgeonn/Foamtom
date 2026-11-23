// Effects table and reduced motion. Pure: no DOM, no clock, no randomness.
// Looks only: nothing here changes a game rule.

/** Three flashes a second is the limit, so no loop may be shorter than this. */
export const MIN_CYCLE_MS = 334;

export type LoopId = 'flameActive' | 'glowActive' | 'glowDim' | 'fogDrift' | 'smokeDrift';

export const LOOP_CYCLES_MS: Record<LoopId, number> = {
  flameActive: 1700,
  glowActive: 2200,
  glowDim: 3600,
  fogDrift: 30000,
  smokeDrift: 2800,
};

/** One-shot durations. None of them repeats. */
export const ONE_SHOT_MS = {
  fadeIn: 600,
  glowMove: 400,
  leave: 1400,
  intoBook: 1200,
  /** The hit flinch (task 45): at most one per tick. */
  hit: 300,
} as const;

export type RegionLevel = 'active' | 'dim' | 'off';

export interface RegionLook {
  /** 0 to 1: brightness. */
  readonly glowOpacity: number;
  /** Size of the glow in px: not hue. */
  readonly glowSizePx: number;
  /** The lit-candle ornament: not hue. */
  readonly flame: boolean;
  /** 0 to 1: size of the brightness change, never its speed. */
  readonly flickerAmplitude: number;
}

export const REGION_LOOKS: Record<RegionLevel, RegionLook> = {
  active: { glowOpacity: 0.9, glowSizePx: 72, flame: true, flickerAmplitude: 0.2 },
  dim: { glowOpacity: 0.25, glowSizePx: 24, flame: false, flickerAmplitude: 0.05 },
  off: { glowOpacity: 0, glowSizePx: 0, flame: false, flickerAmplitude: 0 },
};

export const FRAME_METRICS = {
  ringPx: 32,
  /** The ring in short landscape (req 12.1). */
  ringLandscapePx: 20,
} as const;

export interface Effects {
  // Moving effects: off under reduced motion.
  readonly flicker: boolean;
  readonly fogDrift: boolean;
  readonly smokeDrift: boolean;
  /** False: a monster that leaves only fades. */
  readonly leavingMotion: boolean;
  /** The end-card "going into the Book" movement. */
  readonly bookMotion: boolean;
  /** The hit flinch of the monster (req 6.9, 11.9). */
  readonly hitMotion: boolean;
  // States: always on.
  readonly glow: true;
  readonly ornament: true;
  readonly sizeChange: true;
  readonly smokeThinning: true;
}

export function effectsFor(prefersReducedMotion: boolean): Effects {
  const moving = !prefersReducedMotion;
  return {
    flicker: moving,
    fogDrift: moving,
    smokeDrift: moving,
    leavingMotion: moving,
    bookMotion: moving,
    hitMotion: moving,
    glow: true,
    ornament: true,
    sizeChange: true,
    smokeThinning: true,
  };
}

/** Root class names for the effects that are off. */
export function effectClasses(effects: Effects): string[] {
  const classes: string[] = [];
  if (!effects.flicker) classes.push('fx-no-flicker');
  if (!effects.fogDrift) classes.push('fx-no-fog');
  if (!effects.smokeDrift) classes.push('fx-no-smoke-drift');
  if (!effects.leavingMotion) classes.push('fx-no-leaving');
  if (!effects.bookMotion) classes.push('fx-no-book');
  if (!effects.hitMotion) classes.push('fx-no-hit');
  return classes;
}
