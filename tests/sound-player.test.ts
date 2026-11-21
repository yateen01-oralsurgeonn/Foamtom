import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createSoundPlayer } from '../src/audio/sound-player';
import { SOUNDS, type SoundId } from '../src/audio/sounds';

interface FakeParam {
  value: number;
  curve: Float32Array | null;
  curveStart: number;
  setValueCurveAtTime(curve: Float32Array, start: number, duration: number): void;
  setValueAtTime(v: number, t: number): void;
  linearRampToValueAtTime(v: number, t: number): void;
}

function param(): FakeParam {
  return {
    value: 1,
    curve: null,
    curveStart: -1,
    setValueCurveAtTime(curve, start) {
      this.curve = curve;
      this.curveStart = start;
    },
    setValueAtTime() {},
    linearRampToValueAtTime() {},
  };
}

class FakeOscillator {
  type = 'sine';
  frequency = param();
  onended: (() => void) | null = null;
  startedAt: number | null = null;
  stoppedAt: number | null | 'now' = null;
  connect(): void {}
  start(t: number): void {
    this.startedAt = t;
  }
  stop(t?: number): void {
    this.stoppedAt = t === undefined ? 'now' : t;
  }
}

class FakeGain {
  gain = param();
  connect(): void {}
}

interface Options {
  throwOnCreate?: boolean;
  throwOnOscillator?: boolean;
}

function installFakeAudio(options: Options = {}) {
  const made = { contexts: 0, oscillators: [] as FakeOscillator[], gains: [] as FakeGain[] };
  class FakeContext {
    currentTime = 10;
    destination = {};
    constructor() {
      if (options.throwOnCreate) throw new Error('no audio');
      made.contexts += 1;
    }
    resume(): Promise<void> {
      return Promise.resolve();
    }
    createGain(): FakeGain {
      const gain = new FakeGain();
      made.gains.push(gain);
      return gain;
    }
    createOscillator(): FakeOscillator {
      if (options.throwOnOscillator) throw new Error('no oscillator');
      const osc = new FakeOscillator();
      made.oscillators.push(osc);
      return osc;
    }
  }
  (globalThis as Record<string, unknown>).AudioContext = FakeContext;
  return made;
}

const original = (globalThis as Record<string, unknown>).AudioContext;
afterEach(() => {
  (globalThis as Record<string, unknown>).AudioContext = original;
});

describe('soundPlayerSafe', () => {
  it('play before unlock does nothing and does not throw', () => {
    const made = installFakeAudio();
    const player = createSoundPlayer();
    expect(() => player.play('defeat')).not.toThrow();
    expect(made.contexts).toBe(0);
    expect(made.oscillators).toHaveLength(0);
  });

  it('a context that throws on creation leaves the player silent without throwing', () => {
    const made = installFakeAudio({ throwOnCreate: true });
    const player = createSoundPlayer();
    expect(() => player.unlock()).not.toThrow();
    expect(() => player.play('zone-start')).not.toThrow();
    expect(() => player.stop()).not.toThrow();
    expect(made.oscillators).toHaveLength(0);
  });

  it('a context that throws on createOscillator leaves the player silent without throwing', () => {
    installFakeAudio({ throwOnOscillator: true });
    const player = createSoundPlayer();
    player.unlock();
    expect(() => player.play('flee')).not.toThrow();
    expect(() => player.stop()).not.toThrow();
  });

  it('with no AudioContext at all, everything is a quiet no-op', () => {
    (globalThis as Record<string, unknown>).AudioContext = undefined;
    const player = createSoundPlayer();
    expect(() => {
      player.unlock();
      player.play('end');
      player.stop();
    }).not.toThrow();
  });

  it('unlock twice is safe and creates one context', () => {
    const made = installFakeAudio();
    const player = createSoundPlayer();
    player.unlock();
    expect(() => player.unlock()).not.toThrow();
    expect(made.contexts).toBe(1);
  });

  it('plays one oscillator per voice, scheduled on the audio clock with the delay', () => {
    const made = installFakeAudio();
    const player = createSoundPlayer();
    player.unlock();
    const ids: SoundId[] = SOUNDS.map((s) => s.id);
    for (const id of ids) player.play(id, 450);
    const total = SOUNDS.reduce((n, s) => n + s.voices.length, 0);
    expect(made.oscillators).toHaveLength(total);
    for (const osc of made.oscillators) {
      expect(osc.startedAt).toBeCloseTo(10.45, 9);
      expect(typeof osc.stoppedAt).toBe('number');
      expect(osc.stoppedAt as number).toBeGreaterThan(10.45);
    }
  });

  it('a played sound starts at gain 0 and ends at gain 0', () => {
    const made = installFakeAudio();
    const player = createSoundPlayer();
    player.unlock();
    player.play('defeat');
    const withCurve = made.gains.filter((g) => g.gain.curve !== null);
    expect(withCurve).toHaveLength(1);
    const master = withCurve[0]!;
    expect(master.gain.value).toBe(0);
    expect(master.gain.curve![0]).toBe(0);
    expect(master.gain.curve![master.gain.curve!.length - 1]).toBe(0);
    expect(master.gain.curveStart).toBeCloseTo(10, 9);
  });

  it('stop stops every live oscillator', () => {
    const made = installFakeAudio();
    const player = createSoundPlayer();
    player.unlock();
    player.play('defeat');
    player.play('trapped', 450);
    player.stop();
    expect(made.oscillators.length).toBeGreaterThan(0);
    for (const osc of made.oscillators) expect(osc.stoppedAt).toBe('now');
  });

  it('an oscillator that ended is not stopped again', () => {
    const made = installFakeAudio();
    const player = createSoundPlayer();
    player.unlock();
    player.play('flee');
    const osc = made.oscillators[0]!;
    const scheduledStop = osc.stoppedAt;
    osc.onended?.();
    player.stop();
    expect(osc.stoppedAt).toBe(scheduledStop);
  });

  it('the source has no setTimeout, setInterval or requestAnimationFrame', () => {
    const source = readFileSync('src/audio/sound-player.ts', 'utf8');
    expect(source).not.toMatch(/setTimeout|setInterval|requestAnimationFrame/);
  });
});
