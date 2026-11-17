# Design: core-brushing-loop

## 1. Overview

This design covers the pure game logic for a 2-minute brushing session (4 zones × 30 s),
the guided-timer fallback when no camera is available, a plain placeholder screen, and the
property-based tests that guard the logic.

All game logic lives in pure modules under `/src/logic/` with no DOM or camera access. The
only thing that crosses the boundary from the outside world is a per-second brushing signal
(or its absence in guided-timer mode). This separation lets every rule be property-tested
with fast-check without a browser or camera.

**Key design decisions (all flagged "Design choice" inline for Dr. Yatin's review):**

- Tick granularity is 1 second (not per-frame) to keep the logic and tests simple.
- `H_MAX = 60`, `DAMAGE_PER_SECOND = 3`: a normal monster is defeated after 20 s of matching brushing.
- Linear kind-proximity scaling from 100% to 60% of `H_MAX`.
- Timer-mode drain is computed from elapsed time, not accumulated.
- Rare eligibility is evaluated at session start, not retroactively.
- Tab-hidden pauses the zone timer (distinct from "child not brushing").

---

## 2. Architecture

```mermaid
graph TD
    subgraph Tracking ["Tracking — src/tracking"]
        CAM["Camera + MediaPipe<br/>→ BrushingSignal | null"]
    end
    subgraph Logic ["Pure Game Logic — src/logic"]
        SESSION["session.ts<br/>state machine, tick"]
        MONSTERS["monsters.ts<br/>monster table, health,<br/>defeat / trap / rescue"]
        BOOK["monster-book.ts<br/>unlock rules,<br/>rare eligibility"]
        MISS["miss-score.ts<br/>miss score,<br/>starting health"]
        TOD["time-of-day.ts<br/>morning / night / neither"]
        STATS["stats.ts<br/>verified time,<br/>zone most missed"]
        TYPES["types.ts<br/>shared interfaces"]
    end
    subgraph Storage ["Storage — src/storage"]
        STORE["storage.ts<br/>localStorage wrapper<br/>schema v1"]
    end
    subgraph UI ["UI — src/ui"]
        SCREEN["placeholder-screen.ts<br/>preview, monster,<br/>countdown, caption"]
    end
    subgraph Audio ["Audio — src/audio"]
        LINES["lines.ts<br/>voice lines + captions"]
    end

    CAM -- "BrushingSignal | null (per second)" --> SESSION
    SESSION --> MONSTERS
    SESSION --> TOD
    MISS --> SESSION
    SESSION --> BOOK
    SESSION --> STATS
    SESSION -- "SessionState" --> SCREEN
    SCREEN -- "play line" --> LINES
    SESSION -- "SessionResult" --> STORE
    STORE -- "past sessions" --> MISS
    STORE -- "past sessions" --> STATS
    STORE -- "past sessions" --> BOOK
```

**Data flow:** The tracking layer produces one `BrushingSignal` (or `null`) per second.
The UI calls `tick(state, signal)` each second. The logic updates state and the UI renders
it. When the session ends, the logic produces a `SessionResult` that the storage layer
persists. Before a new session, `miss-score.ts` reads past sessions to compute starting
health adjustments.

The dashed boundary around "Pure Game Logic" is the property-testable surface: everything
inside it has no DOM, no camera, no network, and no `Date` dependency. Inputs are plain
data; outputs are plain data.

---

## 3. Module list

Modules matching `structure.md`. One concept per file, kebab-case names.

| Module | Responsibility |
|--------|---------------|
| `src/logic/types.ts` | Shared TypeScript interfaces: `BrushingSignal`, `Zone`, `MonsterDef`, `MonsterState`, `SessionState`, `SessionResult`, `ZoneResult`, `MonsterBook`, `MissScores`, `TimeOfDay`, `SessionMode`. No logic, no DOM. |
| `src/logic/session.ts` | Session state machine: `startSession`, `tick`, `toSessionResult`. Zone advancement, timer countdown, damage/drain application, defeat/trap/resolve. Pure functions — same input always produces same output, no side effects. |
| `src/logic/monsters.ts` | Monster table (12 entries: 8 common, 4 rare), each `{ id, name, rarity, unlockRule }`. `assignMonsters(zones, rareEligible)`: picks one monster per zone from the eligible pool. `resolveMonster(state)`: applies defeat, trap, or rescue at zone end. |
| `src/logic/monster-book.ts` | `computeMonsterBook(sessions)`: union of all `monstersEarned` across sessions. `isRareEligible(sessions, date)`: returns true only when the day has ≥ 1 morning AND ≥ 1 night session. |
| `src/logic/miss-score.ts` | `computeMissScores(sessions)`: per-zone normalized miss score from camera-mode sessions only. `startingHealth(zone, missScores)`: applies kind-proximity scaling with the 60% floor. |
| `src/logic/time-of-day.ts` | `classifyTimeOfDay(hour)`: returns `'morning'`, `'night'`, or `'neither'` from the session start hour (0–23). Pure — no `Date` object needed. |
| `src/logic/stats.ts` | `computeVerifiedTime(sessions)`: total verified seconds across all sessions. `zoneMostMissed(sessions)`: zone with the highest miss from camera-mode sessions. Pure. (Parent screen UI is out of scope; only the computation is here.) |
| `src/storage/storage.ts` | `saveSession(result)`, `loadSessions()`, `saveMissScores(scores)`, `loadMissScores()`, `clearAll()`. Schema versioning. localStorage only. Throws caught by caller. |
| `src/tracking/tracking.ts` | Camera + MediaPipe → `BrushingSignal`. Placeholder stub for this spec (real tracking in another spec). Returns `null` when camera unavailable or quality is poor. |
| `src/ui/placeholder-screen.ts` | Mirrored camera preview (if allowed), one monster drawn over the active zone, countdown, zone caption. Portrait orientation, 48 px touch targets, no colour-only signals. |
| `src/audio/lines.ts` | Voice line table: `{ id, text, caption }`. Every line has a caption. Zone announcements and all spoken instructions live here. |

---

## 4. TypeScript types

Logic never touches `Date`, `Math.random`, the DOM or storage. `main.ts` reads the clock once and passes plain values in.

All types live in `src/logic/types.ts`. Field names match the requirements verbatim.

```typescript
// ── Brushing signal (req 5.1) ──
// The only thing that crosses from tracking into game logic.
// null in guided-timer mode (req 5.2).
interface BrushingSignal {
  readonly handNearMouth: boolean;
  readonly side: 'left' | 'right' | 'unknown';
  readonly level: 'upper' | 'lower' | 'unknown';
  readonly moving: boolean;
}

// ── Zone (req 3) ──
type Side = 'left' | 'right';
type Level = 'upper' | 'lower';

// Zone identifiers in session order: upper-right → upper-left → lower-left → lower-right.
type ZoneId = 'upper-right' | 'upper-left' | 'lower-left' | 'lower-right';

interface Zone {
  readonly id: ZoneId;
  readonly side: Side;
  readonly level: Level;
  readonly index: number;  // 0–3, position in zone order
  readonly label: string;  // spoken/displayed name, e.g. "upper right"
}

// ── Monster (req 7, 10) ──
type Rarity = 'common' | 'rare';
type MonsterOutcome = 'pending' | 'defeated' | 'fled' | 'trapped';

// Static definition — lives in the src/logic/monsters.ts table (req 7.6, 10.4).
interface MonsterDef {
  readonly id: string;
  readonly name: string;
  readonly rarity: Rarity;
  readonly unlockRule: string;  // human-readable
}

// Per-zone monster state during a session.
interface MonsterState {
  readonly def: MonsterDef;
  readonly zoneId: ZoneId;
  readonly health: number;               // current, clamped to [0, startingHealth]
  readonly startingHealth: number;  // after kind-proximity adjustment
  readonly maxHealth: number;       // H_MAX (normal health)
  readonly outcome: MonsterOutcome;
  readonly defeatedAtElapsed: number | null;  // seconds into the zone when health reached zero; null if it has not
}

// ── Session state (req 2, 5) ──
type SessionMode = 'camera' | 'timer-only';
type TimeOfDay = 'morning' | 'night' | 'neither';

// Full session state, advanced one tick at a time by tick().
interface SessionState {
  readonly mode: SessionMode;
  readonly zones: readonly Zone[];          // 4 zones, ordered per req 3.2
  readonly activeZoneIndex: number;                   // 0–3
  readonly zoneTimeRemaining: number;                  // seconds left in current zone (30 → 0)
  readonly monsters: readonly MonsterState[];         // one per zone
  readonly secondsBrushedPerZone: readonly number[];   // [0,0,0,0], increments when signal matches
  readonly secondsUntrackedPerZone: readonly number[]; // [0,0,0,0], increments when the signal is null
  // Brushed or untracked seconds counted after that zone's monster was defeated; used only for drawing.
  readonly secondsSmokeClearedPerZone: readonly number[];
  readonly ticksDone: number;                         // 0 to 120
  readonly startedAt: number;                 // epoch ms
  readonly date: string;                      // YYYY-MM-DD
  readonly timeOfDay: TimeOfDay;
  readonly phase: 'running' | 'paused' | 'ended';
}

// ── Start input (plain values only) ──
interface StartInput {
  readonly mode: SessionMode;
  readonly startedAt: number;   // epoch ms, read once by main.ts
  readonly date: string;        // YYYY-MM-DD, local, read once by main.ts
  readonly hour: number;        // 0–23, local
  readonly pastSessions: readonly SessionResult[];
}

// ── Session result (req 9) ──
// Per-zone outcome.
interface ZoneResult {
  readonly zoneId: ZoneId;
  readonly monsterId: string;
  readonly secondsBrushed: number;  // matched seconds (camera) or 30 (timer-only)
  readonly secondsUntracked: number;
  readonly verified: boolean;       // true only in camera mode when secondsUntracked ≤ 10
  readonly monsterOutcome: 'defeated' | 'fled' | 'trapped';
}

// Produced when the session ends.
interface SessionResult {
  readonly date: string;          // YYYY-MM-DD
  readonly timeOfDay: TimeOfDay;
  readonly mode: SessionMode;
  readonly zoneResults: readonly ZoneResult[];
  readonly monstersEarned: readonly string[];
  readonly startedAt: number;     // epoch ms
  readonly durationSeconds: number;  // ticks processed; 120 for every completed session
}

// ── Monster Book (req 10) ──
// Derived from all stored sessions (union of monstersEarned), not stored separately.
interface MonsterBook {
  readonly unlockedIds: ReadonlySet<string>;
}

// ── Miss scores (req 14) ──
// Per-zone normalized miss score, [0, 1]. Computed from camera-mode sessions only.
type MissScores = Record<ZoneId, number>;
```

---

## 5. Session state machine

The state machine is the same for both modes and there is one tick rule. In timer-only mode every signal is treated as `null`.

```mermaid
stateDiagram-v2
    [*] --> running: startSession(input)
    state running {
        [*] --> Zone0
        Zone0 --> Zone1: zone timer reaches 0 → resolve monster
        Zone1 --> Zone2: zone timer reaches 0 → resolve monster
        Zone2 --> Zone3: zone timer reaches 0 → resolve monster
    }
    running --> paused: pause()
    paused --> running: resume()
    running --> ended: zone 3 timer reaches 0 → resolve monster
    ended --> [*]: toSessionResult → save
```

### Tick pseudocode

```
tick(state, signal):
  if state.phase != 'running': return state          // paused or ended: no change
  s = (state.mode == 'timer-only') ? null : signal
  zone, monster = the active zone and its monster
  elapsed = ZONE_DURATION - state.zoneTimeRemaining + 1

  if s == null:                 damage = UNTRACKED_DRAIN (2); untracked[zone] += 1; progress = true
  else if isBrushing(s, zone):  damage = DAMAGE_PER_SECOND (3); brushed[zone] += 1; progress = true
  else:                         damage = 0; progress = false

  if monster.outcome == 'defeated':
    if progress: smokeCleared[zone] += 1             // drawing only
  else:
    monster.health = max(0, monster.health - damage)
    if monster.health == 0:
      monster.outcome = 'defeated'; monster.defeatedAtElapsed = elapsed

  zoneTimeRemaining -= 1; ticksDone += 1

  if zoneTimeRemaining == 0:
    if monster.outcome == 'pending':
      monster.outcome = (monster.health <= RESCUE_THRESHOLD) ? 'fled' : 'trapped'
    if this was zone 3: phase = 'ended'
    else: activeZoneIndex += 1; zoneTimeRemaining = ZONE_DURATION

  return a NEW state object (the input state is not changed)
```

Health only ever goes down, and by whole numbers.

### `isBrushing(signal, zone)` — req 5.4–5.5, 6.3

```
isBrushing(signal, zone):
  return signal != null
    and signal.handNearMouth == true
    and signal.moving == true
    and signal.side == zone.side          // 'unknown' never matches
    and (REQUIRE_LEVEL_MATCH == false or signal.level == zone.level)   // 'unknown' never matches when checked (req 5.7)
```

When any checked field is `'unknown'`, the signal does not match (req 6.3). The zone timer still
runs (req 6.1). No nag is shown (req 6.2).

`pause(state)`: running → paused, otherwise unchanged. `resume(state)`: paused →
running, otherwise unchanged. Both return a new state. (req 2.6)

### `toSessionResult(state)` — req 9.1–9.3

- Only valid when `phase == 'ended'`.
- Timer-only: each zone has `secondsBrushed = 30`, `secondsUntracked = 0`,
  `verified = false`.
- Camera: `secondsBrushed` and `secondsUntracked` are the counted values;
  `verified = (secondsUntracked <= UNTRACKED_LIMIT)`. (req 9.3)
- `monstersEarned` = the ids of all four monsters (req 10.1, 10.2).
- `durationSeconds = ticksDone`.

### `startSession(input: StartInput)` — req 2.1, 3.2, 14.2

```
startSession(input):
  zones       = ZONE_ORDER.map(makeZone)
  timeOfDay   = classifyTimeOfDay(input.hour)
  today       = input.pastSessions.filter(s => s.date == input.date)
  rare        = isRareEligibleForNewSession(today, timeOfDay)
  defs        = assignMonsters(input.pastSessions, rare)        // fixed rule, no randomness
  missScores  = computeMissScores(input.pastSessions)
  health(z)   = input.mode == 'timer-only' ? H_MAX : startingHealth(z, missScores)
  monsters    = zones.map(z => makeMonster(defs[z.index], z, health(z)))
  return { mode, zones, activeZoneIndex: 0, zoneTimeRemaining: 30, monsters,
           secondsBrushedPerZone: [0,0,0,0], secondsUntrackedPerZone: [0,0,0,0],
           secondsSmokeClearedPerZone: [0,0,0,0], ticksDone: 0,
           startedAt: input.startedAt, date: input.date, timeOfDay, phase: 'running' }
```

> **Design choice:** The logic processes 1-second ticks. Per-frame camera signals (20+ fps)
> are aggregated by the tracking layer (the rule is defined in the `hand-tracking` spec) into one signal per second before being passed to
> `tick`. This keeps the logic simple and testable (120 ticks per session, not 2400). The
> UI may interpolate the countdown and monster health between ticks for smoothness — that
> is a rendering concern, not a logic one. Confirmed by Dr. Yatin 2026-11-15.

---

## 6. Health maths

### Constants

| Constant | Value | Meaning |
|----------|-------|---------|
| `ZONE_DURATION` | 30 s | Seconds per zone (req 2.1) |
| `ZONE_COUNT` | 4 | Zones per session |
| `SESSION_DURATION` | 120 s | Total session (req 2.1) |
| `H_MAX` | 60 | Normal monster health (max) |
| `DAMAGE_PER_SECOND` | 3 | Camera-mode damage per second of correct brushing (normal monster defeated after 20 s: `H_MAX / DAMAGE_PER_SECOND = 60 / 3 = 20`) |
| `KIND_FLOOR_RATIO` | 0.6 | Kind-proximity floor: starting health ≥ 60% of `H_MAX` (req 14.2) |
| `KIND_FLOOR` | 36 | `KIND_FLOOR_RATIO × H_MAX` |
| `RESCUE_THRESHOLD` | 9 | 15% of `H_MAX`; monster at ≤ 9 health at zone end is rescued (req 14.3) |
| `UNTRACKED_DRAIN` | 2 | Health lost per second when the signal is `null` (req 7.7); `H_MAX / ZONE_DURATION` |
| `UNTRACKED_LIMIT` | 10 | A camera-mode zone with more untracked seconds than this is unverified (req 9.3) |
| `MISS_WINDOW` | 7 | Number of most recent camera-mode sessions used for miss scores (req 14.1) |
| `REQUIRE_LEVEL_MATCH` | true | When false, level is ignored and only side is checked (req 5.7) |

> **Design choice:** `H_MAX = 60` and `DAMAGE_PER_SECOND = 3` so that a normal-strength
> monster is defeated after exactly 20 seconds of matching brushing (`60 / 3 = 20`).
> Starting health is rounded to a whole number and every change is −2 or −3, so health is
> always a whole number. Approved: defeat after 20 s of matching brushing. The 20 s leaves
> slack for seconds the tracker misses.

### Normal health (req 7.1)

Each zone monster's `maxHealth = H_MAX = 60`. Before kind-proximity adjustment, starting
health equals `maxHealth`. A child who brushes correctly for 20 seconds deals
`20 × 3 = 60` damage and defeats the monster.

### Camera-mode per-second damage (req 7.2)

When `isBrushing(signal, activeZone)` is true, the active monster loses
`DAMAGE_PER_SECOND = 3` health per second.

| Seconds brushed correctly | Damage | Remaining health | Outcome |
|---------------------------|--------|-----------------|---------|
| 20 | 60 | 0 | Defeated |
| 17 | 51 | 9 | Fled (rescued: 9 ≤ 9) |
| 16 | 48 | 12 | Trapped (12 > 9) |
| 0 | 0 | 60 | Trapped |

### Untracked drain (req 7.7, 8.5)

- When the signal is `null`, in either mode, the active monster loses
  `UNTRACKED_DRAIN = 2` per second. It is subtracted each tick, like camera damage.
- Timer-only mode: every signal is `null` and every monster starts at 60, so health is
  `60 − 2 × elapsed` and reaches 0 exactly at 30 s.
- Camera mode: a second the tracker cannot see costs the monster 2 instead of 3. Mixed
  example: 12 untracked seconds (−24) and 12 matched seconds (−36) defeat a normal
  monster.
- A camera-mode zone with more than 10 untracked seconds is saved as unverified.

### Kind-proximity starting health (req 14)

**Step 1 — Miss score per zone** (req 14.1, 13.9):

```
recent        = the MISS_WINDOW (7) most recent camera-mode sessions, by startedAt
For each session s in recent, each zone z whose result is verified:
  miss(s, z) = max(0, 30 - secondsBrushed - secondsUntracked)
n(z)          = number of verified results for z in recent
missScore(z)  = n(z) > 0 ? Σ miss(s, z) / (30 × n(z)) : 0
```

`missScore(z) ∈ [0, 1]`. Timer-only sessions, unverified zones and sessions older than the
7 most recent contribute nothing. A zone the
child always brushes fully has `missScore = 0`; a zone never brushed has `missScore = 1`.

**Step 2 — Starting health** (req 14.2):

```
startingHealth(z) = clamp(round(60 × (1 − 0.4 × missScore(z))), 36, 60)
```

Not applied in timer-only mode (starting health is always 60).

| Miss score | Starting health | % of normal |
|------------|-----------------|-------------|
| 0.0 (never missed) | 60 | 100% |
| 0.25 | 54 | 90% |
| 0.5 | 48 | 80% |
| 1.0 (always missed) | 36 | 60% (floor) |

Range: `[36, 60]` = `[60% × H_MAX, H_MAX]`. The monster is never already defeated (req 14.2).

> **Design choice:** Linear scaling from 100% to 60% of `H_MAX` as miss score goes from 0
> to 1. This is the simplest transparent mapping. A curved (eased) mapping could make the
> first few misses matter more, but linear is easiest to explain to a parent and to test.
> Linear curve
> confirmed by Dr. Yatin 2026-11-15.

### 15% rescue rule (req 14.3, 13.8)

At zone end (`zoneTimeRemaining == 0`), if the monster is still `'pending'`:

- `health ≤ RESCUE_THRESHOLD (9)` → **fled** ('flees into smoke'; counts as beaten).
- `health > RESCUE_THRESHOLD` → **trapped**.

In timer-only mode health is 0 at zone end, so the monster is already defeated and the
rescue never applies.

With kind proximity (starting health = 36), a child needs to brush only
`ceil((36 - 9) / 3) = 9` seconds correctly to defeat the monster (with rescue), instead of
17 seconds at full health. That is the kindness: often-missed zones need less brushing to
win.

### After a monster is beaten: smoke (req 7.8)

- When a monster is defeated before its zone ends, the zone keeps running and the screen
  shows smoke over the zone.
- `smokeFraction = 1 − secondsSmokeCleared / max(1, ZONE_DURATION − defeatedAtElapsed)`,
  clamped to [0, 1]. It is worked out for drawing only.
- The line "Keep brushing! Brush the smoke away!" is spoken and captioned once.
- Nothing is won or lost: no outcome, stored value or message depends on the smoke.

---

## 7. Morning / night classification (req 10.5)

```typescript
// src/logic/time-of-day.ts

function classifyTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 4 && hour <= 11) return 'morning';   // 04:00–11:59
  if (hour >= 17 && hour <= 23) return 'night';    // 17:00–23:59
  return 'neither';                                 // 00:00–03:59 or 12:00–16:59
}
```

Input is the session start hour (0–23) in local time. Pure — no `Date` object dependency,
so tests pass any hour directly.

The date and time of day are fixed when the session starts. A session that crosses
midnight keeps its start date.

### Rare eligibility (req 10.6–10.8)

```typescript
// src/logic/monster-book.ts
function isRareEligibleForNewSession(
  todaysSessions: readonly SessionResult[],   // stored sessions with today's date
  newTimeOfDay: TimeOfDay,                    // the session about to start
): boolean {
  const times = [...todaysSessions.map(s => s.timeOfDay), newTimeOfDay];
  return times.includes('morning') && times.includes('night');
}
```

Sessions classified `'neither'` count as normal sessions (saved, monsters earned) but do
not contribute to rare eligibility (req 10.8).

> **Design choice:** Rare eligibility is decided when the session starts and counts the
> session that is starting. So tonight's session is rare-eligible when a morning session
> was saved earlier today. (Corrected 2026-11-15: the earlier version needed a night
> session to be stored already, which could not be true at the first night session.)

### Monster assignment (req 10.9, 10.10)

```
assignMonsters(pastSessions, rareEligible):
  owned    = union of monstersEarned over pastSessions
  commons  = the 8 common monsters in table order
  start    = (pastSessions.length × 4) mod 8
  rotated  = commons from position start, wrapping round
  ordered  = [commons not owned, in table order] followed by [rotated, owned only]
  if rareEligible:
    rare   = first rare in table order not owned, else first rare in table order
    return [ordered[0], ordered[1], ordered[2], rare]      // rare on the last zone
  return [ordered[0], ordered[1], ordered[2], ordered[3]]
```

No randomness. The same past sessions always give the same four monsters.

Table order (req 10.4):

| # | Name | Rarity |
|---|------|--------|
| 1 | Plaque Puff | common |
| 2 | Sugar Sprite | common |
| 3 | Gummy Gloop | common |
| 4 | Fuzzlefang | common |
| 5 | Crumb Goblin | common |
| 6 | Sticky Wisp | common |
| 7 | Molar Mumbler | common |
| 8 | Tartar Tot | common |
| 9 | Midnight Molar Ghoul | rare |
| 10 | Dawn Drool Dragon | rare |
| 11 | Moonlit Mint Phantom | rare |
| 12 | Twilight Toffee Wraith | rare |

---

## 8. Storage schema

```typescript
// src/storage/storage.ts

interface StorageData {
  readonly version: 1;                    // schema version
  readonly sessions: SessionRecord[];     // all past sessions
  readonly missScores: MissScores;         // per-zone [0, 1], updated after each camera session
}

// SessionRecord mirrors SessionResult for storage (req 9.1, 9.5).
interface SessionRecord {
  readonly date: string;          // YYYY-MM-DD
  readonly timeOfDay: TimeOfDay;
  readonly mode: SessionMode;
  readonly zoneResults: readonly ZoneResult[];
  readonly monstersEarned: readonly string[];
  readonly startedAt: number;     // epoch ms
  readonly durationSeconds: number;  // always 120
}
```

- **localStorage key:** `foamtom:v1`.
- **Version:** The `version` field allows future migration. On load, if `version` is
  missing or lower than current, the loader discards old data with a console warning (for
  v1 there are no prior versions to migrate from).
- **Monster Book** is derived from `sessions` (union of all `monstersEarned`), not stored
  separately. This keeps stored data to exactly what req 9.5 permits: sessions + miss
  scores.
- **Miss scores** are stored denormalized alongside sessions (req 14.7). They are
  recomputed and saved after each camera-mode session. The "Clear all data" button calls
  `clearAll()`, which removes both sessions and miss scores.

> **Design choice:** Miss scores are stored denormalized (they are also derivable from
> sessions) for O(1) lookup at session start without scanning all past sessions. They are
> recomputed after each camera-mode session to stay consistent. Dr. Yatin to confirm.

---

## 9. Error handling

| Condition | Behaviour | Requirement |
|-----------|-----------|-------------|
| **Camera permission refused** | Switch to timer-only mode. No prompt, no nag, no retry. Session runs fully. | 8.1, 8.3, kid-safety |
| **Camera unavailable** (no device, API missing) | Same as refused: timer-only mode. | 8.1 |
| **Poor light / tracking quality** | Tracking layer returns `null` signal. Logic treats the tick as timer-only drain. If `null` persists for an entire zone (30 s), the UI silently switches the mode indicator to timer-only. No nag to the child. | 6.1–6.3, 8.1 |
| **Tab hidden** (`document.hidden`) | Camera stream stops immediately. Zone timer pauses. When the tab returns, camera restarts (if camera mode) and timer resumes. No data lost. | 11.6, kid-safety |
| **`localStorage` full** (`QuotaExceededError`) | Session result is not saved. Game continues to work; Monster Book only reflects the current session. No crash, no nag. | 9.4, kid-safety |
| **`localStorage` blocked** (private browsing, disabled) | Same as full: in-memory only. Game works fully for the session; nothing persists. | 9.4, kid-safety |

> **Design choice (tab hidden):** The zone timer pauses when the tab is hidden because the
> child cannot see the screen. This is distinct from req 2.5, which covers the child not
> brushing (the timer must not pause for that). Tab-hidden is a visibility event: the
> child left the screen, so the timer pauses and resumes on return. Approved by Dr. Yatin
> 2026-11-14.

> **Design choice (poor light, sustained):** If tracking returns `null` for an entire zone,
> the UI silently switches the mode indicator to timer-only so the parent knows the session
> was unverified. The switch is silent (no nag to the child). Whether to switch mid-session
> or wait for the next session is a UI detail left to implementation. Approved by Dr. Yatin
> 2026-11-14.

---

## 10. Placeholder screen (req 11)

A plain, functional screen. Haunted-mirror art, CSS frame, fog, candle flicker, and
cracked-glass effects are out of scope for this spec.

- **Camera preview:** If permission granted, show a mirrored live `<video>` of the front
  camera. If not, show the screen without a preview (timer-only mode). (req 11.1–11.2)
- **Monster:** Draw one monster over the active zone on a canvas above the video. (req 11.3)
- **Countdown:** Display remaining seconds in the current zone. (req 11.4)
- **Zone caption:** Display the zone name as a caption and speak it aloud when the zone
  becomes active. (req 11.5, 4.1–4.5)
- **Camera stop:** Stop the camera stream immediately when the session ends or the tab
  becomes hidden. (req 11.6)
- **Privacy:** No frame, image, video, landmark, or derived measurement is sent over the
  network, saved, or logged. No screenshot, recording, or share features. (req 11.7–11.8)
- **Layout:** Portrait orientation. Touch targets ≥ 48 px. Colour is never the only signal.
  (req 11.9–11.11)
- **Performance:** 20+ fps on a mid-range Android phone (2022) in Chrome. (req 11.12)

---

## 11. Testing strategy

All tests use **fast-check** property-based tests in `/tests/`. Each property holds for any
arbitrary input. The pure logic functions take plain data and return plain data, so no
browser or camera is needed.

| # | Test name | Req | Arbitrary input | Property assertion |
|---|-----------|-----|----------------|-------------------|
| 1 | `monsterHealthOnlyDecreasesWhenOwnZoneBrushed` | 13.1 | Array of 120 `BrushingSignal \| null` (both modes) | Camera: health decreases only on ticks where `isBrushing(signal, activeZone)` is true. Timer: health decreases every tick and reaches 0 by zone end. Health never decreases while a different zone is active, signal doesn't match, or signal has `unknown` fields. |
| 2 | `totalSessionDurationAlways120` | 13.2 | Array of 120 `BrushingSignal \| null` (none, wrong, partial, all-correct) | `toSessionResult(finalState).durationSeconds === 120` for all inputs. |
| 3 | `rareMonsterUnlockRequiresMorningAndNight` | 13.3 | Array of `SessionRecord` on one day with random `timeOfDay` | `isRareEligible(sessions, date)` is true only when ≥ 1 morning AND ≥ 1 night session exist. Rare monsters in `monstersEarned` only when eligible. |
| 4 | `statsNeverExceedElapsed` | 13.4 | Array of `SessionRecord` (mixed modes, random seconds per zone) | `computeVerifiedTime(sessions) ≤ sessions.length × 120`. Timer-only sessions contribute 0 verified seconds. |
| 5 | `storageRoundTripPreservesSessions` | 13.5 | Array of `SessionRecord` with random modes and verified/unverified flags | `loadSessions(saveSessions(input))` deep-equals `input`. Uses a mock `localStorage`. |
| 6 | `kindProximityStartingHealthWithinBounds` | 13.6 | Array of past `SessionRecord` (mixed modes) | For every zone: `36 ≤ startingHealth(zone, missScores) ≤ 60` (60% floor to 100% of `H_MAX`). |
| 7 | `kindProximityDoesNotChangeDuration` | 13.7 | Array of past sessions + array of 120 signals | `toSessionResult(finalState).durationSeconds === 120` regardless of miss scores. |
| 8 | `soCloseRescueAtOrBelow15Percent` | 13.8 | Zone with monster health ∈ [0, 60] at zone end | `health ≤ 9 → outcome == 'defeated'`. `health > 9 → outcome == 'trapped'`. |
| 9 | `missScoreOnlyFromCameraSessions` | 13.9 | Array of `SessionRecord` (arbitrary mix of camera and timer-only) | Miss scores computed only from camera-mode sessions. Adding or removing timer-only sessions does not change any miss score. |

> **Consequence of `DAMAGE_PER_SECOND = 3`:** At normal health (`H_MAX = 60`), 20 consecutive
> matching ticks defeat the monster (20 × 3 = 60). Test 1 asserts the direction of health
> change; the defeat time follows from `H_MAX / DAMAGE_PER_SECOND = 20`. Timer-mode drain
> reaches 0 at 30 s (2 per second), not 20 s, because it is computed from elapsed time, not
> accumulated damage.

### Test helpers

**Mock `localStorage`:** An in-memory `Map` implementing `getItem`, `setItem`,
`removeItem`, used by tests 5, 6, 9. No real browser storage needed.

**Signal arbitrary:**

```typescript
const signalArb = fc.record({
  handNearMouth: fc.boolean(),
  side: fc.constantFrom('left', 'right', 'unknown'),
  level: fc.constantFrom('upper', 'lower', 'unknown'),
  moving: fc.boolean(),
});
// Nullable for timer mode: fc.option(signalArb, { nil: null })
// Per session: fc.array(signalArb, { minLength: 120, maxLength: 120 })
```

**Session record arbitrary:**

```typescript
const zoneResultArb = fc.record({
  zoneId: fc.constantFrom('upper-right', 'upper-left', 'lower-left', 'lower-right'),
  monsterId: fc.string(),
  secondsBrushed: fc.integer({ min: 0, max: 30 }),
  verified: fc.boolean(),
  monsterOutcome: fc.constantFrom('defeated', 'trapped'),
});

const sessionRecordArb = fc.record({
  date: fc.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
  timeOfDay: fc.constantFrom('morning', 'night', 'neither'),
  mode: fc.constantFrom('camera', 'timer-only'),
  zoneResults: fc.array(zoneResultArb, { minLength: 4, maxLength: 4 }),
  monstersEarned: fc.array(fc.string()),
  startedAt: fc.integer({ min: 0 }),
  durationSeconds: fc.constant(120),
});
```
