# Tasks: core-brushing-loop

## Implementation plan

Fourteen small tasks. A playable timer-only game exists at task 8 and is live on GitHub
Pages at task 9. Storage, the Monster Book, miss scores and parent stats come after that
and are wired into the game in task 14.

### Rules for every task

- One task per run. One module (or two small ones) plus its tests per task.
- Every task ends with `npm run test:run` and `npm run build` both passing.
- A task changes only the files it names. It never edits anything in `.kiro/`.
- Property tests are written in the same task as the code they test.
- Test names follow design section 11.
- Test helpers (arbitraries, fakes) are written inside the test file that uses them. There
  is no shared helper file.

---

- [x] 1. **Project setup and guards**
  - [x] 1.1 Create `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html` and a shell `src/main.ts` that renders only the game title
  - [x] 1.2 Vite + TypeScript with `strict: true`; Vite `base: './'`; set `build.assetsInlineLimit` to `0` so no asset becomes a `data:` URI under the Content-Security-Policy
  - [x] 1.3 Install Vitest and fast-check as dev dependencies
  - [x] 1.4 Add npm scripts: `dev`, `build` (`tsc --noEmit && vite build`), `test`, `test:run`
  - [x] 1.5 Create the folders from `structure.md`: `src/logic/`, `src/tracking/`, `src/ui/`, `src/audio/`, `src/storage/`, `public/models/`, `public/assets/`, `tests/` (keep empty folders in git with a `.gitkeep`)
  - [x] 1.6 Add the Content-Security-Policy `<meta>` tag to `index.html`: same-origin scripts, styles, images, media and connections only (req 12.8)
  - [x] 1.7 Write the privacy guard test (design test 16, `privacyGuard`) exactly as requirement 13.10 states
  - [x] 1.8 Write one smoke test so the test run is never empty
  - _Requirements: 1.1, 12.7, 12.8, 13.10, 15.6_
  - Test file: `tests/privacy-guard.test.ts`, `tests/smoke.test.ts`

- [x] 2. **Types, constants, time of day**
  - [x] 2.1 Define all interfaces in `src/logic/types.ts` per design section 4
  - [x] 2.2 Define every constant from design section 6 and `ZONE_ORDER` in `src/logic/constants.ts`
  - [x] 2.3 Implement `classifyTimeOfDay(hour)` in `src/logic/time-of-day.ts`
  - [x] 2.4 Test `timeOfDayAllHours` (design test 14): all 24 hours match the stated ranges
  - [x] 2.5 Constants tests: `ZONE_COUNT × ZONE_DURATION == SESSION_DURATION`; `KIND_FLOOR == 36`; `RESCUE_THRESHOLD == 9`; `UNTRACKED_DRAIN × ZONE_DURATION == H_MAX`; `ZONE_ORDER` is upper-right, upper-left, lower-left, lower-right
  - _Requirements: 1.2, 3.1, 3.2, 5.1, 5.7, 10.5_
  - Test file: `tests/constants.test.ts`, `tests/time-of-day.test.ts`

- [x] 3. **Monster table, assignment, rescue**
  - [x] 3.1 Define the 12 named monsters (8 common, 4 rare) in `src/logic/monsters.ts`, each `{ id, name, rarity, unlockRule }`, in the order of design section 7
  - [x] 3.2 Implement `assignMonsters(pastSessions, rareEligible)` by the fixed rule in design section 7, with no randomness
  - [x] 3.3 Implement `resolveMonster`: at zone end a pending monster is `fled` at health ≤ 9, else `trapped`
  - [x] 3.4 Test `monsterTableAndAssignment` (design test 8)
  - [x] 3.5 Test `rescueAtOrBelow9` (design test 5)
  - _Requirements: 7.5, 7.6, 10.4, 10.9, 10.10, 14.3_
  - Test file: `tests/monsters.test.ts`

- [x] 4. **Session core**
  - [x] 4.1 At the top of `src/logic/session.ts` add two named constants, each with the comment `// TEMPORARY: replaced in task 14`: the rare-eligible value (`false`) and the starting health for every zone (`H_MAX`)
  - [x] 4.2 Implement `startSession(input)` exactly as design section 5, except that it uses the two TEMPORARY constants. `monster-book.ts` and `miss-score.ts` do not exist yet and are NOT created in this task
  - [x] 4.3 Implement `isBrushing`, `tick`, `pause`, `resume` exactly as design section 5
  - [x] 4.4 Test `isBrushingTruthTable` (design test 1)
  - [x] 4.5 Test `healthChangesOnlyByTheRule` (design test 2)
  - [x] 4.6 Test `sessionIsExactly120Ticks` (design test 3). `toSessionResult` does not exist yet, so assert tick count and phase here; the `durationSeconds == 120` check moves to task 5
  - [x] 4.7 Test `timerOnlyDefeatsEveryMonsterAt30` (design test 4). The "result has 30 brushed, 0 untracked, unverified" check moves to task 5; here assert health, outcome and the defeat tick
  - _Requirements: 1.3, 2.1–2.6, 3.3–3.5, 5.2–5.6, 6.1, 6.3, 7.1–7.4, 7.7, 8.2, 8.5_
  - Test file: `tests/session.test.ts`

- [x] 5. **Session result and view**
  - [x] 5.1 Implement `toSessionResult(state)` in `src/logic/session-result.ts` per design section 5
  - [x] 5.2 Implement `toView(state)` in `src/logic/view.ts`: `{ phase, zoneId, countdown, captionLineId, monsterId, healthFraction, smokeFraction }`. Document the `captionLineId` values it can produce, so task 7 can match them
  - [x] 5.3 Test `resultInvariants` (design test 6)
  - [x] 5.4 Test `smokeChangesNothingThatCounts` (design test 7)
  - [x] 5.5 Test `viewMatchesState` (design test 18)
  - [x] 5.6 Carry-over from task 4: a completed session has `durationSeconds == 120`; a timer-only result has 30 brushed, 0 untracked and every zone unverified
  - _Requirements: 7.8, 9.1–9.3, 10.1–10.3, 11.3, 11.4_
  - Test file: `tests/session-result.test.ts`, `tests/view.test.ts`

- [x] 6. **Signal source and game loop**
  - [x] 6.1 Define the `SignalSource` interface and `nullSignalSource` (`'unavailable'`, `null`) in `src/tracking/signal-source.ts`
  - [x] 6.2 Implement `src/ui/game-loop.ts` as in design section 3: clock, scheduler, visibility source and wake-lock helper are all passed in; the loop is given a function that builds the session from the mode, because the mode is known only after `start()` answers or 8 s pass
  - [x] 6.3 Test `gameLoopExactTicks` (design test 15)
  - [x] 6.4 Test: `start()` is called exactly once per session
  - [x] 6.5 Test: `stop()` is called at the end of the session and when the tab is hidden
  - [x] 6.6 Test: a source that is not ready within 8 s gives a timer-only session
  - _Requirements: 2.6, 2.7, 8.1, 8.3, 11.6, 13.12, 15.2, 15.3, 15.4_
  - Test file: `tests/game-loop.test.ts`

- [x] 7. **Voice lines and wording guard**
  - [x] 7.1 Write `src/audio/lines.ts` with lines `{ id, text, caption }` for: the start button, the four zones, the smoke line ("Keep brushing! Brush the smoke away!"), and the end card
  - [x] 7.2 Make the line ids match the `captionLineId` values that `toView` produces (task 5), and check this in the test
  - [x] 7.3 Test `wordingGuard` (design test 17)
  - _Requirements: 4.1–4.3, 4.5, 6.2, 12.1–12.6, 13.11_
  - Test file: `tests/lines.test.ts`

- [x] 8. **Session screen, wired up (PLAYABLE timer-only game)**
  - [x] 8.1 `src/ui/session-screen.ts`: start button (large, with an icon, ≥ 48 px); a simple drawn monster over the active zone; countdown; caption; smoke after a defeat; everything painted from `toView(state)`
  - [x] 8.2 `src/ui/end-card.ts`: the session's four monsters, the closing line caption, one button back to the start screen, no urge to play again
  - [x] 8.3 `src/main.ts`: wire the clock, `nullSignalSource`, the browser's visibility and wake-lock adapters, the game loop and the screens. A session dropped after 60 s hidden returns to the start screen. No storage yet: `pastSessions` is an empty list
  - [x] 8.4 `index.html` and `src/ui/styles.css`: portrait layout, usable in landscape and on desktop, no "rotate" block; colour is never the only signal. Link the stylesheet from `index.html` and set styles through classes or `element.style`, so the Content-Security-Policy from task 1 stays same-origin only
  - [x] 8.5 Captions only in this task. Speech comes in task 9, and the game is not published before then (req 4.3)
  - [x] 8.6 Check by hand: `npm run dev`, tap start, watch a full 2-minute timer-only session through to the end card
  - _Requirements: 8.4, 11.2–11.5, 11.7–11.11, 15.1, 15.5_
  - Test file: none new (the logic it paints is already tested); the privacy guard must still pass

- [x] 9. **Speaker and first deployment (LIVE LINK)**
  - [x] 9.1 `src/audio/speaker.ts`: pure `rampGain(msSinceStart)`; a pure voice chooser that picks only a voice marked local; play a clip if present, else a local Web Speech voice, else caption only
  - [x] 9.2 Wire the speaker into `src/ui/session-screen.ts`, `src/ui/end-card.ts` and `src/main.ts` so that every captioned line is also spoken: start button, zone lines, smoke line, end card. The start tap unlocks sound
  - [x] 9.3 `.github/workflows/pages.yml`: on push, run `npm run test:run`, run `npm run build`, publish `dist/` to GitHub Pages
  - [x] 9.4 `README.md`: what the game is, the privacy line ("The camera stays on this phone. Nothing is saved or sent."), how to run it, MIT licence. No clinic name, phone number, address or registration number; no health claims
  - [x] 9.5 Test `rampGainIsGentle` (design test 19)
  - [x] 9.6 Test: a non-local voice is never chosen
  - [x] 9.7 Check by hand after the first push: the Pages link opens and a timer-only session plays with sound (the repo's Pages source must be set to GitHub Actions in its settings)
  - _Requirements: 4.1, 4.3, 4.4, 7.8, 11.5, 12.9, 15.1, 15.6_
  - Test file: `tests/speaker.test.ts`
  - `LICENSE` already exists in the repo root; do not create or change it.

- [x] 10. **Storage**
  - [x] 10.1 Implement `createStorage(backend)` in `src/storage/storage.ts` with `saveSession`, `loadSessions`, `clearAll`; key `foamtom:v1`; schema per design section 8
  - [x] 10.2 Missing, unreadable or other-version data loads as no sessions; a throwing backend never throws out of save or load
  - [x] 10.3 Test `storageRoundTrip` (design test 13)
  - _Requirements: 9.4–9.7, 14.7_
  - Test file: `tests/storage.test.ts`

- [x] 11. **Monster Book logic**
  - [x] 11.1 Implement `isRareEligibleForNewSession(todaysSessions, newTimeOfDay)` in `src/logic/monster-book.ts`
  - [x] 11.2 Implement `computeMonsterBook(sessions)`: the union of `monstersEarned`
  - [x] 11.3 Test `rareNeedsMorningAndNightCountingNewSession` (design test 9)
  - [x] 11.4 Test: `computeMonsterBook` is the union of `monstersEarned`
  - _Requirements: 10.1–10.3, 10.6–10.8_
  - Test file: `tests/monster-book.test.ts`

- [x] 12. **Miss scores and starting health**
  - [x] 12.1 Implement `computeMissScores(sessions)` in `src/logic/miss-score.ts`: verified zones of the 7 most recent camera-mode sessions only
  - [x] 12.2 Implement `startingHealth(zone, missScores)`: linear, rounded, clamped to 36–60
  - [x] 12.3 Test `missScoreSources` (design test 10)
  - [x] 12.4 Test `startingHealthBounds` (design test 11)
  - _Requirements: 14.1, 14.2, 14.4, 14.5_
  - Test file: `tests/miss-score.test.ts`

- [x] 13. **Parent stats (logic only)**
  - [x] 13.1 Implement `computeVerifiedTime(sessions)` and `zoneMostMissed(sessions)` in `src/logic/stats.ts`. `computeVerifiedTime` sums `secondsBrushed` over verified zones of camera sessions; `zoneMostMissed` returns `ZoneId | null`, uses all stored camera sessions, averages the per-zone miss, ties go to the first zone in `ZONE_ORDER`, and does not reuse `computeMissScores`.
  - [x] 13.2 Test `statsCeiling` (design test 12)
  - [x] 13.3 Test: `zoneMostMissed` uses verified zones only
  - _Requirements: 13.4_
  - Test file: `tests/stats.test.ts`

- [ ] 14. **Wire memory in**
  - [ ] 14.1 In `src/logic/session.ts`, remove the two TEMPORARY constants from task 4. `startSession` now uses `isRareEligibleForNewSession`, `computeMissScores` and `startingHealth` (timer-only still starts every monster at `H_MAX`)
  - [ ] 14.2 In `src/main.ts`, load past sessions at start and save the result at the end. The end card already shows the session's four monsters from task 8; `end-card.ts` does not change
  - [ ] 14.3 Update `tests/session.test.ts` only if a test needs the new behaviour
  - [ ] 14.4 Integration test with a fake backend and fake clock, composing the same calls `main.ts` makes (load, `startSession`, ticks, `toSessionResult`, save), without importing `main.ts`: play a morning timer-only session, then a night one on the same date. Both are saved; the second is rare-eligible and has exactly one rare monster, on the last zone; a third session's commons follow the assignment rule
  - [ ] 14.5 Check by hand: `npm run dev`, play two sessions, reload the page, confirm the saved sessions change which monsters appear
  - _Requirements: 8.4, 9.4, 10.6, 10.9, 15.5_
  - Test file: `tests/integration.test.ts`, `tests/session.test.ts` (only if needed)

---

Later specs, not in this file: `hand-tracking`, `mirror-and-screens`, `parent-screen`.
