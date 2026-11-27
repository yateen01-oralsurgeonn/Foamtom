Debug-page EXPERIMENT 3: tell small circles from back-and-forth scrubbing. The game must not change.

Read first: every file in `.kiro/steering/`, then `.kiro/specs/hand-tracking/requirements.md`
(every "Decision" and "Experiment" section) and `design.md` (section 5), then
`src/tracking/types.ts`, `thresholds.ts`, `classify-frame.ts`, `aggregate-second.ts`,
`frame-window.ts`, `debug/tracking-debug.ts`, `debug/debug-draw.ts` and
`docs/review/TRACKING-TEST-RESULTS.md` (sections 9 and 10).

Background (27 Nov 2026, Dr. Yatin): children should be taught small, gentle circles on the
outer surfaces of the teeth. Long back-and-forth scrubbing along the gum line is the habit a
dentist wants to change. Today `moving` is only the path length of the hand in one second
(`aggregate-second.ts`), so a scrub counts exactly like circles. Each frame already carries
`handRel`: the hand point relative to the mouth, in face widths, along the face's own axes
(x across the face, y toward the chin). So the SHAPE of the last second's path can be measured
without any new tracking.

Dr. Yatin's decision, 27 Nov 2026: test whether the shape of the hand path can tell circles from
scrubbing. This is an experiment on the debug page only. The game, `aggregate-second.ts`,
`MOVING_MIN_TRAVEL`, `REQUIRE_SIDE_MATCH`, `REQUIRE_LEVEL_MATCH`, `HAND_POINT` and
`TRACK_MIN_INTERVAL_MS` do not change. No child-facing or parent-facing text is added.

Build this:

1. `src/tracking/stroke-shape.ts` (new, pure functions, no DOM, no clock, no `Math.random`, NOT
   imported by the game):
   - `strokeShape(points: readonly Point[]): StrokeShape` where `points` are the non-null
     `handRel` values of the frames of the last second, in time order, and
     `StrokeShape = { kind: 'circles' | 'scrub' | 'unclear', roundness: number,
     axisAngleDeg: number, reversalShare: number, points: number }`.
   - Steps between neighbouring points shorter than `MOVE_JITTER_STEP` are dropped first (they
     are camera noise, as in `aggregate-second.ts`). Reuse that constant; do not copy it.
   - `roundness`: square root of (smaller eigenvalue / larger eigenvalue) of the 2x2 covariance
     of the points. 1 = round cloud, 0 = a straight line. 0 when the larger eigenvalue is 0.
   - `axisAngleDeg`: angle between the long axis (eigenvector of the larger eigenvalue) and the
     face's x axis, folded into 0 to 90. 0 = along the face (side to side), 90 = up and down.
   - `reversalShare`: among the turns between consecutive remaining steps, the share whose
     direction changes by more than `STROKE_REVERSAL_DEG`. Back-and-forth gives many reversals;
     circles give few.
   - `kind`: `'unclear'` when fewer than `STROKE_MIN_POINTS` points remain or the total path is
     not more than `MOVING_MIN_TRAVEL`. Else `'circles'` when roundness >= `CIRCLE_MIN_ROUNDNESS`
     and reversalShare < `CIRCLE_MAX_REVERSAL_SHARE`. Else `'scrub'` when roundness <
     `SCRUB_MAX_ROUNDNESS` or reversalShare >= `SCRUB_MIN_REVERSAL_SHARE`. Else `'unclear'`.
   - Add to `thresholds.ts`, each with a doc comment saying it is a starting value for the debug
     page, not a dental rule, and the game does not use it: `STROKE_MIN_POINTS = 5`,
     `STROKE_REVERSAL_DEG = 135`, `CIRCLE_MIN_ROUNDNESS = 0.4`, `CIRCLE_MAX_REVERSAL_SHARE = 0.3`,
     `SCRUB_MAX_ROUNDNESS = 0.25`, `SCRUB_MIN_REVERSAL_SHARE = 0.5`.
2. `debug/tracking-debug.ts` (+ `.html` if needed):
   - Under the calibration result, a big line every frame with the stroke shape of the last
     second, for the palm point: for example `CIRCLES  round 0.62  angle 12°  rev 0.10  pts 9`,
     or `SCRUB ...`, or `unclear ...`. Show `pts` so we can see whether there are enough frames.
   - Show the measured tracking rate (frames sent to the tracker in the last second) as
     `fps N` on the same line.
   - A debug-page-only URL option `?interval=NN` (milliseconds, clamped to 33..100, default
     `TRACK_MIN_INTERVAL_MS`) that replaces the interval used at line ~248. It must not touch
     `thresholds.ts` or `camera-source.ts`; the game keeps 100 ms.
   - Draw the last second of the palm point as a thin trail on the canvas (a fading line), so
     circles and scrubbing can be seen by eye in a screenshot.
   - Keep the whole readout visible on a 1366x768 laptop screen without scrolling.
   - Nothing is stored, sent, logged or exported. Everything stays in memory.
3. Tests in `tests/`: a synthetic circle (12 points round a centre, radius 0.15) gives `circles`;
   a synthetic side-to-side scrub (12 points going back and forth along x, amplitude 0.2, tiny y
   noise from a fixed list, not random) gives `scrub` with axisAngleDeg < 20; an up-and-down
   scrub gives `scrub` with axisAngleDeg > 70; fewer than STROKE_MIN_POINTS points or a hand
   standing still gives `unclear`. Property tests (fast-check): moving every point by the same
   offset, scaling every point about the centre by the same factor above 1 (so no step drops
   below the jitter step), or reversing the order of the points never changes `kind`.
4. `.kiro/specs/hand-tracking/requirements.md`: add "Experiment 3, 27 Nov 2026" after
   "Experiment 2, 26 Nov 2026": what is measured (the three numbers above), that it is the debug
   page only, memory only, that the game is unchanged until Dr. Yatin's test decides, and the
   pass rule below. Change nothing else in `.kiro/`.
5. `docs/review/TRACKING-TEST-RESULTS.md`: add "## 11. Circles or scrubbing (27 Nov 2026)": how to
   run it (brush each row 4 seconds, then take the screenshot while still brushing), and an empty
   table: Date | Interval (ms) | Brush hand | Zone | How brushed | Shape (3 tries) | fps | Result |
   Note. Codes for Shape: R = read what was brushed, W = read the other one, U = unclear,
   N = null. Rows (same-side hand, outer surface unless said):
   Right hand / Upper right / Small circles; Right hand / Upper right / Side-to-side scrub;
   Left hand / Lower left / Small circles; Left hand / Lower left / Side-to-side scrub;
   Right hand / Front teeth / Small circles; Right hand / Front teeth / Side-to-side scrub;
   Right hand / Upper left (cross-face) / Small circles; Right hand / Upper left (cross-face) /
   Side-to-side scrub; Right hand / Lower right / Chewing surface, short back-and-forth.
   Pass rule: every circles row and every scrub row is R on at least 2 of 3 tries, and no scrub
   row reads CIRCLES more than once. The chewing-surface row is information only (it shows
   what the game must NOT nag about).

Rules: change only the files named above. No network calls, no new npm packages. The debug page
must stay out of `dist`, and the game bundle must not import `stroke-shape.ts` (the build guard
checks the first; check the second by searching `dist` after the build). Kid safety and privacy
override everything. If anything conflicts with a steering file or the spec, STOP, say exactly
what, and change nothing.

Finish with `npm run test:run` then `npm run build`. If either fails after two attempts, STOP and
report. Then print the files you changed and the last lines of the test and build output.
