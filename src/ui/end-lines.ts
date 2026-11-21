// The two lines said when a session ends (req 9.2, 15.9): `end`, then the closing line.
// `say` queues speech after what is already being said, so the lines do not overlap and
// no timer is needed.
import type { Speaker } from '../audio/speaker';

export const END_LINE_IDS = ['end', 'end-close'] as const;

/** Says `end`, then `end-close`. */
export function speakEnd(speaker: Pick<Speaker, 'say'>): void {
  speaker.say('end');
  speaker.say('end-close');
}
