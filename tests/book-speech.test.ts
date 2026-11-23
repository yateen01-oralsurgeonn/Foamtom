import { afterEach, describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createBrowserSpeaker } from '../src/audio/speaker';
import { bookTapAction, monsterBookView } from '../src/ui/book-model';
import { createBookSpeech } from '../src/ui/book-speech';
import { MONSTERS } from '../src/logic/monsters';
import type { SessionResult } from '../src/logic/types';

function recordingSpeaker() {
  const calls: string[] = [];
  return {
    calls,
    stop: () => calls.push('stop'),
    sayText: (text: string) => calls.push(`sayText:${text}`),
    say: (id: string) => calls.push(`say:${id}`),
  };
}

function entriesFor(ids: readonly string[]) {
  const sessions = [{ monstersEarned: [...ids] }] as unknown as SessionResult[];
  return monsterBookView(sessions).entries;
}

describe('bookSpeech', () => {
  it('an owned tap calls stop then sayText(name) once', () => {
    const speaker = recordingSpeaker();
    const speech = createBookSpeech(speaker);
    const entry = entriesFor([MONSTERS[0].id])[0];
    speech.run(bookTapAction(entry));
    expect(speaker.calls).toEqual(['stop', `sayText:${MONSTERS[0].name}`]);
  });

  it('a second tap calls stop again before its own sayText', () => {
    const speaker = recordingSpeaker();
    const speech = createBookSpeech(speaker);
    const entries = entriesFor([MONSTERS[0].id, MONSTERS[1].id]);
    speech.run(bookTapAction(entries[0]));
    speech.run(bookTapAction(entries[1]));
    expect(speaker.calls).toEqual([
      'stop',
      `sayText:${MONSTERS[0].name}`,
      'stop',
      `sayText:${MONSTERS[1].name}`,
    ]);
  });

  it('a not-owned tap never calls sayText', () => {
    fc.assert(
      fc.property(fc.subarray(MONSTERS.map((m) => m.id)), (owned) => {
        const speaker = recordingSpeaker();
        const speech = createBookSpeech(speaker);
        for (const entry of entriesFor(owned)) {
          if (!entry.owned) speech.run(bookTapAction(entry));
        }
        expect(speaker.calls.some((c) => c.startsWith('sayText:'))).toBe(false);
      }),
    );
  });

  it('a rare silhouette tap calls stop then say(rare-invite)', () => {
    const speaker = recordingSpeaker();
    const speech = createBookSpeech(speaker);
    const rare = entriesFor([]).find((e) => e.rare)!;
    speech.run(bookTapAction(rare));
    expect(speaker.calls).toEqual(['stop', 'say:rare-invite']);
  });

  it('a common silhouette tap says nothing', () => {
    const speaker = recordingSpeaker();
    const speech = createBookSpeech(speaker);
    const common = entriesFor([]).find((e) => !e.rare)!;
    speech.run(bookTapAction(common));
    expect(speaker.calls).toEqual([]);
  });
});

describe('sayText without a local voice', () => {
  const g = globalThis as unknown as Record<string, unknown>;
  const saved = {
    speechSynthesis: g.speechSynthesis,
    SpeechSynthesisUtterance: g.SpeechSynthesisUtterance,
  };

  afterEach(() => {
    g.speechSynthesis = saved.speechSynthesis;
    g.SpeechSynthesisUtterance = saved.SpeechSynthesisUtterance;
  });

  function install(voices: unknown[]) {
    const events: string[] = [];
    g.speechSynthesis = {
      getVoices: () => voices,
      cancel: () => events.push('cancel'),
      speak: (u: { text: string }) => events.push(`speak:${u.text}`),
    };
    g.SpeechSynthesisUtterance = class {
      text: string;
      voice: unknown = null;
      lang = '';
      volume = 1;
      constructor(text: string) {
        this.text = text;
      }
    };
    return events;
  }

  it('does not throw and says nothing when there is no local voice', () => {
    const events = install([{ name: 'remote', localService: false, lang: 'en-IN' }]);
    expect(() => createBrowserSpeaker().sayText('Plaque Puff')).not.toThrow();
    expect(events.some((e) => e.startsWith('speak:'))).toBe(false);
  });

  it('does not throw when speech is not available at all', () => {
    g.speechSynthesis = undefined;
    g.SpeechSynthesisUtterance = undefined;
    expect(() => createBrowserSpeaker().sayText('Plaque Puff')).not.toThrow();
  });

  it('cancels, then speaks with a local voice', () => {
    const events = install([{ name: 'local', localService: true, lang: 'en-IN' }]);
    createBrowserSpeaker().sayText('Plaque Puff');
    expect(events).toEqual(['cancel', 'speak:Plaque Puff']);
  });
});
