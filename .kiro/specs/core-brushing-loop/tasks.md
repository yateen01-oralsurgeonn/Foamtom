# Tasks: core-brushing-loop

## Implementation plan

Tasks are ordered: pure logic with property tests first, then storage, then timer-only
mode integration, then the placeholder screen and camera preview, then voice and
captions. Each task is small enough for one coding session. Property tests are written in
the same task as the logic they test — not left to the end.

Hand tracking, haunted-mirror art, the parent screen, and deployment are handled by later
specs and are not included here.

---

- [ ] 1. **Project setup**
  - [ ] 1.1 Scaffold a Vite + TypeScript (strict) project in the repo root
  - [ ] 1.2 Install Vitest and fast-check as dev dependencies
  - [ ] 1.3 Create the folder structure from `structure.md`: `src/logic/`, `src/tracking/`, `src/ui/`, `src/audio/`, `src/storage/`, `public/models/`, `public/assets/`, `tests/`
  - [ ] 1.4 Add npm scripts: `dev` (vite), `build` (tsc + vite build), `test` (vitest), `test:run` (vitest run)
  - [ ] 1.5 Configure `tsconfig.json` with `strict: true`, target ES2020, module resolution bundler
  - [ ] 1.6 Verify with `npm run test:run` (no tests yet, should pass with zero tests)
  - _Requirements: 1.1_
  - No test file (build configuration only)

- [ ] 2. **Shared types and constants**
  - [ ] 2.1 Define all TypeScript interfaces in `src/logic/types.ts` per section 4 of the design: `BrushingSignal`, `Side`, `Level`, `ZoneId`, `Zone`, `Rarity`, `MonsterOutcome`, `MonsterDef`, `MonsterState`, `SessionMode`, `TimeOfDay`, `SessionState`, `ZoneResult`, `SessionResult`, `MonsterBook`, `MissScores`
  - [ ] 2.2 Define shared constants in `src/logic/constants.ts`: `ZONE_DURATION = 30`, `ZONE_COUNT = 4`, `SESSION_DURATION = 120`, `H_MAX = 60`, `DAMAGE_PER_SECOND = 3`, `KIND_FLOOR_RATIO = 0.6`, `KIND_FLOOR = 36`, `RESCUE_THRESHOLD = 9`, `ZONE_ORDER`
  - _Requirements: 1.2, 5.1, 5.2, 5.3_
  - No test file (type and constant definitions only)

- [ ] 3. **Time-of-day classification**
  - [ ] 3.1 Implement `classifyTimeOfDay(hour: number): TimeOfDay` in `src/logic/time-of-day.ts` — morning 04:00–11:59, night 17:00–23:59, neither otherwise
  - [ ] 3.2 Property test: for every hour 0–23, classification matches the defined ranges; morning and night ranges are disjoint; neither covers the remainder
  - _Requirements: 10.5_
  - Test file: `tests/time-of-day.test.ts`

- [ ] 4. **Monster table and assignment**
  - [ ] 4.1 Define the 12 monster entries in `src/logic/monsters.ts`: 8 common, 4 rare, each `{ id, name, rarity, unlockRule }`
  - [ ] 4.2 Implement `assignMonsters(zones, rareEligible)`: picks one monster per zone from the eligible pool (common always eligible; rare only when `rareEligible`)
  - [ ] 4.3 Implement `resolveMonster(monster)`: at zone end, if still pending, rescue (defeated) when `health ≤ RESCUE_THRESHOLD`, else trapped
  - [ ] 4.4 Property test: exactly 12 monsters, 8 common and 4 rare; `assignMonsters` never assigns a rare monster when `rareEligible` is false; every zone gets exactly one monster
  - [ ] 4.5 Property test: at zone end, `health ≤ 9 → outcome == 'defeated'`; `health > 9 → outcome == 'trapped'` (req 13.8)
  - _Requirements: 7.4, 7.5, 7.6, 10.4, 14.3_
  - Test file: `tests/monsters.test.ts`

- [ ] 5. **Miss scores and kind-proximity starting health**
  - [ ] 5.1 Implement `computeMissScores(sessions)` in `src/logic/miss-score.ts`: per-zone normalized miss score from camera-mode sessions only; timer-only sessions contribute nothing
  - [ ] 5.2 Implement `startingHealth(zone, missScores)`: linear scaling from 100% to 60% of `H_MAX` as miss score goes 0 → 1
  - [ ] 5.3 Property test: for any history of sessions, `36 ≤ startingHealth(zone, missScores) ≤ 60` for every zone (req 13.6)
  - [ ] 5.4 Property test: miss scores computed only from camera-mode sessions; adding or removing timer-only sessions does not change any miss score (req 13.9)
  - _Requirements: 14.1, 14.2_
  - Test file: `tests/miss-score.test.ts`

- [ ] 6. **Session state machine**
  - [ ] 6.1 Implement `startSession(mode, missScores, now)` in `src/logic/session.ts`: creates 4 zones in order (upper-right → upper-left → lower-left → lower-right), assigns monsters with kind-proximity starting health, classifies time of day, sets `zoneTimeRemaining = 30`
  - [ ] 6.2 Implement `tick(state, signal)`: advances zone timer, applies camera-mode damage (`DAMAGE_PER_SECOND = 3` per matching tick) or timer-mode drain (computed from elapsed time), checks defeat at health ≤ 0, calls `resolveMonster` at zone end, advances to next zone or ends session
  - [ ] 6.3 Implement `isBrushing(signal, zone)`: true only when `handNearMouth && moving && side === zone.side && level === zone.level`; `'unknown'` never matches
  - [ ] 6.4 Implement `toSessionResult(state)`: builds `SessionResult` with per-zone `secondsBrushed` (camera: counted from matching ticks; timer: 30), `verified` flag, `monstersEarned` (defeated + trapped), `durationSeconds = 120`
  - [ ] 6.5 Property test: monster health decreases only on ticks where `isBrushing(signal, activeZone)` is true (camera mode); timer-mode health decreases every tick and reaches 0 by zone end; health never decreases for a different zone or non-matching signal (req 13.1)
  - [ ] 6.6 Property test: `toSessionResult(finalState).durationSeconds === 120` for any input sequence of 120 signals including none, wrong, partial, and all-correct (req 13.2)
  - [ ] 6.7 Property test: kind proximity does not change session duration — `durationSeconds === 120` regardless of miss scores (req 13.7)
  - _Requirements: 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 5.4, 5.5, 6.1, 6.3, 7.1, 7.2, 7.3, 7.7, 9.1, 9.2, 9.3_
  - Test file: `tests/session.test.ts`

- [ ] 7. **Monster Book unlocks**
  - [ ] 7.1 Implement `isRareEligible(sessions, date)` in `src/logic/monster-book.ts`: true only when the day has ≥ 1 morning AND ≥ 1 night session
  - [ ] 7.2 Implement `computeMonsterBook(sessions)`: union of all `monstersEarned` across sessions
  - [ ] 7.3 Property test: rare eligibility is true only when ≥ 1 morning AND ≥ 1 night session exist on that day; sessions classified `'neither'` do not contribute; no rare monster unlocks when not eligible (req 13.3)
  - _Requirements: 10.1, 10.2, 10.3, 10.6, 10.7, 10.8_
  - Test file: `tests/monster-book.test.ts`

- [ ] 8. **Parent stats computation**
  - [ ] 8.1 Implement `computeVerifiedTime(sessions)` in `src/logic/stats.ts`: total verified seconds across all camera-mode sessions
  - [ ] 8.2 Implement `zoneMostMissed(sessions)`: zone with the highest miss from camera-mode sessions
  - [ ] 8.3 Property test: `computeVerifiedTime(sessions) ≤ sessions.length × 120`; timer-only sessions contribute 0 verified seconds (req 13.4)
  - _Requirements: 13.4_
  - Test file: `tests/stats.test.ts`

- [ ] 9. **Storage layer**
  - [ ] 9.1 Implement `StorageData` schema (version, sessions, missScores) with localStorage key `foamtom:v1` in `src/storage/storage.ts`
  - [ ] 9.2 Implement `saveSession(result)`, `loadSessions()`, `saveMissScores(scores)`, `loadMissScores()`, `clearAll()`
  - [ ] 9.3 Handle `QuotaExceededError` and blocked localStorage gracefully (in-memory fallback, no crash)
  - [ ] 9.4 Schema versioning: discard old data with console warning if version is missing or lower
  - [ ] 9.5 Property test: `loadSessions(saveSessions(input))` deep-equals `input` using a mock localStorage (req 13.5)
  - _Requirements: 9.4, 9.5, 9.6, 9.7, 14.7_
  - Test file: `tests/storage.test.ts`

- [ ] 10. **Timer-only mode integration**
  - [ ] 10.1 Implement placeholder stub in `src/tracking/tracking.ts`: returns `null` (no camera available); real tracking in a later spec
  - [ ] 10.2 Integration test: full 120-second timer-only session — 4 zones advance correctly, all monsters defeated, `secondsBrushed = 30` per zone, `verified = false`, `durationSeconds = 120`, `monstersEarned` contains all 4 monster ids
  - [ ] 10.3 Integration test: mode selection — when tracking returns `null`, session starts in timer-only mode; no camera re-request or nag (req 8.3)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  - Test file: `tests/timer-only.test.ts`

- [ ] 11. **Placeholder screen and camera preview**
  - [ ] 11.1 Display mirrored live `<video>` of front camera when permission is granted; show screen without preview when not (req 11.1–11.2)
  - [ ] 11.2 Draw one monster over the active zone on a canvas above the video (req 11.3)
  - [ ] 11.3 Display countdown timer showing remaining seconds in the current zone (req 11.4)
  - 11.4 Display zone name as caption when a zone becomes active (req 11.5)
  - [ ] 11.5 Stop camera stream immediately when session ends or tab becomes hidden (req 11.6)
  - [ ] 11.6 Enforce privacy: no frame, image, video, landmark, or derived measurement sent over network, saved, or logged; no screenshot, recording, or share features (req 11.7–11.8)
  - [ ] 11.7 Portrait orientation, touch targets ≥ 48 px, colour is never the only signal (req 11.9–11.11)
  - [ ] 11.8 No nag, prompt, or interruption when tracking is uncertain or absent (req 6.2)
  - [ ] 11.9 Verify 20+ fps on target hardware (req 11.12)
  - _Requirements: 6.2, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 11.10, 11.11, 11.12_
  - No test file (UI verification; visual and manual)

- [ ] 12. **Voice lines and captions**
  - [ ] 12.1 Define the voice line table in `src/audio/lines.ts`: every line has `{ id, text, caption }`; zone announcements ("A ghoul is hiding upper left!") and all spoken instructions
  - [ ] 12.2 Ensure every spoken line has a visible caption and every visible instruction has a spoken equivalent (req 4.3)
  - [ ] 12.3 Implement playback with gentle volume ramping — no sudden loud sounds (req 4.4)
  - [ ] 12.4 Provide a Web Speech API fallback when pre-recorded clips are not loaded
  - [ ] 12.5 Wording must be cute-spooky only, with no medical claims, no clinic details, and only dental-rule-approved phrases (req 12.1–12.5)
  - [ ] 12.6 Unit test: every entry in the lines table has a non-empty caption; no line is text-only
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 12.1, 12.2, 12.3, 12.4, 12.5_
  - Test file: `tests/lines.test.ts`
