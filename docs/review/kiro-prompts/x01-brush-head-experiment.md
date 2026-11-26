Debug-page EXPERIMENT for the side check. The game must not change.

Read first: every file in `.kiro/steering/`, then `.kiro/specs/hand-tracking/requirements.md`
(1.12, 1.13 and the "Decision, 21 Nov 2026" and "Decision 2, 21 Nov 2026" sections) and
`design.md` (section 5), then `src/tracking/types.ts`, `thresholds.ts`, `classify-frame.ts`,
`debug/tracking-debug.ts` and `docs/review/TRACKING-TEST-RESULTS.md`.

Background: on 21 Nov the side check failed because `side` comes from the PALM, and when the
right hand reaches across the face to the lower left teeth, the palm stays right of the mouth.
Dr. Yatin's idea, 26 Nov 2026: in a fist grip the toothbrush comes out of the THUMB side of the
hand. So estimate the brush head instead of the palm: start at the index knuckle (landmark 5)
and go further along the line from the little-finger knuckle (landmark 17) to the index knuckle
(landmark 5). When the hand reaches across the face, that line points across the mouth too.
This is a hypothesis. Only Dr. Yatin's brushing test can say if it works.

Do this:

1. `src/tracking/types.ts`: add `'brush-head'` to `HandPointKind`.
2. `src/tracking/thresholds.ts`: add `BRUSH_HEAD_REACH = 1.0` with a doc comment: how far past
   the index knuckle the brush head is estimated, in units of the hand's knuckle width (the
   distance from landmark 17 to landmark 5). Say it is a starting value for the debug page,
   not a dental rule. Do NOT change `HAND_POINT`: the game keeps using `'palm'`.
3. `src/tracking/classify-frame.ts`: `selectHandPoint` returns the brush-head estimate for
   `'brush-head'`: point = landmark 5 + BRUSH_HEAD_REACH x (landmark 5 - landmark 17).
   Do this arithmetic in the same aspect-corrected unit that `classifyFrame` uses (x times
   aspect), so the direction is not bent on a wide camera, then return the point in the
   function's usual raw coordinates. Change the function signature only as much as that needs,
   and keep every existing caller working the same way for 'palm', 'wrist' and 'fingertips'.
4. `debug/tracking-debug.ts`: show `'brush-head'` as a fourth hand point next to palm, wrist
   and fingertips (its side, level and handNearMouth), and draw its point on the preview in a
   different colour from the palm point, so Dr. Yatin can see where the estimate lands.
5. Tests in `tests/`: (a) a hand lying flat with the index knuckle to the left of the little-
   finger knuckle gives a brush-head point further left than the index knuckle; (b) the same
   hand on a 16:9 frame gives the same direction as on a square frame (aspect handled);
   (c) palm, wrist and fingertips results are unchanged (existing tests keep passing).
6. `.kiro/specs/hand-tracking/requirements.md`: add a section "Experiment, 26 Nov 2026" after
   "Decision 2, 21 Nov 2026": the brush-head estimate, why, that it is shown on the debug page
   only, that `REQUIRE_SIDE_MATCH` and `REQUIRE_LEVEL_MATCH` stay `false` and `HAND_POINT` stays
   `'palm'` until Dr. Yatin's test decides. Change nothing else in `.kiro/`.
7. `docs/review/TRACKING-TEST-RESULTS.md`: add a section "7. Brush-head experiment (26 Nov
   2026)" with an empty table for Dr. Yatin to fill, columns: Date | Brush hand | Zone | Surface |
   Palm side | Brush-head side | Brush-head level | Result | Note. Rows (side check, 3 tries each,
   codes as in the file): Right hand / Lower left / Outer; Right hand / Upper left / Outer;
   Left hand / Lower right / Outer; Left hand / Upper right / Outer; Right hand / Lower right /
   Outer (same-side control); Left hand / Lower left / Outer (same-side control). Then two
   level rows: Right hand / Upper right / Chewing; Right hand / Lower right / Chewing.

Rules: change only the files named above. No network calls, no new npm packages. Nothing new
may reach the published site except the type and threshold additions; the debug page must stay
out of `dist` (the build guard checks this). If anything here conflicts with a steering file or
the spec, STOP, say exactly what, and change nothing.

Finish with `npm run test:run` then `npm run build`. If either fails after two attempts, STOP
and report. Then print the files you changed and the last lines of the test and build output.
