This is a SPEC EDIT, not a build. Edit only `.kiro/specs/mirror-and-screens/tasks.md`.

Task 45 adds the reduced-motion class `fx-no-hit` (Dr. Yatin's decision of 21 Nov 2026: no flinch
with reduced motion). `tests/effects-host.test.ts` pins the list of moving-effect classes
(`MOVING_CLASSES`, about line 58) and therefore fails. In task 45, add `tests/effects-host.test.ts`
to the files it may change, with this note: add `'fx-no-hit'` to `MOVING_CLASSES`; nothing else in
that file changes and no assertion is weakened. Change nothing else.

When finished, print task 45's file list, then stop.
