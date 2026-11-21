Spec edit plus one constant, from Dr. Yatin's decision of 21 Nov 2026.
Read first: every file in `.kiro/steering/` (`dental-rules.md` is ALREADY amended with his
approval), then `.kiro/specs/core-brushing-loop/requirements.md` (5.4-5.7, 6.3, 7.2, 7.3)
and `.kiro/specs/hand-tracking/requirements.md` (1.12 and the Decision sections).

Background (hand-tracking 1.12): the level check FAILED on 21 Nov 2026. Right hand, upper
right zone, chewing surface: `level` read `lower`, `unknown`, `lower`, because the brush
lies flat at mouth height and the palm hangs below the mouth. The outer surface of the same
zone passed (RRR) after `NEAR_MOUTH_FACE_WIDTHS` was tuned to 1.1. Dr. Yatin decided to
stop the test and set `REQUIRE_LEVEL_MATCH` to `false`: the camera checks that the child is
brushing at the mouth and moving; the game guides which zone.

Make these changes:
1. `core-brushing-loop` 5.7: record that `REQUIRE_LEVEL_MATCH` is now `false` by Dr. Yatin's
   decision of 21 Nov 2026 (level check failed). Keep the existing sentences; add to them.
2. `core-brushing-loop`: fix any wording that now contradicts 5.7 (with both constants
   `false`, a present signal counts as brushing when `handNearMouth` and `moving` are true).
   Keep changes minimal.
3. `hand-tracking` requirements: add a section "Decision 2, 21 Nov 2026" after "Decision,
   21 Nov 2026", in the same style: the level check failed (facts above); the 1.1 tuning;
   `REQUIRE_LEVEL_MATCH` = `false`; `side` and `level` are still computed and shown on the
   debug page; the feasibility test ends here for side and level (the 24 level rows are no
   longer required); the other checks in section 5 of the results file (second hand, both
   hands, second person, poor light) are still to be done. Add one sentence to 1.12
   pointing to it. Update the steering quote in the `hand-tracking` intro to match the new
   `dental-rules.md` text.
4. `src/logic/constants.ts`: set `REQUIRE_LEVEL_MATCH = false` with a one-line comment
   citing req 5.7 and the 21 Nov 2026 decision.
5. Tests: any test that assumes `REQUIRE_LEVEL_MATCH` is `true` must follow the constant
   (do not delete tests; keep both branches tested the way the side tests already do).

Rules: change only the two requirements files, `src/logic/constants.ts` and files in
`tests/`. No network, no new packages. Finish with `npm run test:run` then `npm run build`;
if either fails after two attempts, STOP and report.

When finished, print the changed requirements, the new section, the files changed and the
last lines of test and build output. Then stop.
