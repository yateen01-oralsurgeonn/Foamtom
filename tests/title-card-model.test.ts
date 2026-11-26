import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { MONSTERS } from '../src/logic/monsters';
import { MONSTER_LOOKS } from '../src/ui/monster-looks';
import {
  CARD_MONSTER_ID,
  STAGE,
  TIMELINE,
  isStill,
  titleCardModel,
  type CardLineRole,
} from '../promo/title-card-model';

const ADDRESS = 'github.com/yateen01-oralsurgeonn/Foamtom';
const ROLES: readonly CardLineRole[] = ['title', 'subtitle', 'tagline', 'credit', 'address'];

describe('startCardText', () => {
  it('has exactly the title and the subtitle', () => {
    const m = titleCardModel('start');
    expect(m.card).toBe('start');
    expect(m.lines).toEqual([
      { role: 'title', text: 'FOAMTOM' },
      { role: 'subtitle', text: 'The Haunted Mirror' },
    ]);
  });
});

describe('endCardText', () => {
  it('has exactly the four lines, with the middle dot', () => {
    const m = titleCardModel('end');
    expect(m.card).toBe('end');
    expect(m.lines.map((l) => l.text)).toEqual([
      'FOAMTOM',
      "Free \u00B7 in your phone's browser",
      'Built with Kiro',
      ADDRESS,
    ]);
    expect(m.lines.map((l) => l.role)).toEqual(['title', 'tagline', 'credit', 'address']);
  });
});

describe('unknownCardIsStart', () => {
  const start = titleCardModel('start');

  it('gives the start card for the fixed odd values', () => {
    for (const v of [null, undefined, '', 'END', 'Start ', 'end ', 'banana']) {
      expect(titleCardModel(v)).toEqual(start);
    }
  });

  it('gives the start card for any string that is neither start nor end', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => s !== 'start' && s !== 'end'),
        (s) => {
          expect(titleCardModel(s)).toEqual(start);
        },
      ),
    );
  });
});

describe('cardWording', () => {
  const BANNED = /(^|[^a-z])(clinic|registr|cure|prevent|guarantee)/;
  const allLines = [...titleCardModel('start').lines, ...titleCardModel('end').lines];

  it('the matcher flags what it must and passes what it must', () => {
    for (const ok of ['FOAMTOM', 'Built with Kiro']) expect(BANNED.test(ok.toLowerCase())).toBe(false);
    for (const bad of ['Prevents cavities', 'Registration no. 1', 'cure', 'Guaranteed', 'Our clinic']) {
      expect(BANNED.test(bad.toLowerCase())).toBe(true);
    }
  });

  it('no line holds a banned word start', () => {
    for (const l of allLines) expect(BANNED.test(l.text.toLowerCase())).toBe(false);
  });

  it('no line except the address holds a person name', () => {
    for (const l of allLines.filter((x) => x.role !== 'address')) {
      const t = l.text.toLowerCase();
      expect(t).not.toContain('yatin');
      expect(t).not.toContain('shinde');
      expect(t).not.toContain('dr.');
    }
  });

  it('no line has a phone-like digit run, an @ or http', () => {
    for (const l of allLines) {
      expect(/\d{7,}/.test(l.text)).toBe(false);
      expect(l.text).not.toContain('@');
      expect(l.text.toLowerCase()).not.toContain('http');
    }
  });
});

describe('onlyTheApprovedLines', () => {
  it('has 2 lines on the start card and 4 on the end card, all clean', () => {
    expect(titleCardModel('start').lines).toHaveLength(2);
    expect(titleCardModel('end').lines).toHaveLength(4);
    for (const card of ['start', 'end']) {
      for (const l of titleCardModel(card).lines) {
        expect(ROLES).toContain(l.role);
        expect(l.text.length).toBeGreaterThan(0);
        expect(l.text).toBe(l.text.trim());
      }
    }
  });
});

describe('stageSize', () => {
  it('is 1920 x 1080', () => {
    expect(STAGE).toEqual({ widthPx: 1920, heightPx: 1080 });
  });
});

describe('timelineTable', () => {
  it('has four contiguous one-second steps in order', () => {
    expect(TIMELINE.map((s) => s.id)).toEqual(['mirror', 'lights', 'monster', 'text']);
    expect(TIMELINE[0]?.startMs).toBe(0);
    for (const s of TIMELINE) expect(s.durationMs).toBe(1000);
    for (let i = 1; i < TIMELINE.length; i++) {
      const prev = TIMELINE[i - 1]!;
      expect(TIMELINE[i]!.startMs).toBe(prev.startMs + prev.durationMs);
    }
    const last = TIMELINE[TIMELINE.length - 1]!;
    expect(last.startMs + last.durationMs).toBe(4000);
  });
});

describe('isStillOnlyForOne', () => {
  it('is true for 1 and false for the fixed odd values', () => {
    expect(isStill('1')).toBe(true);
    for (const v of [null, undefined, '', '0', 'true', '01', '1 ']) expect(isStill(v)).toBe(false);
  });

  it('is false for any generated string other than 1', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => s !== '1'),
        (s) => {
          expect(isStill(s)).toBe(false);
        },
      ),
    );
  });
});

describe('cardMonsterExists', () => {
  it('is plaque-puff, one common entry, with a look row', () => {
    expect(CARD_MONSTER_ID).toBe('plaque-puff');
    const found = MONSTERS.filter((m) => m.id === CARD_MONSTER_ID);
    expect(found).toHaveLength(1);
    expect(found[0]?.rarity).toBe('common');
    expect(MONSTER_LOOKS[CARD_MONSTER_ID]).toBeDefined();
  });
});
