# Tasks: mirror-and-screens

## Implementation plan

Twenty-four small tasks. The pure functions and their tests come first (tasks 1 to 3), then
the frame (tasks 4 to 7), the monsters (tasks 8 to 10), the sounds (tasks 11 to 13), the
wording (task 14), the Monster Book (tasks 15 to 20), the end card (task 21), comfort and
access (task 22), whole-spec guards (task 23) and the manual checks (task 24). Every
requirement tagged "needed for the video" is built before the "later" ones (requirements 2, 8
and 12), except where a "later" part is a small optional piece of a task that is needed anyway.

This spec changes how things look and sound. It never changes a game rule, a number, a stored
value, `toView`, `SignalSource`, `game-loop.ts`, anything under `src/logic/`, `src/tracking/`
or `src/storage/`, or an existing test (requirement 16.1).

### Rules for every task

- One task per run. One module (or two small ones) plus its tests per task.
- Every task ends with `npm run test:run` and `npm run build` both passing, and the game
  still runs: the title screen opens and a timer-only session plays through to the end card.
- A task changes only the files it names. It never edits anything in `.kiro/`, and it never
  edits `tests/` files that already exist.
- Tests are written in the same task as the code they test. Test names follow design
  section 8.
- Test helpers (arbitraries, fakes) are written inside the test file that uses them. There is
  no shared helper file. Reuse the session helpers and arbitraries that `core-brushing-loop`
  tests already define by copying the few lines needed, not by importing from another test.
- New pure files import from `src/logic/` only, and have no DOM, no clock and no randomness
  (requirement 16.2).
- No new file calls `setInterval`, `setTimeout` or `requestAnimationFrame` (requirement 13.3).
- New styling uses stylesheet classes and `element.style` only. No `style=""` attribute, no
  `<style>` element, no `innerHTML`, no `url(`, no web font (requirements 13.1, 13.2).
- No new word is shown or spoken unless it is one of the 19 approved lines in
  `requirements.md`. If a task seems to need another word, stop and ask Dr. Yatin.
- A "check by hand" sub-task says exactly what to look at. If the agent cannot run a browser,
  it leaves the sub-task unticked and says so in its report. It does not tick it.

---

- [ ] 1. **Effects table and reduced motion (pure)**
  - [ ] 1.1 Create `src/ui/effects.ts` with: `MIN_CYCLE_MS = 334`; `LoopId` and `LOOP_CYCLES_MS` (`flameActive` 1700, `glowActive` 2200, `glowDim` 3600, `fogDrift` 30000, `smokeDrift` 2800); `ONE_SHOT_MS` (`fadeIn` 600, `glowMove` 400, `leave` 1400, `intoBook` 1200); `REGION_LOOKS` for `active`, `dim`, `off` (design section 5.1); `Effects`, `effectsFor(prefersReducedMotion)` and `effectClasses(effects)` (design section 5.9)
  - [ ] 1.2 Nothing uses the file yet. The game is unchanged
  - [ ] 1.3 Test `effectsForReducedMotion` (design test 12, first part): `effectsFor(true)` turns off the five moving effects and leaves `glow`, `ornament`, `sizeChange` and `smokeThinning` on; `effectsFor(false)` has all nine on; `effectClasses` lists exactly the effects that are off
  - [ ] 1.4 Test `flashRate` (design test 14, table part): every `LoopId` has a cycle; every cycle is at least `MIN_CYCLE_MS`; no `flickerAmplitude` is above 0.25; `off` has opacity 0
  - [ ] 1.5 Test `frameRegionLooksDiffer` (design test 2): `active` differs from `dim` in `glowOpacity` (higher), `glowSizePx` (larger) and `flame` (true against false), and has the larger `flickerAmplitude`
  - _Requirements: 3.4, 3.5, 11.2, 11.3, 15.4, 15.5, 16.2_
  - Test file: `tests/effects.test.ts`
  - Files this task may change: `src/ui/effects.ts`, `tests/effects.test.ts`

- [ ] 2. **Frame guidance (pure)**
  - [ ] 2.1 Create `src/ui/frame-guidance.ts` with `FrameRegion`, `ZONE_REGION` (upper-left to top-left, upper-right to top-right, lower-left to bottom-left, lower-right to bottom-right), `REGION_ORDER` and `frameGuidance(input)` as in design section 5.1. The argument type is `Pick<View, 'phase' | 'zoneId'> | null`, so nothing else can reach it. No swap or negation of left and right
  - [ ] 2.2 Nothing uses the file yet. The game is unchanged
  - [ ] 2.3 Test `frameGuidanceZones` (design test 1): each zone gives exactly one active region; the four regions are different; the four mappings are as stated; `ended` and `null` give four `off` regions and no active region; `paused` keeps the region lit with `flickering` false; `running` has `flickering` true; two views that differ only in health, smoke, caption, countdown or monster give equal results; the region is the same before and after a defeat
  - [ ] 2.4 Test: `frame-guidance.ts` contains no `scaleX`, no `-1` multiplication and no `rawToChildSide`
  - _Requirements: 3.2, 3.3, 3.7, 3.8, 3.9, 15.1, 16.2_
  - Test file: `tests/frame-guidance.test.ts`
  - Files this task may change: `src/ui/frame-guidance.ts`, `tests/frame-guidance.test.ts`

- [ ] 3. **Monster draw state, smoke look and zone-end event (pure)**
  - [ ] 3.1 Create `src/ui/monster-draw-state.ts` with `MIN_MONSTER_SCALE` (0.35, the value `session-screen.ts` has now), `MonsterDrawState`, `monsterDrawState(view, endOutcome)`, `monsterScale(h)`, `smokeLook(f)` and `zoneEndEvent(prev, next)` as in design section 5.4
  - [ ] 3.2 In `src/ui/session-screen.ts` replace only the local `MIN_MONSTER_SCALE` constant with an import from the new file. Nothing else in that file changes and its behaviour is the same
  - [ ] 3.3 Test `monsterDrawStateProperties` (design test 4): one state for every input; health 1 gives `sitting`; between 0 and 1 gives `shrinking`; 0 with smoke above 0 gives `defeated`; 0 with no smoke gives `gone`; the outcomes `fled` and `trapped` and `defeated` give those states; the same input gives the same state
  - [ ] 3.4 Test `scaleAndSmokeLook` (design test 5): `monsterScale` is never below `MIN_MONSTER_SCALE`, never above 1 and never rises as health falls; `smokeLook` puffs, scale and opacity never rise as smoke falls; 0 gives no puff and anything above 0 gives at least one
  - [ ] 3.5 Test `zoneEndEvents` (design test 6): over any 120 signals-or-null in either mode, exactly four events per session, in zone order, none `pending`, each equal to the final `monsters[i].outcome`; no event when the state is paused or resumed
  - _Requirements: 6.1, 6.2, 6.5, 6.6, 6.7, 15.2_
  - Test file: `tests/monster-draw-state.test.ts`
  - Files this task may change: `src/ui/monster-draw-state.ts`, `src/ui/session-screen.ts` (the one import), `tests/monster-draw-state.test.ts`

- [ ] 4. **Effects host: reduced motion, tab hidden, cycle variables**
  - [ ] 4.1 Create `src/ui/effects-host.ts` with `startEffects({ root, matchMedia, visibility })` as in design section 5.9: write one `--cycle-<id>` variable per `LoopId` with `setProperty`; put the `fx-*` classes from `effectClasses(effectsFor(...))` on the root; follow `change` of `(prefers-reduced-motion: reduce)`; put `fx-paused` on the root while the document is hidden. `matchMedia` and the visibility source are optional. It uses event listeners only, no timer
  - [ ] 4.2 In `src/main.ts` call `startEffects` once at start-up with the real `window.matchMedia` and `document`. No other change to `main.ts`
  - [ ] 4.3 Test `effectsHostFollowsPreference` (design test 13) with a fake root, a fake media query that can fire `change`, and a fake visibility source: classes match the preference at start and after a change; `fx-paused` is set while hidden and cleared when visible; a missing `matchMedia` gives no classes and no error; one `--cycle-` variable is written per `LoopId` with the table's value
  - _Requirements: 11.2, 11.3, 13.3_
  - Test file: `tests/effects-host.test.ts`
  - Files this task may change: `src/ui/effects-host.ts`, `src/main.ts`, `tests/effects-host.test.ts`

- [ ] 5. **Stylesheet scaffold and CSS guards**
  - [ ] 5.1 Create `src/ui/frame.css`, `src/ui/monster-art.css` and `src/ui/screens.css`, each with one comment line and no rules yet
  - [ ] 5.2 Add three `<link rel="stylesheet">` lines for them in `index.html`, next to the existing `styles.css` link. Do not touch the Content-Security-Policy `<meta>` tag
  - [ ] 5.3 Test `cssGuards` (parts of design tests 14, 25 and 29): across `frame.css`, `monster-art.css` and `screens.css`, no `@font-face`, no `url(`, no `<style`; every rule that contains `infinite` takes its duration from `var(--cycle-` and has no literal time; every `--cycle-` name used exists as a `LoopId` in `effects.ts`; every class among `big-button`, `small-button`, `icon-button`, `book-cell` that is defined in any of the four stylesheets (including `styles.css`) has a `:focus-visible` rule. The test must pass on the empty files and keep checking them as later tasks fill them
  - [ ] 5.4 Check that the existing `csp.test.ts` and `build-output.test.ts` pass unchanged
  - _Requirements: 11.2, 12.3, 13.1, 13.2, 15.5_
  - Test file: `tests/css-guards.test.ts`
  - Files this task may change: `src/ui/frame.css`, `src/ui/monster-art.css`, `src/ui/screens.css`, `index.html`, `tests/css-guards.test.ts`

- [ ] 6. **Mirror frame painter and styles (not yet shown)**
  - [ ] 6.1 Create `src/ui/frame-art.ts`: builds the crack drawing with `createElementNS` (a short, regular, star-shaped pattern in the ring corners, thin strokes) and the candle stick and flame pieces. No `innerHTML`
  - [ ] 6.2 Create `src/ui/mirror-frame.ts`: the structure in design section 5.1 (`mirror-frame`, a `mirror-frame__deco` layer with `aria-hidden="true"` holding fog, four regions and cracks, and a `mirror-frame__glass` slot). `paint(guidance)` sets the region classes (`frame-region--active`, `--dim`, `--off`, `--flicker`) and the look values with `setProperty`. It makes no decision of its own
  - [ ] 6.3 In `src/ui/frame.css` write the styles: a 32 px ring (20 px in short landscape) around the glass; the glow layer behind the glass with a lower `z-index` than the glass; `pointer-events: none` on the deco layer; fog as two soft blurred ellipses, no shape or face; cracks at about 35% opacity; the lit flame only in the active region; a fade-in that uses `ONE_SHOT_MS.fadeIn`; looping animation durations only through `var(--cycle-…)`; only `opacity` and small `translate` movement, no `filter`, no shake; `.fx-no-flicker`, `.fx-no-fog` and `.fx-paused` rules that set `animation: none` or pause
  - [ ] 6.4 Nothing shows the frame yet. The game is unchanged
  - [ ] 6.5 Test `decorativeFrame` (design test 24): the deco element has `aria-hidden="true"`; no `scaleX` in `mirror-frame.ts`, `frame-art.ts` or `frame.css`; the frame is never inside or given to `.preview--mirrored`; the glow layer has a lower `z-index` than the glass; `pointer-events: none` is on the deco layer; the keyframes use only `opacity` and `transform`; the `cssGuards` test from task 5 still passes on the filled file
  - _Requirements: 3.1, 3.3, 3.4, 3.5, 3.10, 4.1, 4.2, 4.5, 4.6, 11.8, 13.2, 13.3_
  - Test file: `tests/mirror-frame.test.ts`
  - Files this task may change: `src/ui/frame-art.ts`, `src/ui/mirror-frame.ts`, `src/ui/frame.css`, `tests/mirror-frame.test.ts`

- [ ] 7. **Show the frame in both modes (frame is the guidance)**
  - [ ] 7.1 In `src/ui/session-screen.ts` create one `MirrorFrame` and put the live preview in its glass slot in a camera session and the plain four-zone grid in a timer-only session (design section 5.1). The frame is a sibling of the mirrored preview element, never its parent or child
  - [ ] 7.2 In the one synchronous `paint(view)` call, in this order: `frame.paint(frameGuidance(view))`, caption and speech, monster. The glow, the spoken line and the monster therefore change together. Use no timer. Existing class names `.zone`, `.zone--active`, `.big-button` and `.caption` stay, and `camera-preview.test.ts` still passes unchanged
  - [ ] 7.3 The frame exists only inside the session panel. It is not on the title screen, the end card or (later) the Book. `frameGuidance(null)` is used when the session ends
  - [ ] 7.4 Test `glowMatchesLineAndMonster` (design test 3), using the pure functions and `toView`, without a DOM: over any 120 signals-or-null in either mode, at every tick the active region equals `ZONE_REGION` of `toView(state).zoneId`; when the caption id is a zone line, that zone is the active one; the region does not change between a defeat and the zone end; both modes give the same regions for the same zone
  - [ ] 7.5 Check by hand (requirement 3, mode part of M1): `npm run dev`. Play a timer-only session. In each of the four zones, look at the frame ring: the corner nearest the zone (upper right first, then upper left, lower left, lower right, with the child's left on the left of the screen) is brighter, has a larger glow and shows a lit candle, and the other three corners are dim with no candle. Check that the glow, the spoken line and the monster change in the same moment. Check that the pause (switch tab and back within a few seconds) keeps the corner lit
  - [ ] 7.6 Check by hand (camera session, rest of M1): start a camera session. The frame surrounds the mirrored preview and its picture is not flipped. Cover the face mid-zone: the glow does not change
  - _Requirements: 3.1, 3.2, 3.6, 3.7, 3.8, 3.9, 4.3, 4.4, 15.1_
  - Test file: `tests/frame-session.test.ts`
  - Files this task may change: `src/ui/session-screen.ts`, `tests/frame-session.test.ts`

- [ ] 8. **Monster look table (pure)**
  - [ ] 8.1 Create `src/ui/monster-looks.ts` with the shape types, the 12-row `MONSTER_LOOKS` table (design section 5.3 starting values) and `shapeKey(look)`. There is no colour field and no mouth value that is a tooth, fang, blood or drip
  - [ ] 8.2 Nothing uses the file yet. The game is unchanged
  - [ ] 8.3 Test `monsterLooks` (design test 8): keys equal the twelve ids of `MONSTERS` in order; the twelve `shapeKey` values are pairwise different; every field is in its allowed set; every rare has `star` and a crest, and the four crests are different; no common monster has a star or a crest
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 16.2_
  - Test file: `tests/monster-looks.test.ts`
  - Files this task may change: `src/ui/monster-looks.ts`, `tests/monster-looks.test.ts`

- [ ] 9. **Monster art: twelve drawings and the silhouette**
  - [ ] 9.1 Create `src/ui/monster-art.ts` with `drawMonster(def: MonsterDef): HTMLElement` and `drawSilhouette(rarity)`. `drawMonster` moves here from `session-screen.ts`, keeps its signature, sets `role="img"` and an `aria-label` equal to the monster's name, and builds the element from `MONSTER_LOOKS` with the classes in design section 5.3 plus the existing `monster--<id>` colour class. It uses `createElementNS` for any SVG and no `innerHTML`
  - [ ] 9.2 In `monster-art.css` write the styles: big round friendly eyes with a highlight, the four mouth shapes (none with teeth), the body, ear, extra and crest shapes, the rare star, and the friendly silhouette (the same blob for every common, star and crest only for rares, no padlock, cross or number). Every size is a multiple of one variable `--u` so a Book cell and the cheek can scale it. Keep the existing colour classes working
  - [ ] 9.3 In `src/ui/session-screen.ts` delete the old `drawMonster` body and add `export { drawMonster } from './monster-art'`, importing it for its own use. `end-card.ts` keeps its existing import and still works
  - [ ] 9.4 Test `drawMonsterSignature` (design test 32): `monster-art.ts` exports `drawMonster(def: MonsterDef): HTMLElement`, sets `role="img"` and an `aria-label` from `def.name`; `session-screen.ts` re-exports it; the file uses no `innerHTML`, no `<img`, no `url(`, no `setTimeout`
  - [ ] 9.5 The `cssGuards` test from task 5 still passes on the filled file
  - [ ] 9.6 Check by hand (M9, drawings part): `npm run dev`, play a session. The monsters on the cheek are friendly, with big eyes and no teeth, blood or drips, and are easy to tell apart. Read the shape of each of the four that appear in one session: they differ in at least one shape feature, not only in colour
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 13.1_
  - Test file: `tests/monster-art.test.ts`
  - Files this task may change: `src/ui/monster-art.ts`, `src/ui/monster-art.css`, `src/ui/session-screen.ts`, `tests/monster-art.test.ts`

- [ ] 10. **Monster states, smoke and the leaving copy (session presenter)**
  - [ ] 10.1 Create `src/ui/session-presenter.ts` with `createSessionPresenter(deps)`: `update(state)` and `reset()`. It keeps the previous state and, for each update, calls `toView(state)` and `zoneEndEvent(prev, state)`, then `screen.paint(view, zoneEnd)`. It does not paint a zone-end event when the new phase is `ended` (the end card shows the fourth outcome). It makes no game decision and uses no timer
  - [ ] 10.2 In `src/ui/session-screen.ts` change `paint(view)` to `paint(view, zoneEnd?)`. The monster is drawn with `monsterDrawState(view, null)`, `monsterScale` and `smokeLook` (puffs, size and opacity). With a `zoneEnd`, draw one leaving copy of that zone's monster in the state for its outcome while the next zone's monster appears at once. Only one copy exists: it is removed on its `animationend`, on the next zone-end, on pause, on `ended` and in `showStart()`. The trapped copy sits in a small glass bubble and waves or sleeps (class chosen by zone index parity, no randomness), with the same happy face
  - [ ] 10.3 In `monster-art.css` add the leaving-copy and smoke styles: a one-shot animation of `ONE_SHOT_MS.leave`; `.fx-no-leaving` and `.fx-no-smoke-drift` make the copy only fade and stop the smoke drift, while the state still shows (puff count, size, monster size). Smoke carries no text or colour change
  - [ ] 10.4 In `src/main.ts` replace the direct `screen.paint(toView(state))` call with the presenter's `update(state)`, and call `reset()` where the session ends or drops. No other change to `main.ts`
  - [ ] 10.5 Test `sessionPresenterZoneEnds`, with a fake screen that records calls: over a whole session the screen gets exactly three zone-end paints (zones 1 to 3, in order) and none for the fourth; none on pause or resume; `reset()` clears the remembered state; the presenter file has no `setTimeout`, `setInterval` or `document`
  - [ ] 10.6 Test: only `smokeLook` reads `smokeFraction` among the new `src/ui/` files (a source scan; `toView` and `monster-draw-state.ts` are the only other places the word appears)
  - [ ] 10.7 Check by hand (M1 monster part, M9 states): `npm run dev`, play a timer-only session. Each monster shrinks to a floor and turns to smoke at its defeat; the smoke thins in the number and size of its puffs; when a zone ends the monster of that zone is shown once, briefly, as it leaves, while the next monster appears at once and the timer is not interrupted. A trapped monster looks happy, waving or asleep in a bubble, never sad
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.8, 11.1, 11.3, 15.2_
  - Test file: `tests/session-presenter.test.ts`
  - Files this task may change: `src/ui/session-presenter.ts`, `src/ui/session-screen.ts`, `src/ui/monster-art.css`, `src/main.ts`, `tests/session-presenter.test.ts`

- [ ] 11. **Sound data and envelope (pure)**
  - [ ] 11.1 Create `src/audio/sounds.ts` with `SoundId`, `SoundVoice`, `SoundSpec`, `EFFECT_PEAK_GAIN` (0.25), the five-row `SOUNDS` table (design section 5.8 starting values) and `envelopeGainAt(spec, ms)`. Import `GAIN_LEVEL` and `GAIN_STEP_PER_MS` from `src/audio/speaker.ts`; do not copy them
  - [ ] 11.2 Nothing plays yet. The game is unchanged
  - [ ] 11.3 Test `soundData` (design test 15), sampled every 1 ms: five sounds, one per `SoundId`; gain at 0 ms is 0; no 1 ms step rises by more than `GAIN_STEP_PER_MS`; no gain is above `GAIN_LEVEL` or `EFFECT_PEAK_GAIN`; `EFFECT_PEAK_GAIN` is below `GAIN_LEVEL`; each sound's voice levels add to at most 1; pitches are within 200 to 1000 Hz; each total length is at most 1500 ms; gain is 0 again at the end
  - _Requirements: 10.1, 10.2, 10.3, 10.5, 10.10, 15.6_
  - Test file: `tests/sounds.test.ts`
  - Files this task may change: `src/audio/sounds.ts`, `tests/sounds.test.ts`

- [ ] 12. **Sound cues (pure)**
  - [ ] 12.1 Create `src/ui/sound-cues.ts` with `cuesFor(prev, next)` as in design section 5.8: a `defeat`, `flee` or `trapped` cue when a monster's outcome changes; `zone-start` for a new zone and at the first state; nothing at the `ended` state. It never reads the signal or the brushing speed
  - [ ] 12.2 Nothing plays yet. The game is unchanged
  - [ ] 12.3 Test `soundCues` (design test 7): over any 120 signals-or-null in either mode, one cue per monster equal to its final outcome, four `zone-start` cues, none at the `ended` tick, and no cue appears twice for one outcome change; the result is the same for two signal sequences that give the same states
  - _Requirements: 10.4, 10.6, 16.2_
  - Test file: `tests/sound-cues.test.ts`
  - Files this task may change: `src/ui/sound-cues.ts`, `tests/sound-cues.test.ts`

- [ ] 13. **Sound player, audio kit and wiring**
  - [ ] 13.1 Create `src/audio/sound-player.ts`: `createSoundPlayer()` with `unlock()`, `play(id)` and `stop()`. The `AudioContext` is created in `unlock()` only. `play` builds one gain node whose curve is sampled from `envelopeGainAt` and sent with `setValueCurveAtTime`, plus one oscillator per voice, all started and stopped on the audio clock. No timer. Everything is in `try/catch`; a `play` before `unlock()` is ignored
  - [ ] 13.2 Create `src/audio/audio-kit.ts`: `createAudioKit()` returns `{ speaker, sounds }`, where the speaker's `unlock()` and `stop()` also call the player's. The existing `speaker.stop()` calls (pause, session end, drop, back to start) therefore also stop every sound
  - [ ] 13.3 In `src/ui/session-presenter.ts` call `sounds.play(cue)` for each cue of `cuesFor(prev, state)`. In `src/main.ts` build the kit once and pass `kit.speaker` and `kit.sounds` where the speaker is passed now. There is no mute control and no music
  - [ ] 13.4 Test `soundPlayerSafe`, with a fake `AudioContext`: `play` before `unlock` does nothing and does not throw; a context that throws on creation or on `createOscillator` leaves the player silent without throwing; `stop` stops every live oscillator; `unlock` twice is safe; the source has no `setTimeout`, `setInterval` or `requestAnimationFrame`
  - [ ] 13.5 Test `soundCuesPlayed`, with a fake sound player and fake screen through the presenter: the presenter plays each cue once and plays nothing at the `ended` state
  - [ ] 13.6 Check by hand (M5): `npm run dev`. Open the title screen: it is silent. Tap start: sounds begin. At medium volume check that a defeat, a new zone, a flee and a trapped monster each have a soft, rising sound, the voice stays clear over it, nothing is sharp or loud, and pausing (switch tab) stops all sound. Turn the volume off: every event still shows on screen
  - _Requirements: 10.1, 10.2, 10.4, 10.6, 10.7, 10.8, 10.10, 10.11, 1.7_
  - Test file: `tests/sound-player.test.ts`
  - Files this task may change: `src/audio/sound-player.ts`, `src/audio/audio-kit.ts`, `src/ui/session-presenter.ts`, `src/main.ts`, `tests/sound-player.test.ts`

- [ ] 14. **New wording: two lines, the second text table, pins and guard**
  - [ ] 14.1 First write `tests/existing-lines-pinned.test.ts` (design test 18) and run it: it pins the exact `text` and `caption` of `start`, the four `zone-` lines, `smoke` and `end` as they are now, and it must pass before any edit to `lines.ts`
  - [ ] 14.2 In `src/audio/lines.ts` add exactly two lines, each with a caption: `end-close` ("Two minutes. Every corner.") and `rare-invite` ("Brush morning AND night."). The seven existing lines are not touched. The existing `tests/lines.test.ts` is not edited and passes with the two new lines
  - [ ] 14.3 Create `src/ui/display-text.ts` with `DisplayTextId`, `DISPLAY_TEXT` and the kinds from design section 4: `privacy` ("The camera stays on this phone. Nothing is saved or sent."), `book-title` ("Monster Book"), `back` ("Back"), `grown-ups` ("Grown-ups", name only) and `not-met` ("Not met yet", name only)
  - [ ] 14.4 Test `displayTextPinned` (design test 16): `DISPLAY_TEXT` equals the approved strings exactly; `lines.ts` has `end-close` and `rare-invite` with the approved text and caption; the monster names are the twelve approved ones
  - [ ] 14.5 Test `newTextGuard` (design test 17): every `DISPLAY_TEXT` row, all twelve monster names, `end-close` and `rare-invite` contain no word of the core banned list (prevent, cure, cavity-free, guarantee, diagnose, clinic, doctor, almost, lost, lose, failed, missed) and none of again, tomorrow, "come back", streak, hurry, blood, gore, kill, die, dead, hurt, scream, matched as whole words. Do not apply the camera-and-light rule. The matcher passes "Twilight Toffee Wraith" and "Midnight Molar Ghoul", flags "die" in "Do not die" and does not flag "Diet"
  - [ ] 14.6 Nothing shows the new text yet. The game is unchanged
  - _Requirements: 1.3, 7.4, 8.1, 9.2, 10.9, 14.1, 14.2, 14.3, 14.4, 14.5, 15.7_
  - Test file: `tests/existing-lines-pinned.test.ts`, `tests/display-text.test.ts`, `tests/new-text-guard.test.ts`
  - Files this task may change: `src/audio/lines.ts`, `src/ui/display-text.ts`, and the three new test files

- [ ] 15. **Tap targets and title controls (pure)**
  - [ ] 15.1 Create `src/ui/tap-targets.ts` with `TapTargetId`, `TapTarget` and `TAP_TARGETS` (design section 5.5 starting values: `start` 160 x 72, `titleBook` 128 x 52, `parent` 48 x 48, `bookCell` 72 x 72, `bookBack` 96 x 48, `endDone` 160 x 72, `endBook` 128 x 56)
  - [ ] 15.2 Create `src/ui/title-model.ts` with `titleControls(hasParentHandler)` returning the controls in design section 5.5: one `large` start control, one `small` Book control, and a `quiet` parent control only when a handler exists. Every control has an icon and a text id
  - [ ] 15.3 Nothing uses the files yet. The game is unchanged
  - [ ] 15.4 Test `tapTargets` (design test 22): every entry is at least 48 x 48; `titleBook` is smaller than `start` in width and in height; `parent` is smaller than `titleBook` in both; `start` equals the `min-width` and `min-height` of `.big-button` in `src/ui/styles.css` (read the file)
  - [ ] 15.5 Test `titleModel` (design test 21): exactly one `large` control and it is `start`; one `small` control, `book`; the parent control is `quiet` and present only with a handler; each control has an icon and a text id; no control id or text id mentions sound, mute or volume; `privacy` is a `DISPLAY_TEXT` entry of kind `shown`
  - _Requirements: 1.1, 1.2, 1.8, 2.1, 2.2, 7.7, 9.3, 10.11, 11.4, 15.9_
  - Test file: `tests/tap-targets.test.ts`, `tests/title-model.test.ts`
  - Files this task may change: `src/ui/tap-targets.ts`, `src/ui/title-model.ts`, and the two new test files

- [ ] 16. **Monster Book model (pure)**
  - [ ] 16.1 Create `src/ui/book-model.ts` with `BookEntry`, `BookView`, `BookTapAction`, `monsterBookView(sessions)`, `bookViewFromLoader(load)` and `bookTapAction(entry)` as in design section 5.7. `owned` comes only from `computeMonsterBook(sessions).unlockedIds`. The model takes no date and no time of day
  - [ ] 16.2 Nothing uses the file yet. The game is unchanged
  - [ ] 16.3 Test `monsterBookView` (design test 9): always twelve entries in table order (8 common, then 4 rare); `owned` exactly when the id is in `computeMonsterBook(sessions).unlockedIds`; not-owned entries have `name` null; `rare` is true for rares whether owned or not; `invite` is true exactly for rares not owned; `showRareInvitation` is true exactly when some rare is not owned; the result is the same for any order of the sessions and any dates and times of day with the same earned monsters; empty sessions give twelve silhouettes; an unknown id in `monstersEarned` changes nothing
  - [ ] 16.4 Test `bookFromLoader` (design test 10): a loader that returns sessions gives the same as `monsterBookView`; a loader that throws gives twelve silhouettes and does not throw
  - [ ] 16.5 Test `bookTapAction`: owned gives `say-name` with the name; a rare not owned gives `say-line` `rare-invite`; a common not owned gives `none`
  - _Requirements: 7.1, 7.2, 7.5, 7.6, 8.1, 8.3, 8.4, 15.3_
  - Test file: `tests/book-model.test.ts`
  - Files this task may change: `src/ui/book-model.ts`, `tests/book-model.test.ts`

- [ ] 17. **Speaking monster names: `sayText` and book speech**
  - [ ] 17.1 In `src/audio/speaker.ts` add `TextSpeaker { sayText(text) }` and make `createBrowserSpeaker` return `Speaker & TextSpeaker`. `sayText` cancels what is being said, picks a voice with the existing `pickLocalVoice` and speaks the text with the existing gentle ramp. With no local voice it does nothing. `Speaker`, `silentSpeaker`, `rampGain`, `GAIN_LEVEL`, `GAIN_STEP_PER_MS` and `CLIP_LINE_IDS` are not changed, and the existing `speaker.test.ts` passes unchanged
  - [ ] 17.2 Create `src/ui/book-speech.ts`: `createBookSpeech(speaker)` runs a `BookTapAction`. `say-name` calls `speaker.stop()` then `speaker.sayText(name)`; `say-line` calls `speaker.stop()` then `speaker.say('rare-invite')`; `none` does nothing. A new tap therefore replaces what is being said. No DOM
  - [ ] 17.3 If the audio kit from task 13 returns a speaker without `sayText`, extend `src/audio/audio-kit.ts` so its speaker also has `sayText` and its `stop()` still stops the sounds
  - [ ] 17.4 Test `bookSpeech` (design test 11), with a fake speaker that records `stop`, `say` and `sayText`: an owned tap calls `stop` then `sayText(name)` once; a second tap calls `stop` again before it; a not-owned tap never calls `sayText`; a rare silhouette says `rare-invite`; a common silhouette says nothing
  - [ ] 17.5 Test: `sayText` with no local voice does not throw (use the existing fake speech-synthesis pattern of `speaker.test.ts`, copied into the new test)
  - _Requirements: 7.4, 7.5, 8.1, 10.8, 10.9, 15.9_
  - Test file: `tests/book-speech.test.ts`
  - Files this task may change: `src/audio/speaker.ts`, `src/audio/audio-kit.ts`, `src/ui/book-speech.ts`, `tests/book-speech.test.ts`

- [ ] 18. **Monster Book screen (built, not yet reachable)**
  - [ ] 18.1 Create `src/ui/monster-book-screen.ts`: `createMonsterBookScreen(deps)` with `open()` and `close()`. `open()` reads the sessions through `bookViewFromLoader(deps.loadSessions)` each time. It builds the structure in design section 5.7: a header with one back button (icon, "Back", accessible name, `TAP_TARGETS.bookBack`) and the heading "Monster Book"; a common grid and a rare grid; a caption line with `aria-live="polite"`
  - [ ] 18.2 An owned cell is a `<button>` with `drawMonster` and the name as visible text; a tap runs `createBookSpeech(...)` and shows the same words in the caption. A not-owned cell shows `drawSilhouette` with accessible name "Not met yet" and no name; a rare silhouette is a `<button>` that speaks `rare-invite`, a common silhouette is a non-interactive `role="img"` element. The rare invitation "Brush morning AND night." shows once under the rare grid while `showRareInvitation` is true and is not shown when all four rares are owned
  - [ ] 18.3 In `src/ui/screens.css` add the Book styles: `book-cell` at `TAP_TARGETS.bookCell` size with a `:focus-visible` rule, `auto-fit` grids with `minmax(72px, 1fr)`, `overflow-y: auto` so the screen scrolls when it is taller than the window, and a fade-in. The Book creates no frame and takes no camera input
  - [ ] 18.4 Nothing opens the Book yet. The game is unchanged
  - [ ] 18.5 Test `bookScreenIsReadOnly` (design test 30, Book part): the source of `monster-book-screen.ts` contains no `saveSession`, `setItem`, `localStorage`, `import(`, `getUserMedia`, `setTimeout`, `setInterval`, and no import of `src/tracking/`, `mirror-frame` or `frame-guidance`; it calls `bookViewFromLoader`; it contains no padlock, cross or number in the silhouette code
  - [ ] 18.6 The `cssGuards` test from task 5 passes on the filled `screens.css`
  - _Requirements: 5.4, 7.1, 7.3, 7.4, 7.5, 7.6, 7.7, 7.10, 8.1, 8.2, 8.3, 11.4, 12.2, 12.3_
  - Test file: `tests/monster-book-screen.test.ts`
  - Files this task may change: `src/ui/monster-book-screen.ts`, `src/ui/screens.css`, `tests/monster-book-screen.test.ts`

- [ ] 19. **Title panel: one large start button, a smaller Monster Book button, privacy line**
  - [ ] 19.1 Create `src/ui/title-panel.ts`: builds the panel from `titleControls(...)` with the game name, the large start button (existing icon, label and `start` line, unchanged), the smaller Monster Book button (icon, visible label from `DISPLAY_TEXT['book-title']`, accessible name, `TAP_TARGETS.titleBook`), the privacy line as visible text from `DISPLAY_TEXT['privacy']`, and the quiet parent control (icon, accessible name "Grown-ups", 48 px) only when `onOpenParent` is passed. Sizes are applied with `style.minWidth` and `style.minHeight`
  - [ ] 19.2 The Book button's tap calls `speaker.unlock()` and then the `onOpenBook` handler passed in. It does not call `onStart`, the camera or a session. The start tap keeps its behaviour. The panel has no form, no sign-up, no install prompt, no countdown, no sound before the first tap, and no mute control
  - [ ] 19.3 In `src/ui/session-screen.ts` build the start screen with `title-panel.ts`, and add optional `onOpenBook` and `onOpenParent` to its dependencies. When `onOpenBook` is not passed, the Book button is not shown, so the game is unchanged until task 20. `main.ts` passes neither handler in this task
  - [ ] 19.4 In `src/ui/screens.css` add the title panel styles: portrait single column, controls in the lower half, a `small-button` and an `icon-button` with `:focus-visible` rules, and a fade-in
  - [ ] 19.5 Test `titlePanelSource` (design test 30, title part): the source of `title-panel.ts` contains no `getUserMedia`, `import(`, `beforeinstallprompt`, `setTimeout`, `setInterval`, `fetch`, `setItem`, `localStorage`, and no import of `src/tracking/`; it reads text only from `DISPLAY_TEXT` and `lines.ts`; no string in it mentions mute, sound off or volume
  - [ ] 19.6 The `cssGuards` test passes on the filled `screens.css`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.7, 1.8, 2.1, 2.2, 2.3, 10.11, 11.4_
  - Test file: `tests/title-panel.test.ts`
  - Files this task may change: `src/ui/title-panel.ts`, `src/ui/session-screen.ts`, `src/ui/screens.css`, `tests/title-panel.test.ts`

- [ ] 20. **Open the Monster Book from the title screen**
  - [ ] 20.1 In `src/main.ts` create the Book screen with `loadSessions` from the existing storage object, and pass `onOpenBook` to the session screen. Remember where the Book was opened from. Its Back button returns to the title screen. Opening the Book unlocks sound and does not start the camera or a session
  - [ ] 20.2 Do not pass `onOpenParent`; the `parent-screen` spec provides it later
  - [ ] 20.3 Check by hand (M3 title part, M9 Book part, M5 Book part): `npm run dev`. At 360 x 640 in browser dev tools, the title screen shows the large start button, the smaller Monster Book button and the privacy line "The camera stays on this phone. Nothing is saved or sent." without scrolling. Tap Monster Book: with no sessions, twelve silhouettes with no names, the four rare ones with a star, and the line "Brush morning AND night." under them. Tap a rare silhouette: the line is spoken and captioned. Tap a common silhouette: nothing is said. Play one session, return to the Book: the four monsters of that session show with names; tap one: its name is spoken and captioned, and a quick second tap on another replaces the first. Back returns to the title screen
  - [ ] 20.4 Check by hand (M10, title and Book part): in the browser Network panel, opening the title screen and the Book makes no request except the same-origin page files, and loads no model, font or image
  - _Requirements: 1.8, 7.8, 7.9, 7.10, 1.5_
  - Test file: none new (the model, speech and screen sources are tested in tasks 16 to 19; the privacy guard, `csp.test.ts` and `build-output.test.ts` must still pass)
  - Files this task may change: `src/main.ts`

- [ ] 21. **End card: closing line, outcomes, Monster Book button**
  - [ ] 21.1 First write `tests/end-lines.test.ts` (design test 19) and `tests/end-card-source.test.ts` (design test 20), then change the code until they pass
  - [ ] 21.2 Create `src/ui/end-lines.ts` with `END_LINE_IDS = ['end', 'end-close']` and `speakEnd(speaker)`, which calls `say('end')` and then `say('end-close')`. The `end` line is unchanged. Both captions are shown together, `end` first
  - [ ] 21.3 In `src/ui/end-card.ts` use `speakEnd`; accept an optional `outcomes` argument (`show(defs, outcomes?)`) and give each item a class for its outcome (`end-card__item--defeated`, `--fled`, `--trapped`); draw each with `drawMonster`; play the `end` sound after `speaker.stop()`; add exactly two buttons, each with an icon, label and accessible name: the existing big "Done" button (`TAP_TARGETS.endDone`) back to the title screen, and a smaller "Monster Book" button (`TAP_TARGETS.endBook`) that calls `speaker.unlock()` and an `onOpenBook` handler. Add `unhide()`, which shows the card again without speaking or playing anything. There is no "again", "next" or "play" button and no score, streak or timer
  - [ ] 21.4 In `src/ui/screens.css` add the end-card styles: both buttons visible at 360 x 640, a one-shot "into the Book" movement of `ONE_SHOT_MS.intoBook` that `.fx-no-book` turns into a plain fade, and `:focus-visible` rules
  - [ ] 21.5 In `src/main.ts` pass `state.monsters[i].outcome` to the end card, open the Book from the end card (remember `'end'`), and make Back call `endCard.unhide()` in that case. The end card is shown from `onEnded`, after the camera has stopped, as it is now
  - [ ] 21.6 Test `endLines`: `speakEnd` calls `say('end')` then `say('end-close')`, once each, in that order; `CLIP_LINE_IDS` holds neither id (so a clip cannot cut the second line)
  - [ ] 21.7 Test `endCardNoUrging`: the source of `end-card.ts` creates exactly two buttons; has no string literal containing again, next, tomorrow, "come back", streak, score or timer; and no button calls `onStart`
  - [ ] 21.8 Check by hand (M3 end-card part, M2): `npm run dev`, play a full session. The end card shows the four monsters going into the Book, then hears "end" and then "Two minutes. Every corner."; two buttons, both visible at 360 x 640; nothing urges another game. Tap Monster Book, then Back: the end card is shown again and says nothing. Tap Done: the title screen shows
  - _Requirements: 7.8, 7.9, 9.1, 9.2, 9.3, 9.4, 9.5, 10.4, 11.3, 11.4, 15.9_
  - Test file: `tests/end-lines.test.ts`, `tests/end-card-source.test.ts`
  - Files this task may change: `src/ui/end-lines.ts`, `src/ui/end-card.ts`, `src/ui/screens.css`, `src/main.ts`, and the two new test files

- [ ] 22. **Comfort and access: captions, focus, landscape**
  - [ ] 22.1 In `src/ui/styles.css` add (do not edit the rules that `camera-preview.test.ts` reads) the variables `--caption-fg` and `--caption-bg` as 6-digit hex colours with a contrast ratio of at least 4.5, and make the caption sit on an opaque plate of `--caption-bg`, outside the frame and above the fog
  - [ ] 22.2 In `frame.css` and `screens.css` make the frame width `min(100%, 480px)`, shrink the ring in short landscape, and keep the preview `max-height: 60dvh`. Nothing shows a "rotate your device" message
  - [ ] 22.3 Make sure every interactive class (`big-button`, `small-button`, `icon-button`, `book-cell`) has a visible `:focus-visible` outline
  - [ ] 22.4 Test `captionContrast` (design test 23): `--caption-fg` and `--caption-bg` are 6-digit hex; their contrast ratio, computed by the standard relative-luminance formula, is at least 4.5
  - [ ] 22.5 The `cssGuards` test from task 5 and the existing `camera-preview.test.ts` still pass
  - [ ] 22.6 Check by hand (M6, reduced motion): turn on "reduce motion" in the device or browser settings, also while a session runs. The candle flicker, fog drift, smoke drift, leaving animations and the end-card movement stop. The lit corner and its candle remain, the monster still changes size with its health, and the smoke still thins
  - [ ] 22.7 Check by hand (M7, keyboard and screen reader): on a desktop, Tab through the title screen, the Book and the end card: every control shows a visible focus mark and works with Enter. With a screen reader on, the frame is silent and the caption is read
  - [ ] 22.8 Check by hand (M8, landscape and desktop): rotate the phone sideways and open the game on a laptop: no rotate message, and the preview, caption, countdown and buttons are not clipped; the Book grid reflows and scrolls
  - _Requirements: 4.5, 11.3, 11.4, 11.6, 11.7, 11.8, 12.1, 12.2, 12.3_
  - Test file: `tests/caption-contrast.test.ts`
  - Files this task may change: `src/ui/styles.css`, `src/ui/frame.css`, `src/ui/screens.css`, `tests/caption-contrast.test.ts`

- [ ] 23. **Whole-spec guards**
  - [ ] 23.1 Write `tests/mirror-screens-guards.test.ts` only. No source file changes. If a guard fails, fix the source file named by the failure in a follow-up run, not in this task
  - [ ] 23.2 Test `noNewTimers` (design test 26): across every file under `src/`, `setInterval` and `setTimeout` appear only in `src/main.ts` (the existing scheduler adapter and its existing count) and in the files that already had them before this spec (`src/ui/game-loop.ts` and any existing speaker or tracking file the test lists by name); `requestAnimationFrame` appears nowhere in the new files
  - [ ] 23.3 Test `pureFilesAreClean` (design test 27): the nine pure files (`frame-guidance.ts`, `effects.ts`, `monster-draw-state.ts`, `sound-cues.ts`, `monster-looks.ts`, `book-model.ts`, `title-model.ts`, `tap-targets.ts`, `display-text.ts`) plus `src/audio/sounds.ts` contain no `document`, `window`, `Date`, `performance`, `Math.random`, `setTimeout`, `localStorage`, and no import from `src/tracking/`; nothing under `src/logic/` imports from any of them
  - [ ] 23.4 Test `drawValueStaysInPreview` (design test 28): `DrawValue` and `draw-value` appear only in `src/tracking/`, `camera-preview.ts`, `monster-anchor.ts` and `main.ts`
  - [ ] 23.5 Test `noExternalAssets` (design test 29, code part): the new TS files contain no `<style`, no `style=` attribute string, no `innerHTML`, no `<img`, no `@font-face`; each audio file under `public/assets/`, if any exists, is named in `public/assets/NOTICE.txt`
  - [ ] 23.6 Test `noNewStorageNetworkOrLog`: no new file under `src/ui/` or `src/audio/` contains `fetch(`, `XMLHttpRequest`, `sendBeacon`, `WebSocket`, `document.cookie`, `localStorage`, `console.`, `toDataURL`, `getImageData`
  - [ ] 23.7 Test `existingSuite` (design test 31) by running the whole `npm run test:run`: every test that existed before this spec passes unchanged, in particular `view`, `lines`, `camera-preview`, `monster-anchor`, `privacy-guard`, `tracking-guards`, `csp`, `build-output`. Confirm with `git diff --stat` that no file under `tests/` that existed before task 1 was changed, and report the result
  - _Requirements: 6.7, 10.1, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 15.8, 15.10, 16.1, 16.2, 16.3_
  - Test file: `tests/mirror-screens-guards.test.ts`
  - Files this task may change: `tests/mirror-screens-guards.test.ts`

- [ ] 24. **Final manual checks and the speed result**
  - [ ] 24.1 Run `npm run test:run` and `npm run build` and report both results. Confirm that `dist/` still loads no model or WASM file from the title screen (`cameraCodeIsLazy` and `firstLoadUnder5MB` pass)
  - [ ] 24.2 Check by hand (M1, whole): play one timer-only and one camera session end to end. In each zone the lit corner, the lit candle, the spoken line and the monster agree; covering the face changes nothing about the glow
  - [ ] 24.3 Check by hand (M2, mood): watch a full session on a phone. Nothing appears suddenly or flashes, the cracks read as a pattern and not as a broken screen, there is no face in the fog, no screen shake, nothing looks scary to a 5-year-old
  - [ ] 24.4 Check by hand (M3, layout at 360 x 640): title screen (start, Monster Book, privacy line), end card (both buttons) and Book (all twelve cells reached by scrolling) fit; the phone is usable one-handed in portrait; the small parent control is not on the session screen or the end card
  - [ ] 24.5 Check by hand (M4, speed): on the 2022 mid-range Android phone in Chrome, play a camera session with all effects on and measure the frame rate. It must be 20 frames per second or more. Dr. Yatin or the person who runs the test writes one dated row in words in `docs/review/TRACKING-TEST-RESULTS.md`, section 7 (words only; no image, frame or landmark value). If the frame rate is below 20, stop and report; do not tick the sub-task
  - [ ] 24.6 Check by hand (M5, sounds): at medium volume nothing is sharp or loud; the voice is clear over the effects; the title screen is silent until the first tap; sound stops on pause and at the end
  - [ ] 24.7 Check by hand (M9, drawings): in the Book, all twelve monsters are easy to tell apart; none is scary; the four rare ones carry a star and a crest; a silhouette shows no name, padlock, cross or number
  - [ ] 24.8 Check by hand (M10, network): with the browser Network panel open, play a full session and visit the Book: the only requests are the same-origin page, script, stylesheet and, after the start tap in a camera session, the model and WASM files from this site. No request goes to another host, and no cookie or new storage key is set (the only key is `foamtom:v1`)
  - [ ] 24.9 Read the 19 approved lines in `requirements.md` against what appears on screen and in speech. Nothing else is shown or said by the new screens
  - _Requirements: 1.6, 1.7, 3.1, 3.6, 4.2, 4.7, 5.3, 6.3, 6.4, 7.5, 9.3, 10.2, 10.3, 10.6, 11.1, 11.6, 13.1, 13.5, 13.6, 14.1, 14.5_
  - Test file: none new (this task runs the whole suite and the manual checks; it changes no source file)
  - Files this task may change: `docs/review/TRACKING-TEST-RESULTS.md` (one dated row, section 7, words only)

---

Later specs, not in this file: `parent-screen` (the adult gate and the screen behind the small parent control, requirement 2). `hand-tracking` is a separate spec with its own task list.
