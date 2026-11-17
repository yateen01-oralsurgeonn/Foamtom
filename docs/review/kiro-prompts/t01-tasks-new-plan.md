This is a SPEC EDIT, not a build. Do not write app code.

Edit only this file: `.kiro/specs/core-brushing-loop/tasks.md`.
Do not create, edit or delete any other file.
Read first: every file in `.kiro/steering/`, then `requirements.md` and `design.md` in
`.kiro/specs/core-brushing-loop/` (both were updated on 15 Nov 2026 and are the source of
truth), then the file you are editing.
If the plan below disagrees with the requirements or the design, stop and say so.

THEME: replace the 12-task plan with 14 smaller tasks, ordered so that a playable
timer-only game exists at task 8 and is live on GitHub Pages at task 9.

Rewrite the whole file in your normal tasks format (numbered tasks, `- [ ]` checkboxes on
every task AND every sub-task, a `_Requirements:_` line, a `Test file:` line). No task is
marked done.

Rules to state at the top of the file:
- One task per run. One module (or two small ones) plus its tests per task.
- Every task ends with `npm run test:run` and `npm run build` both passing.
- A task changes only the files it names. It never edits anything in `.kiro/`.
- Property tests are written in the same task as the code they test.
- Test names follow design section 11.

THE 14 TASKS

1. **Project setup and guards**
   Files: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.ts`
   (empty shell that renders the game title), folders from `structure.md`,
   `tests/privacy-guard.test.ts`, `tests/smoke.test.ts`.
   Sub-tasks: Vite + TypeScript strict; Vitest + fast-check; scripts `dev`, `build`
   (`tsc --noEmit && vite build`), `test`, `test:run`; Vite `base: './'`; the
   Content-Security-Policy meta tag (req 12.8); privacy guard test (design test 16); one
   smoke test so the test run is never empty.
   Requirements: 1.1, 12.7, 12.8, 13.10, 15.6.

2. **Types, constants, time of day**
   Files: `src/logic/types.ts`, `src/logic/constants.ts`, `src/logic/time-of-day.ts`,
   `tests/constants.test.ts`, `tests/time-of-day.test.ts`.
   Tests: design test 14 (all 24 hours); `ZONE_COUNT × ZONE_DURATION == SESSION_DURATION`; `KIND_FLOOR == 36`;
   `RESCUE_THRESHOLD == 9`; `UNTRACKED_DRAIN × ZONE_DURATION == H_MAX`; `ZONE_ORDER` is
   upper-right, upper-left, lower-left, lower-right.
   Requirements: 1.2, 3.1, 3.2, 5.1, 5.7, 10.5.

3. **Monster table, assignment, rescue**
   Files: `src/logic/monsters.ts`, `tests/monsters.test.ts`.
   Sub-tasks: the 12 named monsters; `assignMonsters(pastSessions, rareEligible)` by the
   fixed rule in design section 7; `resolveMonster` (fled at ≤ 9, else trapped).
   Tests: design tests 5 and 8.
   Requirements: 7.5, 7.6, 10.4, 10.9, 10.10, 14.3.

4. **Session core**
   Files: `src/logic/session.ts`, `tests/session.test.ts`.
   Sub-tasks: `startSession(input)`, `isBrushing`, `tick`, `pause`, `resume`, exactly as
   design section 5, with ONE temporary difference: `monster-book.ts` and
   `miss-score.ts` do not exist yet, so in this task `startSession` uses rare-eligible =
   `false` and starting health = `H_MAX` for every zone. Put those two values in two
   named constants at the top of `session.ts`, each with the comment
   `// TEMPORARY: replaced in task 14`. Do not create `monster-book.ts` or
   `miss-score.ts` in this task.
   Tests: design tests 1, 2, 3, 4.
   Requirements: 1.3, 2.1–2.6, 3.3–3.5, 5.2–5.6, 6.1, 6.3, 7.1–7.4, 7.7, 8.2, 8.5.

5. **Session result and view**
   Files: `src/logic/session-result.ts`, `src/logic/view.ts`,
   `tests/session-result.test.ts`, `tests/view.test.ts`.
   Tests: design tests 6, 7, 18.
   Requirements: 7.8, 9.1–9.3, 10.1–10.3, 11.3, 11.4.

6. **Signal source and game loop**
   Files: `src/tracking/signal-source.ts`, `src/ui/game-loop.ts`,
   `tests/game-loop.test.ts`.
   Sub-tasks: `SignalSource` interface and `nullSignalSource`; the game loop as in design
   section 3 (clock, scheduler, visibility and wake lock all passed in).
   Tests: design test 15, plus: `start()` is called exactly once per session; `stop()` is
   called at the end and when hidden; a source that is not ready within 8 s gives a
   timer-only session.
   Requirements: 2.6, 2.7, 8.1, 8.3, 11.6, 13.12, 15.2, 15.3, 15.4.

7. **Voice lines and wording guard**
   Files: `src/audio/lines.ts`, `tests/lines.test.ts`.
   Sub-tasks: lines for the start button, the four zones, the smoke line ("Keep brushing!
   Brush the smoke away!"), and the end card; each `{ id, text, caption }`.
   Tests: design test 17.
   Requirements: 4.1–4.3, 4.5, 6.2, 12.1–12.6, 13.11.

8. **Session screen, wired up (PLAYABLE timer-only game)**
   Files: `src/ui/session-screen.ts`, `src/ui/end-card.ts`, `src/main.ts`, `index.html`,
   one CSS file.
   Sub-tasks: start button; monster (a simple drawn shape is enough) over the active
   zone; countdown; caption; smoke; end card; `main.ts` wires clock, `nullSignalSource`,
   game loop and screen. Captions only in this task (speech comes in task 9). No storage
   yet: `pastSessions` is an empty list.
   Check by hand: `npm run dev`, tap start, watch a full 2-minute timer-only session.
   Requirements: 8.4, 11.2–11.5, 11.7–11.11, 15.1, 15.5.
   Test file: none new (the logic it paints is already tested); the privacy guard must
   still pass.

9. **Speaker and first deployment (LIVE LINK)**
   Files: `src/audio/speaker.ts`, `tests/speaker.test.ts`,
   `.github/workflows/pages.yml`, `README.md`.
   Sub-tasks: `rampGain`; play a clip if present, else a local Web Speech voice, else
   caption only; a GitHub Actions workflow that runs the tests, builds, and publishes
   `dist/` to GitHub Pages; a short README (what it is, privacy line, how to run, MIT).
   Tests: design test 19; a test that a non-local voice is never chosen.
   Requirements: 4.4, 12.9, 15.6.

10. **Storage**
    Files: `src/storage/storage.ts`, `tests/storage.test.ts`.
    Tests: design test 13.
    Requirements: 9.4–9.7, 14.7.

11. **Monster Book logic**
    Files: `src/logic/monster-book.ts`, `tests/monster-book.test.ts`.
    Tests: design test 9; `computeMonsterBook` is the union of `monstersEarned`.
    Requirements: 10.1–10.3, 10.6–10.8.

12. **Miss scores and starting health**
    Files: `src/logic/miss-score.ts`, `tests/miss-score.test.ts`.
    Tests: design tests 10, 11.
    Requirements: 14.1, 14.2, 14.4, 14.5.

13. **Parent stats (logic only)**
    Files: `src/logic/stats.ts`, `tests/stats.test.ts`.
    Tests: design test 12; `zoneMostMissed` uses verified zones only.
    Requirements: 13.4.

14. **Wire memory in**
    Files: `src/main.ts`, `src/logic/session.ts`, `tests/integration.test.ts`,
    `tests/session.test.ts` (only if a test needs the new behaviour).
    Sub-tasks: remove the two TEMPORARY constants from task 4 so that `startSession` uses
    `isRareEligibleForNewSession`, `computeMissScores` and `startingHealth`; load past sessions at start; save the result at the end; the end card shows
    the monsters earned.
    Test: with a fake backend and fake clock, play a morning timer-only session, then a
    night one on the same date: both are saved; the second is rare-eligible and has
    exactly one rare monster on the last zone; a third session's commons follow the
    assignment rule.
    Requirements: 8.4, 9.4, 10.6, 10.9, 15.5.

Leave out of this file: camera preview, MediaPipe, haunted-mirror art, the Monster Book
screen and the parent screen. Add one closing line naming the three later specs
(`hand-tracking`, `mirror-and-screens`, `parent-screen`).

When finished, print the task titles in order, then stop.
