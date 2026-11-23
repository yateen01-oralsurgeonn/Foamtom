// Runs a Monster Book tap on a speaker (design section 5.7). No DOM, no timer.
// A new tap replaces what is being said and never queues (req 7.4).
import type { Speaker, TextSpeaker } from '../audio/speaker';
import type { BookTapAction } from './book-model';

export interface BookSpeech {
  run(action: BookTapAction): void;
}

export function createBookSpeech(
  speaker: Pick<Speaker, 'stop' | 'say'> & TextSpeaker,
): BookSpeech {
  return {
    run(action: BookTapAction): void {
      if (action.kind === 'say-name') {
        speaker.stop();
        speaker.sayText(action.text);
      } else if (action.kind === 'say-line') {
        speaker.stop();
        speaker.say(action.lineId);
      }
    },
  };
}
