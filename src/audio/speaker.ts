// Speaks a voice line (req 4.1, 4.4, 12.9): a shipped clip if there is one, else a local
// (on-device) Web Speech voice, else nothing (the caption is always shown by the screen).
// No cloud speech. No timer here: the gentle volume ramp is handed to the audio graph as a
// precomputed curve, so `src/ui/game-loop.ts` stays the only module that owns a timer.
import { getLine } from './lines';

/** The loudest the game ever plays (0 to 1). */
export const GAIN_LEVEL = 0.8;
/** The gain takes this long to rise from silence to `GAIN_LEVEL`. */
export const RAMP_MS = 600;
/** The steepest allowed rise, in gain per millisecond. */
export const GAIN_STEP_PER_MS = GAIN_LEVEL / RAMP_MS;

/** Line ids that ship with a recorded clip at `assets/voice/<id>.mp3`. None yet. */
export const CLIP_LINE_IDS: readonly string[] = [];

/**
 * Gain for a sound that started `msSinceStart` ago: 0 at the start, rising in a straight
 * line, never above `GAIN_LEVEL`, never rising faster than `GAIN_STEP_PER_MS`.
 */
export function rampGain(msSinceStart: number): number {
  if (!(msSinceStart > 0)) return 0;
  return Math.min(GAIN_LEVEL, msSinceStart * GAIN_STEP_PER_MS);
}

/** The part of a speech voice the chooser looks at. */
export interface VoiceInfo {
  readonly localService: boolean;
  readonly lang: string;
}

/**
 * Picks an English voice that is marked local (on-device), preferring en-IN. Returns
 * `null` when there is none: a voice that is not local is never chosen (req 12.9).
 */
export function pickLocalVoice<T extends VoiceInfo>(voices: readonly T[]): T | null {
  const local = voices.filter((v) => v.localService === true && /^en([-_]|$)/i.test(v.lang));
  return local.find((v) => /^en[-_]in$/i.test(v.lang)) ?? local[0] ?? null;
}

export interface Speaker {
  /** Call from inside a tap handler: lets the browser play sound afterwards. */
  unlock(): void;
  /** Speaks the line with this id, after anything already being said. */
  say(lineId: string): void;
  /** Stops anything being said or queued. */
  stop(): void;
}

/** A speaker that says nothing. */
export const silentSpeaker: Speaker = { unlock() {}, say() {}, stop() {} };

/** Number of points in the volume curve handed to the audio graph. */
const CURVE_POINTS = 16;

function rampCurve(): Float32Array {
  const curve = new Float32Array(CURVE_POINTS);
  for (let i = 0; i < CURVE_POINTS; i++) curve[i] = rampGain((RAMP_MS * i) / (CURVE_POINTS - 1));
  return curve;
}

/** Speaks free text, such as a monster's name (req 7.4). Not a voice line: it has no id. */
export interface TextSpeaker {
  /** Cancels what is being said, then speaks the text. Does nothing without a local voice. */
  sayText(text: string): void;
}

/** The browser speaker. Safe to create where no audio or speech exists: it then says nothing. */
export function createBrowserSpeaker(): Speaker & TextSpeaker {
  const g = globalThis as unknown as {
    AudioContext?: typeof AudioContext;
    speechSynthesis?: SpeechSynthesis;
    SpeechSynthesisUtterance?: typeof SpeechSynthesisUtterance;
  };
  let context: AudioContext | null = null;
  let current: HTMLAudioElement | null = null;

  function playClip(lineId: string): boolean {
    if (!CLIP_LINE_IDS.includes(lineId) || !context) return false;
    try {
      const element = new Audio(`assets/voice/${lineId}.mp3`);
      const gain = context.createGain();
      gain.gain.setValueCurveAtTime(rampCurve(), context.currentTime, RAMP_MS / 1000);
      context.createMediaElementSource(element).connect(gain).connect(context.destination);
      current?.pause();
      current = element;
      void element.play().catch(() => {});
      return true;
    } catch {
      return false;
    }
  }

  function speak(text: string): void {
    const synth = g.speechSynthesis;
    const Utterance = g.SpeechSynthesisUtterance;
    if (!synth || !Utterance) return;
    try {
      const voice = pickLocalVoice(synth.getVoices());
      if (!voice) return; // no local voice: caption only
      const utterance = new Utterance(text);
      utterance.voice = voice;
      utterance.lang = voice.lang;
      utterance.volume = GAIN_LEVEL;
      synth.speak(utterance);
    } catch {
      // caption only
    }
  }

  return {
    unlock(): void {
      try {
        if (g.AudioContext && !context) context = new g.AudioContext();
        void context?.resume().catch(() => {});
      } catch {
        context = null;
      }
    },

    say(lineId: string): void {
      const line = getLine(lineId);
      if (!line) return;
      if (playClip(lineId)) return;
      speak(line.text);
    },

    sayText(text: string): void {
      try {
        g.speechSynthesis?.cancel();
      } catch {
        // nothing to cancel
      }
      speak(text);
    },

    stop(): void {
      try {
        g.speechSynthesis?.cancel();
        current?.pause();
      } catch {
        // nothing to stop
      }
    },
  };
}
