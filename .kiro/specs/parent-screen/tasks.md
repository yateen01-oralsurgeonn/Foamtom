# Tasks: parent-screen

## Implementation plan

Sixteen small tasks, in the build order of design section 1.2. Tasks 1 to 7 are the pure core
(stage A): the facts, the nudge and the disclosure, fully tested with no DOM. Task 8 is storage
and clearing (stage B). Tasks 9 and 10 are the pure gate and screen model (stage C). Tasks 11
to 14 are the styles and the painters (stage D). Task 15 is the wiring in `main.ts` (stage E).
Task 16 is the manual check list.

The game still runs after every task. Tasks 1 to 14 add files that nothing opens yet, so the
game behaves exactly as before. Task 15 is the first task that changes what a player can reach.

**Dependency on `mirror-and-screens`.** Task 15 must not start until `mirror-and-screens` tasks
36 to 38 are done (`[x]`), because the title-screen control and `onOpenParent` come from them.
Dr. Yatin decided on 22 Nov 2026 that those tasks are built before task 15. This list does not
build, mock or bypass that control, and adds no URL flag, hidden key or demo hook.

### Rules for every task

- One task per run. One module (or two small ones) plus its tests per task. No task names more
  than four files.
- Every task ends with `npm run test:run` and `npm run build` both passing.
- A task changes only the files it names. It never edits anything in `.kiro/`.
- Tests are written in the same task as the code they test.
- Test helpers shared by several test files live in `tests/fixtures/parent-sessions.ts`
  (created in task 3). Helpers used by one test file stay inside that file.
- Every parent-facing string comes from the approved table "Lines for Dr. Yatin to approve"
  (`requirements.md`). No task adds a line, and no task edits `requirements.md`, `design.md`,
  `dental-rules.md`, `src/audio/lines.ts` or any existing test.
- New files must not contain the words `setInterval`, `setTimeout` or `requestAnimationFrame`,
  even in a comment (the existing `mirror-screens-guards` test fails on them). The one frame
  adapter is written in `main.ts` in task 15.
- Test names follow design section 8 (tests 1 to 19).

---

- [x] 1. **Calendar day maths**
  - [x] 1.1 Create `src/ui/calendar-days.ts` with `parseDate`, `daysFromCivil`, `civilFromDays`, `weekdayIndex` and `windowDates(today, n)` per design section 5.3. Integer maths on `YYYY-MM-DD` strings only. No `Date`, `Intl`, `toLocale*` or `getTimezoneOffset`
  - [x] 1.2 `parseDate` returns `null` for anything that is not a real calendar date in the exact form `YYYY-MM-DD` (`'2026-02-29'`, `'2026-13-01'`, `'2026-1-1'`, `''`); `windowDates` returns `[]` when `today` does not parse
  - [x] 1.3 Test `calendarDays` (design test 1): `daysFromCivil` and `civilFromDays` are inverses over several years including leap days, month ends and year ends; `windowDates(today, 7)` is 7 consecutive dates ending at `today`, oldest first; 2026-11-16 has weekday index 1 (Monday); invalid strings give `null` and `[]`; the file contains none of `Date`, `Intl`, `toLocale`, `getTimezoneOffset`
  - _Requirements: 3.1, 3.6, 13.2, 14.4_
  - Test file: `tests/calendar-days.test.ts`
  - May change: `src/ui/calendar-days.ts`, `tests/calendar-days.test.ts`

- [x] 2. **Parent constants and the approved text table**
  - [x] 2.1 Create `src/ui/parent-constants.ts` with `GATE_HOLD_SECONDS` (3), `ZONE_FACT_MIN_CAMERA_SESSIONS` (3), `NUDGE_MIN_NIGHTS` (2), `WINDOW_DAYS` (7), the `ParentViewConstants` type, `PARENT_VIEW_CONSTANTS` (built from `src/logic/constants.ts` and the constants above, with no number of its own for the core values) and `PARENT_TAP_TARGETS` (gate 160 x 72, clear 160 x 56, confirmClear 96 x 48, keep 96 x 48)
  - [x] 2.2 Create `src/ui/parent-text.ts` with `PARENT_TEXT` (one row per approved line, each with its `row` number and id from design section 6), `ZONE_NAMES` (row 25), `WEEKDAY_NAMES`, `MONTH_NAMES`, `JOIN` and `fill(text, values)`. Text is copied word for word from the approved table; row 4 ("Back") is not duplicated, it stays `DISPLAY_TEXT.back`
  - [x] 2.3 Test `parentTextPinned` (design test 10, table part): the table equals the approved strings of rows 1, 2, 3, 5 to 14 and 15 to 24 exactly (copied into the test); `ZONE_NAMES` are the four approved names; no row id appears in `src/audio/lines.ts`; no word or stem (case-insensitive) risk, danger, disease, decay, cavity, prevent, cure, guarantee, diagnos, clinic, doctor, missed, skipped; none of again, streak, "keep going", "brush more", "you should", "don't forget"; no run of 7 or more digits, no `@`, `www`, `http`; `fill` throws on an unfilled placeholder
  - [x] 2.4 Test the constants: `GATE_HOLD_SECONDS` 3, `ZONE_FACT_MIN_CAMERA_SESSIONS` 3, `NUDGE_MIN_NIGHTS` 2, `WINDOW_DAYS` 7; every `PARENT_TAP_TARGETS` entry is at least 48 x 48; `PARENT_VIEW_CONSTANTS` core values equal those in `src/logic/constants.ts`
  - _Requirements: 2.1, 5.3, 5.6, 6.2, 6.4, 7.1, 7.3, 8.1, 8.3, 10.1–10.6, 11.1, 11.3, 11.4, 12.1, 13.2, 13.4, 14.7_
  - Test file: `tests/parent-text.test.ts`, `tests/parent-constants.test.ts`
  - May change: `src/ui/parent-constants.ts`, `src/ui/parent-text.ts`, `tests/parent-text.test.ts`, `tests/parent-constants.test.ts`

- [x] 3. **Which stored sessions count, and the shared test fixtures**
  - [x] 3.1 Create `src/ui/parent-accept.ts` with `acceptSession(value, constants)` and `acceptedSessions(values, constants)` by the six rules of design section 5.3: plain object, valid date, valid `timeOfDay` and `mode`, finite `startedAt`, `monstersEarned` array, whole `durationSeconds` from 0 to `SESSION_DURATION`, one entry per zone each once with whole seconds from 0 to `ZONE_DURATION`, and brushed plus untracked over all zones at most `durationSeconds`. It never throws for any JSON value
  - [x] 3.2 Create `tests/fixtures/parent-sessions.ts` with `sessionArb(dates)` (valid sessions: any mode, time of day and verified flags, four zones in `ZONE_ORDER`, dates from the window, the days just outside it and a future day), `oddSessionArb` (one defect each: second count below 0 or above 30, missing field, negative `durationSeconds`, zone seconds above `durationSeconds`, repeated or missing zone, bad date, non-whole number, non-object), `todayArb` (month ends, a leap day, a year end) and `fakeBackend()` (Map-backed `StorageBackend` with switches that make `getItem`, `setItem` or `removeItem` throw)
  - [x] 3.3 Test `parentAccept`: every valid session is accepted; every `oddSessionArb` value is skipped; accepting never throws and never changes its input; the result does not depend on the order of the list
  - _Requirements: 13.5, 13.7, 14.15_
  - Test file: `tests/parent-accept.test.ts`
  - May change: `src/ui/parent-accept.ts`, `tests/fixtures/parent-sessions.ts`, `tests/parent-accept.test.ts`

- [x] 4. **Zone fact: where brushing was seen least**
  - [x] 4.1 Create `src/ui/parent-zone-fact.ts` with `zoneFact(windowCameraSessions, constants)` per design section 5.4. Fewer than `ZONE_FACT_MIN_CAMERA_SESSIONS` camera sessions gives row 12; 3 or more with no verified result gives row 12; best average 0 gives row 11; otherwise rows 10 or 10b with every tied zone in `ZONE_ORDER` order, names joined with `JOIN`. The average is compared by cross-multiplying, so no rounding decides a tie. `src/logic/stats.ts` is not changed
  - [x] 4.2 Test `parentViewZoneFact` (design test 5): under 3 camera sessions gives row 12 and no zone; 3 or more with no verified result gives row 12 and no zone; every verified result fully seen gives row 11 and no zone; otherwise the named zones are exactly those with the highest average of unseen seconds, by an independent oracle written with plain loops; one highest zone equals `zoneMostMissed` over the same sessions; ties give the approved forms for two, three and four zones ("and" before the last name, no comma before "and"); a zone whose average is 0 is never named; timer-only sessions and unverified results never change the result; the text never holds "missed", "skipped" or "not brushed"
  - _Requirements: 5.1–5.8, 6.2, 6.3, 10.4, 13.3, 14.5, 14.6_
  - Test file: `tests/parent-zone-fact.test.ts`
  - May change: `src/ui/parent-zone-fact.ts`, `tests/parent-zone-fact.test.ts`

- [x] 5. **The nudge**
  - [x] 5.1 Create `src/ui/parent-nudge.ts` with `nightsPerZone(windowSessions, constants)` and `nudge(nights, constants)` per design section 5.5. A night is a calendar day with at least one verified night-session result for the zone, where every such result has `secondsBrushed === 0`. Unverified results neither count nor block. Timer-only, morning and `neither` sessions are never read. `nudge` returns `null` below `NUDGE_MIN_NIGHTS`, names the zone with the most nights, ties to the first in `ZONE_ORDER`, and fills row 14 with only the zone name and the number
  - [x] 5.2 Test `parentViewNudge` (design test 6) with an independent oracle written without calling the code under test: zone and number equal the oracle; the number is at least 2; the most nights wins, a tie going to `ZONE_ORDER`; the text equals the approved sentence with only the zone name and number replaced; two night sessions on one day give at most one night; a day where any verified night session has `secondsBrushed > 0` for the zone never counts; an unverified night session neither counts nor blocks; a day with only unverified night sessions for the zone never counts; untracked seconds with `secondsBrushed > 0` never make a night; the result is the same whatever the number of camera sessions; no sessions gives `null`
  - _Requirements: 5.7, 7.1–7.8, 13.4, 14.3_
  - Test file: `tests/parent-nudge.test.ts`
  - May change: `src/ui/parent-nudge.ts`, `tests/parent-nudge.test.ts`

- [x] 6. **`parentView`: the facts, the nudge and the disclosure**
  - [x] 6.1 Create `src/ui/parent-view.ts` with the types of design section 4 and `parentView(sessions, constants, today)`. It accepts sessions with `acceptedSessions`, keeps those in `windowDates(today, WINDOW_DAYS)`, builds the seven day rows (row 6, 0 shown for empty days), the three durations (floored totals; `cameraSaw` is `computeVerifiedTime(windowSessions)` unchanged), the zone fact, the nudge and the six disclosure lines (rows 15 to 20, in order, in every data state). With no accepted session, or a `today` that does not parse, it returns row 13 and no rows, durations, zone fact or nudge, and still returns the disclosure. It never throws, reads no clock and changes no input
  - [x] 6.2 When `REQUIRE_SIDE_MATCH` or `REQUIRE_LEVEL_MATCH` passed in is `true`, leave disclosure line 3 out and set `disclosureNeedsApproval` to `true`
  - [x] 6.3 Tests `parentViewSevenDays`, `parentViewTimeFacts`, `parentViewTimerAndUnverifiedNeverCount` and `parentViewTooLittleData` (design tests 2, 3, 4, 7)
  - [x] 6.4 Test `parentViewDisclosure` (design test 8): six approved lines in order and no seventh in every data state; no number 15, 20, 36 or 9 in any line; line 3 absent and `disclosureNeedsApproval` true when either constant passed in is `true`; a guard that fails, with the message that Dr. Yatin must approve new wording for line 3, if the real `REQUIRE_SIDE_MATCH` or `REQUIRE_LEVEL_MATCH` in `src/logic/constants.ts` is `true`
  - _Requirements: 1.6, 3.1–3.6, 4.1–4.6, 5.1, 5.7, 6.1–6.4, 7.5, 7.6, 8.1–8.5, 13.1–13.3, 13.6, 14.1, 14.2, 14.4, 14.5, 14.8_
  - Test file: `tests/parent-view.test.ts`
  - May change: `src/ui/parent-view.ts`, `tests/parent-view.test.ts`

- [x] 7. **`parentView` over odd data, and the wording sweep**
  - [x] 7.1 Test `parentViewOddData` (design test 9): any mix of valid sessions, `oddSessionArb` entries and non-objects gives the same result as the valid sessions alone; the same list shuffled gives the same result; the ceilings of test 3 hold for the whole mix; `parentView` never throws for any JSON value; a store holding only skipped sessions shows row 13
  - [x] 7.2 Extend the wording test (design test 10, sentence part): every sentence `parentView` returns over generated sessions matches one approved template with only a number, a date part or a zone name filled in; the banned stems, urging phrases, digit runs and link characters of task 2.3 appear in none of them; the matcher flags "was missed", "prevents" and "risky" and passes the nudge
  - [x] 7.3 Fix `src/ui/parent-view.ts` or `src/ui/parent-accept.ts` only if one of these tests finds a real defect. Do not weaken a test to make it pass
  - _Requirements: 10.1–10.6, 11.4, 13.4, 13.5, 13.7, 14.7, 14.15_
  - Test file: `tests/parent-view-odd.test.ts`, `tests/parent-text.test.ts`
  - May change: `tests/parent-view-odd.test.ts`, `tests/parent-text.test.ts`, and, only to fix a defect found by those tests, `src/ui/parent-view.ts`, `src/ui/parent-accept.ts`

- [x] 8. **Stored-keys list and "Clear all data" logic**
  - [x] 8.1 In `src/storage/storage.ts` add `export const STORED_KEYS: readonly string[] = [STORAGE_KEY]` and make `clearAll()` remove every key in it, each in its own `try/catch`. `STORAGE_KEY`, `saveSession`, `loadSessions` and the types do not change, and `tests/storage.test.ts` is not edited
  - [x] 8.2 Create `src/ui/parent-clear.ts` with `clearAllData(storage)` (returns `'cleared'` or `'failed'`: `'failed'` only if sessions can still be read after the clear) and `clearNotice(outcome)` (row 24 for `'failed'`, `null` otherwise). No DOM
  - [x] 8.3 Test `clearAllData` (design test 13): over a Map-backed fake backend with saved sessions, after the clear `loadSessions()` is empty, the backend holds no key, `parentView` of the loaded sessions shows row 13 and no nudge, `computeMonsterBook` is empty, `computeMissScores` are all 0 and `isRareEligibleForNewSession([], 'night')` is false; a backend whose `removeItem` throws gives `'failed'` and `clearNotice` returns row 24; a backend that throws everywhere does not throw; `clearNotice('cleared')` is `null`
  - [x] 8.4 Test `storedKeysGuard` (design test 14): `STORED_KEYS` holds `STORAGE_KEY`; every `.setItem(` call under `src/` writes a key whose value is in `STORED_KEYS`; no file under `src/` outside `storage.ts` and `main.ts` mentions `localStorage`; with every key in `STORED_KEYS` pre-filled, `clearAll()` leaves the backend empty
  - _Requirements: 9.2–9.5, 14.9, 14.10, 15.3_
  - Test file: `tests/parent-clear.test.ts`, `tests/storage-keys.test.ts`
  - May change: `src/storage/storage.ts`, `src/ui/parent-clear.ts`, `tests/parent-clear.test.ts`, `tests/storage-keys.test.ts`

- [x] 9. **Adult gate (pure state machine)**
  - [x] 9.1 Create `src/ui/adult-gate.ts` with `GateState`, `GATE_START`, `gatePress`, `gateRelease`, `gateCancel`, `gateAdvance` and `gateProgress` exactly as design section 5.2. The state holds only the start of the current hold, never a total. `max(0, ...)` keeps a clock that steps backwards from passing early. No storage, no clock read, no `Date`, no `performance`
  - [x] 9.2 Test `adultGate` (design test 11) with a fake clock and any sequence of press, release, cancel and advance events with non-decreasing times: the gate passes exactly when one unbroken hold of at least 3000 ms has been advanced past; 2999 ms does not pass; a release at 3001 ms after `gateAdvance` passes; an early release resets to `GATE_START`; several short holds never pass; a key up does not end a pointer hold and a pointer up does not end a key hold; Space and Enter holds behave as a pointer hold; after `passed`, release and cancel change nothing; a backwards clock never passes; a second press during a hold changes nothing
  - [x] 9.3 Test `gateProgressMark` (design test 12, state part): `step` is 0 to 3 and `fraction` is 0 to 1; neither falls while a hold lasts; both are 0 when not held; `step` equals `floor(elapsed / 1000)`
  - _Requirements: 2.1–2.4, 2.5, 2.6, 2.7, 14.11_
  - Test file: `tests/adult-gate.test.ts`
  - May change: `src/ui/adult-gate.ts`, `tests/adult-gate.test.ts`

- [x] 10. **Screen model (pure phases, confirmation, notice)**
  - [x] 10.1 Create `src/ui/parent-screen-model.ts` with `ParentScreenState` and the pure steps `openScreen`, `withGate`, `askToClear`, `keepData`, `afterClear` and `closeScreen` per design sections 4 and 5.7. `openScreen` gives phase `gated`, a fresh gate, no notice and no confirmation. Contents are shown only in phase `unlocked`. `askToClear` does nothing unless `unlocked`. `afterClear` ends the confirmation and sets `notice` only for `'failed'`. `closeScreen` returns a state with no view, a fresh gate, no notice and no confirmation
  - [x] 10.2 Test `parentScreenModel` (design test 15): any sequence of steps follows the rules above; reopening always starts gated; the model never shows contents before the gate passes; `keepData` removes nothing and calls nothing
  - _Requirements: 1.2, 1.6, 2.2, 9.2, 9.4, 9.5, 9.6, 14.11, 14.13_
  - Test file: `tests/parent-screen-model.test.ts`
  - May change: `src/ui/parent-screen-model.ts`, `tests/parent-screen-model.test.ts`

- [x] 11. **Styles and the one `index.html` line**
  - [x] 11.1 Create `src/ui/parent-screen.css`: one scrolling column; `--parent-fg` and `--parent-bg` as 6-digit hex colours with contrast of at least 4.5 to 1; a `:focus-visible` outline on `gate-button`, `parent__back`, `parent-clear__button` and both confirmation buttons; `touch-action: none`, `user-select: none` and `-webkit-touch-callout: none` on the gate button; the gate ring that fills with `--gate-fraction`, three dots that fill with `data-step`, and a `prefers-reduced-motion: reduce` block that hides the ring and shows only the dots. No `animation`, `infinite`, `@font-face` or `url(`
  - [x] 11.2 In `index.html` add exactly one line, `<link rel="stylesheet" href="/src/ui/parent-screen.css" />`, next to the four existing stylesheet links (approved by Dr. Yatin on 22 Nov 2026). Change nothing else in the file, and do not touch the Content-Security-Policy
  - [x] 11.3 Test `parentCss` (design test 16): `--parent-fg` and `--parent-bg` are 6-digit hex with a contrast ratio of at least 4.5; every interactive class has a `:focus-visible` rule; the gate button sets `touch-action: none` and `user-select: none`; the reduced-motion block exists and shows the steps; no `@font-face`, `url(`, `<style`, `infinite` or `animation`; `TAP_TARGETS.bookBack` and every `PARENT_TAP_TARGETS` entry are at least 48 x 48
  - [x] 11.4 Check that `npm run build` output still passes the existing `build-output` and `csp` tests with the new link
  - _Requirements: 1.7, 2.5, 2.8, 12.1, 12.3, 12.4, 12.5, 14.13, 15.3_
  - Test file: `tests/parent-css.test.ts`
  - May change: `src/ui/parent-screen.css`, `index.html` (the one line only), `tests/parent-css.test.ts`

- [x] 12. **Gate painter (DOM) and the source guards**
  - [x] 12.1 Create `src/ui/parent-gate-view.ts`: one `<button type="button" class="gate-button">` of at least `PARENT_TAP_TARGETS.gate`, with the visible label (row 3), the instruction line (row 2), `aria-labelledby` made from both, an icon, the ring and three dots. It takes a clock (`now`), a `FrameScheduler`, a `VisibilitySource` and an `onPassed` callback as inputs
  - [x] 12.2 Pointer: primary pointer only; `releasePointerCapture` on `pointerdown`; `pointerup`, `pointercancel` and `pointerleave` release; `contextmenu` is cancelled. Keyboard: Space and Enter, ignoring `event.repeat`; `keyup` releases. `blur` and a hidden tab cancel. On release it calls `gateAdvance` first and then `gateRelease`. It reads only the injected clock, never `event.timeStamp`. While held it asks the injected scheduler for each frame and writes `data-step` and `--gate-fraction`. On pass it cancels the request and calls `onPassed`. Nothing is stored, spoken or sent, and nothing is shown on an early release
  - [x] 12.3 Create the source-guard test `parentScreenSourceGuards` (design test 17) over every new `.ts` and `.css` file that exists at this point: none contains `setInterval`, `setTimeout`, `requestAnimationFrame`, `requestVideoFrameCallback`, `import(`, `getUserMedia`, `fetch(`, `localStorage`, `setItem`, `document.cookie`, `console.`, `<style`, `style=`, `innerHTML`, `<img`, `speaker`; none imports from `src/tracking/`, `src/audio/` or `lines.ts`; the pure files have no `document`, `window`, `Date`, `performance` or `Math.random`; nothing under `src/logic/` imports a file of this spec; the gate button has a `PARENT_TAP_TARGETS` size and an `aria-labelledby`. The file list is read from the folder by name pattern, so later tasks need not edit it
  - [x] 12.4 Confirm the existing `privacy-guard`, `tracking-guards`, `tracking-source-rules` and `mirror-screens-guards` tests still pass over the new files
  - _Requirements: 1.4, 2.2, 2.3–2.9, 11.1, 12.4, 12.6, 14.11–14.13_
  - Test file: `tests/parent-screen-guards.test.ts`
  - May change: `src/ui/parent-gate-view.ts`, `tests/parent-screen-guards.test.ts`

- [x] 13. **Parent screen painter: open, close, facts and disclosure**
  - [x] 13.1 Create `src/ui/parent-screen.ts` with `createParentScreen(deps)` returning `{ open(), close() }` (types in design section 4). `open()` reads `storage.loadSessions()`, calls `parentView(sessions, PARENT_VIEW_CONSTANTS, today())` once, sets the model to `gated` and builds only the header (Back with an icon, `DISPLAY_TEXT.back`, an accessible name and the `TAP_TARGETS.bookBack` size, and the `h1` with row 1) and the gate. Focus goes to the gate button. The screen starts no camera, requests no permission, plays no sound and speaks nothing
  - [x] 13.2 Build the contents only in the function that runs after the gate passes, and move focus to the `h1`. Paint what `parentView` returned and decide nothing: the `h2` (row 5), the seven day rows, the three durations, the zone fact, the nudge as a plain paragraph (no icon, bell, badge or colour) only if present, row 13 when there are no sessions, and the six disclosure lines as an always-open list. `<section>` landmarks take their names from lines already on the screen. If `disclosureNeedsApproval` is true, paint the lines it returned and nothing more
  - [x] 13.3 `close()` cancels the frame request, removes every listener (including the visibility subscription), empties the screen, hides it and sets the model to `closeScreen()`, so no session data and no gate state survive. A failed read of the sessions shows row 13 and no error message
  - [x] 13.4 Extend nothing in the guard test: confirm `tests/parent-screen-guards.test.ts` now also covers `parent-screen.ts`, and that the contents are not created in the opening code (the guard checks that the facts builder is called only from the `onPassed` path)
  - _Requirements: 1.1–1.7, 3.2–3.5, 4.6, 5.6, 6.1, 6.4, 7.8, 8.1, 12.1–12.5, 13.1, 14.13_
  - Test file: `tests/parent-screen-guards.test.ts` (no edit expected; it reads the folder)
  - May change: `src/ui/parent-screen.ts`, `tests/parent-screen-guards.test.ts` (only to add a missing check)

- [x] 14. **Parent screen painter: "Clear all data"**
  - [x] 14.1 In `src/ui/parent-screen.ts`, build the "Clear all data" button (row 21, icon, accessible name, `PARENT_TAP_TARGETS.clear` size) only after the gate passes. Pressing it calls `askToClear` and shows one confirmation: the question (row 22), the clearing button ("Clear all data", row 21, `confirmClear` size) and "Keep" (row 23, `keep` size). Focus goes to "Keep". Nothing is removed before the clearing button is pressed, and there is no second confirmation
  - [x] 14.2 "Keep" calls `keepData`, removes nothing and returns focus to the clear button. The clearing button runs `clearAllData(storage)`, reads the sessions again, builds a new view with `parentView` and the same `today`, calls `afterClear` and repaints: row 13, no nudge and the disclosure after a clear; row 24 (`clearNotice`) and no claim of clearing after a failure
  - [x] 14.3 Confirm `tests/parent-screen-guards.test.ts` covers the three new buttons (size and accessible name) and that no clear control or confirmation is created before the gate passes. Add checks to that file only if one is missing
  - _Requirements: 9.1–9.6, 12.1, 12.4, 14.9, 14.13_
  - Test file: `tests/parent-screen-guards.test.ts`
  - May change: `src/ui/parent-screen.ts`, `tests/parent-screen-guards.test.ts`

- [x] 15. **Wire the parent screen in `main.ts`**
  - [x] 15.1 **Do not start until `mirror-and-screens` tasks 36, 37 and 38 are all `[x]`** and `src/ui/session-screen.ts` declares `onOpenParent`. If they are not, stop and report; do not mock or bypass the control
  - [x] 15.2 In `src/main.ts` only: build the frame adapter around the browser's frame callback (the one place the word may appear), build `createParentScreen` once with the existing `storage`, a `today` that reuses the `localDate` function `main.ts` already has, `now: () => performance.now()`, the frame adapter, the `visibility` source `main.ts` already has and `onBack: () => { parent.close(); screen.showStart(); }`. Define one `openParent` function (`screen.hide(); parent.open()`) and pass it as `onOpenParent`. Nothing else in `main.ts` changes, and the end card and session panel get no parent handler
  - [x] 15.3 Test `parentMainWiring` (design test 18): `main.ts` calls `createParentScreen` once and passes one `onOpenParent`; `parent.open()` is called only inside `openParent`; Back calls `parent.close()` and `screen.showStart()`; `end-card.ts` and the session panel code have no `onOpenParent`
  - [x] 15.4 Test `existingSuite` (design test 19): every existing test passes unchanged, including `storage`, `stats`, `display-text`, `new-text-guard`, `lines`, `existing-lines-pinned`, `privacy-guard`, `tracking-source-rules`, `mirror-screens-guards`, `csp` and `build-output`
  - _Requirements: 1.1, 1.3, 1.5, 12.6, 14.12, 14.14, 15.1–15.3_
  - Test file: `tests/parent-main-wiring.test.ts`
  - May change: `src/main.ts`, `tests/parent-main-wiring.test.ts`

- [ ] 16. **Manual checks on a phone and on a laptop**
  - [ ] 16.1 No code or test changes in this task. Run `npm run test:run` and `npm run build` first, then `npm run dev`. Real sessions on Dr. Yatin's phone, or a typed `foamtom:v1` value in DevTools, are the only data sources: the build has no demo hook
  - [ ] 16.2 **M1 Gate on a phone.** Touch and hold the gate button. Look at: the ring fills and the dots fill one by one; at 3 seconds the contents appear. Lift at 2 seconds: the mark empties and nothing is said. Slide the finger off the button while holding: the mark empties. A long press opens no menu and selects no text. Three 1-second holds do not open it
  - [ ] 16.3 **M2 Layout.** Portrait at 360 x 640: Back and "Clear all data" are reachable with one hand and by scrolling, with no sideways scroll. Rotate the phone, and open it on a laptop: still usable
  - [ ] 16.4 **M3 Keyboard and screen reader.** On a desktop, Tab to the gate and hold Space for 3 seconds, then again with Enter: the contents open, focus is visible, and focus lands on the "Grown-ups" heading. With a screen reader before the gate is passed, only "Grown-ups", the instruction, the gate and Back are read; no fact, no disclosure line and no clear button. After the gate, headings and named sections can be jumped between
  - [ ] 16.5 **M4 Network, camera, sound.** Open the screen with the Network panel open: no request is made. The camera light stays off. No sound plays and nothing is spoken
  - [ ] 16.6 **M5 Clear all data, for real.** In DevTools, Application, Local Storage: `foamtom:v1` is there. Press "Clear all data", then "Keep": nothing changes. Press it again and clear: the key is gone, the screen shows "No sessions yet." and the six disclosure lines, the Monster Book shows twelve silhouettes, and the title screen still works
  - [ ] 16.7 **M6 Wording read-through.** Put the screen next to "Lines for Dr. Yatin to approve": every line matches. The nudge matches `dental-rules.md` word for word. No line says anything was "missed", and none claims which side or which teeth were brushed. Dr. Yatin signs this off
  - [ ] 16.8 **M7 Entry control.** The small control on the title screen opens the gate; Back returns to the title screen; the control is not on the session screen or the end card
  - [ ] 16.9 **M8 Colour and motion.** View the gate in grayscale: the progress is still clear. Turn on reduce-motion in the device settings: the ring is replaced by three steps
  - [ ] 16.10 Record any line found no longer true against the code as an open question for Dr. Yatin. Do not reword it
  - _Requirements: 1.1–1.5, 2.3–2.5, 2.7–2.9, 5.6, 7.1, 7.7, 7.8, 8.1, 9.2, 9.4, 9.6, 10.1–10.6, 12.1–12.5_
  - Test file: none (manual)
  - May change: no files

---

Not in this file: the title-screen entry control (`mirror-and-screens` tasks 36 to 38) and any
change to `src/logic/stats.ts`.
