import { describe, expect, it } from 'vitest';
import { SESSION_DURATION } from '../src/logic/constants';
import { MONSTERS } from '../src/logic/monsters';
import { startSession, tick } from '../src/logic/session';
import { toSessionResult } from '../src/logic/session-result';
import type { SessionMode, SessionResult, SessionState } from '../src/logic/types';
import { createStorage } from '../src/storage/storage';
import type { StorageBackend } from '../src/storage/storage';

// Test helpers live in this file (tasks.md rules).
function fakeBackend(): StorageBackend {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
  };
}

function fakeClock(start: Date): {
  now(): Date;
  advanceMs(ms: number): void;
  setTo(date: Date): void;
} {
  let ms = start.getTime();
  return {
    now: () => new Date(ms),
    advanceMs: (delta) => {
      ms += delta;
    },
    setTo: (date) => {
      ms = date.getTime();
    },
  };
}

function localDate(now: Date): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

// Composes the same calls main.ts makes: load, startSession, ticks, toSessionResult, save.
function playSession(
  storage: ReturnType<typeof createStorage>,
  clock: ReturnType<typeof fakeClock>,
  mode: SessionMode,
): { state: SessionState; result: SessionResult } {
  const now = clock.now();
  let state = startSession({
    mode,
    startedAt: now.getTime(),
    date: localDate(now),
    hour: now.getHours(),
    pastSessions: storage.loadSessions(),
  });
  for (let i = 0; i < SESSION_DURATION; i++) {
    state = tick(state, null);
    clock.advanceMs(1000);
  }
  const result = toSessionResult(state);
  storage.saveSession(result);
  return { state, result };
}

const rareIds = MONSTERS.filter((m) => m.rarity === 'rare').map((m) => m.id);

function names(result: SessionResult): string[] {
  return result.zoneResults.map((z) => MONSTERS.find((m) => m.id === z.monsterId)?.name ?? '?');
}

describe('memory wired into the session', () => {
  it('saves a morning and a night timer-only session; the night one gets one rare monster on the last zone', () => {
    const storage = createStorage(fakeBackend());
    const clock = fakeClock(new Date(2026, 10, 19, 8, 0, 0));

    const morning = playSession(storage, clock, 'timer-only');
    expect(morning.result.timeOfDay).toBe('morning');
    expect(morning.result.zoneResults.some((z) => rareIds.includes(z.monsterId))).toBe(false);
    expect(storage.loadSessions()).toHaveLength(1);

    clock.setTo(new Date(2026, 10, 19, 20, 0, 0));
    const night = playSession(storage, clock, 'timer-only');
    expect(night.result.timeOfDay).toBe('night');
    expect(night.result.date).toBe(morning.result.date);

    expect(storage.loadSessions()).toEqual([morning.result, night.result]);

    const ids = night.result.zoneResults.map((z) => z.monsterId);
    expect(new Set(ids).size).toBe(4);
    expect(ids.filter((id) => rareIds.includes(id))).toHaveLength(1);
    expect(rareIds).toContain(ids[3]);
    expect(night.state.monsters[3].def.rarity).toBe('rare');
    // Timer-only: every monster starts at normal health.
    expect(night.state.monsters.every((m) => m.startingHealth === night.state.monsters[0].maxHealth)).toBe(true);
  });

  it('a third session takes its commons from the assignment rule', () => {
    const storage = createStorage(fakeBackend());
    const clock = fakeClock(new Date(2026, 10, 19, 8, 0, 0));
    const first = playSession(storage, clock, 'timer-only');
    clock.setTo(new Date(2026, 10, 19, 20, 0, 0));
    const second = playSession(storage, clock, 'timer-only');
    const third = playSession(storage, clock, 'timer-only');

    // Nothing owned: the first four commons in table order.
    expect(names(first.result)).toEqual(['Plaque Puff', 'Sugar Sprite', 'Gummy Gloop', 'Fuzzlefang']);
    // Four commons owned: the next three unowned commons, then the first rare.
    expect(names(second.result)).toEqual(['Crumb Goblin', 'Sticky Wisp', 'Molar Mumbler', 'Midnight Molar Ghoul']);
    // Only Tartar Tot unowned, then owned commons from position (2 x 4) mod 8 = 0. Morning and
    // night are both stored today, so the rare slot is the first unowned rare.
    expect(names(third.result)).toEqual(['Tartar Tot', 'Plaque Puff', 'Sugar Sprite', 'Dawn Drool Dragon']);
  });
});
