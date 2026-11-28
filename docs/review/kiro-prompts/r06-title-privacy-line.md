Make the privacy line on the title screen exact. Steering and spec first, then code and test.

Read first: `.kiro/steering/kid-safety-privacy.md`, `.kiro/specs/mirror-and-screens/requirements.md`
(the shown-text table near row 1) and `design.md` (the `display-text.ts` section and the text table),
`.kiro/specs/parent-screen/requirements.md` (the two places that quote the title-screen line),
`src/ui/display-text.ts`, `tests/display-text.test.ts` and `README.md` (the "Privacy" section).

Why (Dr. Yatin, 28 Nov 2026): the title screen says "The camera stays on this phone. Nothing is saved
or sent." But brushing times ARE saved on the device (Monster Book, Grown-ups screen), so "Nothing is
saved" says more than the game does. The README was already made exact on 26 Nov ("The camera picture
stays on this phone. It is never saved or sent. Only brushing times are kept, on this device."). His
decision: the title screen line becomes exactly

    The camera picture stays on this phone. It is never saved or sent.

This is his approved change to his own steering rule.

Change, replacing the old sentence with the new one exactly, and nothing else:
1. `.kiro/steering/kid-safety-privacy.md`, line 31 (the example of plain wording a parent can trust).
2. `.kiro/specs/mirror-and-screens/requirements.md` (the shown-text table, row 1) and `design.md`
   (both places that quote it).
3. `.kiro/specs/parent-screen/requirements.md` (both places that quote the title-screen line).
4. `src/ui/display-text.ts` (`DISPLAY_TEXT['privacy']`) and `tests/display-text.test.ts`.

Do NOT change: completed task lines in any `tasks.md` (they record finished work), anything under
`docs/` (old prompts, reviews and the old storyboard are history), `README.md`, or any other code.
The line stays shown and never spoken, in the same place under the start button.

Rules: kid safety and privacy override everything. No network calls, no new npm packages. If the new
line conflicts with any other steering or spec line, or the old sentence is not found where listed,
STOP, say exactly what and where, and change nothing.

Finish with `npm run test:run` then `npm run build`. If either fails after two attempts, STOP and
report. Then print the files you changed and the last lines of the test and build output.
