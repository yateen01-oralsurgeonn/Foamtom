This is a SPEC EDIT. Do not change any code or test.

Dr. Yatin decided on 23 Nov 2026, during the parent-screen manual check 38.5: he could not find the
parent entry control on the title screen because it shows only an icon. The control SHALL now show
the small word "Grown-ups" next to its icon. The word is the line he already approved (row 18 of
"Approved lines (21 Nov 2026)"); no new wording.

Edit ONLY these three files in `.kiro/specs/mirror-and-screens/`:

1. `requirements.md`
   - Requirement 2.2: replace "Its visible mark SHALL be an icon; its label is an accessible name"
     with: its visible mark SHALL be an icon followed by the small word "Grown-ups" (the approved
     line), in a text size and colour quieter than the Monster Book button's text, so a parent can
     find it and a child is not drawn to it. Keep the 48 px minimum and "smaller and quieter than
     both" rules.
   - Row 18 of "Approved lines (21 Nov 2026)": change "Name only (the control shows an icon)" to
     "Shown, small, next to the icon (changed 23 Nov 2026)".
   - Add this decision, dated 23 Nov 2026, to the decisions list.

2. `design.md`
   - `DISPLAY_TEXT['grown-ups']` kind becomes `shown`.
   - The "Parent control (req 2)" paragraph and the traceability row for 2.2: the quiet button holds
     the icon and the visible word; the accessible name stays "Grown-ups" (no doubled reading: the
     icon stays aria-hidden).

3. `tasks.md`
   - Add a new task 49 at the end, in the same style as the other tasks: update `DISPLAY_TEXT`
     (kind `shown`), the title panel (a text span after the icon, with a CSS class for the quieter
     text), the styles, and the tests that pin the kind and the icon-only look
     (`tests/display-text.test.ts`, `tests/title-panel.test.ts`, `tests/title-model.test.ts` if needed).
     The control stays absent from the session screen and the end card. Last sub-task: run
     `npm run test:run` and `npm run build`. Add one hand-check sub-task for Dr. Yatin: the word is
     readable, quieter than Monster Book, and fits at 360 x 640 without wrapping.
   - In task 38.5, add one note: the visible word was added by task 49.

Change nothing else. When finished, print the changed lines, then stop.
