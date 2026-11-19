This is a SPEC EDIT, not a build. Do not write app code.

Edit only `.kiro/specs/hand-tracking/design.md` and `.kiro/specs/hand-tracking/tasks.md`.
Do not create, edit or delete any other file. Keep everything not listed below word for word.
If an instruction conflicts with a steering file or another requirement, STOP and say so.

Problem found when part 1C was run: `selectHandPoint` needs MediaPipe hand landmark indices
(palm = 0, 5, 9, 13, 17; fingertips = 4, 8, 12, 16, 20; wrist = 0), but `classify-frame.ts`
may hold no numeric literal other than 0, 1 and 2. Dr. Yatin's decision (19 Nov 2026, option
1): the indices become exported constants in `src/tracking/thresholds.ts`.

1. `design.md` section 5.5 (thresholds table) and the section 3 row for `thresholds.ts`: add
   three exported constants, with a comment that they follow the MediaPipe hand landmark
   order: `PALM_LANDMARKS = [0, 5, 9, 13, 17]`, `WRIST_LANDMARK = 0`,
   `FINGERTIP_LANDMARKS = [4, 8, 12, 16, 20]`. In section 5.2 say `selectHandPoint` reads
   these constants. Section 12 test 15 (`thresholdsInOneFile`): list them with the other
   constants that must be exported from `thresholds.ts`. Keep the rule "no numeric literal
   other than 0, 1, 2" unchanged.
2. `tasks.md` part 1C: 1C.1 says `selectHandPoint` uses `PALM_LANDMARKS`, `WRIST_LANDMARK` and
   `FINGERTIP_LANDMARKS` from `thresholds.ts`. Add `src/tracking/thresholds.ts` and
   `tests/thresholds.test.ts` to the "Files this task may change" line of 1C, and say that 1C
   adds these three exports to `thresholds.ts` and extends the 1B.5 test so it checks they are
   exported. Do not tick any box.

When finished, print the changed passages and stop.
