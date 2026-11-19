import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { GAIN_LEVEL, GAIN_STEP_PER_MS, pickLocalVoice, rampGain } from '../src/audio/speaker';

describe('rampGainIsGentle', () => {
  it('starts at 0', () => {
    expect(rampGain(0)).toBe(0);
    expect(rampGain(-50)).toBe(0);
  });

  it('never exceeds the set level, for any time', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 5000 }), (ms) => {
        const gain = rampGain(ms);
        expect(gain).toBeGreaterThanOrEqual(0);
        expect(gain).toBeLessThanOrEqual(GAIN_LEVEL);
      }),
    );
  });

  it('never rises faster than the set step, and never falls', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 5000 }), fc.integer({ min: 0, max: 5000 }), (a, b) => {
        const from = Math.min(a, b);
        const to = Math.max(a, b);
        const rise = rampGain(to) - rampGain(from);
        expect(rise).toBeGreaterThanOrEqual(0);
        expect(rise).toBeLessThanOrEqual((to - from) * GAIN_STEP_PER_MS + 1e-12);
      }),
    );
  });

  it('is below the full level for the first moments', () => {
    expect(rampGain(1)).toBeLessThan(GAIN_LEVEL);
    expect(rampGain(5000)).toBe(GAIN_LEVEL);
  });
});

describe('voice chooser', () => {
  const voiceArb = fc.record({
    name: fc.string(),
    localService: fc.boolean(),
    lang: fc.constantFrom('en-US', 'en-IN', 'en-GB', 'hi-IN', 'fr-FR', 'en'),
  });

  it('a non-local voice is never chosen', () => {
    fc.assert(
      fc.property(fc.array(voiceArb, { maxLength: 12 }), (voices) => {
        const chosen = pickLocalVoice(voices);
        if (chosen !== null) {
          expect(chosen.localService).toBe(true);
          expect(voices).toContain(chosen);
        }
      }),
    );
  });

  it('returns null when no voice is local', () => {
    const voices = [
      { name: 'a', localService: false, lang: 'en-IN' },
      { name: 'b', localService: false, lang: 'en-US' },
    ];
    expect(pickLocalVoice(voices)).toBeNull();
    expect(pickLocalVoice([])).toBeNull();
  });

  it('prefers a local en-IN voice, and ignores a local voice in another language', () => {
    const us = { name: 'us', localService: true, lang: 'en-US' };
    const india = { name: 'in', localService: true, lang: 'en-IN' };
    const hindi = { name: 'hi', localService: true, lang: 'hi-IN' };
    const remoteIndia = { name: 'remote', localService: false, lang: 'en-IN' };
    expect(pickLocalVoice([remoteIndia, us, india])).toBe(india);
    expect(pickLocalVoice([hindi, remoteIndia])).toBeNull();
  });
});
