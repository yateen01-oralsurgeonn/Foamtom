# Tasks: hand-tracking

## Implementation plan

Eleven tasks. Task 1 is the feasibility test and is the only large one: it has eleven parts
(1A to 1K), and each part is one run. Task 2 does not start until Dr. Yatin has filled in
`docs/review/TRACKING-TEST-RESULTS.md` and written both verdicts (requirement 1.14).
Tasks 3 to 9 build the real camera source, the preview and the wiring. Task 10 is the manual
check on a real phone. Task 11 corrects one stale line in the README.

The game keeps working after every task. Nothing is wired into `src/main.ts` until task 9,
so tasks 1 to 8 change nothing a player can see. The camera is used only in a session that
starts in camera mode. Guided-timer mode is never changed.

### Rules for every task (and every part of task 1)

- One task (or one part of task 1) per run. One module, or two small ones, plus its tests.
  No task names more than about four files.
- Every task ends with `npm run test:run` and `npm run build` both passing.
- A task changes only the files it names under "Files this task may change". It never edits
  anything in `.kiro/`. `requirements.md` and `design.md` are not changed by any task.
- Tests are written in the same task as the code they test. Test helpers (arbitraries,
  fakes) live inside the test file that uses them, except hand-written fixtures, which live
  in `tests/fixtures/tracking/`.
- Fixtures are hand-written plain numbers. Nothing is ever captured from a camera
  (requirement 11.3).
- No task changes `src/logic/`. No task changes `REQUIRE_LEVEL_MATCH`; only Dr. Yatin does
  (requirement 1.12).
- No task writes `console.`, `setInterval` or `setTimeout` under `src/tracking/` or
  `debug/`, and none stores or exports a frame (requirements 9.1, 9.2).
- If a task meets a case marked "STOP" below, it stops and tells Dr. Yatin. It does not work
  around the problem.
- Where a task's code differs from `design.md` because the documentation check (part 1A)
  found a difference, the task follows the documentation and records the difference in
  `docs/review/MEDIAPIPE-DOC-CHECK.md`. `design.md` itself is updated outside this task list.

---

- [ ] 1. **Feasibility test: debug page and checklist**

  This task builds only what the debug page needs (requirement 1.14): the left and right
  conversion, the thresholds, the per-frame and per-second classification, the frame window,
  the landmark adapters, the MediaPipe loader, the page itself, and the results file.
  `camera-source.ts` (lifecycle), the preview and the monster placement are NOT built here.

  - [x] 1A. **Check MediaPipe against its documentation; install the package** (requirement 10.2)
    - [x] 1A.1 Run `npm install @mediapipe/tasks-vision` and note the installed version
    - [x] 1A.2 Read the documentation and the type definitions of that installed version, and write `docs/review/MEDIAPIPE-DOC-CHECK.md` (words only) with, for each item below, what the documentation says and whether `design.md` section 8.1 matches: the names and file formats of the hand landmarker, face detector and face landmarker models; the order of the 21 hand landmarks (0 wrist, 4 thumb tip, 8, 12, 16, 20 fingertips, 5, 9, 13, 17 knuckles); which keypoint of the face detector is the mouth and which two are the ears (and whether they are normalised 0 to 1); which landmark indices of the face mesh give the mouth centre and the two face edges; the name and signature of `detectForVideo`; the location of the WASM files inside the package; how to ask for the GPU delegate and the CPU delegate
    - [x] 1A.3 For every difference from `design.md`, write the corrected fact in the same file under the heading "Corrections to design.md". Do not edit `design.md`
    - [x] 1A.4 STOP if the face detector gives no usable mouth point and no two face-edge points, and the mesh is also unsuitable: tell Dr. Yatin
    - _Requirements: 6.2, 10.2_
    - Test file: none (documentation task). The existing privacy guard must still pass.
    - Files this task may change: `package.json`, `package-lock.json`, `docs/review/MEDIAPIPE-DOC-CHECK.md`

  - [x] 1B. **Left and right, types, thresholds** (requirements 2, 3.7)
    - [x] 1B.1 `src/tracking/side.ts`: `rawToChildSide(raw: 'raw-left' | 'raw-right'): Side`, the only place where left and right are swapped (design 5.1)
    - [x] 1B.2 `src/tracking/types.ts`: `Point`, `FaceInput`, `HandInput`, `FrameInput`, `HandPointKind`, `FrameResult`, `TimedFrame` as in design section 4. Import `Side`, `Level` and `BrushingSignal` from `src/logic/types.ts`; do not redefine them. `DrawValue` is NOT defined here (task 3)
    - [x] 1B.3 `src/tracking/thresholds.ts`: every constant of design section 5.5 (`NEAR_MOUTH_FACE_WIDTHS` 0.7, `SIDE_DEAD_ZONE` 0.10, `LEVEL_DEAD_ZONE` 0.10, `MIN_FRAMES_PER_SECOND` 5, `MIN_FACE_FRACTION` 0.5, `MOVING_MIN_TRAVEL` 0.30, `MOVE_JITTER_STEP` 0.01, `WINDOW_MS` 1000, `TRACK_MIN_INTERVAL_MS` 100, `HAND_POINT` `'palm'`, `FACE_MODEL` `'detector'`), each with a comment saying what it measures and its unit
    - [x] 1B.4 Test `rawToChildSideFixture` (design test 1): `'raw-right'` gives `left`, `'raw-left'` gives `right`. This is the first test written for the spec (requirement 2.4, 11.1). The `classifyFrame` half of this test is added in 1C
    - [x] 1B.5 Test that every constant of design 5.5 is exported from `thresholds.ts` with the stated start value and that `MIN_FRAMES_PER_SECOND` is 5 and `MIN_FACE_FRACTION` is 0.5 (the values that requirements 4.2 and 4.3 name). Do NOT pin the other start values, because they are tuned later
    - _Requirements: 2.1, 2.2, 2.4, 3.7, 4.2, 4.3, 11.1_
    - Test file: `tests/side.test.ts`, `tests/thresholds.test.ts`
    - Files this task may change: `src/tracking/side.ts`, `src/tracking/types.ts`, `src/tracking/thresholds.ts`, `tests/side.test.ts`, `tests/thresholds.test.ts`

  - [ ] 1C. **Per-frame classification** (requirements 3, 5, 11.1 to 11.4)
    - [ ] 1C.1 `src/tracking/classify-frame.ts`: `pickLargestFace`, `selectHandPoint(hand, kind)` (palm, wrist, fingertips as design 5.2; it uses `PALM_LANDMARKS`, `WRIST_LANDMARK` and `FINGERTIP_LANDMARKS` from `thresholds.ts`) and `classifyFrame(input, handPoint = HAND_POINT)` exactly as design 5.3. Every distance in face widths along the face's own axes; the only left and right swap is a call to `rawToChildSide`; no bare number other than 0, 1 and 2
    - [ ] 1C.2 `tests/fixtures/tracking/frames.ts`: first line `// hand-written`; hand-written plain numbers only: a face, a hand at each cheek, above, below, far away, no hand, no face, two hands near, a second face
    - [ ] 1C.3 Test `rawToChildSideFixture`, second half: `classifyFrame` on a hand on the raw right reads `left`, and on the raw left reads `right`. Put it in `tests/side.test.ts` so it stays with the first fixture test
    - [ ] 1C.4 Test `classifyFrameFixtures` (design test 2): `side` and `level` are `unknown` whenever `handNearMouth` is false; `faceSeen` is false with no face
    - [ ] 1C.5 Property tests, with a `frameArb` written inside the test file that builds a frame from face centre, face width, tilt and hand offsets in face widths: `distanceIndependence`, `mirrorSymmetry`, `rotationIndependence`, `deadZones` (including exactly on each edge: strict `<` gives `unknown`), `nearMouthExact` (including exactly `NEAR_MOUTH_FACE_WIDTHS`), `secondFaceIgnored`, `twoHandsRule`
    - [ ] 1C.6 Test `handPointKinds` (design test 18): the three means of design 5.2
    - [ ] 1C.7 `tests/tracking-source-rules.test.ts`: `onlyOneLeftRightSwap` (design test 19: `'raw-left'` and `'raw-right'` appear only in `side.ts` and as arguments in `classify-frame.ts` and `monster-anchor.ts`; no `? 'left' : 'right'` or the reverse outside `side.ts`, scanning `src/` and `debug/`); `thresholdsInOneFile` (design test 15, for the files that exist so far: `classify-frame.ts`); `fixturesAreHandWritten` (design test 29)
    - _Requirements: 2.1, 2.2, 2.4, 3.1 to 3.8, 5.1 to 5.5, 11.1 to 11.4 (a, b, c, d, h, i), 11.3_
    - Test file: `tests/classify-frame.test.ts`, `tests/side.test.ts`, `tests/tracking-source-rules.test.ts`
    - Files this task may change: `src/tracking/classify-frame.ts`, `src/tracking/thresholds.ts`, `tests/classify-frame.test.ts`, `tests/side.test.ts`, `tests/thresholds.test.ts`, `tests/tracking-source-rules.test.ts`, `tests/fixtures/tracking/frames.ts`
    - This part also adds three exports to `src/tracking/thresholds.ts`: `PALM_LANDMARKS = [0, 5, 9, 13, 17]`, `WRIST_LANDMARK = 0` and `FINGERTIP_LANDMARKS = [4, 8, 12, 16, 20]`, with a comment that they follow the MediaPipe hand landmark order. It also extends the 1B.5 test in `tests/thresholds.test.ts` so it checks that these three are exported. The rule "no numeric literal other than 0, 1, 2" in `classify-frame.ts` is unchanged

  - [ ] 1D. **One-second aggregation** (requirement 4)
    - [ ] 1D.1 `src/tracking/aggregate-second.ts`: `aggregateSecond(frames)` exactly as design 5.4 (strict majorities; `side` and `level` counted among the near-mouth frames only; `moving` from path length of `handRel`, steps under `MOVE_JITTER_STEP` ignored). No clock, no randomness
    - [ ] 1D.2 Test `aggregateNullRules` (design test 8): fewer than 5 frames gives `null`; a face seen in fewer than half gives `null` (exactly half is enough); otherwise never `null`
    - [ ] 1D.3 Test `aggregateMajority` (design test 9), including: dead-zone frames among the near frames can stop a majority; frames with the hand away never do; no near frame gives `unknown`
    - [ ] 1D.4 Test `aggregateMoving` (design test 10): still, jitter-only, a stroke of known length above and below `MOVING_MIN_TRAVEL`, and a head that moves with the hand adds nothing
    - [ ] 1D.5 Test `aggregateIsDeterministic` (design test 11): two calls and a copied array give equal results; the input is not changed
    - [ ] 1D.6 Test `signalShape` (design test 14): the output is `null` or has exactly the four keys of core requirement 5.1 with allowed values; `FrameResult` has no field naming a tooth
    - [ ] 1D.7 Extend `thresholdsInOneFile` in `tests/tracking-source-rules.test.ts` to cover `aggregate-second.ts`
    - _Requirements: 3.8, 4.1 to 4.6, 11.2, 11.4 (e, f, g, j)_
    - Test file: `tests/aggregate-second.test.ts`, `tests/tracking-source-rules.test.ts`
    - Files this task may change: `src/tracking/aggregate-second.ts`, `tests/aggregate-second.test.ts`, `tests/tracking-source-rules.test.ts`

  - [ ] 1E. **Frame window and landmark adapters** (requirements 4.7, 5, 6.2)
    - [ ] 1E.1 `src/tracking/frame-window.ts`: `framesInLastSecond(timed, nowMs)` keeps frames with `t` in `(nowMs - WINDOW_MS, nowMs]`, in order. Time is an argument
    - [ ] 1E.2 `src/tracking/landmark-adapters.ts`: pure functions that turn plain MediaPipe-shaped result objects into `FaceInput[]` and `HandInput[]`, for the face detector and for the face mesh (using the point orders recorded in `docs/review/MEDIAPIPE-DOC-CHECK.md`, not the ones in `design.md` if they differ). Empty results give empty lists
    - [ ] 1E.3 Test `framesInLastSecond` (design test 16): exactly the frames in the window; an empty window when the tracker stalled; `aggregateSecond` of that is `null`
    - [ ] 1E.4 Test `landmarkAdapters` (design test 17), with hand-written result objects
    - [ ] 1E.5 Extend `thresholdsInOneFile` in `tests/tracking-source-rules.test.ts` to cover `frame-window.ts`
    - _Requirements: 4.7, 5.1, 5.2, 6.2, 6.4_
    - Test file: `tests/frame-window.test.ts`, `tests/landmark-adapters.test.ts`, `tests/tracking-source-rules.test.ts`
    - Files this task may change: `src/tracking/frame-window.ts`, `src/tracking/landmark-adapters.ts`, `tests/frame-window.test.ts`, `tests/landmark-adapters.test.ts`, `tests/tracking-source-rules.test.ts`

  - [ ] 1F. **Same-origin WASM copy and build scripts** (requirements 6.2, 10.1)
    - [ ] 1F.1 `scripts/copy-mediapipe-wasm.mjs`: copies the WASM files named in `docs/review/MEDIAPIPE-DOC-CHECK.md` from `node_modules/@mediapipe/tasks-vision/wasm/` into `public/models/wasm/`. No network call
    - [ ] 1F.2 `scripts/measure-assets.mjs`: prints the byte size of every file under `public/models/`, recursively, one per line, and the total
    - [ ] 1F.3 `package.json`: add `predev` and `prebuild` scripts that run the copy script; add a `measure-assets` script. Keep the existing `build` script's `tsc --noEmit && vite build`
    - [ ] 1F.4 `.gitignore`: ignore `public/models/wasm/`
    - [ ] 1F.5 `tsconfig.json`: add `debug` to `include` so the debug page is type-checked with `strict`
    - [ ] 1F.6 Run `npm run build` and check that `dist/models/wasm/` holds the copied files and that no file of `src/` contains a URL
    - _Requirements: 6.2, 10.1_
    - Test file: none new (build scripts); the existing privacy guard must still pass
    - Files this task may change: `scripts/copy-mediapipe-wasm.mjs`, `scripts/measure-assets.mjs`, `package.json`, `.gitignore`, `tsconfig.json`

  - [ ] 1G. **Model files and the MediaPipe loader** (requirements 6.2, 10.1, 10.2)
    - [ ] 1G.1 The developer downloads the model files named in `docs/review/MEDIAPIPE-DOC-CHECK.md` (hand landmarker, face detector, face landmarker) from the MediaPipe model page, once, by hand, and puts them in `public/models/`. No build step fetches them
    - [ ] 1G.2 `public/models/NOTICE.txt`: the source address and Apache-2.0 licence of each model file, in words
    - [ ] 1G.3 `src/tracking/mediapipe-loader.ts`: browser only. Creates the hand tracker and the face tracker named by `FACE_MODEL` from `/models/` on the same origin, with paths built from `import.meta.env.BASE_URL`; asks for the GPU delegate first and falls back to the CPU delegate; exports a `Trackers` type with `detectForVideo` for each and a `close()` that releases both. It contains no URL, no `fetch(`, no `console.`
    - [ ] 1G.4 Run `npm run measure-assets` and copy the output into the table in `docs/review/MEDIAPIPE-DOC-CHECK.md` under "Measured sizes" (bytes, date). Do not record any size from memory
    - [ ] 1G.5 Check by hand: `npm run dev` still starts, and the title screen of the game makes no request for a `.task`, `.tflite` or `.wasm` file (nothing imports the loader yet)
    - _Requirements: 6.2, 6.3, 10.1, 10.2_
    - Test file: none new (browser only); the existing privacy guard and `tracking-source-rules` tests must still pass
    - Files this task may change: `public/models/*` (the model files and `NOTICE.txt`), `src/tracking/mediapipe-loader.ts`, `docs/review/MEDIAPIPE-DOC-CHECK.md`

  - [ ] 1H. **The debug page** (requirements 1.1, 1.3, 1.4)
    - [ ] 1H.1 `debug/tracking-debug.html`: title contains the fixed marker `FOAMTOM-TRACKING-DEBUG`; carries a Content-Security-Policy `<meta>` that is the policy of `index.html` plus only `'wasm-unsafe-eval'` in `script-src`; a stage for the video and canvas; a large text readout. Not linked from `index.html` or anything under `src/`
    - [ ] 1H.2 `debug/tracking-debug.ts`: opens the front camera, loads the trackers with `mediapipe-loader.ts`, hands each frame through the adapters to `classifyFrame`, keeps a list of timed frames, and every frame shows `aggregateSecond(framesInLastSecond(frames, now))` (window not emptied) as the four fields `handNearMouth`, `side`, `level`, `moving`, or the word `null`, in large text. Also shows `side` and `level` for each of the three hand points (`'palm'`, `'wrist'`, `'fingertips'`) side by side. Accepts `?face=detector` or `?face=mesh`. Uses frame callbacks, not timers. Stops every camera track when the tab is hidden. No `console.`, no storage, no canvas export
    - [ ] 1H.3 `debug/debug-draw.ts`: draws the face points and hand points on a canvas laid over the video. The video and canvas box is mirrored with CSS only; the landmark numbers and the classifier's input are not mirrored, and the readout text is not mirrored
    - [ ] 1H.4 The page imports `classifyFrame`, `aggregateSecond`, `framesInLastSecond` and the constants from `src/tracking/` and defines no threshold or copy of them
    - [ ] 1H.5 Test `debugUsesSharedFunctions` (design test 32) and `trackingPrivacyGuard` (design test 23: no `console.`, `toDataURL`, `toBlob`, `MediaRecorder`, `captureStream`, `setInterval` or `setTimeout` under `src/tracking/` and `debug/`; `DrawValue` or `draw-value` not imported from `src/logic/` or `src/storage/`); extend `thresholdsInOneFile` to scan `debug/`
    - [ ] 1H.6 Check by hand on a laptop: `npm run dev`, open `/debug/tracking-debug.html`, allow the camera. Look at: the picture is a mirror image; the four fields and the word `null` show in large text and change as you move; cover the lens and the readout becomes `null`; hide the tab and the camera light goes off; the network panel shows only same-origin requests
    - _Requirements: 1.1, 1.3, 1.4, 9.1, 9.2, 9.5_
    - Test file: `tests/tracking-guards.test.ts`, `tests/tracking-source-rules.test.ts`
    - Files this task may change: `debug/tracking-debug.html`, `debug/tracking-debug.ts`, `debug/debug-draw.ts`, `tests/tracking-guards.test.ts`, `tests/tracking-source-rules.test.ts`

  - [ ] 1I. **Keep the debug page out of the production build** (requirements 1.2, 11.6)
    - [ ] 1I.1 `vite.config.ts`: set `build.rollupOptions.input` to `index.html` only, so `debug/` is never built. Change nothing else in the file
    - [ ] 1I.2 `tests/build-output.test.ts`: test `distHasNoDebugPage` (design test 26). Build the site into a temporary folder with `vite build --outDir <temp> --emptyOutDir`, and fail if any built file contains `FOAMTOM-TRACKING-DEBUG` or has a name containing `tracking-debug` or `debug-draw`; also fail if `index.html` or any file under `src/` mentions `tracking-debug`. Give the test a long timeout; delete the temporary folder afterwards
    - [ ] 1I.3 Check by hand: `npm run build`, then open the `dist/` folder: no debug page, and the `debug/` route is absent
    - _Requirements: 1.2, 11.6_
    - Test file: `tests/build-output.test.ts`
    - Files this task may change: `vite.config.ts`, `tests/build-output.test.ts`

  - [ ] 1J. **Results file template and its helpers** (requirements 1.5, 1.12, 1.13)
    - [ ] 1J.1 `docs/review/TRACKING-TEST-RESULTS.md`: an empty template in words only, with the eight parts of design 7.2 (set-up; hand-point comparison; side check with 24 rows; level check with 24 rows; other checks; counts and decision; speed; asset sizes), headings and empty tables only, no readings. Every table has a Date column and a Note column. The side and level tables have the columns Date, Brush hand, Zone, Surface, Palm, Wrist, Fingertips, Result, Note. The "Other checks" table lists these rows: mirror flip signal says `left`; mirror flip hand on the left of the preview; hand resting on sink edge; hand touching cheek; both hands near the mouth; second person behind the child; lights dimmed until the face is lost. The counts section has two empty verdict lines, "Side check:" and "Level check:", each for Dr. Yatin's word, initials and date. A short "How to fill this in" paragraph explains the codes R, W, U, N and says: words only, no screenshots, no landmark values
    - [ ] 1J.2 `src/tracking/test-results.ts`: pure `surfacePasses(codes)` (true when at least 2 of 3 codes are `R`; `U` and `N` count as not right) and `countPasses(rows)`
    - [ ] 1J.3 Test `surfacePasses` (design test 30) with a fast-check property over any three codes from `R`, `W`, `U`, `N`
    - [ ] 1J.4 Test `resultsFileIsWordsOnly` (design test 31). It never skips: it fails if the file is missing, contains image syntax, `data:`, or a number with three or more decimals; every filled table row has a date; reading cells use only `R`, `W`, `U`, `N`; an empty template passes
    - _Requirements: 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 1.12, 1.13_
    - Test file: `tests/test-results.test.ts`
    - Files this task may change: `docs/review/TRACKING-TEST-RESULTS.md`, `src/tracking/test-results.ts`, `tests/test-results.test.ts`

  - [ ] 1K. **Dr. Yatin runs the feasibility checks** (requirements 1.5 to 1.13, 9.3, 10.1, 10.2). This part is done by Dr. Yatin with the developer present. The developer changes no code in it except where a step says so
    - [ ] 1K.1 Check in Chrome that the debug page runs with exactly the one CSP change (`'wasm-unsafe-eval'` in `script-src`). Look at the browser's developer tools for CSP errors about workers, `blob:`, `unsafe-eval` or `media-src`. Write the result in words in the set-up part of the results file. STOP if MediaPipe needs any other relaxation (requirement 9.4, design 14 item 3)
    - [ ] 1K.2 Fill in the set-up part: device, browser, face model used (`detector` or `mesh`), `HAND_POINT`, date. Try `?face=mesh` if the readout is `null` too often with the detector
    - [ ] 1K.3 Copy the size table from `docs/review/MEDIAPIPE-DOC-CHECK.md` into the asset sizes part of the results file
    - [ ] 1K.4 Side check (requirement 1.6): brush with the right hand in each of the four zones on the outer, chewing and inner surfaces, three times each, and write the three codes for palm, wrist and fingertips for each of the 12 rows. Then repeat with the left hand (requirement 1.9a), 24 rows in all. Look at: the `side` field of the readout while brushing each surface
    - [ ] 1K.5 Level check (requirement 1.7): the same 24 cases, reading the `level` field
    - [ ] 1K.6 Mirror-flip check (requirement 1.8): raise your own left hand. Look at two things and record them as two rows: the readout says `left`, and the hand appears on the left of the mirrored preview
    - [ ] 1K.7 Both-hands checks (requirement 1.9b and 1.9c): brush with one hand while the other rests on the sink edge, then touches the cheek (the signal must follow the hand at the mouth); then hold both hands near the mouth (`side` must read `unknown`)
    - [ ] 1K.8 Second-face check (requirement 1.10): a second person steps in behind you; the readout must not change
    - [ ] 1K.9 Poor-light check (requirement 1.11): dim the lights until the face is lost; the readout must become `null`, not a guess
    - [ ] 1K.10 Fill in the hand-point comparison part from the tables, then the counts, then write the two verdict lines "Side check: pass or fail" and "Level check: pass or fail" with initials and date. Applying the decision rule (surface passes at 2 of 3) is Dr. Yatin's call (design 14 item 1)
    - [ ] 1K.11 Run `npm run test:run`: `resultsFileIsWordsOnly` must pass on the filled-in file
    - _Requirements: 1.5 to 1.13, 9.3, 9.4, 10.1, 10.2_
    - Test file: `tests/test-results.test.ts` (existing)
    - Files this task may change: `docs/review/TRACKING-TEST-RESULTS.md`
    - **GATE: task 2 does not start until 1K.10 is complete and both verdict lines carry Dr. Yatin's initials and date.**

- [ ] 2. **Apply the decision rule**
  - [ ] 2.1 Read `docs/review/TRACKING-TEST-RESULTS.md`. STOP if the "Side check:" verdict is fail or is missing: work on this spec ends, and Dr. Yatin decides what happens next. Do not tune any threshold around a failed side check (requirement 1.13)
  - [ ] 2.2 If the "Level check:" verdict is fail, Dr. Yatin sets `REQUIRE_LEVEL_MATCH` to `false` in `src/logic/constants.ts` himself, in his own commit (requirement 1.12). This task does not edit that file. Record in the results file, in words, that he did
  - [ ] 2.3 If Dr. Yatin decided in the results file to change `HAND_POINT` (to `wrist` or `fingertips`), `FACE_MODEL` (to `mesh`), or any other value in `thresholds.ts`, change only those lines, with the value he wrote. Change nothing he did not decide
  - [ ] 2.4 `tests/tracking-decision.test.ts`: test that the results file has a "Side check:" verdict that says pass, with initials and a date; that it has a "Level check:" verdict with initials and a date; and that if the Level verdict says fail then `REQUIRE_LEVEL_MATCH` in `src/logic/constants.ts` is `false`. The test only reads the constant; it does not change it
  - [ ] 2.5 Re-run the whole suite: the tests of parts 1B to 1E must still pass with any changed threshold values (they do not pin the tuned values, except those named in 1B.5)
  - _Requirements: 1.12, 1.13, 1.14_
  - Test file: `tests/tracking-decision.test.ts`
  - Files this task may change: `src/tracking/thresholds.ts` (only the lines Dr. Yatin decided), `tests/tracking-decision.test.ts`

- [ ] 3. **Draw value and the camera SignalSource**
  - [ ] 3.1 `src/tracking/draw-value.ts`: `DrawValue` (`mouth`, `faceWidth`, `roll`) and `toDrawValue(face, aspect)` as design 5.7. Pure
  - [ ] 3.2 `src/tracking/camera-source.ts`: `createCameraSignalSource(deps)` returning `CameraSignalSource`: the unchanged `SignalSource` plus `latestDraw()`, `onDraw(listener)` and `attachVideo(video)`. Browser only; `CameraDeps` (`now`, `getUserMedia`, `loadTrackers`) are injected. States and rules exactly as design 6.1:
    - `start()` asks `getUserMedia({ video: { facingMode: 'user' }, audio: false })` and `loadTrackers()` in parallel, answers `'ready'` only when the stream plays and both trackers exist, answers `'unavailable'` on any failure or refusal, never rejects, never keeps error text, and does not ask again after a refusal
    - `stop()` stops every track, closes the trackers, cancels the pending frame callback, empties the frames and the draw value, and is safe to call twice
    - a generation counter releases a camera that arrives after `stop()`
    - `latest()` is `null` unless running; otherwise `aggregateSecond(framesInLastSecond(frames, now()))`, then empties the frames
    - the frame pump uses `requestVideoFrameCallback` (fallback `requestAnimationFrame`), sends a frame to the trackers at most every `TRACK_MIN_INTERVAL_MS`, skips a frame that throws, and clears the draw value when no face is seen
    - nothing but the signal and the `DrawValue` leaves the module
  - [ ] 3.3 Test `cameraSourceLifecycle` (design test 20) with fake `getUserMedia`, `loadTrackers` and `now`: refusal, failed load and no camera give `'unavailable'` with no second `getUserMedia`; `stop()` stops every fake track and closes the trackers; `stop()` during `start()` releases on arrival; `latest()` is `null` before ready, after `stop()` and during a restart; a restart after `stop()` works; `latest()` empties the frames; a stalled tracker gives `null`
  - [ ] 3.4 Test: `toDrawValue` for a face gives the mouth, the width as a fraction of image width and the roll of the face axis; a face of width zero gives no value
  - [ ] 3.5 Extend nothing else: `trackingPrivacyGuard`, `thresholdsInOneFile` and the core privacy guard already cover these files and must pass
  - _Requirements: 6.1, 6.2, 6.4, 6.5, 6.6, 6.7, 7.1, 7.4, 8.3, 9.1, 9.2_
  - Test file: `tests/camera-source.test.ts`, `tests/draw-value.test.ts`
  - Files this task may change: `src/tracking/draw-value.ts`, `src/tracking/camera-source.ts`, `tests/camera-source.test.ts`, `tests/draw-value.test.ts`

- [ ] 4. **Restart the camera when the tab comes back**
  - [ ] 4.1 In `src/ui/game-loop.ts`, in the visibility handler, after the check that the session may continue (under the 60-second limit of core requirement 2.6), add the single behaviour: if the session mode is `camera`, call `source.start()` and ignore its answer. Timer-only sessions do not call it. Change nothing else
  - [ ] 4.2 Test `gameLoopResumeRestart` (design test 21) in `tests/game-loop.test.ts` with the fake clock: hidden then visible in camera mode calls `start()` once more; in timer-only mode it does not; a session dropped after more than 60 s hidden does not; when the restart answers `'unavailable'` the mode does not change and the session ticks on
  - [ ] 4.3 The existing game-loop tests (exact ticks, `start()` once per session, `stop()` at the end and when hidden, the 8-second fallback) still pass unchanged
  - _Requirements: 7.2, 7.3, 7.4_
  - Test file: `tests/game-loop.test.ts`
  - Files this task may change: `src/ui/game-loop.ts`, `tests/game-loop.test.ts`

- [ ] 5. **Monster placement on the cheek**
  - [ ] 5.1 `src/ui/monster-anchor.ts`: pure `monsterAnchor(draw: DrawValue | null, zone): Anchor | null` as design 9.2. `null` in gives `null` out. The cheek direction comes from `rawToChildSide('raw-right') === zone.side`; no other swap. Named constants `CHEEK_OFFSET` 0.45, `LEVEL_LIFT` 0.15, `MONSTER_SIZE` 0.40 at the top of the file. The result is clamped so the monster stays inside the stage
  - [ ] 5.2 Test `monsterAnchorPlacement` (design test 22): `null` in gives `null` out; left zones sit on the raw side that `rawToChildSide` calls `left`; upper zones are above lower zones; the anchor stays inside the stage; the size scales with `faceWidth`; a tilted face (`roll`) turns the monster
  - [ ] 5.3 `onlyOneLeftRightSwap` still passes with `monster-anchor.ts` in place
  - _Requirements: 2.2, 8.2, 8.4_
  - Test file: `tests/monster-anchor.test.ts`
  - Files this task may change: `src/ui/monster-anchor.ts`, `tests/monster-anchor.test.ts`

- [ ] 6. **Mirrored preview**
  - [ ] 6.1 `src/ui/camera-preview.ts`: builds a stage `div` holding a `<video>` (`playsinline`, `muted`) and a monster layer above it. The stage is mirrored for display with one CSS class (`transform: scaleX(-1)`); the monster element carries a second `scaleX(-1)` so its art is not back to front. Exposes `attach(source)`, `placeMonster(anchor | null)` and `destroy()`. A `null` anchor puts the monster back at the plain session screen position and shows no message. It has no screenshot, recording or share control, and no export calls
  - [ ] 6.2 `src/ui/styles.css`: add the classes for the stage, the mirror and the monster layer, with a CSS `transition` on position. Portrait first, usable in landscape and on desktop. Any control keeps a touch target of at least 48 px. Styles stay in the stylesheet or in `element.style`, so the Content-Security-Policy stays same-origin
  - [ ] 6.3 Test (source scan, since the preview is browser code): `camera-preview.ts` contains no `toDataURL`, `toBlob`, `MediaRecorder`, `captureStream`, `console.`, `setInterval` or `setTimeout`, no `<button` that offers capture or share, and applies the mirror only through the CSS class
  - [ ] 6.4 Nothing imports `camera-preview.ts` yet, so the game is unchanged
  - _Requirements: 2.3, 8.1, 8.4, 8.5, 8.7_
  - Test file: `tests/camera-preview.test.ts`
  - Files this task may change: `src/ui/camera-preview.ts`, `src/ui/styles.css`, `tests/camera-preview.test.ts`

- [ ] 7. **Allow WebAssembly in the Content-Security-Policy**
  - [ ] 7.1 In `index.html` change only the Content-Security-Policy `<meta>`: add `'wasm-unsafe-eval'` to `script-src`. Nothing else in the policy changes. STOP if part 1K.1 found that any other relaxation is needed
  - [ ] 7.2 Test `cspIsStillSameOrigin` (design test 25) in `tests/csp.test.ts`: parse the policy in `index.html`; fail if any directive names a host, `*`, `data:`, `'unsafe-inline'` or `'unsafe-eval'`; the only difference from the core policy is `'wasm-unsafe-eval'` in `script-src`
  - [ ] 7.3 The core privacy guard still passes
  - _Requirements: 9.3, 9.4_
  - Test file: `tests/csp.test.ts`
  - Files this task may change: `index.html`, `tests/csp.test.ts`

- [ ] 8. **Session screen can show the preview**
  - [ ] 8.1 In `src/ui/session-screen.ts` add an optional way to attach a `camera-preview` to the screen. When a preview is attached, the monster is drawn by the preview at the anchor it is given; when it is not, the screen is exactly the plain session screen it is today. Everything else is still painted from `toView(state)`; the preview only changes where the monster is drawn and shows the video
  - [ ] 8.2 In guided-timer mode no preview is created and no video element is added to the page (requirement 8.6)
  - [ ] 8.3 Check by hand: `npm run dev`, play a timer-only session. It looks and behaves as before, with no preview and no camera request
  - _Requirements: 8.1, 8.2, 8.4, 8.6_
  - Test file: none new (the logic it paints is already tested); the privacy guard and `camera-preview` source scan must still pass
  - Files this task may change: `src/ui/session-screen.ts`, `src/ui/camera-preview.ts`

- [ ] 9. **Wire the camera into the game (lazy)**
  - [ ] 9.1 In `src/main.ts`, inside the start-button handler only, load the camera source with a dynamic `import()` of `camera-source.ts` and pass it to the game loop in place of `nullSignalSource`. No static import of any camera, tracker or MediaPipe module anywhere in `main.ts` or the title screen. If the import fails, use `nullSignalSource`
  - [ ] 9.2 Subscribe the session screen's preview to `onDraw`; paint the anchor from `monsterAnchor(draw, zone)`; attach the camera's video to the preview. When the draw value is `null`, show the plain position with no message. In timer-only mode do nothing of this
  - [ ] 9.3 `attachVideo` and the preview are removed when the session ends; `stop()` is already called by the loop
  - [ ] 9.4 Extend `tests/build-output.test.ts`: test `cameraCodeIsLazy` (design test 27: build with the manifest and fail if the entry chunk's static imports reach the chunk holding `camera-source` or `tasks-vision`); test `firstLoadUnder5MB` (design test 28: sum the bytes of every built file except `models/` and the lazy camera chunk; fail above 5,000,000)
  - [ ] 9.5 Check by hand with the network panel open: load the title screen, and no `.task`, `.tflite` or `.wasm` request appears; tap start, and the model and WASM requests go only to this origin
  - [ ] 9.6 Check by hand: allow the camera and play a session; refuse the camera and play a session (the plain screen, no preview, no nagging, a second session does not prompt more than the browser itself does)
  - _Requirements: 6.1, 6.3, 7.1, 8.1, 8.2, 8.4, 8.6, 10.3_
  - Test file: `tests/build-output.test.ts`
  - Files this task may change: `src/main.ts`, `tests/build-output.test.ts`

- [ ] 10. **Manual checks on a real phone and the final run** (requirements 7, 8, 9, 10; done by Dr. Yatin or the developer, written in `docs/review/TRACKING-TEST-RESULTS.md`)
  - [ ] 10.1 Speed (requirement 10.4): on a real mid-range 2022 Android phone in Chrome, with the camera on, record the device model, Android and Chrome versions, and two separate lines: (a) frames per second of the picture and the drawing (20 or more passes); (b) frames per second the tracker handles (at least 5 in a normal second). If (a) fails, raise `TRACK_MIN_INTERVAL_MS` only with Dr. Yatin's say and repeat (requirement 10.5)
  - [ ] 10.2 Look at, on the phone in portrait, one-handed: the preview is a mirror image; in the upper-right zone the monster sits on your right cheek, which is on the right of the screen; in the lower-left zone it sits low on the left; it follows when you tilt your head
  - [ ] 10.3 Cover the face: the monster returns to its plain position and no message is shown or spoken. Dim the lights during a session: nothing is shown or said (requirement 7.5)
  - [ ] 10.4 Switch to another tab and come back inside a minute: the preview returns, Chrome does not ask again where it can avoid it, and the session carries on in the same mode
  - [ ] 10.5 When a session ends, the camera light goes off. Hiding the tab turns it off too
  - [ ] 10.6 Refuse the camera: the plain screen shows with no preview and no repeat prompt
  - [ ] 10.7 Rotate to landscape and open on a desktop browser: the preview is usable. Measure every touch target in the browser's developer tools: at least 48 px. The preview has no screenshot, record or share button
  - [ ] 10.8 Network panel during a camera session: only same-origin requests; nothing is sent while brushing
  - [ ] 10.9 Record the asset sizes and the first load size from the final build (`npm run build`, then `npm run measure-assets`) in the results file, in bytes, with the date
  - [ ] 10.10 Run `npm run test:run` and `npm run build`; the full suite passes, including `resultsFileIsWordsOnly`, `privacyGuard`, `trackingPrivacyGuard`, `distHasNoDebugPage`, `cameraCodeIsLazy` and `firstLoadUnder5MB`
  - _Requirements: 6.3, 7.2, 7.3, 7.5, 8.1, 8.2, 8.4, 8.5, 8.6, 8.7, 9.1, 9.3, 10.1, 10.3, 10.4, 10.5_
  - Test file: `tests/test-results.test.ts` (existing)
  - Files this task may change: `docs/review/TRACKING-TEST-RESULTS.md`, `src/tracking/thresholds.ts` (only `TRACK_MIN_INTERVAL_MS`, and only with Dr. Yatin's say)

- [ ] 11. **README: camera tracking is now in the game**
  - [ ] 11.1 In `README.md` replace the paragraph that says the version plays only in guided-timer mode and that camera tracking is planned, with a short plain description: the game uses the front camera when allowed and works in guided-timer mode when it is not. Keep the privacy line "The camera stays on this phone. Nothing is saved or sent." No health claim, no clinic name, phone number, address or registration number
  - [ ] 11.2 Mention that the debug page is for development only and is not part of the built site
  - _Requirements: 9.1, 1.2_
  - Test file: none new; the existing wording and privacy tests must still pass
  - Files this task may change: `README.md`

---

Later specs, not in this file: `mirror-and-screens`, `parent-screen`.
