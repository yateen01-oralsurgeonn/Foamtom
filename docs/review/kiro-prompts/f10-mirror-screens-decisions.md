This is a SPEC EDIT, not a build. Do not write app code.

Edit only `.kiro/specs/mirror-and-screens/requirements.md`. Keep requirement numbers.

Dr. Yatin answered on 21 Nov 2026. Replace the section "Open questions for Dr. Yatin" with a
section "Decisions, 21 Nov 2026", and make the requirements agree with it:

1. The title screen gets a second, smaller Monster Book button (smaller than the start
   button, at least 48 px). Update requirement 7.8 and the title screen requirement.
2. On the end card, "Two minutes. Every corner." is said AFTER the existing `end` line,
   which stays unchanged.
3. Monster names are spoken from the `monsters.ts` table, with a caption, covered by the new
   guard of requirement 14.4 (option b). The existing wording guard in `tests/lines.test.ts`
   is not changed. All twelve names are spoken this way, for consistency.
4. The rare-monster invitation is one line for the rare group, also spoken when a rare
   silhouette is tapped (the default stands).
5. No mute control in the game (the default stands).
6. All 19 lines in "Lines for Dr. Yatin to approve" are APPROVED on 21 Nov 2026. Rename the
   section "Approved lines (21 Nov 2026)" and keep the table.
7. The 360 x 640 px smallest viewport assumption stands.

When finished, print the Decisions section and the changed requirements, then stop.
