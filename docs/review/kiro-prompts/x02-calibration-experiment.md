Debug-page EXPERIMENT: per-child calibration of the four zones. The game must not change.

Read first: every file in `.kiro/steering/`, then `.kiro/specs/hand-tracking/requirements.md`
(1.12, 1.13 and every "Decision" and "Experiment" section) and `design.md` (section 5), then
`src/tracking/types.ts`, `thresholds.ts`, `classify-frame.ts`, `landmark-adapters.ts`,
`aggregate-second.ts`, `debug/tracking-debug.ts`, `debug/debug-draw.ts` and
`docs/review/TRACKING-TEST-RESULTS.md` (sections 3, 4 and 9).

Background (26 Nov 2026, Dr. Yatin's test, eight screenshots): with the same-side hand, palm side
and level were right in 8 of 8. But `side` really reports WHICH HAND is at the mouth, not which
teeth: a right hand reaching across to the left teeth still reads `right`. The brush-head
estimate of section 9 also failed: its point lands beside the knuckles, not on the brush, because
in a real grip the brush leaves along the fingers. Every child holds the brush differently.

Dr. Yatin's decision, 26 Nov 2026: test PER-CHILD CALIBRATION. The child first brushes each zone
for a few seconds while the page learns how THAT child's hand looks for that zone (any hand, any
grip, cross-face included). Then, during brushing, the page compares each frame with what it
learned and says which zone it looks like. This is an experiment on the debug page only. The game,
`REQUIRE_SIDE_MATCH`, `REQUIRE_LEVEL_MATCH` and `HAND_POINT` do not change.

Build this:

1. `src/tracking/calibration.ts` (new, pure functions, no DOM, no clock, no `Math.random`, not
   imported by the game):
   - `handFeatures(input: FrameInput, aspect): number[] | null`: for the largest face and the hand
     nearest the mouth (the same choices `classifyFrame` makes, reuse its helpers rather than
     copying them), return the positions of the wrist (0), index knuckle (5), middle knuckle (9),
     little-finger knuckle (17) and middle fingertip (12), each RELATIVE to the mouth centre and
     divided by the face width, in the face's own axes (the same `ux/uy/vx/vy` frame
     `classifyFrame` uses), plus the hand's handedness if MediaPipe gives it (+1 / -1, else 0).
     Return null when there is no face, no hand, or the hand is not near the mouth.
   - `type ZoneId = 'upper-right' | 'upper-left' | 'lower-left' | 'lower-right'` (reuse the
     game's zone type if one exists) and `type CalibrationSet = { zone, features }[]`.
   - `classifyByCalibration(set, features, k): { zone, votes } | null`: k nearest neighbours
     (Euclidean) over every stored frame; majority zone and its vote count; null if the set has
     fewer than k frames.
   - `zoneOverWindow(results): { zone, share } | null`: the majority zone over the frames of the
     last second and the share of frames that agree.
   - Add `CALIBRATION_K = 7`, `CALIBRATION_SECONDS_PER_ZONE = 5` and
     `CALIBRATION_LEAD_IN_SECONDS = 3` to `thresholds.ts` with doc comments saying they are
     starting values for the debug page, not dental rules.
2. If handedness is needed: add an OPTIONAL `handedness?: 'Left' | 'Right'` to the hand input type
   and fill it in `landmark-adapters.ts` from the MediaPipe result. Additive only; every existing
   test must pass unchanged.
3. `debug/tracking-debug.ts` (+ `.html` if needed): a "Calibrate" button and a "Reset" button.
   - Calibrate runs a guided sequence for the four zones in the game's order (upper right, upper
     left, lower left, lower right): for each zone, a big caption "Get ready: brush UPPER RIGHT"
     with a countdown of CALIBRATION_LEAD_IN_SECONDS, then "Brushing UPPER RIGHT" for
     CALIBRATION_SECONDS_PER_ZONE seconds while frames with features are collected for that zone,
     with the count shown. Speak the instruction with the browser's local speech voice if one is
     available (no network voice); captions are enough if not.
   - Pressing Calibrate again ADDS another round (for example with the other hand); Reset clears.
   - After calibration, show in big text, every frame, the zone the calibration says
     (`zoneOverWindow` of the last second) and the share, for example "UPPER LEFT 6/7", next to the
     palm side and level that are already shown. Show "calibrate first" before any calibration.
   - Keep the page readable on a 1366x768 laptop screen WITHOUT scrolling: put the calibration
     result at the top of the readout, and make the hand-point rows smaller so all of them fit.
     Do not draw the brush-head point any more (keep the code; just leave it out of the drawing).
   - Everything stays in memory. Nothing is stored, sent, logged or exported. Calibration data is
     dropped when the tab closes or Reset is pressed.
4. Tests in `tests/`: `handFeatures` gives the same numbers for the same hand on a square and a
   16:9 frame (aspect handled) and null without a face or with a far hand; `classifyByCalibration`
   picks the right zone for a point near one cluster of a synthetic set, returns null for a set
   smaller than k, and does not depend on the order of the set; `zoneOverWindow` majority and
   share. A property test (fast-check): moving a whole synthetic set and the query by the same
   offset never changes the answer.
5. `.kiro/specs/hand-tracking/requirements.md`: add "Experiment 2, 26 Nov 2026" after "Experiment,
   26 Nov 2026": the brush-head estimate failed (facts above); per-child calibration is tested on
   the debug page only; it keeps camera data in memory only; the game is unchanged until Dr.
   Yatin's test decides (pass rule: in every cross-face row, the calibrated zone is right on at
   least 2 of 3 tries). Change nothing else in `.kiro/`.
6. `docs/review/TRACKING-TEST-RESULTS.md`: under section 9 add one line "Result 26 Nov 2026: failed:
   the orange point lands beside the knuckles, not on the brush (8 screenshots, same-side hand)."
   Then add "## 10. Calibration experiment (26 Nov 2026)": how to run it (Calibrate, brush each
   zone the way you normally do, then test), and an empty table: Date | Calibration (hands used) |
   Brush hand | Zone | Surface | Calibrated zone (3 tries) | Palm side (3 tries) | Result | Note.
   Rows: Right hand / Upper left / Outer; Right hand / Lower left / Outer; Left hand / Upper right
   / Outer; Left hand / Lower right / Outer (all four cross-face); Right hand / Upper right / Outer;
   Right hand / Lower right / Chewing; Left hand / Lower left / Outer; Left hand / Upper left /
   Chewing (controls).

Rules: change only the files named above. No network calls, no new npm packages. The debug page
must stay out of `dist` and the game bundle must not import `calibration.ts` (the build guard
checks the first; check the second by searching `dist` after the build). Kid safety and privacy
override everything. If anything conflicts with a steering file or the spec, STOP, say exactly
what, and change nothing.

Finish with `npm run test:run` then `npm run build`. If either fails after two attempts, STOP and
report. Then print the files you changed and the last lines of the test and build output.
