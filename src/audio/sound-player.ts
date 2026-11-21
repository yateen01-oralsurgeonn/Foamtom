// Plays the soft synthesised sounds (req 10). Web Audio only, no audio file, no timer: every
// start and stop is scheduled on the audio clock. The AudioContext is created in `unlock()`,
// which is called from a tap, so the game is silent until the first tap (req 10.7, 1.7).
// When audio is missing or fails, the game carries on silently (the screen shows everything).
import { SOUNDS, envelopeGainAt, soundLengthMs, type SoundId } from './sounds';

export interface Sounds {
  /** Call from inside a tap handler: lets the browser play sound afterwards. */
  unlock(): void;
  /** Plays the sound, starting `delayMs` from now on the audio clock. Ignored before `unlock()`. */
  play(id: SoundId, delayMs?: number): void;
  /** Stops every sound that is playing or scheduled. */
  stop(): void;
}

/** The envelope curve is sampled every this many milliseconds of sound time. */
const CURVE_STEP_MS = 20;

export function createSoundPlayer(): Sounds {
  const g = globalThis as unknown as { AudioContext?: typeof AudioContext };
  let context: AudioContext | null = null;
  const live = new Set<OscillatorNode>();

  return {
    unlock(): void {
      try {
        if (g.AudioContext && !context) context = new g.AudioContext();
        void context?.resume().catch(() => {});
      } catch {
        context = null;
      }
    },

    play(id: SoundId, delayMs = 0): void {
      if (!context) return;
      try {
        const spec = SOUNDS.find((s) => s.id === id);
        if (!spec) return;
        const lengthMs = soundLengthMs(spec);
        const start = context.currentTime + Math.max(0, delayMs) / 1000;
        const durationS = lengthMs / 1000;

        const points = Math.ceil(lengthMs / CURVE_STEP_MS) + 1;
        const curve = new Float32Array(points);
        for (let i = 0; i < points; i++) {
          curve[i] = envelopeGainAt(spec, Math.min(lengthMs, i * CURVE_STEP_MS));
        }
        const master = context.createGain();
        master.gain.value = 0;
        master.gain.setValueCurveAtTime(curve, start, durationS);
        master.connect(context.destination);

        for (const voice of spec.voices) {
          const level = context.createGain();
          level.gain.value = voice.level;
          level.connect(master);
          const osc = context.createOscillator();
          osc.type = voice.wave;
          osc.frequency.setValueAtTime(voice.fromHz, start);
          osc.frequency.linearRampToValueAtTime(voice.toHz, start + durationS);
          osc.connect(level);
          osc.onended = () => {
            live.delete(osc);
          };
          live.add(osc);
          osc.start(start);
          osc.stop(start + durationS);
        }
      } catch {
        // silent: every event is also shown on screen
      }
    },

    stop(): void {
      for (const osc of [...live]) {
        try {
          osc.stop();
        } catch {
          // already stopped
        }
      }
      live.clear();
    },
  };
}
