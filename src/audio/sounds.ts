// Sound data and the gain envelope (req 10). Pure: no audio, no DOM, no clock, no randomness.
// The player in `sound-player.ts` turns these numbers into Web Audio nodes.
import { GAIN_LEVEL } from './speaker';

export type SoundId = 'zone-start' | 'defeat' | 'flee' | 'trapped' | 'end';

export interface SoundVoice {
  readonly wave: 'sine' | 'triangle';
  readonly fromHz: number;
  readonly toHz: number;
  readonly level: number;
}

export interface SoundSpec {
  readonly id: SoundId;
  /** Summed; the levels add up to 1 or less. */
  readonly voices: readonly SoundVoice[];
  /** At most `EFFECT_PEAK_GAIN`. */
  readonly peakGain: number;
  readonly attackMs: number;
  readonly holdMs: number;
  readonly releaseMs: number;
}

/** Effects stay under the voice: this is below `GAIN_LEVEL`. */
export const EFFECT_PEAK_GAIN = 0.25;

/** Gap on the audio clock between an outcome cue and a `zone-start` on the same tick. */
export const CUE_GAP_MS = 450;

export const SOUNDS: readonly SoundSpec[] = [
  {
    id: 'zone-start',
    voices: [{ wave: 'sine', fromHz: 520, toHz: 660, level: 1 }],
    peakGain: 0.2,
    attackMs: 160,
    holdMs: 60,
    releaseMs: 500,
  },
  {
    id: 'defeat',
    voices: [
      { wave: 'triangle', fromHz: 440, toHz: 700, level: 0.7 },
      { wave: 'sine', fromHz: 880, toHz: 880, level: 0.3 },
    ],
    peakGain: 0.25,
    attackMs: 190,
    holdMs: 40,
    releaseMs: 420,
  },
  {
    id: 'flee',
    voices: [{ wave: 'sine', fromHz: 600, toHz: 360, level: 1 }],
    peakGain: 0.2,
    attackMs: 160,
    holdMs: 40,
    releaseMs: 520,
  },
  {
    id: 'trapped',
    voices: [
      { wave: 'sine', fromHz: 330, toHz: 330, level: 0.6 },
      { wave: 'sine', fromHz: 495, toHz: 495, level: 0.4 },
    ],
    peakGain: 0.2,
    attackMs: 200,
    holdMs: 120,
    releaseMs: 600,
  },
  {
    id: 'end',
    voices: [
      { wave: 'sine', fromHz: 392, toHz: 392, level: 0.5 },
      { wave: 'sine', fromHz: 523, toHz: 523, level: 0.5 },
    ],
    peakGain: 0.22,
    attackMs: 200,
    holdMs: 200,
    releaseMs: 700,
  },
];

/** Total length of a sound in milliseconds. */
export function soundLengthMs(spec: SoundSpec): number {
  return spec.attackMs + spec.holdMs + spec.releaseMs;
}

/**
 * Gain `ms` after the sound starts. Piecewise linear: 0 at the start, a straight rise over
 * the attack, the peak through the hold, a straight fall over the release, then 0. It never
 * rises faster than `peakGain / attackMs`, which the tests hold at or below
 * `GAIN_STEP_PER_MS` from `speaker.ts` (so the voice and the effects share one rule), and
 * never exceeds `peakGain`.
 */
export function envelopeGainAt(spec: SoundSpec, ms: number): number {
  if (!(ms > 0)) return 0;
  const peak = Math.min(spec.peakGain, EFFECT_PEAK_GAIN, GAIN_LEVEL);
  const { attackMs, holdMs, releaseMs } = spec;
  if (ms < attackMs) return (peak * ms) / attackMs;
  if (ms <= attackMs + holdMs) return peak;
  const t = ms - attackMs - holdMs;
  if (t >= releaseMs) return 0;
  return peak * (1 - t / releaseMs);
}
