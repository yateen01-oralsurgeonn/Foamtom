import { describe, expect, it } from 'vitest';
import { createAudioKit } from '../src/audio/audio-kit';
import type { Sounds } from '../src/audio/sound-player';
import type { Speaker } from '../src/audio/speaker';

function fakes(): { speaker: Speaker; sounds: Sounds; calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    speaker: {
      unlock: () => calls.push('speaker.unlock'),
      say: (id) => calls.push(`speaker.say:${id}`),
      stop: () => calls.push('speaker.stop'),
    },
    sounds: {
      unlock: () => calls.push('sounds.unlock'),
      play: (id) => calls.push(`sounds.play:${id}`),
      stop: () => calls.push('sounds.stop'),
    },
  };
}

describe('audioKit', () => {
  it('unlock reaches both the speaker and the player', () => {
    const f = fakes();
    createAudioKit({ speaker: f.speaker, sounds: f.sounds }).speaker.unlock();
    expect(f.calls).toContain('speaker.unlock');
    expect(f.calls).toContain('sounds.unlock');
  });

  it('stop reaches both the speaker and the player', () => {
    const f = fakes();
    createAudioKit({ speaker: f.speaker, sounds: f.sounds }).speaker.stop();
    expect(f.calls).toContain('speaker.stop');
    expect(f.calls).toContain('sounds.stop');
  });

  it('say reaches the speaker only', () => {
    const f = fakes();
    createAudioKit({ speaker: f.speaker, sounds: f.sounds }).speaker.say('start');
    expect(f.calls).toEqual(['speaker.say:start']);
  });

  it('exposes the given player as sounds', () => {
    const f = fakes();
    expect(createAudioKit({ speaker: f.speaker, sounds: f.sounds }).sounds).toBe(f.sounds);
  });

  it('has no member that mentions mute or volume', () => {
    const f = fakes();
    const kit = createAudioKit({ speaker: f.speaker, sounds: f.sounds });
    const names = [...Object.keys(kit), ...Object.keys(kit.speaker)];
    for (const name of names) expect(name).not.toMatch(/mute|volume/i);
  });
});
