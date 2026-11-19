// Session state machine. See design section 5 (req 1.3, 2.1-2.6, 3.2-3.5, 5.2-5.7, 6.1, 6.3, 7.1-7.4, 7.7, 8.2, 8.5).
// Pure: no randomness, no DOM, no Date. Every function returns a new state.
import {
  DAMAGE_PER_SECOND,
  H_MAX,
  REQUIRE_LEVEL_MATCH,
  UNTRACKED_DRAIN,
  ZONE_DURATION,
  ZONE_ORDER,
} from './constants';
import { computeMissScores, startingHealth } from './miss-score';
import { isRareEligibleForNewSession } from './monster-book';
import { assignMonsters, resolveMonster } from './monsters';
import { classifyTimeOfDay } from './time-of-day';
import type {
  BrushingSignal,
  MonsterDef,
  MonsterState,
  SessionState,
  StartInput,
  Zone,
  ZoneId,
} from './types';

function makeZone(id: ZoneId, index: number): Zone {
  const [level, side] = id.split('-') as ['upper' | 'lower', 'left' | 'right'];
  return { id, side, level, index, label: `${level} ${side}` };
}

function makeMonster(def: MonsterDef, zone: Zone, health: number): MonsterState {
  return {
    def,
    zoneId: zone.id,
    health,
    startingHealth: health,
    maxHealth: H_MAX,
    outcome: 'pending',
    defeatedAtElapsed: null,
  };
}

/** Builds the state at second 0 of a session (design section 5). */
export function startSession(input: StartInput): SessionState {
  const zones = ZONE_ORDER.map(makeZone);
  const timeOfDay = classifyTimeOfDay(input.hour);
  const today = input.pastSessions.filter((s) => s.date === input.date);
  const rareEligible = isRareEligibleForNewSession(today, timeOfDay);
  const defs = assignMonsters(input.pastSessions, rareEligible);
  const missScores = computeMissScores(input.pastSessions);
  const health = (z: Zone): number =>
    input.mode === 'timer-only' ? H_MAX : startingHealth(z, missScores);
  const monsters = zones.map((z) => makeMonster(defs[z.index], z, health(z)));
  return {
    mode: input.mode,
    zones,
    activeZoneIndex: 0,
    zoneTimeRemaining: ZONE_DURATION,
    monsters,
    secondsBrushedPerZone: [0, 0, 0, 0],
    secondsUntrackedPerZone: [0, 0, 0, 0],
    secondsSmokeClearedPerZone: [0, 0, 0, 0],
    ticksDone: 0,
    startedAt: input.startedAt,
    date: input.date,
    timeOfDay,
    phase: 'running',
  };
}

/** True when the signal shows the given zone being brushed (req 5.4, 5.5, 5.7, 6.3). */
export function isBrushing(signal: BrushingSignal | null, zone: Zone): boolean {
  return (
    signal !== null &&
    signal.handNearMouth &&
    signal.moving &&
    signal.side === zone.side &&
    (!REQUIRE_LEVEL_MATCH || signal.level === zone.level)
  );
}

function bump(values: readonly number[], index: number): number[] {
  return values.map((v, i) => (i === index ? v + 1 : v));
}

/** Advances the session by one second. Paused or ended sessions are returned unchanged. */
export function tick(state: SessionState, signal: BrushingSignal | null): SessionState {
  if (state.phase !== 'running') return state;

  const s = state.mode === 'timer-only' ? null : signal;
  const zoneIndex = state.activeZoneIndex;
  const zone = state.zones[zoneIndex];
  const elapsed = ZONE_DURATION - state.zoneTimeRemaining + 1;

  let damage = 0;
  let progress = false;
  let brushed = state.secondsBrushedPerZone;
  let untracked = state.secondsUntrackedPerZone;
  if (s === null) {
    damage = UNTRACKED_DRAIN;
    untracked = bump(untracked, zoneIndex);
    progress = true;
  } else if (isBrushing(s, zone)) {
    damage = DAMAGE_PER_SECOND;
    brushed = bump(brushed, zoneIndex);
    progress = true;
  }

  let monster = state.monsters[zoneIndex];
  let smoke = state.secondsSmokeClearedPerZone;
  if (monster.outcome === 'defeated') {
    if (progress) smoke = bump(smoke, zoneIndex);
  } else {
    const health = Math.max(0, monster.health - damage);
    monster =
      health === 0
        ? { ...monster, health, outcome: 'defeated', defeatedAtElapsed: elapsed }
        : { ...monster, health };
  }

  const zoneTimeRemaining = state.zoneTimeRemaining - 1;
  let activeZoneIndex = zoneIndex;
  let nextRemaining = zoneTimeRemaining;
  let phase: SessionState['phase'] = state.phase;
  if (zoneTimeRemaining === 0) {
    monster = resolveMonster(monster);
    if (zoneIndex === state.zones.length - 1) {
      phase = 'ended';
    } else {
      activeZoneIndex = zoneIndex + 1;
      nextRemaining = ZONE_DURATION;
    }
  }

  return {
    ...state,
    activeZoneIndex,
    zoneTimeRemaining: nextRemaining,
    monsters: state.monsters.map((m, i) => (i === zoneIndex ? monster : m)),
    secondsBrushedPerZone: brushed,
    secondsUntrackedPerZone: untracked,
    secondsSmokeClearedPerZone: smoke,
    ticksDone: state.ticksDone + 1,
    phase,
  };
}

/** running -> paused; any other phase is returned unchanged (req 2.6). */
export function pause(state: SessionState): SessionState {
  return state.phase === 'running' ? { ...state, phase: 'paused' } : state;
}

/** paused -> running; any other phase is returned unchanged (req 2.6). */
export function resume(state: SessionState): SessionState {
  return state.phase === 'paused' ? { ...state, phase: 'running' } : state;
}
