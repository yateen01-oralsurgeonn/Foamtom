This is a SPEC EDIT, not a build. Do not write app code.

Edit only `.kiro/specs/hand-tracking/requirements.md`. Do not create, edit or delete any
other file. Keep everything else in the file word for word, and keep all requirement numbers.
If a decision below conflicts with a steering file, `core-brushing-loop`, or another
requirement, stop and say so. Do not guess.

Dr. Yatin answered the eight open questions on 19 Nov 2026. Replace the section
"Open questions for Dr. Yatin (not decided in this spec)" with a section "Decisions,
19 Nov 2026", and make requirements 1.12, 1.13, 5.3, 7.1 and 8.4 agree with it.

1. A surface (cheek side, chewing, tongue side) PASSES the side check, and separately the
   level check, when at least 2 of its 3 readings are right. All three readings are
   recorded anyway. Requirements 1.12 and 1.13 use this rule instead of "as Dr. Yatin judges".
2. The hand point is chosen in design.md; the feasibility test checks it (wrist, palm
   centre, fingertips are compared there).
3. Starting threshold values come from design.md and are tuned on the debug page.
4. "Once per session" means one brushing session; the camera permission is asked again
   only if the browser has forgotten it. Update 7.1 to say so.
5. When both hands are near the mouth, `side` is `unknown` and `level` is also `unknown`.
   Update 5.3.
6. The debug page is a separate dev-only entry that the production build leaves out;
   design.md decides the details.
7. When the face is lost, the monster keeps the plain-screen position (as 8.4 says).
8. The row layout of `docs/review/TRACKING-TEST-RESULTS.md` is decided in design.md.

When finished, print the Decisions section and the changed requirements, then stop.
