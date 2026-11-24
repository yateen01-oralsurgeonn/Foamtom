# Tasks: mirror-and-screens

## Implementation plan

Forty-seven small tasks, in four groups. The group matters because the Kiroween video is due
on 4 Dec 2026 (2 pm PT).

| Tasks | Mark | What |
|-------|------|------|
| 1 to 32 | **needed for the video** | Pure functions and their tests (1 to 9), effects host (10), the frame as guidance (11 to 13), the twelve monsters, their states and smoke (14 to 18), sounds (19 to 21), the end card (22 to 24), the Monster Book and the title screen (25 to 29), caption contrast (30), whole-spec guards (31), final checks for the video (32) |
| 33 to 40 | **later** | The rare-monster invitation, requirement 8 (33 to 35); the parent entry point, requirement 2 (36 to 38); landscape, desktop and focus marks, requirement 12 (39); final checks for the later items (40) |
| 41 | **closed, 21 Nov 2026** | The tooth-shape question (design section 10). Dr. Yatin chose option 1: no drawing work |
| 42 to 47 | **needed for the video** | Fixes after Dr. Yatin's camera session of 21 Nov 2026 (requirements Decision 8): timer-only smoke (42), no overlap of monsters (43), clearer shrink (44), hit feedback (45), smoke readability (46), and a check by hand in camera mode (47) |

Every task of group 1 comes before every task of group 2. Tasks 42 to 47 were added on 21 Nov
2026, after the others were written. They are **needed for the video**, so they are built
**before** tasks 33 to 40, in the order 42, 43, 44, 45, 46, 47. They need the code sub-tasks
of tasks 13 to 18 (the frame, the monster states, the leaving copy and the presenter) to be
done. Each task carries a `Mark:` line, and a sub-task that belongs to a different mark says
so. The three "later" requirements are additive: none of tasks 1 to 32 or 42 to 47 depends on
them (design section 1.1).

This spec changes how things look and sound. It never changes a game rule, a number, a stored
value, `toView`, its output type, `SignalSource`, the signal, `game-loop.ts`, or anything
under `src/logic/`, `src/tracking/` or `src/storage/` (requirement 16.1). The one exception is
task 42: Dr. Yatin's rule change of 21 Nov 2026 to core requirement 8.5 (requirement 16.4),
which touches `src/logic/constants.ts` and `src/logic/session.ts` and the tests that pinned
the old rule. Between task 1 and task 47 the game runs after every task: the title screen
opens and a timer-only session plays through to the end card.

### Rules for every task

- One task per run. One module (or two small ones) plus its tests. A task names at most about
  four files; where more were needed, the work is split into more tasks.
- Every task ends with `npm run test:run` and `npm run build` both passing. The last sub-task
  of each task says so and says what the player sees.
- A task changes only the files named under "Files this task may change". It never edits
  anything in `.kiro/`. It never edits `requirements.md` or `design.md`.
- "Pre-spec tests" are the test files that exist before task 1 of this spec. No task edits
  them, except task 42, which updates the pre-spec test files it names to Dr. Yatin's new
  timer-only rule (requirement 16.4). A test file that this spec creates may be extended by a later
  task that names it.
- Tests are written in the same task as the code they test. Test names follow design section
  8. Test helpers (arbitraries, fakes) are written inside the test file that uses them. Where a
  test needs the session helpers of `core-brushing-loop` (`startSession`, `tick`, `pause`,
  `resume`, a signal arbitrary), it copies the few lines it needs and does not import from
  another test file.
- The project has no DOM library, and this spec adds none. Painters are checked by a source
  scan in a test and by a manual sub-task. Their decisions are pure functions with tests.
- New pure files import from `src/logic/` only (and from other pure files of this spec). They
  have no DOM, no clock and no randomness (requirement 16.2).
- No new file calls `setInterval`, `setTimeout`, `requestAnimationFrame` or
  `requestVideoFrameCallback` (requirement 13.3). Events such as `animationend`, `change` and
  `visibilitychange` are allowed.
- New styling uses stylesheet classes and `element.style` / `setProperty` only. No `style=""`
  attribute, no `<style>` element, no `innerHTML`, no `url(`, no web font, no `<img>`, and
  SVG only through `createElementNS` (requirements 13.1, 13.2). Do not touch the
  Content-Security-Policy in `index.html`.
- No new word is shown or spoken unless it is one of the 19 approved lines in
  `requirements.md`, used word for word. If a task seems to need another word, stop and ask
  Dr. Yatin. Do not invent child-facing text.
- Nothing drawn or played reads the camera, a landmark or a `DrawValue` (requirement 13.4).
  No new file imports from `src/tracking/`.
- A "Check by hand" sub-task says exactly what to look at. If the agent cannot run a browser,
  a phone or a screen reader, it leaves that sub-task unticked and says so in its report. It
  never ticks a check it did not do.
- New CSS files are linked from `index.html` with one `<link rel="stylesheet">` line each, in
  the same form as the existing `/src/ui/styles.css` line. `src/ui/styles.css` is only added
  to, and only where a task says so, and never in the rules that `camera-preview.test.ts`
  reads.

---

## Group 1: needed for the video

- [x] 1. **Effects table and reduced motion (pure)**
  - Mark: needed for the video (req 3, 4, 11, 15).
  - [x] 1.1 Create `src/ui/effects.ts` with: `MIN_CYCLE_MS = 334`; `LoopId` and `LOOP_CYCLES_MS` (`flameActive` 1700, `glowActive` 2200, `glowDim` 3600, `fogDrift` 30000, `smokeDrift` 2800); `ONE_SHOT_MS` (`fadeIn` 600, `glowMove` 400, `leave` 1400, `intoBook` 1200); `RegionLevel`, `RegionLook` and `REGION_LOOKS` for `active`, `dim` and `off` (design section 5.1 values); `FRAME_METRICS` with `ringPx` 32 only (the landscape size is added in task 39); `Effects`, `effectsFor(prefersReducedMotion)` and `effectClasses(effects)` (design section 5.9). Declare `RegionLevel` and `RegionLook` here, so that `frame-guidance.ts` can re-export them without a circular import
  - [x] 1.2 Test `effectsForReducedMotion` (design test 12): `effectsFor(true)` turns off the five moving effects and leaves `glow`, `ornament`, `sizeChange` and `smokeThinning` on; `effectsFor(false)` has all nine on; `effectClasses` lists exactly the effects that are off
  - [x] 1.3 Test `flashRate`, table part (design test 14): every `LoopId` has a cycle; every cycle is at least `MIN_CYCLE_MS`; no `flickerAmplitude` is above 0.25
  - [x] 1.4 Test `frameRegionLooksDiffer` (design test 2): `active` differs from `dim` in `glowOpacity` (higher), `glowSizePx` (larger) and `flame` (true against false) and has the larger `flickerAmplitude`; `off` has `glowOpacity` 0, `glowSizePx` 0 and no flame
  - [x] 1.5 Run `npm run test:run` and `npm run build`: both pass. Nothing uses the file yet, so the game is unchanged
  - _Requirements: 3.4, 3.5, 11.2, 11.3, 15.4, 15.5, 16.2_
  - Test file: `tests/effects.test.ts`
  - Files this task may change: `src/ui/effects.ts`, `tests/effects.test.ts`

- [x] 2. **Frame guidance (pure)**
  - Mark: needed for the video (req 3, 15.1).
  - [x] 2.1 Create `src/ui/frame-guidance.ts` with `FrameRegion`, `ZONE_REGION` (upper-left to top-left, upper-right to top-right, lower-left to bottom-left, lower-right to bottom-right), `REGION_ORDER`, `RegionState`, `FrameGuidance` and `frameGuidance(input)` as in design section 5.1. The argument type is `Pick<View, 'phase' | 'zoneId'> | null`, so health, smoke, caption, countdown, monster and mode cannot reach it. Re-export `RegionLevel` and `RegionLook` from `effects.ts`. No swap, negation or inversion of left and right, and no left/right ternary: the side is chosen only through the table
  - [x] 2.2 Test `frameGuidanceZones` (design test 1): each zone gives exactly one active region; the four regions are different; the four mappings are as stated; `ended` and `null` give four `off` regions and no active region; `paused` keeps the region lit with `flickering` false; `running` has `flickering` true; two views that differ only in health, smoke, caption, countdown or monster give equal results; the region is the same before and after a defeat
  - [x] 2.3 Test: the source of `frame-guidance.ts` contains no `scaleX`, no `rawToChildSide`, no `raw-left` or `raw-right`, and no `? 'left' : 'right'` or `? 'right' : 'left'`
  - [x] 2.4 Run `npm run test:run` and `npm run build`: both pass. Nothing uses the file yet, so the game is unchanged
  - _Requirements: 3.2, 3.3, 3.7, 3.8, 3.9, 15.1, 16.2_
  - Test file: `tests/frame-guidance.test.ts`
  - Files this task may change: `src/ui/frame-guidance.ts`, `tests/frame-guidance.test.ts`

- [x] 3. **Monster draw state, smoke look and zone-end event (pure)**
  - Mark: needed for the video (req 6, 15.2).
  - [x] 3.1 Create `src/ui/monster-draw-state.ts` with `MIN_MONSTER_SCALE` (0.35, the value `session-screen.ts` has now), `MonsterDrawState`, `ZoneEndOutcome`, `ZoneEnd`, `SmokeLook`, `monsterDrawState(view, endOutcome)`, `monsterScale(h)`, `smokeLook(f)` and `zoneEndEvent(prev, next)` as in design section 5.4
  - [x] 3.2 In `src/ui/session-screen.ts` replace only the local `MIN_MONSTER_SCALE` constant with an import from the new file. Nothing else changes and the behaviour is the same
  - [x] 3.3 Test `monsterDrawStateProperties` (design test 4): one state for every generated `View` and outcome; health 1 gives `sitting`; between 0 and 1 gives `shrinking`; 0 with smoke above 0 gives `defeated`; 0 with no smoke gives `gone`; the outcomes `defeated`, `fled` and `trapped` give those states; the same input gives the same state
  - [x] 3.4 Test `scaleAndSmokeLook` (design test 5): `monsterScale` is never below `MIN_MONSTER_SCALE`, never above 1 and never rises as health falls; `smokeLook` puffs, scale and opacity never rise as smoke falls; 0 gives no puff and anything above 0 gives at least one
  - [x] 3.5 Test `zoneEndEvents` (design test 6): over any 120 signals-or-null in either mode, exactly four events per session, in zone order, none `pending`, each equal to the final `monsters[i].outcome`; no event when the state is paused or resumed (use the existing `pause` and `resume`); the number of events is the same for every signal sequence
  - [x] 3.6 Run `npm run test:run` and `npm run build`: both pass. The game looks the same
  - _Requirements: 6.1, 6.2, 6.5, 6.6, 6.7, 15.2, 16.2_
  - Test file: `tests/monster-draw-state.test.ts`
  - Files this task may change: `src/ui/monster-draw-state.ts`, `src/ui/session-screen.ts` (the one import), `tests/monster-draw-state.test.ts`

- [x] 4. **Monster look table (pure)**
  - Mark: needed for the video (req 5).
  - [x] 4.1 Create `src/ui/monster-looks.ts` with the shape types, the 12-row `MONSTER_LOOKS` table (design section 5.3 starting values, shapes only) and `shapeKey(look)`. There is no colour field, and no mouth value that is a tooth, fang, blood or drip
  - [x] 4.2 Test `monsterLooks` (design test 8): keys equal the twelve ids of `MONSTERS` in table order; the twelve `shapeKey` values are pairwise different; every field is in its allowed set; every rare has `star` and a crest and the four crests are different; no common monster has a star or a crest
  - [x] 4.3 Run `npm run test:run` and `npm run build`: both pass. Nothing uses the file yet, so the game is unchanged
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 16.2_
  - Test file: `tests/monster-looks.test.ts`
  - Files this task may change: `src/ui/monster-looks.ts`, `tests/monster-looks.test.ts`

- [x] 5. **Sound data and envelope (pure)**
  - Mark: needed for the video (req 10).
  - [x] 5.1 Create `src/audio/sounds.ts` with `SoundId`, `SoundVoice`, `SoundSpec`, `EFFECT_PEAK_GAIN` (0.25), `CUE_GAP_MS` (450), the five-row `SOUNDS` table (design section 5.8 starting values) and `envelopeGainAt(spec, ms)`. Import `GAIN_LEVEL` and `GAIN_STEP_PER_MS` from `src/audio/speaker.ts`; do not copy them. Sine and triangle waves only, pitches 200 to 1000 Hz
  - [x] 5.2 Test `soundData` (design test 15), sampled every 1 ms: five sounds, one per `SoundId`; gain at 0 ms is 0; no 1 ms step rises by more than `GAIN_STEP_PER_MS`; no gain is above `GAIN_LEVEL` or `EFFECT_PEAK_GAIN`; `EFFECT_PEAK_GAIN` is below `GAIN_LEVEL`; each sound's voice levels add to at most 1; pitches are within 200 to 1000 Hz; each total length is at most 1500 ms; gain is 0 again at the end
  - [x] 5.3 Run `npm run test:run` and `npm run build`: both pass. Nothing plays yet, so the game is unchanged
  - _Requirements: 10.1, 10.2, 10.3, 10.5, 10.10, 15.6, 16.2_
  - Test file: `tests/sounds.test.ts`
  - Files this task may change: `src/audio/sounds.ts`, `tests/sounds.test.ts`

- [x] 6. **Sound cues (pure)**
  - Mark: needed for the video (req 10.4, 10.6).
  - [x] 6.1 Create `src/ui/sound-cues.ts` with `SoundCue` and `cuesFor(prev, next)` as in design section 5.8: a `defeat`, `flee` or `trapped` cue (delay 0) for each monster whose outcome changed; a `zone-start` cue at the first state and whenever the active zone index rose, with delay `CUE_GAP_MS` when it shares a tick with an outcome cue, else 0; no cue at all when `next.phase` is `ended`. It never reads the signal or the brushing speed
  - [x] 6.2 Test `soundCues` (design test 7): over any 120 signals-or-null in either mode, for every tick except the one that ends the session the cues hold exactly one outcome cue for each monster whose outcome changed on that tick and no other, and `zone-start` exactly when the zone changed or at the first state; a `zone-start` that shares a tick with an outcome cue has `delayMs` `CUE_GAP_MS`, otherwise 0; outcome cues have `delayMs` 0; over the session there are four `zone-start` cues; the tick that ends the session gives no cue; no outcome cue appears twice for one monster
  - [x] 6.3 Run `npm run test:run` and `npm run build`: both pass. Nothing plays yet, so the game is unchanged
  - _Requirements: 10.4, 10.6, 16.2_
  - Test file: `tests/sound-cues.test.ts`
  - Files this task may change: `src/ui/sound-cues.ts`, `tests/sound-cues.test.ts`

- [x] 7. **Pin the seven existing lines and add `end-close`**
  - Mark: needed for the video (req 9.2, 14).
  - [x] 7.1 First write `tests/existing-lines-pinned.test.ts` (design test 18) and run it: it pins the exact `text` and `caption` of `start`, `zone-upper-right`, `zone-upper-left`, `zone-lower-left`, `zone-lower-right`, `smoke` and `end` as they are now. It must pass before any edit to `lines.ts`
  - [x] 7.2 In `src/audio/lines.ts` add exactly one line, with a caption: `end-close`, "Two minutes. Every corner." The seven existing lines are not touched. The pre-spec `tests/lines.test.ts` is not edited and passes with the new line
  - [x] 7.3 Extend the new test file: `end-close` has the text and caption "Two minutes. Every corner."; the seven pinned lines are unchanged
  - [x] 7.4 Run `npm run test:run` and `npm run build`: both pass. Nothing speaks `end-close` yet, so the game is unchanged
  - _Requirements: 9.2, 10.9, 14.1, 14.2, 14.3, 15.7_
  - Test file: `tests/existing-lines-pinned.test.ts`
  - Files this task may change: `src/audio/lines.ts`, `tests/existing-lines-pinned.test.ts`

- [x] 8. **Second text table and the new wording guard**
  - Mark: needed for the video (req 1.3, 14). The `grown-ups` row and the `rare-invite` line are later (tasks 33 and 36).
  - [x] 8.1 Create `src/ui/display-text.ts` with `DisplayTextId`, `DisplayText` and `DISPLAY_TEXT` (design section 4), holding four rows: `privacy` ("The camera stays on this phone. Nothing is saved or sent.", kind `shown`), `book-title` ("Monster Book", `shown`), `back` ("Back", `shown`) and `not-met` ("Not met yet", `name-only`). Do not add `grown-ups` yet
  - [x] 8.2 Test `displayTextPinned` (design test 16, needed part): `DISPLAY_TEXT` equals the approved strings of rows 1, 16, 17 and 19 exactly; the monster names in `MONSTERS` are the twelve approved ones, in order
  - [x] 8.3 Test `newTextGuard` (design test 17): every `DISPLAY_TEXT` row, all twelve monster names (with the caption shown for each, which is the same string) and `end-close` contain no word of the core banned list (prevent, cure, cavity-free, guarantee, diagnose, clinic, doctor, almost, lost, lose, failed, missed) and none of again, tomorrow, "come back", streak, hurry, blood, gore, kill, die, dead, hurt, scream, matched as whole words with `(^|[^a-z])word([^a-z]|$)` on lower-case text. Do not apply the camera-and-light rule. The matcher passes "Twilight Toffee Wraith" and "Midnight Molar Ghoul", flags "die" in "Do not die" and does not flag "Diet". Keep the list of checked texts in one array so that tasks 33 and 36 can add to it
  - [x] 8.4 Run `npm run test:run` and `npm run build`: both pass. Nothing shows the text yet, so the game is unchanged. The pre-spec `tests/lines.test.ts` is not edited
  - _Requirements: 1.3, 7.4, 10.9, 14.1, 14.3, 14.4, 14.5, 15.7_
  - Test file: `tests/display-text.test.ts`, `tests/new-text-guard.test.ts`
  - Files this task may change: `src/ui/display-text.ts`, `tests/display-text.test.ts`, `tests/new-text-guard.test.ts`

- [x] 9. **Tap targets and title controls (pure)**
  - Mark: needed for the video (req 1, 7.7, 9.3, 11.4). The `parent` row and control are later (tasks 36 to 38).
  - [x] 9.1 Create `src/ui/tap-targets.ts` with `TapTargetId`, `TapTarget` and `TAP_TARGETS` (design section 5.5 starting values: `start` 160 x 72, `titleBook` 128 x 52, `bookCell` 72 x 72, `bookBack` 96 x 48, `endDone` 160 x 72, `endBook` 128 x 56). No `parent` row yet
  - [x] 9.2 Create `src/ui/title-model.ts` with `TitleControl` and `titleControls()` returning two controls: `start` (`large`, target `start`, text id `start-line`, icon) and `book` (`small`, target `titleBook`, text id `book-title`, icon)
  - [x] 9.3 Test `tapTargets` (design test 22, needed part): every entry is at least 48 x 48; `titleBook` is smaller than `start` in width and in height; `start` equals the `min-width` and `min-height` of `.big-button` in `src/ui/styles.css` (read the file and compare)
  - [x] 9.4 Test `titleModel` (design test 21, needed part): exactly one `large` control and it is `start`; one `small` control, `book`; each has an icon and a text id; no control id or text id mentions sound, mute or volume; `privacy` is a `DISPLAY_TEXT` entry of kind `shown`
  - [x] 9.5 Run `npm run test:run` and `npm run build`: both pass. Nothing uses the files yet, so the game is unchanged
  - _Requirements: 1.1, 1.2, 1.8, 7.7, 9.3, 10.11, 11.4, 15.9, 16.2_
  - Test file: `tests/tap-targets.test.ts`, `tests/title-model.test.ts`
  - Files this task may change: `src/ui/tap-targets.ts`, `src/ui/title-model.ts`, `tests/tap-targets.test.ts`, `tests/title-model.test.ts`

- [x] 10. **Effects host: reduced motion, tab hidden, cycle variables**
  - Mark: needed for the video (req 11.2, 11.3, 13.3).
  - [x] 10.1 Create `src/ui/effects-host.ts` with `startEffects({ root, matchMedia, visibility })` as in design section 5.9: write one `--cycle-<id>` variable per `LoopId` (for example `--cycle-flame-active: 1700ms`) with `setProperty`; put the classes of `effectClasses(effectsFor(...))` on the root; follow the `change` event of `(prefers-reduced-motion: reduce)`; put `fx-paused` on the root while the document is hidden and take it off when visible. `matchMedia` and the visibility source are optional; if `matchMedia` is missing or throws it uses `effectsFor(false)`. Event listeners only, no timer
  - [x] 10.2 In `src/main.ts` call `startEffects` once at start-up with the real `document.documentElement`, `window.matchMedia` and a small visibility adapter built from `document`. No other change to `main.ts`
  - [x] 10.3 Test `effectsHostFollowsPreference` (design test 13) with a fake root (`classList`-like add, remove, contains; `style.setProperty`), a fake media query that can fire `change`, and a fake visibility source: classes match the preference at start and after a change; `fx-paused` is set while hidden and cleared when visible; a missing `matchMedia` gives no classes and no error; one `--cycle-` variable is written per `LoopId` with the table's value
  - [x] 10.4 Run `npm run test:run` and `npm run build`: both pass. The game looks the same (no CSS uses the variables yet)
  - _Requirements: 11.2, 11.3, 13.3, 15.4_
  - Test file: `tests/effects-host.test.ts`
  - Files this task may change: `src/ui/effects-host.ts`, `src/main.ts`, `tests/effects-host.test.ts`

- [x] 11. **Mirror frame painter (not yet shown)**
  - Mark: needed for the video (req 3, 4, 11.8).
  - [x] 11.1 Create `src/ui/frame-art.ts`: builds the crack drawing with `createElementNS` (a short, regular, star-shaped pattern in the ring corners, thin strokes) and the candle stick and flame pieces. No `innerHTML`
  - [x] 11.2 Create `src/ui/mirror-frame.ts` with the structure of design section 5.1: `div.mirror-frame` holding `div.mirror-frame__deco` (with `aria-hidden="true"`; inside it `div.frame-fog`, four `div.frame-region.frame-region--<region>` each with a glow layer, a candle stick and a flame, and `svg.frame-cracks`) and `div.mirror-frame__glass` (the play area slot). `MirrorFrame.paint(guidance)` sets the classes `frame-region--active`, `--dim`, `--off` and `--flicker` and the three look values as CSS variables with `setProperty`, and makes no decision of its own. The flame is shown only for a region whose `look.flame` is true
  - [x] 11.3 Test `decorativeFrame`, source part (design test 24): the deco element has `aria-hidden="true"`; no `scaleX` in `mirror-frame.ts` or `frame-art.ts`; neither file mentions `preview--mirrored`; no `innerHTML`, `style=` or `<style`; no left/right ternary and no `raw-` string
  - [x] 11.4 Run `npm run test:run` and `npm run build`: both pass. Nothing shows the frame yet, so the game is unchanged
  - _Requirements: 3.1, 3.3, 3.5, 3.10, 4.1, 4.2, 11.8, 13.2_
  - Test file: `tests/mirror-frame.test.ts`
  - Files this task may change: `src/ui/frame-art.ts`, `src/ui/mirror-frame.ts`, `tests/mirror-frame.test.ts`

- [x] 12. **Frame stylesheet and CSS guards**
  - Mark: needed for the video (req 3, 4, 11.1, 11.2, 13).
  - [x] 12.1 Create `src/ui/frame.css` for the class names of task 11: a 32 px ring (`FRAME_METRICS.ringPx`) around the glass; the glow layer behind the glass with a lower `z-index` than the glass; `pointer-events: none` on the deco layer; fog as two soft blurred ellipses (no shape, no face); cracks at about 35% opacity; the candle flame visible only in the active region; the flicker as a small change of `opacity` between about 0.75 and 1 on unevenly spaced keyframes, never between light and dark; a one-shot fade-in of `ONE_SHOT_MS.fadeIn` (600 ms) that plays when a screen opens, and a 400 ms glow move; every `infinite` animation takes its duration only from `var(--cycle-flame-active)`, `--cycle-glow-active`, `--cycle-glow-dim` or `--cycle-fog-drift`, never a literal time; keyframes move only `opacity` and a small `translate`, with no `filter`, no `backdrop-filter`, no `mix-blend-mode`, no shake; `.fx-no-flicker`, `.fx-no-fog` and `.fx-paused` rules that set `animation: none` or pause
  - [x] 12.2 Link `frame.css` from `index.html`, next to the existing `styles.css` link. Do not touch the Content-Security-Policy `<meta>` tag
  - [x] 12.3 Test `cssGuards` (design tests 14 and 29, CSS part): for each of `frame.css`, `monster-art.css` and `screens.css` that exists (the test reads whichever exist, so it keeps checking as later tasks create the other two): no `@font-face`, no `url(`, no `<style`; every rule that contains `infinite` takes its duration from `var(--cycle-` and has no literal time; every `--cycle-` name used corresponds to a `LoopId` in `effects.ts`
  - [x] 12.4 Test `frameCss` (design test 24, CSS part): the glow layer has a lower `z-index` than the glass; `pointer-events: none` is on the deco layer; no `scaleX` in `frame.css`; the keyframes use only `opacity` and `transform`
  - [x] 12.5 Run `npm run test:run` and `npm run build`: both pass. The existing `csp.test.ts` and `build-output.test.ts` pass unchanged. Nothing uses the frame classes yet, so the game is unchanged
  - _Requirements: 3.4, 3.5, 3.10, 4.1, 4.2, 4.5, 4.6, 11.1, 11.2, 13.1, 13.2, 13.3, 15.5_
  - Test file: `tests/css-guards.test.ts`, `tests/frame-css.test.ts`
  - Files this task may change: `src/ui/frame.css`, `index.html`, `tests/css-guards.test.ts`, `tests/frame-css.test.ts`

- [x] 13. **Show the frame in both modes: the frame is the guidance**
  - Mark: needed for the video (req 3, 4.3, 4.4, 15.1).
  - [x] 13.1 In `src/ui/session-screen.ts` create one `MirrorFrame` in the session panel. In a timer-only session its glass slot holds the four-zone `mouth` grid. `attachPreview(preview)` moves the `mouth` grid out below the frame and puts `preview.element` into the glass slot; `attachPreview(null)` puts the grid back. The frame is a sibling of the mirrored preview and never its parent or child. Class names `.zone`, `.zone--active`, `.big-button` and `.caption` stay, and `camera-preview.test.ts` passes unchanged
  - [x] 13.2 In the one synchronous `paint(view)` call, in this order: `frame.paint(frameGuidance(view))`, then the caption and `speaker.say(...)`, then the monster. The glow, the spoken line and the monster therefore change together. Use no timer. `showStart()` paints the frame with `frameGuidance(null)`, so a new session never starts with a lit region, and nothing shows the frame outside the session panel
  - [x] 13.3 Test `glowMatchesLineAndMonster` (design test 3), with the pure functions and `toView`, no DOM: over any 120 signals-or-null in either mode, at every tick the active region equals `ZONE_REGION` of `toView(state).zoneId`; when the caption id is a zone line, that zone is the active one; the region does not change between a defeat and the zone end; both modes give the same regions for the same zone
  - [x] 13.4 Test `decorativeFrame`, screen part (design test 24): in `session-screen.ts` the preview element is appended into the frame's glass slot, the frame is never appended into the preview, `frameGuidance(view)` and `frameGuidance(null)` are both used, and no `scaleX`, `raw-` string or left/right ternary appears
  - [x] 13.5 Check by hand (M1, timer-only): `npm run dev`. Play a timer-only session. In each of the four zones, in the order upper right, upper left, lower left, lower right (the child's left is on the left of the screen), the ring corner nearest the zone is brighter, has a larger glow and shows a lit candle; the other three corners are dim with no candle. Look at the moment a zone changes: the glow, the spoken line, its caption and the monster all change together. Switch to another tab and back within a few seconds: the active corner stays lit. At the start screen and at the end card, no corner glows
  - [x] 13.6 Check by hand (M1, camera): start a camera session. The frame surrounds the mirrored live picture, and the picture is not flipped by the frame. Cover the face mid-zone: the glow does not change
  - [x] 13.7 Run `npm run test:run` and `npm run build`: both pass. The game runs: the title screen opens and a timer-only session plays through, now inside the frame
  - _Requirements: 3.1, 3.2, 3.3, 3.6, 3.7, 3.8, 3.9, 3.10, 4.3, 4.4, 15.1_
  - Test file: `tests/frame-session.test.ts`
  - Files this task may change: `src/ui/session-screen.ts`, `tests/frame-session.test.ts`

- [x] 14. **Monster art: twelve shapes and the silhouette (structure)**
  - Mark: needed for the video (req 5).
  - [x] 14.1 Create `src/ui/monster-art.ts` with `drawMonster(def: MonsterDef): HTMLElement` and `drawSilhouette(rarity)`. `drawMonster` moves here from `session-screen.ts`, keeps its signature, keeps `role="img"` and an `aria-label` equal to the monster's name, keeps the existing child elements and class names (`monster`, `monster--<id>`, `monster__ear`, `monster__eye`, `monster__mouth`, `monster__star`), and adds the classes from `MONSTER_LOOKS` (`monster--body-tall`, `monster--ears-horns`, `monster--eyes-3`, `monster--extra-tail`, `monster--mouth-smile`, `monster--crest-moon`). The rare star stays. `drawSilhouette` builds one friendly blob, the same for every common monster, with the rare star and a crest shape for rare ones, and no padlock, cross, number or name. No `innerHTML`; SVG only through `createElementNS`
  - [x] 14.2 In `src/ui/session-screen.ts` delete the old `drawMonster` body and add `export { drawMonster } from './monster-art'`, importing it for its own use. `end-card.ts` keeps its existing import and still works
  - [x] 14.3 Test `drawMonsterSignature` (design test 32): `monster-art.ts` exports `drawMonster(def: MonsterDef): HTMLElement`, sets `role="img"` and an `aria-label` from `def.name`, and reads its shape classes from `MONSTER_LOOKS`; `session-screen.ts` re-exports `drawMonster`; `monster-art.ts` has no `innerHTML`, `<img`, `url(`, `setTimeout`, `setInterval` or `requestAnimationFrame`; `drawSilhouette` has no text that names a monster
  - [x] 14.4 Run `npm run test:run` and `npm run build`: both pass. The game looks the same, because the existing colour and part classes are all still there
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 7.5, 13.1_
  - Test file: `tests/monster-art.test.ts`
  - Files this task may change: `src/ui/monster-art.ts`, `src/ui/session-screen.ts` (remove the old body, add the re-export), `tests/monster-art.test.ts`

- [x] 15. **Monster art styles**
  - Mark: needed for the video (req 5, 11.5).
  - [x] 15.1 Create `src/ui/monster-art.css`: big round friendly eyes with a highlight; the four mouth shapes (none with teeth); the four body shapes; the ear, extra and crest shapes; the rare star; the friendly silhouette (same blob for every common, star and crest only for rares, no padlock, cross or number). Every size is a multiple of one variable `--u` (default `1px`), so a Book cell can set a smaller `--u` and the cheek its own. Keep the existing colour classes working. No colour is the only difference between two monsters
  - [x] 15.2 Link `monster-art.css` from `index.html`, next to the other `<link>` lines. Do not touch the Content-Security-Policy
  - [x] 15.3 The `cssGuards` test of task 12 now also reads `monster-art.css` and still passes
  - [x] 15.4 Check by hand (M9, drawings on the cheek): `npm run dev`, play a session. The four monsters of that session are friendly, with big eyes and no teeth, blood, drips, wounds or angry eyes, and they differ from each other in at least one shape feature (ears, horns, tail, number of eyes), not only in colour. A rare monster, when one appears, has a star and a crest
  - [x] 15.5 Run `npm run test:run` and `npm run build`: both pass. The game runs with the new drawings
  - _Requirements: 5.2, 5.3, 5.4, 5.5, 11.5, 13.1, 13.2_
  - Test file: none new (`cssGuards` from task 12 and `drawMonsterSignature` from task 14 cover it)
  - Files this task may change: `src/ui/monster-art.css`, `index.html`

- [x] 16. **Monster states and smoke in the session screen**
  - Mark: needed for the video (req 6.1, 6.2, 6.5, 6.6, 11.3).
  - [x] 16.1 In `src/ui/session-screen.ts` paint the live monster from `monsterDrawState(view, null)`, `monsterScale` and `smokeLook`: `sitting` and `shrinking` show the monster at `monsterScale(view.healthFraction)`; `defeated` hides the monster and shows the smoke; `gone` shows nothing. The smoke shows `smokeLook(view.smokeFraction)`: the first `puffs` of the three existing puff elements, scaled by `scale` and set to `opacity`. The smoke has no text and no colour change
  - [x] 16.2 In `src/ui/monster-art.css` add the smoke styles: puff count, size and opacity come from the painter; a slow drift whose duration is `var(--cycle-smoke-drift)`; `.fx-no-smoke-drift` sets `animation: none`, and the puffs, their count and their size stay. Smoke eases in (no sudden full-size puff)
  - [x] 16.3 Test `sessionScreenStates` (source scan): `session-screen.ts` imports and uses `monsterDrawState`, `monsterScale` and `smokeLook`; the word `smokeFraction` appears in `src/ui/` only in `monster-draw-state.ts` and, once, as the argument of `smokeLook` in `session-screen.ts`; no `src/audio/` or `src/ui/` file other than those two reads `smokeFraction`; the smoke code has no text and no colour assignment
  - [x] 16.4 Check by hand (M9, states): `npm run dev`, play a camera-less session. Each monster is full size at the start of its zone; with brushing in camera mode it would shrink to a floor and turn to smoke when defeated, and in timer-only mode it turns to smoke on the last second of its zone. The smoke thins as it fades: fewer and smaller puffs, not only fainter
  - [x] 16.5 Run `npm run test:run` and `npm run build`: both pass. The game runs
  - _Requirements: 6.2, 6.5, 6.6, 11.1, 11.3, 11.5, 15.2_
  - Test file: `tests/session-screen-states.test.ts`
  - Files this task may change: `src/ui/session-screen.ts`, `src/ui/monster-art.css`, `tests/session-screen-states.test.ts`

- [x] 17. **Leaving copy: defeated, fled and trapped monsters at zone end**
  - Mark: needed for the video (req 6.3, 6.4).
  - [x] 17.1 In `src/ui/session-screen.ts` change `paint(view)` to `paint(view, zoneEnd?)`, where `zoneEnd` is a `ZoneEnd`. With a `zoneEnd`, draw one leaving copy of that zone's monster in the state for its outcome, in the place where the monster was, while the next zone's monster appears at once and the timer is not touched. Timer-only: put the copy in the grid cell of the zone that ended. Camera: put it in a leave layer, an absolutely positioned child of the mirrored stage, copying the slot's current inline `left`, `top`, `width` and `transform` strings before the stage moves (placement strings only; no `DrawValue` is read); if the slot is at the plain position, use the grid cell. Nothing passes a `zoneEnd` yet, so the game is unchanged
  - [x] 17.2 Only one leaving copy exists at a time. It is removed on its `animationend`, when the next zone-end arrives, on `paused`, on `ended`, and in `showStart()`. It uses no timer
  - [x] 17.3 The trapped copy sits in a small glass bubble and waves or sleeps (two classes, `trapped-wave` and `trapped-sleep`, chosen by the parity of the zone's index in `ZONE_ORDER`, with no randomness), with the same happy face: no tears, no frown, no text
  - [x] 17.4 In `src/ui/monster-art.css` add the leaving-copy styles: a one-shot animation of `ONE_SHOT_MS.leave` (1400 ms): defeated puffs into smoke, fled slips sideways and fades into a puff, trapped sits in the bubble then fades; `.fx-no-leaving` makes every leaving copy only fade, so the state still shows; no `infinite` animation here except through `var(--cycle-…)`
  - [x] 17.5 Test `leavingCopySource` (source scan): `session-screen.ts` uses `animationend`; has no `setTimeout`, `setInterval` or `requestAnimationFrame`; removes the copy in `showStart`, on pause and on `ended`; does not import `DrawValue` or `draw-value`; the trapped class is chosen by `ZONE_ORDER` index parity with no `Math.random`
  - [x] 17.6 Run `npm run test:run` and `npm run build`: both pass. The game runs and looks the same until task 18 passes a `zoneEnd`
  - _Requirements: 6.3, 6.4, 6.8, 11.3, 13.3, 13.4_
  - Test file: `tests/leaving-copy.test.ts`
  - Files this task may change: `src/ui/session-screen.ts`, `src/ui/monster-art.css`, `tests/leaving-copy.test.ts`

- [x] 18. **Session presenter and wiring: zone ends reach the screen**
  - Mark: needed for the video (req 3.6, 6.3).
  - [x] 18.1 Create `src/ui/session-presenter.ts` with `createSessionPresenter(deps)` returning `update(state)` and `reset()`. It keeps the previous state; for each update it calls `toView(state)` and `zoneEndEvent(prev, state)` and then `screen.paint(view, zoneEnd)`. It passes no `zoneEnd` when the new phase is `ended` (the end card shows the fourth outcome, design section 5.4). It makes no game decision and uses no timer. `reset()` forgets the previous state
  - [x] 18.2 In `src/main.ts` replace the direct `screen.paint(toView(state))` call with `presenter.update(state)`, keeping the `showCamera(state)` call after it, and call `presenter.reset()` in `onEnded` and `onDropped`. No other change to `main.ts`
  - [x] 18.3 Test `sessionPresenterZoneEnds`, with a fake screen that records calls: over a whole session (any signals, either mode) the screen gets exactly three paints that carry a `zoneEnd` (zones one to three, in zone order) and none for the fourth; none on pause or resume; `reset()` clears the remembered state, so the first update after it carries no `zoneEnd`; the presenter file has no `setTimeout`, `setInterval`, `document` or `window`
  - [x] 18.4 Check by hand (M1 monster part, M9 states, M2 mood): `npm run dev`, play a timer-only session. When a zone ends, the monster of that zone is shown once, briefly, puffing into smoke, while the next zone's monster appears at once and the countdown does not stop or jump. Nothing appears suddenly, nothing flashes. If a trapped or fled monster can be reached (camera session with little brushing), it looks happy or slips away, never sad or hurt
  - [x] 18.5 Run `npm run test:run` and `npm run build`: both pass. The game runs through to the end card
  - _Requirements: 3.6, 6.1, 6.3, 6.4, 15.2_
  - Test file: `tests/session-presenter.test.ts`
  - Files this task may change: `src/ui/session-presenter.ts`, `src/main.ts`, `tests/session-presenter.test.ts`

- [x] 19. **Sound player (Web Audio)**
  - Mark: needed for the video (req 10).
  - [x] 19.1 Create `src/audio/sound-player.ts` with `Sounds` (`unlock()`, `play(id, delayMs = 0)`, `stop()`) and `createSoundPlayer()`. The `AudioContext` is created in `unlock()` only. `play` builds one gain node whose curve is sampled from `envelopeGainAt` every 20 ms of sound time and sent with `setValueCurveAtTime`, plus one oscillator per voice with `frequency.setValueAtTime` and `linearRampToValueAtTime`, all started at `context.currentTime + delayMs / 1000` and stopped on the audio clock. No timer. Everything is in `try/catch`. A `play` before `unlock()` is ignored. `stop()` stops every live oscillator. No audio file is shipped
  - [x] 19.2 Test `soundPlayerSafe`, with a fake `AudioContext` (copy the fake-audio pattern of `tests/speaker.test.ts` into the new test): `play` before `unlock` does nothing and does not throw; a context that throws on creation or on `createOscillator` leaves the player silent without throwing; `stop` stops every live oscillator; `unlock` twice is safe; a played sound starts at gain 0; the source has no `setTimeout`, `setInterval` or `requestAnimationFrame`
  - [x] 19.3 Run `npm run test:run` and `npm run build`: both pass. Nothing uses the player yet, so the game is unchanged
  - _Requirements: 10.1, 10.2, 10.7, 10.8, 13.3_
  - Test file: `tests/sound-player.test.ts`
  - Files this task may change: `src/audio/sound-player.ts`, `tests/sound-player.test.ts`

- [x] 20. **Audio kit: one speaker, one player, one unlock, one stop**
  - Mark: needed for the video (req 10.7, 10.8).
  - [x] 20.1 Create `src/audio/audio-kit.ts` with `createAudioKit(deps?)` returning `{ speaker, sounds }`. By default it builds `createBrowserSpeaker()` and `createSoundPlayer()`; the optional `deps` lets a test pass fakes. The kit's `speaker.unlock()` also calls the player's `unlock()`, and its `speaker.stop()` also calls the player's `stop()`, so every existing `speaker.stop()` call (pause, session end, drop, back to start) also stops every sound. `say` is passed through unchanged. There is no mute control and no music
  - [x] 20.2 In `src/main.ts` build the kit once and pass `kit.speaker` where `createBrowserSpeaker()` is passed now. Keep `kit.sounds` for tasks 21 and 24. No other change
  - [x] 20.3 Test `audioKit`, with fake speaker and player: `unlock` reaches both; `stop` reaches both; `say` reaches the speaker only; the kit has no member that mentions mute or volume
  - [x] 20.4 Run `npm run test:run` and `npm run build`: both pass. The game runs and sounds exactly as before
  - _Requirements: 10.7, 10.8, 10.10, 10.11, 1.7_
  - Test file: `tests/audio-kit.test.ts`
  - Files this task may change: `src/audio/audio-kit.ts`, `src/main.ts`, `tests/audio-kit.test.ts`

- [x] 21. **Play the sound cues**
  - Mark: needed for the video (req 10.4, 10.6, 10.7).
  - [x] 21.1 In `src/ui/session-presenter.ts` add an optional `sounds` dependency (`Pick<Sounds, 'play'>`). On each update, for every cue in `cuesFor(prev, state)` call `sounds.play(cue.id, cue.delayMs)`. Nothing is played at the `ended` state, which `cuesFor` already guarantees
  - [x] 21.2 In `src/main.ts` pass `kit.sounds` to the presenter. No other change
  - [x] 21.3 Test `soundCuesPlayed` (extend `tests/session-presenter.test.ts`), with a fake sounds object: over a whole session the plays equal the concatenated `cuesFor` results, in order, with their delays; four `zone-start` plays; no play at the `ended` tick
  - [x] 21.4 Check by hand (M5): `npm run dev`. Open the title screen: it is silent. Tap start: sounds begin. At medium volume a new zone, a defeat, and (when they occur) a flee and a trapped monster each have a soft sound that rises gently; the spoken voice stays clear over the sounds; nothing is sharp or loud; switching to another tab stops all sound. Turn the volume off: every event still shows on screen
  - [x] 21.5 Run `npm run test:run` and `npm run build`: both pass. The game runs with soft sounds
  - _Requirements: 10.2, 10.3, 10.4, 10.6, 10.7, 1.7, 6.8, 15.6_
  - Test file: `tests/session-presenter.test.ts` (extended)
  - Files this task may change: `src/ui/session-presenter.ts`, `src/main.ts`, `tests/session-presenter.test.ts`

- [x] 22. **End lines: `end`, then the closing line**
  - Mark: needed for the video (req 9.2).
  - [x] 22.1 Create `src/ui/end-lines.ts` with `END_LINE_IDS = ['end', 'end-close']` and `speakEnd(speaker)`, which calls `speaker.say('end')` and then `speaker.say('end-close')`. `say` queues after what is already being said, so the lines do not overlap and no timer is needed
  - [x] 22.2 Test `endLines` (design test 19), with a fake speaker: `speakEnd` calls `say('end')` then `say('end-close')`, once each, in that order; `CLIP_LINE_IDS` holds neither id (a clip would not queue and would be cut by the next `say`); both ids exist in `lines.ts`
  - [x] 22.3 Run `npm run test:run` and `npm run build`: both pass. Nothing uses the file yet, so the game is unchanged
  - _Requirements: 9.2, 14.3, 15.9_
  - Test file: `tests/end-lines.test.ts`
  - Files this task may change: `src/ui/end-lines.ts`, `tests/end-lines.test.ts`

- [x] 23. **End card: closing line, outcomes, second button**
  - Mark: needed for the video (req 9).
  - [x] 23.1 In `src/ui/end-card.ts` call `speakEnd` instead of the single `speaker.say('end')`, and show both captions together, `end` first. The `end` line itself is unchanged
  - [x] 23.2 Change `show(monsters)` to `show(monsters, outcomes?)`. Each item gets a class for its outcome (`end-card__item--defeated`, `--fled`, `--trapped`) and a drawing from `drawMonster`; with no outcomes it behaves as before. Add an optional `sounds` dependency and play the `end` sound after the speech is started and after the caller's `speaker.stop()`, so the stop does not cut it
  - [x] 23.3 The card has exactly two buttons. The existing big "Done" button (icon, label, accessible name, `TAP_TARGETS.endDone` applied with `style.minWidth` and `style.minHeight`) goes back to the title screen. A second, smaller button with an icon, the label `DISPLAY_TEXT['book-title']` ("Monster Book") and an accessible name uses `TAP_TARGETS.endBook`; it calls `speaker.unlock()` and then an optional `onOpenBook` handler, and it is created only when `onOpenBook` is passed. Add `unhide()`, which shows the card again without speaking or playing anything. There is no "again", "next" or "play" button, and no score, streak or timer
  - [x] 23.4 Test `endCardNoUrging` (design test 20, source scan): `end-card.ts` creates exactly two buttons in its source; has no string literal containing again, next, tomorrow, "come back", streak, score or timer; no button calls `onStart`; it uses `speakEnd` and `unhide`; it has no `setTimeout`, `setInterval` or `requestAnimationFrame`
  - [x] 23.5 Run `npm run test:run` and `npm run build`: both pass. The game runs; the end card now says `end` and then "Two minutes. Every corner." (the second button appears in task 29)
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 10.4, 11.4, 15.9_
  - Test file: `tests/end-card-source.test.ts`
  - Files this task may change: `src/ui/end-card.ts`, `tests/end-card-source.test.ts`

- [x] 24. **End card styles and wiring**
  - Mark: needed for the video (req 9, 11.3).
  - [x] 24.1 Create `src/ui/screens.css` with the end-card styles: both buttons visible at 360 x 640; the four monsters in a row or a 2 x 2 grid; a one-shot "into the Book" movement of `ONE_SHOT_MS.intoBook` (1200 ms) that `.fx-no-book` turns into a plain fade; the fled and trapped items use their small leaving style and look friendly; a fade-in. No colour is the only signal
  - [x] 24.2 Link `screens.css` from `index.html`, after the other `<link>` lines. Do not touch the Content-Security-Policy
  - [x] 24.3 In `src/main.ts` pass `state.monsters.map((m) => m.outcome)` as the second argument of `endCard.show`, and pass `kit.sounds` when the end card is created. No other change
  - [x] 24.4 The `cssGuards` test of task 12 now also reads `screens.css` and still passes
  - [x] 24.5 Check by hand (M3 end-card part, M2 mood): `npm run dev`, play a full session. The end card shows the four monsters going into the Book, says "Well done! Two minutes of brushing!" and then "Two minutes. Every corner.", with both captions visible, and plays a soft closing sound. At 360 x 640 in the browser dev tools the Done button is visible without scrolling. Nothing urges another game. Tap Done: the title screen shows and nothing glows
  - [x] 24.6 Run `npm run test:run` and `npm run build`: both pass. The game runs through to the new end card
  - _Requirements: 9.1, 9.3, 9.4, 10.4, 11.1, 11.3, 11.5, 13.2_
  - Test file: none new (`cssGuards` and `endCardNoUrging` cover it)
  - Files this task may change: `src/ui/screens.css`, `index.html`, `src/main.ts`

- [x] 25. **Monster Book model (pure)**
  - Mark: needed for the video (req 7.1, 7.2, 7.5, 7.6, 15.3). The `invite` flag, `showRareInvitation` and the `say-line` action are later (task 34).
  - [x] 25.1 Create `src/ui/book-model.ts` with `BookEntry` (`id`, `rare`, `owned`, `name`: the name, or `null` when not owned), `BookView` (`entries`), `BookTapAction` (`say-name` with the text, or `none`), `monsterBookView(sessions)`, `bookViewFromLoader(load)` and `bookTapAction(entry)` as in design section 5.7. `owned` comes only from `computeMonsterBook(sessions).unlockedIds`. The model takes no date and no time of day. `bookViewFromLoader` is `try { monsterBookView(load()) } catch { monsterBookView([]) }`. `bookTapAction` gives `say-name` for an owned entry and `none` for every other
  - [x] 25.2 Test `monsterBookView` (design test 9, needed part): always twelve entries in table order (8 common, then 4 rare); `owned` exactly when the id is in `computeMonsterBook(sessions).unlockedIds`; not-owned entries have `name` null; `rare` is true for rares whether owned or not; the result is the same for any order of the sessions and any dates and times of day with the same earned monsters; empty sessions give twelve silhouettes; an id in `monstersEarned` that is not in the table changes nothing
  - [x] 25.3 Test `bookFromLoader` (design test 10): a loader that returns sessions gives the same as `monsterBookView`; a loader that throws gives twelve silhouettes and does not throw
  - [x] 25.4 Test: `bookTapAction` gives `say-name` with the monster's name for an owned entry and `none` for every not-owned entry
  - [x] 25.5 Run `npm run test:run` and `npm run build`: both pass. Nothing uses the file yet, so the game is unchanged
  - _Requirements: 7.1, 7.2, 7.5, 7.6, 15.3, 16.2_
  - Test file: `tests/book-model.test.ts`
  - Files this task may change: `src/ui/book-model.ts`, `tests/book-model.test.ts`

- [x] 26. **Speaking monster names: `sayText` and book speech**
  - Mark: needed for the video (req 7.4, 10.8, 10.9).
  - [x] 26.1 In `src/audio/speaker.ts` add `TextSpeaker { sayText(text) }` and make `createBrowserSpeaker` return `Speaker & TextSpeaker`. `sayText` cancels what is being said, picks a voice with the existing `pickLocalVoice`, and speaks the text with the existing gentle volume. With no local voice it does nothing. `Speaker`, `silentSpeaker`, `rampGain`, `GAIN_LEVEL`, `GAIN_STEP_PER_MS` and `CLIP_LINE_IDS` are not changed, and the pre-spec `tests/speaker.test.ts` passes unchanged
  - [x] 26.2 In `src/audio/audio-kit.ts` let the kit's speaker pass `sayText` through, so its type is `Speaker & TextSpeaker`, and its `stop()` still stops the sounds
  - [x] 26.3 Create `src/ui/book-speech.ts` with `createBookSpeech(speaker)` that runs a `BookTapAction`: `say-name` calls `speaker.stop()` and then `speaker.sayText(name)`; `none` does nothing. A new tap therefore replaces what is being said and never queues. No DOM
  - [x] 26.4 Test `bookSpeech` (design test 11, needed part), with a fake speaker that records `stop`, `say` and `sayText`: an owned tap calls `stop` then `sayText(name)` once; a second tap calls `stop` again before its own `sayText`; a not-owned tap never calls `sayText`. Also: `sayText` with no local voice does not throw (use the fake speech-synthesis pattern of `tests/speaker.test.ts`, copied into the new test)
  - [x] 26.5 Run `npm run test:run` and `npm run build`: both pass. Nothing calls `sayText` yet, so the game sounds as before
  - _Requirements: 7.4, 7.5, 10.8, 10.9, 15.9_
  - Test file: `tests/book-speech.test.ts`
  - Files this task may change: `src/audio/speaker.ts`, `src/audio/audio-kit.ts`, `src/ui/book-speech.ts`, `tests/book-speech.test.ts`

- [x] 27. **Monster Book screen (built, not yet reachable)**
  - Mark: needed for the video (req 7, 11.4, 13).
  - [x] 27.1 Create `src/ui/monster-book-screen.ts` with `createMonsterBookScreen(deps)` returning `open()` and `close()`; `deps` holds the root, `loadSessions`, the speaker (`Speaker & TextSpeaker`) and an `onBack` handler. `open()` reads the sessions through `bookViewFromLoader(deps.loadSessions)` every time. Structure (design section 5.7): a header with one back button (class `icon-button`, an icon, the label `DISPLAY_TEXT['back']`, an accessible name, `TAP_TARGETS.bookBack` applied with `style.minWidth` and `style.minHeight`) and the heading `DISPLAY_TEXT['book-title']`; a grid of the 8 common cells and a grid of the 4 rare cells, each four columns wide; a caption line with `aria-live="polite"`. Back calls `speaker.stop()` and then `onBack`
  - [x] 27.2 An owned cell is a `<button class="book-cell">` (`TAP_TARGETS.bookCell`) with `drawMonster` and the name as visible text and the name as accessible name; a tap runs `createBookSpeech(speaker)` with `bookTapAction(entry)` and shows the same words in the caption. A not-owned cell shows `drawSilhouette(rarity)` with the accessible name `DISPLAY_TEXT['not-met']` and no name text, as a non-interactive `role="img"` element, for rare ones too (the rare star and crest stay). No padlock, cross, grey "lost" look, number or countdown. The Book creates no frame, shows no glow, starts no camera, stores nothing
  - [x] 27.3 In `src/ui/screens.css` add the Book styles: the heading, the header, `book-cell` at its size, four-column grids, the caption, a fade-in, and a smaller `--u` for the drawings in a cell. Use a fixed four-column grid for now (the reflowing grid is task 39)
  - [x] 27.4 Test `bookScreenIsReadOnly` (design test 30, Book part; source scan): `monster-book-screen.ts` has no `saveSession`, `setItem`, `localStorage`, `import(`, `getUserMedia`, `setTimeout`, `setInterval`, `fetch`, and no import from `src/tracking/`, `mirror-frame` or `frame-guidance`; it calls `bookViewFromLoader`; its text comes from `DISPLAY_TEXT` and the monsters' `name` field; no padlock or cross characters in its silhouette code
  - [x] 27.5 The `cssGuards` test passes on the extended `screens.css`
  - [x] 27.6 Run `npm run test:run` and `npm run build`: both pass. Nothing opens the Book yet, so the game is unchanged
  - _Requirements: 5.4, 7.1, 7.3, 7.4, 7.5, 7.6, 7.7, 7.10, 11.4, 11.5, 13.2, 13.4, 13.5_
  - Test file: `tests/monster-book-screen.test.ts`
  - Files this task may change: `src/ui/monster-book-screen.ts`, `src/ui/screens.css`, `tests/monster-book-screen.test.ts`

- [x] 28. **Title panel: one large start button, a smaller Monster Book button, privacy line**
  - Mark: needed for the video (req 1). The parent control is later (task 38).
  - [x] 28.1 Create `src/ui/title-panel.ts` that builds the start panel from `titleControls()`: the game name, the large start button (existing icon, label "Brush!", accessible name and `start` line, all unchanged; `TAP_TARGETS.start`), the smaller Monster Book button (class `small-button`, icon, visible label `DISPLAY_TEXT['book-title']`, accessible name, `TAP_TARGETS.titleBook`), and the privacy line `DISPLAY_TEXT['privacy']` as a visible `<p>`, never spoken. The Monster Book button is created only when an `onOpenBook` handler is passed. Sizes are applied with `style.minWidth` and `style.minHeight`
  - [x] 28.2 The Book button's tap calls `speaker.unlock()` and then `onOpenBook`. It does not call `onStart`, the camera or a session. The start tap keeps its behaviour: it unlocks sound, says `start` and calls `onStart`. The panel has no form, no sign-up, no install prompt, no countdown, no sound before the first tap, and no mute control
  - [x] 28.3 In `src/ui/session-screen.ts` build the start panel with `title-panel.ts` and add an optional `onOpenBook` to `SessionScreenHandlers`. The start panel keeps its existing caption of the `start` line. `main.ts` does not pass `onOpenBook` in this task
  - [x] 28.4 In `src/ui/screens.css` add the title-panel styles: portrait single column, controls in the lower half, the smaller button clearly smaller than the start button, the privacy line readable on the dark background, a fade-in
  - [x] 28.5 Test `titlePanelSource` (design test 30, title part; source scan): `title-panel.ts` has no `getUserMedia`, `import(`, `beforeinstallprompt`, `setTimeout`, `setInterval`, `fetch`, `setItem`, `localStorage`, and no import from `src/tracking/`; its text comes from `DISPLAY_TEXT` and `lines.ts`; no string in it mentions mute, sound off or volume; it uses `titleControls` and `TAP_TARGETS`
  - [x] 28.6 The `cssGuards` test passes on the extended `screens.css`
  - [x] 28.7 Check by hand (M3, title part): `npm run dev`, at 360 x 640 in the browser dev tools. The title screen shows the name, the large start button and the privacy line "The camera stays on this phone. Nothing is saved or sent." without scrolling. The Monster Book button is not shown yet (no handler)
  - [x] 28.8 Run `npm run test:run` and `npm run build`: both pass. The game runs; the title screen now shows the privacy line
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 10.11, 11.4, 15.9_
  - Test file: `tests/title-panel.test.ts`
  - Files this task may change: `src/ui/title-panel.ts`, `src/ui/session-screen.ts`, `src/ui/screens.css`, `tests/title-panel.test.ts`

- [x] 29. **Open the Monster Book from the title screen and the end card**
  - Mark: needed for the video (req 7.8, 7.9, 1.8, 9.3).
  - [x] 29.1 In `src/main.ts` create the Book screen (`createMonsterBookScreen`) with `loadSessions: () => storage.loadSessions()` and `kit.speaker`. Write one `openBook(from)` function that remembers where the Book was opened from (`'title'` or `'end'`), hides that screen (`screen.hide()` or `endCard.hide()`) and calls `book.open()`. Pass `onOpenBook: () => openBook('title')` to the session screen and `onOpenBook: () => openBook('end')` to the end card. Both buttons already call `speaker.unlock()` in their own tap. Back returns to where the Book was opened from: `screen.showStart()` or `endCard.unhide()`. Do not pass `onOpenParent`
  - [x] 29.2 Check by hand (M3, M9, M5, M10): `npm run dev`. At 360 x 640, the title screen shows the large start button, the smaller Monster Book button and the privacy line without scrolling. Tap Monster Book: with no sessions you see twelve silhouettes with no names; the four rare ones carry a star; no padlock, cross or number. Tap a silhouette: nothing is said. Play one full session, tap Monster Book on the end card: the four monsters of that session show with their names. Tap one: its name is spoken and shown as a caption. Tap a second one quickly: the first name is replaced, not queued. Back from the Book opened from the end card shows the end card again and says nothing. Back from the Book opened from the title shows the title screen. In the browser Network panel, opening the title screen, the Book and the end card makes no request except the same-origin page files, and loads no model, font or image
  - [x] 29.3 Run `npm run test:run` and `npm run build`: both pass. The game runs: title, Book, session, end card, Book, back
  - _Requirements: 1.8, 7.8, 7.9, 7.10, 9.3, 1.5, 15.9_
  - Test file: none new (the model, speech and screen sources are tested in tasks 25 to 28; the privacy guard, `csp.test.ts` and `build-output.test.ts` must still pass)
  - Files this task may change: `src/main.ts`

- [x] 30. **Caption contrast**
  - Mark: needed for the video (req 4.5, 11.7).
  - [x] 30.1 In `src/ui/screens.css` define `--caption-fg` and `--caption-bg` on `:root` as 6-digit hex colours with a contrast ratio of at least 4.5 to 1, and restyle `.caption` with them so that the caption sits on an opaque plate. `screens.css` loads after `styles.css`, so `styles.css` is not edited. The caption stays outside the frame and above the fog
  - [x] 30.2 Test `captionContrast` (design test 23): `--caption-fg` and `--caption-bg` are 6-digit hex values found in `screens.css`; their contrast ratio, computed with the standard relative-luminance formula, is at least 4.5
  - [x] 30.3 Check by hand (M2, legibility): `npm run dev`. During a session the caption is easy to read over the frame and fog, in all four zones, and the fog never covers the face or the monster
  - [x] 30.4 Run `npm run test:run` and `npm run build`: both pass. The game runs with the new caption plate
  - _Requirements: 4.5, 11.7_
  - Test file: `tests/caption-contrast.test.ts`
  - Files this task may change: `src/ui/screens.css`, `tests/caption-contrast.test.ts`

- [x] 31. **Whole-spec guards**
  - Mark: needed for the video (req 13, 15.8, 15.10, 16).
  - [x] 31.1 Write `tests/mirror-screens-guards.test.ts` only. No source file changes. If a guard fails, name the source file in the report and fix it in a follow-up run, not in this task. Before writing the test, search `src/` for `setInterval`, `setTimeout` and `requestAnimationFrame` and write the files that already contain them (before this spec) into the test as an explicit allow-list
  - [x] 31.2 Test `noNewTimers` (design test 26): `setInterval` and `setTimeout` appear under `src/` only in the allow-list; none of the files this spec adds (the lists in tasks 1 to 30) contains `setInterval`, `setTimeout`, `requestAnimationFrame` or `requestVideoFrameCallback`
  - [x] 31.3 Test `pureFilesAreClean` (design test 27): the nine pure files (`frame-guidance.ts`, `effects.ts`, `monster-draw-state.ts`, `sound-cues.ts`, `monster-looks.ts`, `book-model.ts`, `title-model.ts`, `tap-targets.ts`, `display-text.ts`) and `src/audio/sounds.ts` contain no `document`, `window`, `Date`, `performance`, `Math.random`, `setTimeout`, `localStorage`, and no import from `src/tracking/`; nothing under `src/logic/` imports from any of them
  - [x] 31.4 Test `drawValueStaysInPreview` (design test 28): `DrawValue` and `draw-value` appear only in `src/tracking/`, `src/ui/camera-preview.ts`, `src/ui/monster-anchor.ts` and `src/main.ts`
  - [x] 31.5 Test `noExternalAssets` (design test 29, code part): the new TS files contain no `<style`, no `style=` attribute string, no `innerHTML`, no `<img`, no `@font-face`; each audio file under `public/assets/`, if any exists, is named in `public/assets/NOTICE.txt`
  - [x] 31.6 Test `noNewStorageNetworkOrLog`: no file this spec adds contains `fetch(`, `XMLHttpRequest`, `sendBeacon`, `WebSocket`, `document.cookie`, `localStorage`, `console.`, `toDataURL`, `getImageData`, `saveSession` (the Book reads sessions only)
  - [x] 31.7 Run the whole `npm run test:run` and `npm run build`: both pass. Run `git diff --stat` against the commit before task 1 and report that no pre-spec test file was changed (design test 31, `existingSuite`), in particular `view`, `lines`, `camera-preview`, `monster-anchor`, `privacy-guard`, `tracking-guards`, `csp` and `build-output`
  - _Requirements: 6.7, 10.1, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 15.8, 15.10, 16.1, 16.2, 16.3_
  - Test file: `tests/mirror-screens-guards.test.ts`
  - Files this task may change: `tests/mirror-screens-guards.test.ts`

- [ ] 32. **Final checks for the video**
  - Mark: needed for the video (req 1.6, 1.7, 3.1, 3.6, 4.2, 4.7, 5.3, 6.3, 6.4, 7.5, 9.3, 10, 11, 13.5, 13.6, 14).
  - [x] 32.1 Run `npm run test:run` and `npm run build` and report both results. Confirm that the built `dist/` title screen still loads no model or WASM file (`cameraCodeIsLazy` and `firstLoadUnder5MB` pass)
  - [x] 32.2 Check by hand (M1, whole): play one timer-only and one camera session end to end. In each zone the lit corner, the lit candle, the spoken line, its caption and the monster agree; covering the face changes nothing about the glow
  - [x] 32.3 Check by hand (M2, mood): watch a full session on a phone. Nothing appears suddenly or flashes; the cracks read as a pattern and not as a broken screen; there is no face in the fog; no screen shake; nothing looks scary to a 5-year-old
  - [x] 32.4 Check by hand (M3, layout at 360 x 640): title screen (start, Monster Book, privacy line), end card (both buttons) and Book (all twelve cells) fit without scrolling; the phone is usable one-handed in portrait
  - [x] 32.5 Check by hand (M4, speed): on a 2022 mid-range Android phone in Chrome, play a camera session with all effects on and read the frame rate. It must be 20 frames per second or more. Dr. Yatin, or the person who runs the test, writes one dated row in words in `docs/review/TRACKING-TEST-RESULTS.md`, section 7 (words only: no image, frame or landmark value). The agent does not invent a measurement. If the rate is below 20, stop and report; leave this sub-task unticked
  - [x] 32.6 Check by hand (M5, sounds): at medium volume nothing is sharp or loud; the voice is clear over the effects; the title screen is silent until the first tap; sound stops on pause and at the end; with the volume off every event still shows
  - [x] 32.7 Check by hand (M6, reduced motion): turn on "reduce motion" in the device or browser settings, also while a session runs. The candle flicker, fog drift, smoke drift, leaving animations and the end-card movement stop. The lit corner and its candle remain, the monster still changes size with its health, and the smoke still thins
  - [ ] 32.8 Check by hand (M7, screen-reader part): with a screen reader on, the frame is silent and the caption of the active zone is read
  - [x] 32.9 Check by hand (M9, drawings): in the Book and on the cheek, all twelve monsters are easy to tell apart; none is scary; the four rare ones carry a star and a crest; a silhouette shows no name, padlock, cross or number
  - [x] 32.10 Check by hand (M10, network): with the browser Network panel open, play a full session and visit the Book. The only requests are the same-origin page, script and stylesheet files and, after the start tap in a camera session, the model and WASM files from this site. No request goes to another host, no cookie is set, and the only storage key is `foamtom:v1`
  - [x] 32.11 Read the 19 approved lines in `requirements.md` against what appears on screen and in speech. The new screens show or say nothing else. (The `rare-invite` line and the `Grown-ups` name come in tasks 33 to 38.)
  - _Requirements: 1.6, 1.7, 3.1, 3.6, 4.2, 4.7, 5.3, 6.3, 6.4, 7.5, 9.3, 10.2, 10.3, 10.6, 11.1, 11.3, 11.6, 11.8, 13.5, 13.6, 14.1, 14.5_
  - Test file: none new (this task runs the whole suite and the manual checks; it changes no source file)
  - Files this task may change: `docs/review/TRACKING-TEST-RESULTS.md` (one dated row, section 7, words only, written by the person who ran the phone test)

---

## Group 2: later (after the video's needs are built)

- [x] 33. **Rare invitation line: `rare-invite`**
  - Mark: later (req 8.1, 14).
  - [x] 33.1 In `src/audio/lines.ts` add exactly one line, with a caption: `rare-invite`, "Brush morning AND night." The eight other lines are not touched. The pre-spec `tests/lines.test.ts` is not edited and passes
  - [x] 33.2 In `tests/display-text.test.ts` add the pin: `lines.ts` has `rare-invite` with text and caption "Brush morning AND night."
  - [x] 33.3 In `tests/new-text-guard.test.ts` add `rare-invite` to the checked texts. It passes the banned and urging lists ("morning" and "night" are not banned; the matcher is by whole word)
  - [x] 33.4 Run `npm run test:run` and `npm run build`: both pass. Nothing speaks `rare-invite` yet, so the game is unchanged
  - _Requirements: 8.1, 8.2, 10.9, 14.1, 14.3, 14.4, 14.5_
  - Test file: `tests/display-text.test.ts` (extended), `tests/new-text-guard.test.ts` (extended)
  - Files this task may change: `src/audio/lines.ts`, `tests/display-text.test.ts`, `tests/new-text-guard.test.ts`

- [x] 34. **Rare invitation: model and speech**
  - Mark: later (req 8).
  - [x] 34.1 In `src/ui/book-model.ts` add `invite` to `BookEntry` (true exactly for rare entries that are not owned) and `showRareInvitation` to `BookView` (true exactly when some entry has `invite`). Add the `say-line` action (`lineId: 'rare-invite'`) to `BookTapAction`: `bookTapAction` gives it for a rare entry that is not owned and still gives `none` for a common one that is not owned. The model still takes no date and no time of day
  - [x] 34.2 In `src/ui/book-speech.ts` add the `say-line` branch: `speaker.stop()` and then `speaker.say('rare-invite')`
  - [x] 34.3 Extend `tests/book-model.test.ts` (design test 9, later part): `invite` is true exactly for rares that are not owned; `showRareInvitation` is true exactly when some rare is not owned and false when all four rares are owned; the result is the same whatever the dates and times of day on the sessions; `bookTapAction` is `say-line` for a rare not owned, `say-name` for an owned entry and `none` for a common not owned
  - [x] 34.4 Extend `tests/book-speech.test.ts`: a rare silhouette tap calls `stop` then `say('rare-invite')`; a common silhouette says nothing
  - [x] 34.5 Run `npm run test:run` and `npm run build`: both pass. The Book screen does not use the new fields yet, so the game is unchanged
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 15.3, 15.9_
  - Test file: `tests/book-model.test.ts` (extended), `tests/book-speech.test.ts` (extended)
  - Files this task may change: `src/ui/book-model.ts`, `src/ui/book-speech.ts`, `tests/book-model.test.ts`, `tests/book-speech.test.ts`

- [x] 35. **Rare invitation: painted in the Monster Book**
  - Mark: later (req 8).
  - [x] 35.1 In `src/ui/monster-book-screen.ts` show the caption of `rare-invite` ("Brush morning AND night.", read from `lines.ts`) once, as visible text under the four rare cells, while `showRareInvitation` is true, and not at all when it is false. Make each rare silhouette a `<button>` (accessible name `DISPLAY_TEXT['not-met']`, `TAP_TARGETS.bookCell`, no visible name) whose tap runs the book speech with its action and shows the same words in the caption line. Common silhouettes stay non-interactive. The line is not repeated on each silhouette and carries no countdown, count, streak or "missed" wording
  - [x] 35.2 In `src/ui/screens.css` add the styles for the invitation text and the rare silhouette button
  - [x] 35.3 Extend `tests/monster-book-screen.test.ts` (source scan): the screen reads `showRareInvitation` and `getLine('rare-invite')`; rare silhouettes are created as buttons and common ones are not; the invitation text is created once, outside the loop over entries
  - [x] 35.4 Check by hand (requirement 8): `npm run dev`. With no sessions saved, open the Monster Book: "Brush morning AND night." shows once under the four rare silhouettes. Tap a rare silhouette: the line is spoken and captioned. Tap a common silhouette: nothing is said. The line has no countdown and does not mention today. (That the line disappears when all four rares are owned is checked by the model test of task 34.) Note (23 Nov 2026): an empty dark plate under the line was found here and fixed by task 50
  - [x] 35.5 Run `npm run test:run` and `npm run build`: both pass. The game runs with the invitation in the Book
  - _Requirements: 7.5, 8.1, 8.2, 8.3, 8.4, 11.4_
  - Test file: `tests/monster-book-screen.test.ts` (extended)
  - Files this task may change: `src/ui/monster-book-screen.ts`, `src/ui/screens.css`, `tests/monster-book-screen.test.ts`

- [x] 36. **Parent entry point: the `Grown-ups` name**
  - Mark: later (req 2).
  - [x] 36.1 In `src/ui/display-text.ts` add the row `grown-ups` ("Grown-ups", kind `name-only`) and the id to `DisplayTextId`
  - [x] 36.2 In `tests/display-text.test.ts` extend the pin to row 18; in `tests/new-text-guard.test.ts` add the row to the checked texts
  - [x] 36.3 Run `npm run test:run` and `npm run build`: both pass. Nothing shows the text yet, so the game is unchanged
  - _Requirements: 2.2, 14.1, 14.4, 14.5_
  - Test file: `tests/display-text.test.ts` (extended), `tests/new-text-guard.test.ts` (extended)
  - Files this task may change: `src/ui/display-text.ts`, `tests/display-text.test.ts`, `tests/new-text-guard.test.ts`

- [x] 37. **Parent entry point: title model and tap target**
  - Mark: later (req 2).
  - [x] 37.1 In `src/ui/tap-targets.ts` add the `parent` row (48 x 48). In `src/ui/title-model.ts` change the signature to `titleControls(hasParentHandler = false)`: with a handler it adds a third control `parent` (`quiet`, target `parent`, text id `grown-ups`, icon). Without one the result is the same two controls as before
  - [x] 37.2 Extend `tests/tap-targets.test.ts` (design test 22, later part): `parent` is smaller than `titleBook` in width and in height and is at least 48 x 48
  - [x] 37.3 Extend `tests/title-model.test.ts` (design test 21, later part): the parent control is `quiet` and present only with a handler; there is still exactly one `large` control; the parent control has an icon and a text id; no control mentions sound, mute or volume
  - [x] 37.4 Run `npm run test:run` and `npm run build`: both pass. `title-panel.ts` still calls `titleControls()` without an argument, so the game is unchanged
  - _Requirements: 2.1, 2.2, 11.4, 15.9_
  - Test file: `tests/tap-targets.test.ts` (extended), `tests/title-model.test.ts` (extended)
  - Files this task may change: `src/ui/tap-targets.ts`, `src/ui/title-model.ts`, `tests/tap-targets.test.ts`, `tests/title-model.test.ts`

- [x] 38. **Parent entry point: the small control on the title screen**
  - Mark: later (req 2).
  - [x] 38.1 In `src/ui/title-panel.ts` build the parent control when an `onParentOpen` handler is passed: call `titleControls(true)`, create a small, quiet icon button (class `icon-button`, an icon made from a character of the system font or a CSS shape, no padlock, accessible name `DISPLAY_TEXT['grown-ups']`, `TAP_TARGETS.parent`) whose tap calls the handler. It builds no gate, mock or bypass (that is the `parent-screen` spec). Only the title panel creates it, so it is never on the session screen or the end card
  - [x] 38.2 In `src/ui/session-screen.ts` add an optional `onOpenParent` to `SessionScreenHandlers` and pass it to the title panel. `main.ts` passes nothing, so the control is not shown until the `parent-screen` spec provides a handler
  - [x] 38.3 In `src/ui/screens.css` add the quiet control's styles: smaller and quieter than both the start and the Monster Book buttons
  - [x] 38.4 Extend `tests/title-panel.test.ts` (source scan): the parent control is created only inside a branch that needs the handler; `title-panel.ts` still has no `getUserMedia`, `import(`, `fetch`, `setItem` or `localStorage`; `session-screen.ts` creates no parent control
  - [x] 38.5 Check by hand (requirement 2.2, 2.3): this cannot be seen until the `parent-screen` spec passes a handler. Leave this sub-task unticked now. When that handler exists, look at the title screen: the control is small, quiet and at least 48 px, with a visible icon, and it is not on the session screen or the end card. Note (23 Nov 2026): the visible word "Grown-ups" was added by task 49
  - [x] 38.6 Run `npm run test:run` and `npm run build`: both pass. The game runs and looks the same
  - _Requirements: 2.1, 2.2, 2.3, 11.4_
  - Test file: `tests/title-panel.test.ts` (extended)
  - Files this task may change: `src/ui/title-panel.ts`, `src/ui/session-screen.ts`, `src/ui/screens.css`, `tests/title-panel.test.ts`

- [x] 39. **Landscape, desktop, reflowing Book and focus marks**
  - Mark: later (req 12).
  - [x] 39.1 In `src/ui/effects.ts` add `ringLandscapePx` (20) to `FRAME_METRICS`. In `src/ui/frame.css` make the frame `width: min(100%, 480px)`, use the landscape ring in short landscape, and keep the preview at `max-height: 60dvh`. Nothing shows a "rotate your device" message and nothing clips the preview, caption, countdown or buttons
  - [x] 39.2 In `src/ui/screens.css` change the two Book grids to `grid-template-columns: repeat(auto-fit, minmax(72px, 1fr))` and let the Book screen scroll (`overflow-y: auto`) when it is taller than the window. Add a visible `:focus-visible` outline to `.small-button`, `.icon-button` and `.book-cell`, in the pattern of the existing `.big-button:focus-visible` rule
  - [x] 39.3 Extend `tests/css-guards.test.ts` (design test 25): every class among `big-button`, `small-button`, `icon-button`, `book-cell` that is defined in any of `styles.css`, `frame.css`, `monster-art.css` and `screens.css` has a `:focus-visible` rule; `FRAME_METRICS.ringLandscapePx` is smaller than `ringPx`; `screens.css` contains `auto-fit` for the Book grids
  - [x] 39.4 Run `npm run test:run` and `npm run build`: both pass. The existing `camera-preview.test.ts` passes unchanged. The game runs in portrait as before
  - _Requirements: 12.1, 12.2, 12.3, 15.5_
  - Test file: `tests/css-guards.test.ts` (extended)
  - Files this task may change: `src/ui/effects.ts`, `src/ui/frame.css`, `src/ui/screens.css`, `tests/css-guards.test.ts`

- [x] 40. **Final checks for the later items**
  - Mark: later (req 2, 8, 12).
  - [x] 40.1 Run `npm run test:run` and `npm run build` and report both results
  - [x] 40.2 Check by hand (M7, keyboard part, requirement 12.3): on a desktop browser, Tab through the title screen, the Monster Book and the end card. Every control shows a visible focus mark and works with Enter and Space. Note (23 Nov 2026): an empty dark plate under the Monster Book caption line was found here and fixed by task 50
  - [x] 40.3 Check by hand (M8, requirement 12.1): rotate the phone sideways and open the game on a laptop. There is no rotate message, and the preview, caption, countdown, frame and buttons are not clipped
  - [x] 40.4 Check by hand (M3 and requirement 12.2): in a window too small to show the whole Monster Book, the grid reflows and the screen scrolls so that all twelve cells can be reached
  - [x] 40.5 Check by hand (requirement 8): the rare invitation shows once under the rare silhouettes and is spoken on a rare-silhouette tap, as in task 35. Read it once more against approved line 3
  - [x] 40.6 The parent-control check of task 38.5 is done only when the `parent-screen` spec provides a handler. Leave it as it is until then
  - [x] 40.7 Read the 19 approved lines in `requirements.md` against what appears on screen and in speech. Nothing else is shown or said
  - _Requirements: 2.2, 2.3, 8.1, 12.1, 12.2, 12.3, 14.1_
  - Test file: none new (this task runs the whole suite and the manual checks; it changes no source file)
  - Files this task may change: none

---

## Group 3: decided by Dr. Yatin

- [x] 41. **Tooth shapes in the drawings (design section 10): closed by Dr. Yatin's decision of 21 Nov 2026, no drawing work**
  - Mark: closed. Dr. Yatin chose option 1 on 21 Nov 2026. No monster drawing has a tooth-like shape, including `molar-mumbler` and `midnight-molar-ghoul`. `fuzzlefang` keeps its name and is drawn with a silly tongue and no fangs. No monster name changes. This is what tasks 4, 14 and 15 already built, so nothing is changed.
  - [x] 41.1 Dr. Yatin's answers are recorded in design section 10 (a: no tooth motif; b: the name stays, the drawing has no fangs)
  - [x] 41.2 No drawing work needed: no file is changed for this task
  - [x] 41.3 Not applicable: the motif is not wanted and the `fuzzlefang` drawing is not changed
  - [x] 41.4 Not applicable: no new field, so `tests/monster-looks.test.ts` is not extended
  - [x] 41.5 Not applicable: no drawing changed
  - [x] 41.6 Not applicable: no code changed
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

---

## Group 4: needed for the video, added 21 Nov 2026 (fixes after Dr. Yatin's camera session)

Dr. Yatin played a camera session at the laptop while brushing (requirements Decision 8). The
screen values recorded once a second showed the monster did shrink (72 px to 29 px wide over
24 s), was defeated, smoke showed 23 s over the session, and the leaving copy stayed about
1.5 s at each zone change. What he saw: "the monster is not reducing in size", and two
monsters overlapping. Build these in the order 42, 43, 44, 45, 46, 47, before tasks 33 to 40.
Tick nothing in tasks 1 to 41 again; they stay as they are.

- [x] 42. **Timer-only smoke: `TIMER_ONLY_DAMAGE` (core 8.5, 8.6)**
  - Mark: needed for the video (core 7.7, 7.8, 8.5, 8.6, 13.1; requirement 16.4).
  - [x] 42.1 In `src/logic/constants.ts` add `export const TIMER_ONLY_DAMAGE = DAMAGE_PER_SECOND;` (value 3), with a comment naming Dr. Yatin's decision of 21 Nov 2026. `UNTRACKED_DRAIN` stays 2
  - [x] 42.2 In `src/logic/session.ts` change `tick` as in the core design (section 5): in timer-only mode `damage = TIMER_ONLY_DAMAGE`, the untracked count and `progress` are as before; in camera mode a `null` signal still gives `UNTRACKED_DRAIN`. No other change under `src/logic/`, and no change to `toView`, its type, `toSessionResult` or any result field (timer-only results still record 30 brushed, 0 untracked, unverified)
  - [x] 42.3 Update the existing tests that pinned the old rule, to the new rule, in this same task. This is a rule change by Dr. Yatin, not a weakening of a test: every assertion keeps its strength and only the numbers change. The files are:
    - `tests/session.test.ts`: in `healthChangesOnlyByTheRule` the expected damage is `TIMER_ONLY_DAMAGE` for every timer-only tick, `UNTRACKED_DRAIN` for a `null` signal in camera mode, `DAMAGE_PER_SECOND` for a match, 0 otherwise; the describe `timerOnlyDefeatsEveryMonsterAt30` becomes `timerOnlyDefeatsEveryMonsterAt20`: health is `60 - 3 * tickInZone`, the outcome is `pending` with `defeatedAtElapsed` null before tick 20 and `defeated` with `defeatedAtElapsed` 20 from tick 20 to the zone end, and every monster is `defeated` at health 0 at the end
    - `tests/view.test.ts`: the test 'timer-only: the monster is defeated on the 30th tick of its zone, with no smoke line' becomes 'timer-only: the monster is defeated on the 20th tick of its zone, the smoke line shows from tick 20, and `smokeFraction` falls from 1 to 0 by tick 30', with the zone line still shown up to tick 19 and the next zone's line right after tick 30
    - `tests/sound-cues.test.ts`: the test 'puts defeat and the next zone-start on one tick in timer-only mode, a gap apart' becomes: in timer-only mode the `defeat` cue is given at tick 20 of a zone with no `zone-start`, and the next `zone-start` at tick 30 has `delayMs` 0 (no outcome cue shares that tick); the camera-mode case where a `fled` or `trapped` cue shares a tick with `zone-start` and gets `CUE_GAP_MS` stays covered by the generated-session property of `soundCues`
    - `tests/constants.test.ts`: keep `UNTRACKED_DRAIN * ZONE_DURATION === H_MAX`; add `TIMER_ONLY_DAMAGE === DAMAGE_PER_SECOND` and `H_MAX / TIMER_ONLY_DAMAGE === 20`
    - `tests/session-result.test.ts`: only the test label `timerOnlyDefeatsEveryMonsterAt30: ...` is renamed `timerOnlyDefeatsEveryMonsterAt20: ...`; its assertions (30 brushed, 0 untracked, unverified, outcome `defeated`) stay as they are
    - `tests/lines.test.ts` is not edited. It still passes (the smoke line is now also produced in timer-only mode); its comment 'monster defeated at 30 s only, so no smoke' is stale and is left alone by the mirror spec's rule that this file is not changed. Say so in the report
  - [x] 42.4 Run `npm run test:run`. If any other test fails because it asserted the old timer-only rule (defeat at 30 s, drain 2 in timer-only mode), list it by name in the report and update it the same way. If any test fails for another reason, stop and report. Do not weaken any test
  - [x] 42.5 Check by hand: `npm run dev`, a timer-only session. In the first zone the monster is full size at the start and turns to smoke at 20 s, the line 'Keep brushing! Brush the smoke away!' is spoken and captioned once, the smoke thins over the last 10 s, the zone still ends at 30 s, and the end card still shows four monsters. The frame glow stays on the zone all the time
  - [x] 42.6 Run `npm run test:run` and `npm run build`: both pass
  - _Requirements: core 7.7, 7.8, 8.5, 8.6, 13.1; 16.4_
  - Test files: `tests/session.test.ts`, `tests/view.test.ts`, `tests/sound-cues.test.ts`, `tests/constants.test.ts`, `tests/session-result.test.ts` (label only)
  - Files this task may change: `src/logic/constants.ts`, `src/logic/session.ts`, the five test files above (and any other test that fails only because it asserted the old rule, named in the report)

- [x] 43. **No overlap: the next monster waits for the leaving copy**
  - Mark: needed for the video (req 6.3, 6.13, 3.6, 15.12).
  - [x] 43.1 Create `src/ui/leaving-gate.ts` (pure) as in design section 5.12: `LeavingGate`, `MAX_LEAVING_PAINTS` (2), `GATE_OPEN`, `gateOnPaint(gate, { zoneEnd, phase })`, `gateOnAnimationEnd(gate)`, `nextMonsterVisible(gate)`. No DOM, no clock, no timer, no randomness
  - [x] 43.2 In `src/ui/session-screen.ts` keep one gate. In each `paint(view, zoneEnd?)` apply `gateOnPaint`, hide the live monster element with the `hidden` attribute while `!nextMonsterVisible(gate)` (so its name is not read either), and show it again from the last painted view when the gate opens. The copy's `animationend` handler removes the copy, calls `gateOnAnimationEnd` and re-shows the monster. The glow, caption, spoken line and sound cues still change at the zone end exactly as before, and the timer is not touched. Removing the copy on pause, on `ended`, on a new zone end and in `showStart()` also resets the gate. Both modes and reduced motion use the same code. No `setTimeout`, `setInterval` or `requestAnimationFrame`
  - [x] 43.3 Test `nextMonsterWaitsForLeavingCopy` (design test 36), in both modes: at the paint that carries a zone end the next monster is not visible; it stays hidden until `gateOnAnimationEnd`; with no `animationend` it is visible at the second paint after the zone end at the latest (never hidden at a third paint); pause, `ended` and reset open the gate at once; a second zone end replaces the first. Drive it from generated sessions (zone ends from `zoneEndEvent`). Add a source scan: `session-screen.ts` uses `gateOnPaint`, `gateOnAnimationEnd` and `nextMonsterVisible`, sets `hidden` on the live monster, and has no timer call
  - [x] 43.4 Extend `tests/leaving-copy.test.ts` only if it asserts that the next monster shows at once (update that line to the gate rule); otherwise leave it
  - [x] 43.5 Run `npm run test:run` and `npm run build`: both pass. The game runs
  - _Requirements: 3.6, 6.3, 6.13, 15.12_
  - Test file: `tests/leaving-gate.test.ts`
  - Files this task may change: `src/ui/leaving-gate.ts`, `src/ui/session-screen.ts`, `tests/leaving-gate.test.ts`, `tests/leaving-copy.test.ts` (the one line, only if needed)

- [x] 44. **Clearer shrink: `MIN_MONSTER_SCALE` 0.2**
  - Mark: needed for the video (req 6.2, 6.11).
  - [x] 44.1 In `src/ui/monster-draw-state.ts` change `MIN_MONSTER_SCALE` from 0.35 to 0.2. The monster is still never at zero before it is defeated
  - [x] 44.2 Extend `tests/monster-draw-state.test.ts` (`scaleAndSmokeLook`, design test 5): `MIN_MONSTER_SCALE` is 0.2; `monsterScale(0)` is 0.2 and `monsterScale(1)` is 1; the existing never-below-floor, never-above-1 and never-rises properties stay. Update any assertion in that file that still reads the number 0.35 (it was this spec's own value, not a core or hand-tracking rule)
  - [x] 44.3 Run `npm run test:run` and `npm run build`: both pass. The monster now shrinks to a fifth of its size
  - _Requirements: 6.2, 6.11, 15.2_
  - Test file: `tests/monster-draw-state.test.ts` (extended)
  - Files this task may change: `src/ui/monster-draw-state.ts`, `tests/monster-draw-state.test.ts`

- [x] 45. **Hit feedback: a short flinch on every tick that lowers health**
  - Mark: needed for the video (req 6.9, 6.10, 11.3, 11.9, 15.11).
  - [x] 45.1 Create `src/ui/hit-feedback.ts` (pure) as in design section 5.11: `isHit(prevView, view)` (true only when both views exist, `zoneId` and `monsterId` are equal and `healthFraction` is lower) and `hitClassFor(hit, effects, flip)` (`null` when not a hit or when `effects.hitMotion` is false, else `monster--hit-a` or `monster--hit-b` by `flip`). No DOM, no clock, no timer, no randomness
  - [x] 45.2 In `src/ui/effects.ts` add `ONE_SHOT_MS.hit = 300`, and add the field `hitMotion` to `Effects` (`!reduced`), with the class `fx-no-hit` in `effectClasses`. Update `tests/effects.test.ts` for the new field: `effectsFor(true)` now has six moving fields false and four state fields true, `effectsFor(false)` all ten true, `effectClasses` lists the extra class. This extends the test of task 1 by one field; every old assertion stays
  - [x] 45.3 In `src/ui/session-screen.ts` keep the last painted view (cleared in `showStart()`, on `ended` and on reset) and a boolean `flip`. In `paint`, when the monster is shown (the leaving gate of task 43 is open and the draw state is `sitting` or `shrinking`), put the class from `hitClassFor(isHit(lastView, view), effects, flip)` on the live monster element's inner drawing (not on the slot the anchor positions), toggle `flip` on each hit, and remove both classes when there is no hit. No timer, no forced reflow. The painter gets `effects` from the same `effectsFor` value that `effects-host.ts` uses, passed in by `main.ts`
  - [x] 45.4 In `src/ui/monster-art.css` add the one-shot hit animation: two identical keyframe sets with different names (`hit-squash-a`, `hit-squash-b`), 300 ms taken from `ONE_SHOT_MS.hit`, a quick squash (about 1.12 wide by 0.9 tall) and a small wobble of a few degrees on `transform` only, never `infinite`, no colour or brightness change, no text; `.fx-no-hit` sets `animation: none` for both classes. In `src/ui/effects-host.ts` nothing changes beyond what `effectClasses` already returns
  - [x] 45.5 Test `hitOnlyWhenHealthDrops` (design test 33): `isHit` is true exactly when both views exist, the zone and monster are equal and `healthFraction` is lower; false when equal, higher or either view is `null`; over generated sessions in both modes, at most one hit per tick
  - [x] 45.6 Test `noHitOnZoneChange` (design test 34): false whenever `zoneId` or `monsterId` differs; over generated sessions in both modes no tick on which the zone changes is a hit
  - [x] 45.7 Test `noHitWhenReducedMotion` (design test 35): `hitClassFor` is `null` for every input when `effectsFor(true)`; with `effectsFor(false)` hits alternate `monster--hit-a` and `monster--hit-b`; `ONE_SHOT_MS.hit` is at most 300; the hit rules in `monster-art.css` have no `infinite`, use only `transform` in their keyframes, and `.fx-no-hit` sets `animation: none`. Extend `tests/css-guards.test.ts` only if its flash-rate part needs the new `ONE_SHOT_MS` entry (it should not)
  - [x] 45.8 Run `npm run test:run` and `npm run build`: both pass. In a session each brushing tick now flinches the monster
  - _Requirements: 6.9, 6.10, 11.2, 11.3, 11.9, 15.4, 15.11_
  - Test file: `tests/hit-feedback.test.ts`
  - Files this task may change: `src/ui/hit-feedback.ts`, `src/ui/effects.ts`, `src/ui/session-screen.ts`, `src/ui/monster-art.css`, `src/main.ts` (only to pass the effects value), `tests/hit-feedback.test.ts`, `tests/effects.test.ts` (the one new field), `tests/css-guards.test.ts` (only if needed), `tests/effects-host.test.ts` (add `'fx-no-hit'` to `MOVING_CLASSES` (about line 58) because the test pins the list of moving-effect classes and fails without it; nothing else in that file changes and no assertion is weakened; Dr. Yatin's decision of 21 Nov 2026: no flinch with reduced motion)

- [x] 46. **Smoke readable over the camera picture (small change only)**
  - Mark: needed for the video (req 6.12).
  - [x] 46.1 In `src/ui/monster-art.css` make the smoke puffs about 20 % larger (the puff size is multiplied by 1.2) and replace the near-white puff border with a mid-lilac one (starting value `#8a6fc4`, about 4:1 against white; adjust only if the test below fails). The smoke's colour family, puff counts, thinning rule, drift and opacity rules do not change, and `smokeLook` in `monster-draw-state.ts` is not touched
  - [x] 46.2 Test `smokeOutlineReadable` (design test 37): the puff outline is a 6-digit hex whose contrast ratio against white is at least 3 to 1 and that is not near-white; the puff rule holds the new 1.2 size multiplier; `scaleAndSmokeLook` still passes unchanged (puff counts and thinning)
  - [x] 46.3 Run `npm run test:run` and `npm run build`: both pass
  - _Requirements: 6.5, 6.6, 6.12_
  - Test file: `tests/smoke-outline.test.ts`
  - Files this task may change: `src/ui/monster-art.css`, `tests/smoke-outline.test.ts`

- [x] 47. **Check by hand (camera)**
  - Mark: needed for the video (req 6.9, 6.11, 6.12, 6.13, 11.9; design M11).
  - [x] 47.1 Check by hand: `npm run dev`, a camera session on the laptop, brush one zone. Each brushing second the monster visibly flinches once, and it shrinks clearly, down to about a fifth of its size. The smoke is easy to see over the camera picture. At a zone change no two monsters are on screen at once: the old one leaves, then the new one appears within about 2 s, while the glow, caption and voice change at the zone end. Do the same with "reduce motion" on: no flinch, the size change and smoke still show, and the new monster still appears. Do the same in a timer-only session: the monster turns to smoke at 20 s
  - [x] 47.2 Run `npm run test:run` and `npm run build` and report both results
  - _Requirements: 6.9, 6.11, 6.12, 6.13, 11.9_
  - Test file: none new
  - Files this task may change: none

- [x] 48. **Gentle brushing counts and a camera monster falls after 15 brushed seconds**
  - Mark: needed for the video (core 7.2, 8.5, 8.6, 13.1; hand-tracking 4.5, Decision 4; core Decision 2026-11-21 evening).
  - Reason: measured on 21 Nov 2026, brisk brushing counted 85% of seconds, gentle brushing 69% (13% lost as "near mouth but not moving"), real game play 37-47%. Camera speed was the same in the game and the debug page, so speed is not the cause. With 20 counted seconds needed out of 30, camera-mode monsters were rarely defeated and smoke rarely appeared. Both values below are Dr. Yatin's decisions of 21 Nov 2026 (A is a clinical decision).
  - [x] 48.1 In `src/tracking/thresholds.ts` change `MOVING_MIN_TRAVEL` from 0.3 to 0.2 (face widths per second) and update its comment. No other threshold changes
  - [x] 48.2 In `src/logic/constants.ts` change `DAMAGE_PER_SECOND` from 3 to 4, and make `TIMER_ONLY_DAMAGE` its own value, `3`, not `= DAMAGE_PER_SECOND`, with a comment naming Dr. Yatin's decisions of 21 Nov 2026. `UNTRACKED_DRAIN` (2), `H_MAX` (60), `KIND_FLOOR` (36) and `RESCUE_THRESHOLD` (9) stay. `src/logic/session.ts` should need no change (it already uses the two names); if it does, change only what the names require
  - [x] 48.3 Update the existing tests that pinned the old values to the new rule, in this same task. This is a rule change by Dr. Yatin, not a weakening of a test: every assertion keeps its strength and only the numbers change. The files are:
    - `tests/thresholds.test.ts`: `MOVING_MIN_TRAVEL` is 0.2
    - `tests/aggregate-second.test.ts`: strokes of known length that sat between 0.2 and 0.3 face widths per second now give `moving` true; the "just below" case uses a length below 0.2; the "still" and "jitter-only" cases stay false
    - `tests/tracking-source-rules.test.ts`: any hand path or expected `moving` value tied to 0.3 uses 0.2
    - `tests/constants.test.ts`: `DAMAGE_PER_SECOND === 4`; `TIMER_ONLY_DAMAGE === 3` and it is not derived from `DAMAGE_PER_SECOND` (replace the old `TIMER_ONLY_DAMAGE === DAMAGE_PER_SECOND` line); `H_MAX / DAMAGE_PER_SECOND === 15`; `H_MAX / TIMER_ONLY_DAMAGE === 20`; `UNTRACKED_DRAIN * ZONE_DURATION === H_MAX`, `KIND_FLOOR === 36` and `RESCUE_THRESHOLD === 9` stay
    - `tests/session.test.ts`: in `healthChangesOnlyByTheRule` the expected damage for a match in camera mode is 4 (`DAMAGE_PER_SECOND`); timer-only stays 3; `null` in camera mode stays 2. Add or update one fixed case: a camera-mode monster at 60 brushed on every second is `pending` at tick 14 with health 4 and `defeated` at tick 15 with `defeatedAtElapsed` 15; 13 brushed seconds (not brushed otherwise) end `fled` with health 8; 12 end `trapped` with health 12; a monster that starts at 36 is defeated at 9 brushed seconds and `fled` at 7. Timer-only still defeats at 20
    - any other test that fails only because it asserted the old values (3 damage per matched second in camera mode, 20 counted seconds, 17 seconds for a rescue, 0.3 travel): update it the same way and **name each one in the report**
  - [x] 48.4 Run `npm run test:run`. If any test fails for another reason, stop and report. Do not weaken any test
  - [x] 48.5 Check by hand (camera): `npm run dev`, one camera session brushed gently, with short strokes as the dentist teaches. Monsters are defeated in most zones and smoke appears
  - [x] 48.6 Run `npm run test:run` and `npm run build`: both pass
  - _Requirements: core 7.2, 8.5, 8.6, 13.1; hand-tracking 4.5, 11.4(g)_
  - Test files: `tests/aggregate-second.test.ts`, `tests/constants.test.ts`, `tests/session.test.ts`, `tests/thresholds.test.ts`, `tests/tracking-source-rules.test.ts`
  - Files this task may change: `src/tracking/thresholds.ts`, `src/logic/constants.ts`, the five test files above, and any other test that fails only because it asserted the old values (named in the report), not in this file: `parent-screen` (the adult gate and the screen behind the small parent control, requirement 2). `hand-tracking` and `core-brushing-loop` are separate specs with their own task lists.

- [x] 49. **Parent control shows the small word "Grown-ups" next to its icon**
  - Mark: later (req 2.2). Dr. Yatin's decision of 23 Nov 2026, from the manual check 38.5: he could not find the control because it showed only an icon. The word is row 18 of "Approved lines (21 Nov 2026)"; no new wording.
  - [x] 49.1 In `src/ui/display-text.ts` change the kind of `DISPLAY_TEXT['grown-ups']` from `name-only` to `shown`. The text stays "Grown-ups"
  - [x] 49.2 In `src/ui/title-panel.ts` add a text span after the icon in the parent button, with its own CSS class (for example `icon-button__word`), filled from `DISPLAY_TEXT['grown-ups'].text`. The icon stays `aria-hidden`, so the accessible name is read once, as "Grown-ups". The control is still created only inside the branch that needs the handler, so it stays absent from the session screen and the end card
  - [x] 49.3 In `src/ui/screens.css` style the word: a text size and colour quieter than the Monster Book button's text, on one line (no wrapping), and the button keeps at least 48 x 48 px and stays smaller and quieter than both the start and the Monster Book buttons
  - [x] 49.4 Update the tests that pinned the old kind and the icon-only look: `tests/display-text.test.ts` (`grown-ups` is `shown`, text unchanged), `tests/title-panel.test.ts` (source scan: the word span comes after the icon, the icon is `aria-hidden`, the accessible name is the `grown-ups` text, the control is still created only inside the handler branch, `session-screen.ts` still creates no parent control), and `tests/title-model.test.ts` only if it pinned the icon-only look. Every other assertion keeps its strength. `tests/new-text-guard.test.ts` changes only if it needs the kind
  - [x] 49.5 Run `npm run test:run` and `npm run build`: both pass
  - [x] 49.6 Check by hand (Dr. Yatin; requirement 2.2, 2.3): `npm run dev`, title screen at 360 x 640 with a parent handler. The word "Grown-ups" is readable next to the icon, is quieter than the Monster Book button's text, and fits without wrapping. The control is not on the session screen or the end card
  - _Requirements: 2.2, 2.3, 11.4, 14.1, 14.4_
  - Test file: `tests/display-text.test.ts` (extended), `tests/title-panel.test.ts` (extended), `tests/title-model.test.ts` (only if needed)
  - Files this task may change: `src/ui/display-text.ts`, `src/ui/title-panel.ts`, `src/ui/screens.css`, `tests/display-text.test.ts`, `tests/title-panel.test.ts`, `tests/title-model.test.ts` (only if needed), `tests/new-text-guard.test.ts` (only if needed)

- [x] 50. **No empty caption plate in the Monster Book**
  - Mark: needed for the video (req 7.11). Dr. Yatin's decision of 23 Nov 2026, from the manual checks 35.4 and 40.2: `p.book__caption` has an opaque background (the plate of requirement 11.7) and `min-height: 2.6rem`, so an empty dark plate showed under the line "Brush morning AND night." No new wording.
  - [x] 50.1 In `src/ui/screens.css` add a rule `.book__caption:empty` that sets `background: transparent` (and removes the padding paint if needed), keeping the `min-height` of `.book__caption`
  - [x] 50.2 Add a test to `tests/css-guards.test.ts`: `screens.css` has a `.book__caption:empty` rule with a transparent background, and `.book__caption` still has a `min-height`
  - [x] 50.3 Run `npm run test:run` and `npm run build`: both pass
  - [x] 50.4 Check by hand (Dr. Yatin; requirement 7.11): open the Monster Book with no monsters: no dark empty plate under the caption line. Tap an owned monster: its name shows on the normal plate. Tap away: the plate disappears again and nothing jumps
  - _Requirements: 7.11, 11.7_
  - Test file: `tests/css-guards.test.ts` (extended)
  - Files this task may change: `src/ui/screens.css`, `tests/css-guards.test.ts`

---

Later specs, not in this file: `parent-screen` (the adult gate and the screen behind the small parent control, requirement 2). `hand-tracking` and `core-brushing-loop` are separate specs with their own task lists.
