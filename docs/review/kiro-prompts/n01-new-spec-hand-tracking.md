Create a new spec called "hand-tracking" for Foamtom: The Haunted Mirror. In this run,
write ONLY `.kiro/specs/hand-tracking/requirements.md`, in EARS format, in the same style
as `.kiro/specs/core-brushing-loop/requirements.md`. Do not write design.md or tasks.md
yet. Do not write app code. Do not edit any other file.

Read first: every file in `.kiro/steering/` (follow `kid-safety-privacy.md` and
`dental-rules.md` strictly), then `requirements.md` and `design.md` of
`core-brushing-loop`. That spec already defines the `BrushingSignal` shape, what `null`
means, the `SignalSource` interface, the 8-second start limit and the tick rule. Do not
redefine or change any of them; this spec only produces the signal.

SCOPE OF THIS SPEC

1. **A feasibility test first (requirement 1, and it must become the first task).**
   A debug page for the developer and Dr. Yatin only: mirrored preview, landmarks drawn,
   and the computed signal shown live in large text (`handNearMouth`, `side`, `level`,
   `moving`, or "null"). Not linked from the game and not in the production build. It
   obeys every privacy rule (nothing saved, sent or logged). Dr. Yatin brushes in front of
   it and records pass or fail for each check in
   `docs/review/TRACKING-TEST-RESULTS.md` (words only, no images):
   - Side check: brush each of the four zones; does `side` read the side being brushed?
     Do it three times per zone and record each separately: outer surfaces (cheek side),
     chewing surfaces, inner surfaces (tongue side). The handle leaves the mouth at a
     different place for each, so the hand may read a different side.
   - Level check: for each zone, does `level` read upper or lower correctly? Record it
     for the same three surfaces.
   - Mirror-flip check: raise the left hand (the child's own left). The signal must say
     `left`, and the hand must appear on the left of the mirrored preview.
   - Both-hands check: (a) repeat the side check with the brush in the right hand, then
     in the left hand; (b) brush with one hand while the other hand is in view (on the
     sink edge, then touching the cheek): the signal must follow the hand at the mouth;
     (c) both hands near the mouth at once: `side` must be `unknown`, never a guess.
   - Second-face check: a second person steps into view behind; the signal must not
     change.
   - Poor-light check: lights dimmed until the face is lost; the signal must become
     `null`, not a guess.
   State the decision rule: if the level check fails, Dr. Yatin sets
   `REQUIRE_LEVEL_MATCH` to false (core-brushing-loop requirement 5.7). If the side check
   fails, work stops and Dr. Yatin decides.

2. **Left and right.** `side` is always the child's own left or right. The raw camera
   frame is not mirrored, so the child's left appears on the right of the raw image. The
   preview is mirrored for display only (CSS). The conversion happens in exactly one
   function, and it has the first fixture test.

3. **Pure classification, testable without a camera.**
   - `classifyFrame(landmarks)` → a per-frame result. Distances are measured relative to
     face width, so they do not depend on how far the child stands.
   - `handNearMouth`: the hand point is within a set fraction of face width from the
     mouth centre.
   - `side`: from the hand's position relative to the mouth centre line, with a dead zone
     in the middle that gives `unknown`.
   - `level`: from the hand's height relative to the mouth, with a dead zone that gives
     `unknown`.
   - `aggregateSecond(frames)` → one `BrushingSignal` or `null`: `null` if fewer than 5
     frames arrived in the second or the face was seen in fewer than half of them;
     `handNearMouth`, `side` and `level` by majority, `unknown` when there is no clear
     majority; `moving` from how far the hand travelled during the second.
   - Every threshold is a named constant in one file, so the feasibility test can tune it.

4. **One face, the right hand.** Track one face only, the largest. A second face never
   changes the signal. Detect up to two hands and use the one nearest the mouth.

5. **The real `SignalSource`.** Camera + MediaPipe Tasks Vision behind the existing
   interface. Model and WASM files served from `/public/models/` (same origin), loaded
   only after the start tap. `stop()` stops every camera track. When the tab is hidden
   the stream stops; on return it restarts without a new permission prompt where the
   browser allows. Permission is asked once per session and never nagged.

6. **Preview and monster position.** A mirrored live preview on the session screen, with
   the monster drawn on the cheek of the active zone. The tracker may give the UI one
   extra value for drawing only (mouth position and face width). It must never reach
   `src/logic/`, storage, the network or the console.

7. **Size and speed.** Record the real size of each model and WASM file in the design.
   Prefer the smallest models that pass the feasibility test (for example a face detector
   that gives a mouth point instead of the full face mesh; check the MediaPipe docs, do
   not assume). 20+ fps on a mid-range 2022 Android phone, checked by hand.

8. **Tests.** Property and unit tests on `classifyFrame` and `aggregateSecond` using
   fixture landmark arrays. Fixtures are written by hand as plain numbers. They must NOT
   be captured from a real person's camera (that would be a stored derived measurement).
   The privacy guard test from core-brushing-loop must keep passing with the camera code
   in place.

OUT OF SCOPE: game rules, monster art, the Monster Book, the parent screen.

Ask me before deciding anything this prompt does not settle. Do not invent dental facts.
When finished, print the requirement titles, then stop.
