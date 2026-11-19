This is a SPEC EDIT, not a build. Do not write app code.

Edit only `.kiro/specs/hand-tracking/design.md` and `.kiro/specs/hand-tracking/requirements.md`
(requirements.md: ONE added line in 4.4, nothing else). Do not create, edit or delete any
other file. Keep everything not listed below word for word; keep all numbers and names.
If an instruction conflicts with a steering file, `core-brushing-loop`, or another
requirement, STOP and say so. Do not guess.

Context: Opus reviewed design.md on 19 Nov 2026 (docs/review/DESIGN-REVIEW-hand-tracking.md).
Dr. Yatin approved the three confirmations and fixes A to D.

1. `design.md` section 14 ("Dr. Yatin to confirm"): replace it with "Decisions, 19 Nov 2026":
   (1) There is no automatic overall pass count. The results file records counts; Dr. Yatin
   writes the overall side and level verdicts himself (a surface passes at 2 of 3 right).
   Update the matching text in section 7.3 so it no longer says "Dr. Yatin to confirm".
   (2) `HAND_POINT` may change from `palm` to `wrist` or `fingertips` if that point passes
   where the palm fails, with Dr. Yatin's yes.
   (3) Adding only `'wasm-unsafe-eval'` to `script-src` is allowed. Any other CSP relaxation
   (`blob:`, `'unsafe-eval'`, a host) or any exception to the privacy guard stops work and
   Dr. Yatin decides.

2. FIX A. `aggregateSecond` (design 5.4, test 9 `aggregateMajority`, and the note about
   11.4f): `handNearMouth` stays a strict majority of ALL frames. `side` and `level` are
   decided by strict majority among the frames where `handNearMouth` is true (count only those
   frames; `unknown` when no side or level holds more than half of them, and `unknown` when no
   frame has the hand near the mouth). Reason to state in one sentence: core 6.3 drains an
   unclear signal 0 but a `null` signal 2, so dead-zone frames must not cancel clear readings.
   `requirements.md` 4.4: add ONE sentence at the end: "`side` and `level` are decided by
   majority among the frames in which `handNearMouth` is true." Change nothing else there.

3. FIX B. Results file (design 7.2): the reading codes become R, W, U and N. N = the signal
   was `null`. N counts as not right. Add one line: many N while brushing means try
   `FACE_MODEL = 'mesh'`. Update `surfacePasses` (test 30) and `resultsFileIsWordsOnly`
   (test 31) so they accept R, W, U, N.

4. FIX C. Test 31 `resultsFileIsWordsOnly` must not be skipped. Say that the first task
   creates `docs/review/TRACKING-TEST-RESULTS.md` as an empty template (headings and empty
   tables, no readings), so the test always runs. Fix the matching row in section 11.

5. FIX D. State in section 8.4 and 7.2 item 7 that 20 frames per second (req 10.4) means the
   picture and drawing; the tracking rate is recorded on its own line in the results file and
   must give at least 5 frames in a normal second (req 10.5).

When finished, print the changed passages and stop.
