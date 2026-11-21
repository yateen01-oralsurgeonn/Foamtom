This is a SPEC EDIT, not a build. Do not write app code.

Edit only:
- `.kiro/specs/hand-tracking/tasks.md` (task 2 only)
- `.kiro/specs/core-brushing-loop/design.md` (only where it lists `REQUIRE_LEVEL_MATCH`)

Read first: `.kiro/steering/`, the two "Decision ... 21 Nov 2026" sections of
`.kiro/specs/hand-tracking/requirements.md`, core requirement 5.7, and
`docs/review/TRACKING-TEST-RESULTS.md` (both verdicts are filled in, initialled YGS,
2026-11-21). `src/logic/constants.ts` already has `REQUIRE_SIDE_MATCH = false` and
`REQUIRE_LEVEL_MATCH = false`, set in commits on 21 Nov by Dr. Yatin's decision.

Task 2 was written before those decisions. 2.1 says to STOP if the side verdict is fail;
Dr. Yatin has since decided what happens next (requirement 1.13 and the Decision section).
Rewrite task 2 so it agrees with the decisions:
1. 2.1: the side verdict is fail and carries his decision; check that
   `REQUIRE_SIDE_MATCH` is `false`. Still STOP if a verdict is missing or has no initials
   and date.
2. 2.2: the level verdict is fail and `REQUIRE_LEVEL_MATCH` is already `false` (done on
   21 Nov); record nothing new.
3. 2.3: thresholds: Dr. Yatin approved `NEAR_MOUTH_FACE_WIDTHS` = 1.1 (already in
   `thresholds.ts`); nothing else changes.
4. 2.4: `tests/tracking-decision.test.ts` tests that both verdicts exist with initials and
   a date, that if the side verdict says fail then `REQUIRE_SIDE_MATCH` is `false`, and if
   the level verdict says fail then `REQUIRE_LEVEL_MATCH` is `false`. The test only reads
   the constants. The verdict text is free prose in his words: match "fail"/"Failed"
   case-insensitively, and initials as `Initials: <letters>, <YYYY-MM-DD>`.
5. Keep 2.5 and the files list (add nothing else).

In core `design.md`, update the `REQUIRE_LEVEL_MATCH` entry to show it is `false` since
21 Nov 2026 by Dr. Yatin's decision, and add `REQUIRE_SIDE_MATCH` (`false`, same date)
next to it in the same style.

Do not touch anything else. When finished, print the new task 2 and the design.md change,
then stop.
