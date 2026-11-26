# Spec: hand-tracking — Requirements

## Introduction

This spec defines how **Foamtom: The Haunted Mirror** sees the child: a feasibility test
that Dr. Yatin runs first, the pure classification that turns face and hand landmarks
into the one-per-second brushing signal, the real camera `SignalSource`, the mirrored live
preview, and the tests that guard all of it.

This spec **only produces the signal**. It does not define or change anything that
`core-brushing-loop` already defines:

- the `BrushingSignal` shape (core requirement 5.1),
- what `null` means (core requirements 5.2 and 5.6),
- the `SignalSource` interface and its three operations (core requirement 15.3),
- the 8-second camera start limit and the fixed mode per session (core requirement 8.1),
- the tick rule, health maths and benefit of the doubt (core requirements 6, 7 and 14).

Where this spec says "the signal", it means exactly the `BrushingSignal` of core
requirement 5.1, or `null`.

The classification lives in `/src/tracking/` as pure functions with no DOM and no camera
access, so it can be tested with fixture arrays of plain numbers. Only the thin camera and
MediaPipe wrapper touches the browser.

### In scope

1. **A feasibility test** (requirement 1): a debug page and Dr. Yatin's written results.
   It is the first task, and it decides whether the rest of the spec goes ahead.
2. **Left and right** (requirement 2): one conversion from raw camera side to the child's
   own side.
3. **Pure classification** (requirements 3 and 4): `classifyFrame` and `aggregateSecond`,
   with every threshold a named constant in one file.
4. **Face and hand selection** (requirement 5).
5. **The real `SignalSource`** (requirements 6 and 7): camera and MediaPipe Tasks Vision
   behind the existing interface, with its lifecycle and permission rules.
6. **Preview and monster position** (requirement 8): a mirrored live preview on the
   session screen, with the monster drawn on the cheek of the active zone. (This takes
   over core requirement 11.1.)
7. **Privacy** (requirement 9), **size and speed** (requirement 10) and **tests**
   (requirement 11). (Requirement 10 takes over core requirement 11.12.)

### Out of scope

- Game rules, health, scoring and zone order: `core-brushing-loop`.
- Monster art, the haunted-mirror frame, fog and effects: `mirror-and-screens`.
- The Monster Book screen: `mirror-and-screens`.
- The parent screen: `parent-screen`.
- Recognising individual teeth, the toothbrush itself, or the toothpaste. The game
  never claims to see individual teeth (`dental-rules.md`).
- Any hardware other than the device's front camera.

### Steering references

All requirements below comply with the steering files in `.kiro/steering/`. The rules in
`kid-safety-privacy.md` override any other requirement here; if a feature cannot meet
them, the feature is dropped. The brushing rules in `dental-rules.md` belong to
Dr. Yatin and are not changed by this spec. In particular, "brushing a zone" means the
brush hand is near the mouth and moving (the game tells the child which zone to brush;
the camera does not check the side, because a child brushing across the face holds the
hand on the other side; the camera does not check upper versus lower either, because for
the chewing surface of the upper teeth the hand hangs below the mouth), and uncertain
tracking gives the benefit of the doubt to time.

---

## Requirements

### 1. Feasibility test and Dr. Yatin's checks

**As the developer and Dr. Yatin, I want to see on a real face whether the camera can
tell which side and which level a child is brushing, before any other tracking work is
built, so that we stop early if it cannot.**

**Debug page**

1.1 THE SYSTEM SHALL provide one debug page, for the developer and Dr. Yatin only, that
shows: the live camera preview mirrored for display, the face and hand landmarks drawn
over it, and the signal computed live, in large text, as the four fields
`handNearMouth`, `side`, `level` and `moving`, or the word "null" when the signal is
`null`.

1.2 THE SYSTEM SHALL NOT link the debug page from the game, and SHALL NOT include it in
the production build. A check on the built `dist/` folder SHALL fail if the page, or any
file that only the page uses, is present.

1.3 THE debug page SHALL obey every rule of requirement 9 and every rule of
`kid-safety-privacy.md`: no frame, image, video, landmark or derived measurement is
saved, sent or logged, and the camera stops when the tab is hidden.

1.4 THE debug page SHALL compute the signal with the same `classifyFrame` and
`aggregateSecond` functions, and the same named thresholds, that the game uses
(requirements 3 and 4), so that what Dr. Yatin sees is what the game will use. THE
thresholds SHALL be changeable on that page only through the one constants file
(requirement 3.7), never through a second copy.

**Results file**

1.5 Dr. Yatin SHALL brush in front of the debug page and record a **pass** or **fail**
for each check below in `docs/review/TRACKING-TEST-RESULTS.md`. The file SHALL contain
words only: no images, no screenshots, no landmark values. Each row SHALL carry the date
and a short note.

1.6 **Side check.** For each of the four zones (upper left, upper right, lower left,
lower right) Dr. Yatin SHALL brush three times, once on each of these surfaces, and
record each of the 12 results separately: **outer surfaces** (cheek side), **chewing
surfaces**, and **inner surfaces** (tongue side). A pass means `side` reads the side
being brushed. The brush handle leaves the mouth at a different place for each surface,
so the hand may read a different side.

1.7 **Level check.** For the same 12 cases, Dr. Yatin SHALL record whether `level` reads
`upper` or `lower` correctly. A pass means `level` reads the level of the zone being
brushed.

1.8 **Mirror-flip check.** Dr. Yatin SHALL raise the left hand (the child's own left). A
pass requires both: the signal says `left`, and the hand appears on the left of the
mirrored preview. A fail on either is a fail of the check.

1.9 **Both-hands check.** Dr. Yatin SHALL record these separately:

(a) the side check (1.6) repeated with the brush in the right hand, then repeated with
the brush in the left hand;

(b) brushing with one hand while the other hand is in view, first resting on the sink
edge, then touching the cheek: a pass means the signal follows the hand at the mouth;

(c) both hands near the mouth at once: a pass means `side` is `unknown`, never a guess.

1.10 **Second-face check.** A second person SHALL step into view behind the child. A
pass means the signal does not change.

1.11 **Poor-light check.** The lights SHALL be dimmed until the face is lost. A pass
means the signal becomes `null`, not a guess.

**Decision rule**

1.12 A surface (outer, chewing or inner) of a zone PASSES the level check when at least 2
of its 3 `level` readings are right; all three readings SHALL be recorded anyway. IF the
level check fails THEN Dr. Yatin SHALL set `REQUIRE_LEVEL_MATCH` to `false`
(core requirement 5.7), and the game checks side only. THE system SHALL NOT change that
constant on its own. The level check failed on 21 Nov 2026; see "Decision 2, 21 Nov 2026"
below.

1.13 A surface (outer, chewing or inner) of a zone PASSES the side check when at least 2
of its 3 `side` readings are right; all three readings SHALL be recorded anyway. IF the
side check fails THEN work on this spec SHALL stop, and Dr. Yatin SHALL decide what
happens next. THE developer SHALL NOT tune thresholds around a failed side check without
his decision. The side check failed on 21 Nov 2026; see "Decision, 21 Nov 2026" below.

1.14 The feasibility test SHALL be the **first task** in `tasks.md`. No task for
requirements 5 to 8 SHALL start before the results file exists and the decision rule in
1.12 and 1.13 has been applied. The first task MAY build only the part of requirements 2
to 4 and 6 that the debug page needs.

---

### 2. Left and right

**As a child, I want the game to know my own left and right, so that a monster on my
left cheek is cleared by brushing my left side.**

2.1 THE SYSTEM SHALL report `side` as the child's own left or right: the side of the
child's body, not the side of the screen.

2.2 THE raw camera frame is not mirrored, so the child's own left appears on the **right**
of the raw image. THE SYSTEM SHALL convert from the raw image side to the child's own
side in **exactly one function**, and no other code SHALL swap, negate or invert left and
right.

2.3 THE live preview SHALL be mirrored for display only, using CSS. THE SYSTEM SHALL NOT
mirror the pixel data, the landmark values or the canvas contents that the classifier
reads.

2.4 THE conversion function SHALL have the **first fixture test** in the test suite
(requirement 11.1).

---

### 3. Per-frame classification

**As a developer, I want a pure function that classifies one camera frame from landmark
numbers, so that it can be tested without a camera.**

3.1 THE SYSTEM SHALL provide a pure function `classifyFrame(landmarks)` that returns a
per-frame result. It SHALL have no DOM access, no camera access and no side effects.

3.2 THE SYSTEM SHALL measure every distance used by `classifyFrame` **relative to face
width**, so that the result does not depend on how far the child stands from the camera.
Horizontal and vertical distances SHALL be measured in the same unit, so that the shape of
the camera image does not change the result.

3.3 **`handNearMouth`:** THE SYSTEM SHALL set it true when the hand point is within
`NEAR_MOUTH_FACE_WIDTHS` of the mouth centre, where that distance is a fraction of face
width.

3.4 **`side`:** THE SYSTEM SHALL work out `side` from the hand's position relative to the
mouth centre line, converted to the child's own side by the function of requirement 2.2.
IF the hand is inside a dead zone either side of that line, of width `SIDE_DEAD_ZONE`
(in face widths), THE SYSTEM SHALL give `unknown`.

3.5 **`level`:** THE SYSTEM SHALL work out `level` from the hand's height relative to the
mouth, as `upper` or `lower`. IF the hand is inside a dead zone either side of the mouth
height, of size `LEVEL_DEAD_ZONE` (in face widths), THE SYSTEM SHALL give `unknown`.

3.6 THE SYSTEM SHALL give `side` and `level` only a meaning when `handNearMouth` is true.
(Core requirement 5.6: a hand away from the mouth means the face is seen and the hand is
not at the mouth.) The per-frame result SHALL also say whether a face was seen at all.

3.7 EVERY threshold used by `classifyFrame` and `aggregateSecond` SHALL be a named
constant in **one file**, `src/tracking/thresholds.ts`, with a comment saying what it
measures and its unit. No threshold SHALL be written as a bare number anywhere else.

3.8 THE SYSTEM SHALL NOT claim to see individual teeth. `classifyFrame` produces only a
side and an upper or lower level (core requirement 3.3).

---

### 4. One-second aggregation

**As a developer, I want one signal per second built from many frames, so that the game
logic receives exactly what core-brushing-loop expects.**

4.1 THE SYSTEM SHALL provide a pure function `aggregateSecond(frames)` that takes the
per-frame results of one second and returns one `BrushingSignal` or `null`.

4.2 IF fewer than `MIN_FRAMES_PER_SECOND` (5) frames arrived in the second, THE SYSTEM
SHALL return `null`.

4.3 IF the face was seen in fewer than half of the frames in the second, THE SYSTEM SHALL
return `null`.

4.4 OTHERWISE THE SYSTEM SHALL return a signal in which `handNearMouth`, `side` and
`level` are each decided **by majority** of the frames. WHEN there is no clear majority
for a field, that field SHALL be `unknown` (`side` and `level`) or `false`
(`handNearMouth`). `side` and `level` are decided by majority among the frames in which `handNearMouth` is true.

4.5 `moving` SHALL be decided from how far the hand travelled during the second, measured
relative to face width (requirement 3.2) and compared with `MOVING_MIN_TRAVEL` (0.2 face widths per second since 21 Nov 2026; it was
0.3, see Decision 4).

4.6 `aggregateSecond` SHALL NOT use the wall clock or any randomness. The same frames
SHALL always give the same signal.

4.7 THE SYSTEM SHALL NOT keep the frames of a finished second. Once the signal for that
second has been produced, the frames SHALL be discarded.

---

### 5. One face, and the hand at the mouth

**As a child brushing with a parent or sibling behind me, I want the game to follow only
me, so that someone else walking past does not change my brushing.**

5.1 THE SYSTEM SHALL track **one face only**: the largest face in the frame. A second
face SHALL NOT change the signal.

5.2 THE SYSTEM SHALL look for up to **two hands**. FOR the signal it SHALL use the hand
whose hand point is nearest the mouth centre, and SHALL ignore the other hand, whichever
hand holds the brush.

5.3 IF both hands are within `NEAR_MOUTH_FACE_WIDTHS` of the mouth at once, THE SYSTEM
SHALL give `side` as `unknown` and `level` as `unknown` for that frame. It SHALL NOT
guess.

5.4 IF no hand is seen, THE SYSTEM SHALL give `handNearMouth` false for that frame.

5.5 A hand resting elsewhere (for example on the sink edge, or touching the cheek farther
than `NEAR_MOUTH_FACE_WIDTHS` from the mouth) SHALL NOT affect the signal while another
hand is nearer the mouth.

---

### 6. The real SignalSource

**As a developer, I want the camera and MediaPipe to sit behind the existing interface,
so that game logic never learns that a camera exists.**

6.1 THE SYSTEM SHALL provide a camera `SignalSource` in `src/tracking/` that implements
the `SignalSource` interface of core requirement 15.3 without changing it: `start()`
answers `'ready'` or `'unavailable'`, `latest()` returns the signal for the last full
second or `null`, and `stop()` stops the camera.

6.2 THE SYSTEM SHALL use MediaPipe Tasks Vision (face and hand landmarks) running in the
browser. The model files and the WASM files SHALL be served from `/public/models/` on the
same origin. THE SYSTEM SHALL NOT fetch any of them from a third-party address.

6.3 THE SYSTEM SHALL NOT load the camera code, the model files or the WASM files until the
child has tapped the start button (core requirement 15.1). THE title screen SHALL load
none of them.

6.4 `latest()` SHALL return `null` whenever the tracker cannot see the child: no face, too
little light, tracker not ready, or the camera restarting.

6.5 `stop()` SHALL stop **every** track of the camera stream, and SHALL release the
tracker. IF `stop()` is called while `start()` is still waiting for the camera, the camera
SHALL be released as soon as it arrives.

6.6 IF `start()` has not answered when the 8-second limit of core requirement 8.1 is
reached, the game plays that session in guided-timer mode. THE camera source SHALL then
release the camera and SHALL NOT affect that session.

6.7 THE camera source SHALL make no other module learn anything beyond the signal and
the one drawing value of requirement 8.3.

---

### 7. Camera lifecycle and permission

**As a parent, I want the camera to be on only while my child is brushing and never to
nag, so that I can trust it.**

7.1 THE SYSTEM SHALL ask for camera permission **once per brushing session**. A later
session SHALL ask again only if the browser has forgotten the earlier answer. IF permission is
refused, THE SYSTEM SHALL answer `'unavailable'` and SHALL NOT ask again, show a prompt,
or nag (core requirement 8.3).

7.2 THE SYSTEM SHALL stop the camera stream when the session ends and when the tab is
hidden (core requirement 11.6).

7.3 WHEN the tab becomes visible again within the time the session allows (core
requirement 2.6), THE SYSTEM SHALL restart the stream **without a new permission
prompt** where the browser allows. IF the browser asks again and the answer is no, or the
restart fails, `latest()` SHALL return `null` and the session SHALL carry on at the
guided timer's pace for those seconds (core requirement 6.3). The mode SHALL NOT change.

7.4 WHILE the stream is restarting, `latest()` SHALL return `null`.

7.5 THE SYSTEM SHALL NOT show any message about the camera, the light or the child's
position to the child while the session runs (core requirement 6.2).

---

### 8. Preview and monster position

**As a child, I want to see myself in the mirror with the monster on my cheek, so that I
know where to brush.**

8.1 WHILE a camera-mode session is active THE SYSTEM SHALL show a live preview of the front
camera on the session screen, mirrored for display only (requirement 2.3).

8.2 WHILE the preview is shown THE SYSTEM SHALL draw the monster of the active zone on the
**cheek** of that zone's side, using the child's own left and right. In the mirrored
preview, the child's own left cheek is on the left of the screen. The mouth position and
face width SHALL decide where the monster is drawn and how large.

8.3 THE tracker MAY give the UI **one extra value, for drawing only**: the mouth position
and the face width. This value SHALL NOT reach `src/logic/`, storage, the network or the
console, and SHALL NOT be kept after the frame it describes has been drawn.

8.4 IF the mouth position is not known (the signal is `null`, or the face is lost), THE
SYSTEM SHALL keep the monster in the position the plain session screen of
core-brushing-loop uses, and SHALL NOT show any message. THE monster SHALL NOT stay at
its last cheek position when the face is lost.

8.5 THE preview SHALL work one-handed on a phone propped by a mirror, in portrait, and
SHALL remain usable in landscape and on a desktop browser (core requirement 11.9). Touch
targets SHALL be at least 48 px.

8.6 WHILE in guided-timer mode THE SYSTEM SHALL show no camera preview and SHALL behave
as the plain session screen of core-brushing-loop.

8.7 THE preview SHALL NOT offer screenshots, recording or sharing (core requirement
11.8).

---

### 9. Privacy of tracking data

**As a parent, I want to know the camera picture never leaves my phone, so that I can let
my child use it.**

9.1 THE SYSTEM SHALL process camera frames **in the browser only**. No frame, image,
video, landmark or derived measurement SHALL be sent over the network, saved to storage,
or logged.

9.2 THE SYSTEM SHALL NOT write to the console, anywhere under `src/tracking/`, and SHALL
NOT call `toDataURL`, `toBlob`, `MediaRecorder` or `captureStream`.

9.3 THE SYSTEM SHALL make no third-party request when the game opens or while it runs.
The Content-Security-Policy of core requirement 12.8 SHALL still allow only same-origin
scripts, styles, images, media and connections, including for the model and WASM files,
and for the WASM runtime to start.

9.4 THE core-brushing-loop **privacy guard test** (core requirement 13.10) SHALL keep
passing with the camera code in place. THIS spec SHALL NOT weaken it. If MediaPipe cannot
run without an exception to it, work SHALL stop and Dr. Yatin SHALL decide.

9.5 THE SYSTEM SHALL add a second guard test that fails if any file under
`src/tracking/` contains `console.`, and if the drawing value of requirement 8.3 is
imported from anywhere under `src/logic/` or `src/storage/`.

9.6 THE build SHALL remove MediaPipe's usage-logging network call from the game and from
the debug page, in both `npm run dev` and `npm run build`, with no new npm package and
without editing anything under `node_modules`. The removal matches the code of
`@mediapipe/tasks-vision` **1.2.3**, so `package.json` SHALL pin that package to exactly
`1.2.3` (no `^`, no `~`). The logger SHALL send nothing: no request at all, and not a
request to another address. The removal SHALL NOT change what the trackers detect. IF the
expected code is not found (for example after a MediaPipe update), THE build SHALL fail
with a clear message instead of shipping the call. The built `dist/` SHALL NOT contain the
text `odml.pa.googleapis.com`. The Content-Security-Policy of requirement 9.3 stays as the
second guard.

---

### 10. Size and speed

**As a child on a mid-range phone, I want the game to start quickly and run smoothly, so
that the monsters do not stutter.**

10.1 THE design SHALL record the **real size** of each model file and each WASM file, in
bytes, measured from the files and not from memory or the documentation.

10.2 THE design SHALL prefer the **smallest** models that pass the feasibility test. For
example, a face detector that gives a mouth point may replace the full face mesh, if it
passes. The choice SHALL be checked against the MediaPipe documentation and not assumed.

10.3 THE first load SHALL be under 5 MB where possible. THE model and WASM files SHALL load
only after the start tap (requirement 6.3).

10.4 THE game SHALL run at **20 frames per second or more** with the camera on, on a
mid-range 2022 Android phone in Chrome. This SHALL be checked by hand on a real phone, and
the result SHALL be recorded in `docs/review/TRACKING-TEST-RESULTS.md`.

10.5 IF 20 frames per second cannot be reached, THE tracker MAY run on fewer frames than
it draws, provided `MIN_FRAMES_PER_SECOND` (requirement 4.2) is still met in a normal
second. The game SHALL NOT slow the session clock to wait for the tracker (core
requirement 2.4).

---

### 11. Tests

**As a developer, I want tests that need no camera and no real person's data, so that the
tracking is checked and nothing about a child is stored.**

11.1 THE **first fixture test** SHALL test the left and right conversion function
(requirement 2.2): a hand on the right of the raw image gives `left`, and a hand on the
left of the raw image gives `right`.

11.2 THE SYSTEM SHALL have unit tests and fast-check property tests on `classifyFrame`
and `aggregateSecond`, using fixture landmark arrays.

11.3 FIXTURES SHALL be written **by hand as plain numbers**. They SHALL NOT be captured
from a real person's camera, since that would be a stored derived measurement. A test
SHALL fail if a fixture file holds more than the hand-written numbers the tests name (for
example, a fixture exported from a camera session).

11.4 THE properties tested SHALL include at least:

(a) **Distance independence:** scaling a face and hand arrangement by any positive factor
does not change the per-frame result.

(b) **Mirror symmetry:** swapping the raw left and right of every landmark swaps `left`
and `right` in `side` and changes nothing else.

(c) **Dead zones:** a hand inside the side dead zone gives `side` `unknown`; a hand inside
the level dead zone gives `level` `unknown`.

(d) **Near mouth:** `handNearMouth` is true exactly when the hand point is within
`NEAR_MOUTH_FACE_WIDTHS` of the mouth centre.

(e) **Null rules:** fewer than 5 frames gives `null`; a face seen in fewer than half of
the frames gives `null`; otherwise the result is never `null`.

(f) **Majority:** each field of the signal follows the majority of the frames, and is
`unknown` or `false` when there is no clear majority.

(g) **Moving:** a hand that does not travel gives `moving` false; a hand that travels more
than `MOVING_MIN_TRAVEL` face widths gives `moving` true.

(h) **Second face:** adding a smaller second face to the frame never changes the result.

(i) **Two hands:** when only one hand is near the mouth, that hand decides; when both
hands are near the mouth at once, `side` is `unknown` and `level` is `unknown`.

(j) **Signal shape:** whatever the input, the output is `null` or has exactly the four
fields of core requirement 5.1 with only the allowed values.

11.5 THE core-brushing-loop privacy guard test SHALL keep passing (requirement 9.4), and
the guard test of requirement 9.5 SHALL pass.

11.6 THE test of requirement 1.2 SHALL check the built `dist/` folder for the debug page.

---

## Decisions, 19 Nov 2026

Dr. Yatin answered the eight open questions on 19 Nov 2026.

1. **Pass rule.** A surface (cheek side, chewing, tongue side) passes the side check, and
   separately the level check, when at least 2 of its 3 readings are right. All three
   readings are recorded anyway. Requirements 1.12 and 1.13 use this rule.
2. **Hand point.** The hand point is chosen in `design.md`. The feasibility test checks it
   (wrist, palm centre and fingertips are compared there).
3. **Threshold values.** The starting values come from `design.md` and are tuned on the
   debug page.
4. **Once per session.** "Session" means one brushing session. The camera permission is
   asked again only if the browser has forgotten it (requirement 7.1).
5. **Both hands near the mouth.** `side` is `unknown` and `level` is also `unknown`
   (requirement 5.3).
6. **Debug page.** It is a separate dev-only entry that the production build leaves out.
   `design.md` decides the details.
7. **Face lost.** The monster keeps the plain-screen position (requirement 8.4).
8. **Results file.** The row layout of `docs/review/TRACKING-TEST-RESULTS.md` is decided
   in `design.md`.


## Decision, 21 Nov 2026

Dr. Yatin decided this on 21 Nov 2026, after the side check (requirement 1.13) was run.

1. **The side check failed for brushing across the face.** With the brush in the right
   hand reaching across the face to the lower left zone, `side` read `right`, with the
   palm as the hand point. The camera sees the hand, not the brush head, and the hand
   stays on the right of the mouth. Same-side brushing read correctly.
2. **The mirror-flip check (requirement 1.8) passed.**
3. **Dr. Yatin chose to stop checking side.** The camera checks that the child is
   brushing, not which side. `REQUIRE_SIDE_MATCH` is `false` (core requirement 5.7). The
   game still tells the child which zone to brush, and the monster still sits on that
   zone's cheek.
4. **The `side` field is still computed** and still shown on the debug page. The signal
   shape does not change.
5. **The remaining feasibility test** records `level` and the other checks of section 5
   of the results file. The 24 side rows are no longer required. Requirements 1.6, 1.9(a)
   and 1.9(c) stay as written, and their side rows are marked as no longer required.


## Decision 2, 21 Nov 2026

Dr. Yatin decided this on 21 Nov 2026, after the level check (requirement 1.12) was run.

1. **The level check failed on the chewing surface.** Right hand, upper right zone,
   chewing surface: `level` read `lower`, `unknown`, `lower`. The brush lies flat at mouth
   height and the palm hangs below the mouth. The outer surface of the same zone passed
   (right, right, right) after `NEAR_MOUTH_FACE_WIDTHS` was tuned to 1.1.
2. **Dr. Yatin chose to stop the test and stop checking level.** `REQUIRE_LEVEL_MATCH` is
   `false` (core requirement 5.7). The camera checks that the child is brushing at the
   mouth and moving. The game tells the child which zone to brush.
3. **The `side` and `level` fields are still computed** and still shown on the debug
   page. The signal shape does not change.
4. **The feasibility test ends here for side and level.** The 24 level rows are no longer
   required. Requirements 1.7 and 1.9(a) stay as written, and their level rows are marked
   as no longer required.
5. **The other checks of section 5 of the results file are still to be done:** second
   hand, both hands, second person and poor light.


## Experiment, 26 Nov 2026

Dr. Yatin's idea of 26 Nov 2026. This is a hypothesis, not a decision.

1. **Why.** The side check failed on 21 Nov because `side` comes from the palm, and the palm
   stays right of the mouth when the right hand reaches across the face to the lower left
   teeth. In a fist grip the toothbrush comes out of the thumb side of the hand, so the brush
   head may be estimated better than the palm.
2. **The estimate.** A fourth hand point, `'brush-head'`: start at the index knuckle
   (landmark 5) and go further along the line from the little-finger knuckle (landmark 17) to
   the index knuckle, by `BRUSH_HEAD_REACH` (1.0) knuckle widths. The arithmetic is done in the
   one unit of requirement 3.2 (x times aspect).
3. **Debug page only.** The estimate is shown on the debug page next to palm, wrist and
   fingertips (its `handNearMouth`, `side` and `level`), and its point is drawn on the preview
   in its own colour. The game does not use it.
4. **Nothing in the game changes.** `HAND_POINT` stays `'palm'`, `REQUIRE_SIDE_MATCH` stays
   `false` and `REQUIRE_LEVEL_MATCH` stays `false`, until Dr. Yatin's brushing test decides.
   `BRUSH_HEAD_REACH` is a starting value, not a dental rule.
5. **Results** go in the section "Brush-head experiment (26 Nov 2026)" of
   `docs/review/TRACKING-TEST-RESULTS.md`. Only Dr. Yatin can say whether it works.

## Decision 3, 21 Nov 2026

Dr. Yatin decided this on 21 Nov 2026, after the browser check of `mirror-and-screens`
(`docs/review/MIRROR-SCREENS-CHECKS.md`).

1. **MediaPipe logs usage by itself.** `@mediapipe/tasks-vision` 1.2.3 has a built-in logger
   with no public off switch. Every task creates it. Every 60 seconds and on close it POSTs
   protobuf usage statistics (task type, running mode, OS, library version, latency numbers;
   no images or landmarks) to `https://odml.pa.googleapis.com/v1/log`. The Content-Security-Policy
   blocked both attempts in the browser check, so nothing was sent.
2. **Switch it off at the source as well.** The CSP stays as the second guard. This is
   requirement 9.6.


## Decision 4, 21 Nov 2026 (evening)

Dr. Yatin decided this on 21 Nov 2026, after measuring camera mode on his laptop. A person
read only the debug page's yes/no readout. Brisk brushing counted 85% of seconds. Gentle
brushing as in the game counted 69%, with 13% lost as "near mouth but not moving". Real game
play counted 37-47% of seconds (pauses, repositioning). Camera speed was the same in the game
and the debug page (about 7.5 frames per second), so speed was not the cause.

1. **`MOVING_MIN_TRAVEL` 0.3 -> 0.2 face widths per second** (requirements 4.5 and 11.4g), so
   gentle, short strokes (correct technique) count as brushing. This is a clinical decision by
   Dr. Yatin.
2. **Nothing else in the tracker changes.** `MOVE_JITTER_STEP` stays 0.01, and the signal
   shape and the null rules are the same.
3. The matching change in how fast a monster falls is in `core-brushing-loop` (requirements
   7.2, 8.5, 8.6, 13.1). The work is task 48 of `mirror-and-screens`.
4. The tests that pin 0.3 (`tests/thresholds.test.ts`, `tests/aggregate-second.test.ts`,
   `tests/tracking-source-rules.test.ts`) are updated to 0.2 in that task. This follows a rule
   Dr. Yatin changed and does not weaken them.
