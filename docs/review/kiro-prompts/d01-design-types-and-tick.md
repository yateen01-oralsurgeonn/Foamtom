This is a SPEC EDIT, not a build. Do not write app code.

Edit only this file: `.kiro/specs/core-brushing-loop/design.md`.
Do not create, edit or delete any other file.
Read first: every file in `.kiro/steering/`, then
`.kiro/specs/core-brushing-loop/requirements.md` (it was updated on 15 Nov 2026 and is the
source of truth), then the file you are editing.
Change ONLY section 4 ("TypeScript types") and section 5 ("Session state machine").
Keep every other section exactly as it is, word for word. Later prompts cover them.
If the requirements and an instruction below disagree, stop and say so. Do not guess.

THEME: one tick rule for both modes, read-only state, named phases, plain start inputs.

SECTION 4 — TYPES

1. Make every field of `MonsterState` and `SessionState` `readonly`, and every array a
   `readonly` array. State is never changed in place.
2. `MonsterOutcome` becomes `'pending' | 'defeated' | 'fled' | 'trapped'`.
   `ZoneResult.monsterOutcome` becomes `'defeated' | 'fled' | 'trapped'`.
3. `MonsterState`: add `readonly defeatedAtElapsed: number | null` (seconds into the zone
   when health reached zero; `null` if it has not).
4. `SessionState`:
   - remove `isRunning`; add `readonly phase: 'running' | 'paused' | 'ended'`;
   - add `readonly secondsUntrackedPerZone: readonly number[]`;
   - add `readonly secondsSmokeClearedPerZone: readonly number[]` (brushed or untracked
     seconds counted after that zone's monster was defeated; used only for drawing);
   - add `readonly ticksDone: number` (0 to 120).
5. `ZoneResult`: add `readonly secondsUntracked: number`. Change the comments:
   `secondsBrushed` is "matched seconds (camera) or 30 (timer-only)"; `verified` is "true
   only in camera mode when secondsUntracked ≤ 10".
6. `SessionResult.durationSeconds`: comment becomes "ticks processed; 120 for every
   completed session".
7. Add a new type:
   ```typescript
   interface StartInput {
     readonly mode: SessionMode;
     readonly startedAt: number;   // epoch ms, read once by main.ts
     readonly date: string;        // YYYY-MM-DD, local, read once by main.ts
     readonly hour: number;        // 0–23, local
     readonly pastSessions: readonly SessionResult[];
   }
   ```
8. Add one sentence under the heading: "Logic never touches `Date`, `Math.random`, the
   DOM or storage. `main.ts` reads the clock once and passes plain values in."

SECTION 5 — STATE MACHINE

9. Replace the opening paragraph with: "The state machine is the same for both modes and
   there is one tick rule. In timer-only mode every signal is treated as `null`."
10. Replace the state diagram with one that has three named phases: `running` (with the
    four zones inside it, in order), `paused`, and `ended`. Transitions:
    `startSession(input)` → running/zone 0; zone timer reaches 0 → resolve monster → next
    zone, or `ended` after zone 3; `pause()` running → paused; `resume()` paused →
    running. Remove the `Idle` state and the note box.
11. Replace the tick pseudocode with exactly this rule:
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
    Add one line under it: "Health only ever goes down, and by whole numbers."
12. `isBrushing(signal, zone)`: keep it, and add the level switch:
    "`and (REQUIRE_LEVEL_MATCH == false or signal.level == zone.level)`" (req 5.7).
13. Add two small functions after `isBrushing`:
    "`pause(state)`: running → paused, otherwise unchanged. `resume(state)`: paused →
    running, otherwise unchanged. Both return a new state. (req 2.6)"
14. Replace the `toSessionResult(state)` bullets with:
    - "Only valid when `phase == 'ended'`."
    - "Timer-only: each zone has `secondsBrushed = 30`, `secondsUntracked = 0`,
      `verified = false`."
    - "Camera: `secondsBrushed` and `secondsUntracked` are the counted values;
      `verified = (secondsUntracked <= UNTRACKED_LIMIT)`." (req 9.3)
    - "`monstersEarned` = the ids of all four monsters (req 10.1, 10.2)."
    - "`durationSeconds = ticksDone`."
15. Replace `startSession(mode, missScores, now)` with `startSession(input: StartInput)`:
    ```
    startSession(input):
      zones       = ZONE_ORDER.map(makeZone)
      timeOfDay   = classifyTimeOfDay(input.hour)
      today       = input.pastSessions.filter(s => s.date == input.date)
      rare        = isRareEligibleForNewSession(today, timeOfDay)
      defs        = assignMonsters(input.pastSessions, rare)        // fixed rule, no randomness
      missScores  = computeMissScores(input.pastSessions)
      health(z)   = input.mode == 'timer-only' ? H_MAX : startingHealth(z, missScores)
      return { mode, zones, activeZoneIndex: 0, zoneTimeRemaining: 30, monsters,
               secondsBrushedPerZone: [0,0,0,0], secondsUntrackedPerZone: [0,0,0,0],
               secondsSmokeClearedPerZone: [0,0,0,0], ticksDone: 0,
               startedAt: input.startedAt, date: input.date, timeOfDay, phase: 'running' }
    ```
16. The "Design choice" note about 1-second ticks: change "Dr. Yatin to confirm." to
    "Confirmed by Dr. Yatin 2026-11-15." and change "aggregated by the tracking layer" to
    "aggregated by the tracking layer (the rule is defined in the `hand-tracking` spec)".

DO NOT TOUCH: sections 1, 2, 3, 6, 7, 8, 9, 10 and 11.

When finished, print a short list of what you changed, then stop.
