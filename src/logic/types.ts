// Shared types for the pure game logic. No logic, no DOM. See design section 4.

// ── Brushing signal (req 5.1) ──
// The only thing that crosses from tracking into game logic.
// null in guided-timer mode (req 5.2).
export interface BrushingSignal {
  readonly handNearMouth: boolean;
  readonly side: 'left' | 'right' | 'unknown';
  readonly level: 'upper' | 'lower' | 'unknown';
  readonly moving: boolean;
}

// ── Zone (req 3) ──
export type Side = 'left' | 'right';
export type Level = 'upper' | 'lower';

// Zone identifiers in session order: upper-right → upper-left → lower-left → lower-right.
export type ZoneId = 'upper-right' | 'upper-left' | 'lower-left' | 'lower-right';

export interface Zone {
  readonly id: ZoneId;
  readonly side: Side;
  readonly level: Level;
  readonly index: number; // 0–3, position in zone order
  readonly label: string; // spoken/displayed name, e.g. "upper right"
}

// ── Monster (req 7, 10) ──
export type Rarity = 'common' | 'rare';
export type MonsterOutcome = 'pending' | 'defeated' | 'fled' | 'trapped';

// Static definition: lives in the src/logic/monsters.ts table (req 7.6, 10.4).
export interface MonsterDef {
  readonly id: string;
  readonly name: string;
  readonly rarity: Rarity;
  readonly unlockRule: string; // human-readable
}

// Per-zone monster state during a session.
export interface MonsterState {
  readonly def: MonsterDef;
  readonly zoneId: ZoneId;
  readonly health: number; // current, clamped to [0, startingHealth]
  readonly startingHealth: number; // after kind-proximity adjustment
  readonly maxHealth: number; // H_MAX (normal health)
  readonly outcome: MonsterOutcome;
  readonly defeatedAtElapsed: number | null; // seconds into the zone when health reached zero; null if it has not
}

// ── Session state (req 2, 5) ──
export type SessionMode = 'camera' | 'timer-only';
export type TimeOfDay = 'morning' | 'night' | 'neither';

// Full session state, advanced one tick at a time by tick().
export interface SessionState {
  readonly mode: SessionMode;
  readonly zones: readonly Zone[]; // 4 zones, ordered per req 3.2
  readonly activeZoneIndex: number; // 0–3
  readonly zoneTimeRemaining: number; // seconds left in current zone (30 → 0)
  readonly monsters: readonly MonsterState[]; // one per zone
  readonly secondsBrushedPerZone: readonly number[]; // [0,0,0,0], increments when signal matches
  readonly secondsUntrackedPerZone: readonly number[]; // [0,0,0,0], increments when the signal is null
  // Brushed or untracked seconds counted after that zone's monster was defeated; used only for drawing.
  readonly secondsSmokeClearedPerZone: readonly number[];
  readonly ticksDone: number; // 0 to 120
  readonly startedAt: number; // epoch ms
  readonly date: string; // YYYY-MM-DD
  readonly timeOfDay: TimeOfDay;
  readonly phase: 'running' | 'paused' | 'ended';
}

// ── Start input (plain values only) ──
export interface StartInput {
  readonly mode: SessionMode;
  readonly startedAt: number; // epoch ms, read once by main.ts
  readonly date: string; // YYYY-MM-DD, local, read once by main.ts
  readonly hour: number; // 0–23, local
  readonly pastSessions: readonly SessionResult[];
}

// ── Session result (req 9) ──
// Per-zone outcome.
export interface ZoneResult {
  readonly zoneId: ZoneId;
  readonly monsterId: string;
  readonly secondsBrushed: number; // matched seconds (camera) or 30 (timer-only)
  readonly secondsUntracked: number;
  readonly verified: boolean; // true only in camera mode when secondsUntracked ≤ 10
  readonly monsterOutcome: 'defeated' | 'fled' | 'trapped';
}

// Produced when the session ends.
export interface SessionResult {
  readonly date: string; // YYYY-MM-DD
  readonly timeOfDay: TimeOfDay;
  readonly mode: SessionMode;
  readonly zoneResults: readonly ZoneResult[];
  readonly monstersEarned: readonly string[];
  readonly startedAt: number; // epoch ms
  readonly durationSeconds: number; // ticks processed; 120 for every completed session
}

// ── Monster Book (req 10) ──
// Derived from all stored sessions (union of monstersEarned), not stored separately.
export interface MonsterBook {
  readonly unlockedIds: ReadonlySet<string>;
}

// ── Miss scores (req 14) ──
// Per-zone normalized miss score, [0, 1]. Computed from camera-mode sessions only.
// Derived each time, never stored.
export type MissScores = Record<ZoneId, number>;
