// One speaker and one sound player, with one unlock and one stop for both (req 10.7, 10.8).
// So every existing `speaker.stop()` call (pause, session end, drop, back to start) also stops
// every sound. No mute control and no music (req 10.10, 10.11).
import { createSoundPlayer } from './sound-player';
import type { Sounds } from './sound-player';
import { createBrowserSpeaker } from './speaker';
import type { Speaker, TextSpeaker } from './speaker';

export interface AudioKit {
  readonly speaker: Speaker & TextSpeaker;
  readonly sounds: Sounds;
}

export interface AudioKitDeps {
  readonly speaker?: Speaker & Partial<TextSpeaker>;
  readonly sounds?: Sounds;
}

export function createAudioKit(deps: AudioKitDeps = {}): AudioKit {
  const voice = deps.speaker ?? createBrowserSpeaker();
  const sounds = deps.sounds ?? createSoundPlayer();
  const speaker: Speaker & TextSpeaker = {
    unlock(): void {
      voice.unlock();
      sounds.unlock();
    },
    say(lineId: string): void {
      voice.say(lineId);
    },
    sayText(text: string): void {
      voice.sayText?.(text);
    },
    stop(): void {
      voice.stop();
      sounds.stop();
    },
  };
  return { speaker, sounds };
}
