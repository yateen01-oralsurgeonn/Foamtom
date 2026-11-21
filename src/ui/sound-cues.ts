// Which sounds a state change calls for (design section 5.8, req 10.4, 10.6).
// Pure: no audio, no DOM, no clock, no randomness. Cues depend only on monster outcomes and the
// active zone index, never on the signal or on brushing speed.
import { CUE_GAP_MS, type SoundId } from '../audio/sounds';
import type { MonsterOutcome, SessionState } from '../logic/types';

/** A sound and a start delay on the audio clock (not a timer). */
export interface SoundCue {
  readonly id: SoundId;
  readonly delayMs: number;
}

const OUTCOME_SOUND: Readonly<Record<Exclude<MonsterOutcome, 'pending'>, SoundId>> = {
  defeated: 'defeat',
  fled: 'flee',
  trapped: 'trapped',
};

/**
 * The cues for the change from `prev` to `next`. The tick that ends the session gives none:
 * the end card plays its own `end` sound.
 */
export function cuesFor(prev: SessionState | null, next: SessionState): SoundCue[] {
  if (next.phase === 'ended') return [];
  const cues: SoundCue[] = [];
  if (prev !== null) {
    next.monsters.forEach((monster, i) => {
      const before = prev.monsters[i];
      if (before === undefined || before.outcome === monster.outcome) return;
      if (monster.outcome === 'pending') return;
      cues.push({ id: OUTCOME_SOUND[monster.outcome], delayMs: 0 });
    });
  }
  if (prev === null || next.activeZoneIndex > prev.activeZoneIndex) {
    cues.push({ id: 'zone-start', delayMs: cues.length > 0 ? CUE_GAP_MS : 0 });
  }
  return cues;
}
