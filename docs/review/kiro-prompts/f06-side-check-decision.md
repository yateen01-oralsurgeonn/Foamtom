This is a SPEC EDIT, not a build. Do not write app code.

Edit only these two files:
- `.kiro/specs/core-brushing-loop/requirements.md`
- `.kiro/specs/hand-tracking/requirements.md`

Do not create, edit or delete any other file. Keep everything else word for word, and keep
all requirement numbers. If the decision below conflicts with a steering file or another
requirement, stop and say so. Do not guess.

Background (hand-tracking requirement 1.13): on 21 Nov 2026 the side check FAILED.
With the brush in the right hand reaching across the face to the lower left teeth, `side`
read `right`, because `side` comes from the hand's position and the hand stays on the
right of the mouth. The camera sees the hand, not the brush head. Same-side brushing read
correctly, and the mirror-flip check (1.8) passed. Children often brush across the face.

Dr. Yatin's decision, 21 Nov 2026: **the camera checks that the child is brushing, not
which side.** The game still tells the child which zone to brush, and the monster still
sits on that zone's cheek.

Make these changes:

1. `core-brushing-loop` requirement 5.7: add a second constant next to
   `REQUIRE_LEVEL_MATCH`, named `REQUIRE_SIDE_MATCH`, set to `false` by Dr. Yatin's decision
   of 21 Nov 2026 (the side check failed for brushing across the face). WHEN it is `false`
   THE SYSTEM SHALL ignore `side` in 5.4 and 5.5. Write it in the same style as the
   existing `REQUIRE_LEVEL_MATCH` sentence. Do not change `REQUIRE_LEVEL_MATCH`: the level
   check still decides it.
2. `core-brushing-loop` 6.3 and 7.3: make sure they still read correctly when side is
   ignored (a present signal that does not match per 5.4 drains nothing). Change wording
   only if it now contradicts 5.7.
3. `hand-tracking` requirements: add a section "Decision, 21 Nov 2026" after the
   "Decisions, 19 Nov 2026" section. Say: the side check failed for brushing across the
   face (right hand, lower left zone, palm hand point); the mirror-flip check passed;
   Dr. Yatin chose to stop checking side (`REQUIRE_SIDE_MATCH` = `false`); the `side`
   field is still computed and shown on the debug page; the remaining feasibility test
   records `level` and the other checks of section 5 of the results file, and the 24 side
   rows are no longer required.
4. `hand-tracking` 1.13: add one sentence pointing to that decision section. Keep the
   rule itself.

Answers to your first run's questions (21 Nov 2026):
- Dr. Yatin approved amending the steering files, and they are ALREADY amended:
  `dental-rules.md` ("The brush hand is near the mouth and moving ... the camera does not
  check the side") and `product.md` step 4. Read them again. Also update the quote of the
  old `dental-rules.md` sentence in the `hand-tracking` intro so it matches the new text.
- Keep `hand-tracking` 1.6, 1.9(a) and 1.9(c) word for word; the new decision section
  marks the side rows as no longer required.
- Core 7.2, 7.3, 13.1, 14.1: change "wrong zone" wording only where it now contradicts
  5.7 (side ignored, level still checked). Keep changes minimal.

When finished, print the changed requirements and the new section, then stop.
