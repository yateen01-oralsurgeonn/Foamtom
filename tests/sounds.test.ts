import { describe, expect, it } from 'vitest';
import { GAIN_LEVEL, GAIN_STEP_PER_MS } from '../src/audio/speaker';
import {
  CUE_GAP_MS,
  EFFECT_PEAK_GAIN,
  SOUNDS,
  envelopeGainAt,
  soundLengthMs,
  type SoundId,
} from '../src/audio/sounds';

const IDS: SoundId[] = ['zone-start', 'defeat', 'flee', 'trapped', 'end'];
const EPS = 1e-12;

describe('soundData', () => {
  it('has five sounds, one per SoundId', () => {
    expect(SOUNDS).toHaveLength(5);
    expect(SOUNDS.map((s) => s.id).sort()).toEqual([...IDS].sort());
    expect(CUE_GAP_MS).toBe(450);
  });

  it('keeps the effect peak below the voice level', () => {
    expect(EFFECT_PEAK_GAIN).toBe(0.25);
    expect(EFFECT_PEAK_GAIN).toBeLessThan(GAIN_LEVEL);
  });

  for (const spec of SOUNDS) {
    describe(spec.id, () => {
      const total = soundLengthMs(spec);

      it('starts at gain 0 and ends at gain 0', () => {
        expect(envelopeGainAt(spec, 0)).toBe(0);
        expect(envelopeGainAt(spec, -5)).toBe(0);
        expect(envelopeGainAt(spec, total)).toBeLessThanOrEqual(EPS);
        expect(envelopeGainAt(spec, total + 1)).toBe(0);
        expect(envelopeGainAt(spec, total + 5000)).toBe(0);
      });

      it('never rises by more than GAIN_STEP_PER_MS in 1 ms and never exceeds the caps', () => {
        let prev = envelopeGainAt(spec, 0);
        for (let ms = 1; ms <= total + 10; ms++) {
          const g = envelopeGainAt(spec, ms);
          expect(g - prev).toBeLessThanOrEqual(GAIN_STEP_PER_MS + EPS);
          expect(g).toBeGreaterThanOrEqual(0);
          expect(g).toBeLessThanOrEqual(GAIN_LEVEL);
          expect(g).toBeLessThanOrEqual(EFFECT_PEAK_GAIN);
          prev = g;
        }
      });

      it('keeps voices soft: levels, waves, pitches and length', () => {
        expect(spec.peakGain).toBeLessThanOrEqual(EFFECT_PEAK_GAIN);
        const sum = spec.voices.reduce((a, v) => a + v.level, 0);
        expect(sum).toBeLessThanOrEqual(1 + EPS);
        expect(spec.voices.length).toBeGreaterThan(0);
        for (const v of spec.voices) {
          expect(['sine', 'triangle']).toContain(v.wave);
          expect(v.level).toBeGreaterThan(0);
          for (const hz of [v.fromHz, v.toHz]) {
            expect(hz).toBeGreaterThanOrEqual(200);
            expect(hz).toBeLessThanOrEqual(1000);
          }
        }
        expect(total).toBeLessThanOrEqual(1500);
      });
    });
  }
});
