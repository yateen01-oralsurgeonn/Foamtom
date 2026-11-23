This is a SPEC EDIT. Do not change any code or test.

Dr. Yatin found a visible fault on 23 Nov 2026, in manual checks 35.4 and 40.2. On the Monster Book screen
there is an empty dark rounded plate under the line "Brush morning AND night." It is the caption element
`p.book__caption`: it has an opaque background (the caption plate of requirement 11.7) and `min-height: 2.6rem`,
so the plate shows even when it holds no text. It looks like a bug. The fix: while the caption is empty, the plate
SHALL NOT be painted, but its space SHALL stay reserved, so nothing jumps when a monster name appears.

Edit ONLY these three files in `.kiro/specs/mirror-and-screens/`:

1. `requirements.md`
   - Requirement 7 (Monster Book screen): add one acceptance criterion: when the caption holds no text, the
     caption plate is not painted (no background), and the caption keeps its reserved height. When it holds a
     monster name or the rare invitation line, the opaque plate shows as before.
   - Add this decision, dated 23 Nov 2026, to the decisions list.
   - Change no approved line. No new wording.

2. `design.md`
   - In the Monster Book part, one sentence: `.book__caption:empty` is transparent (the plate colour applies
     only when the element has text); height stays reserved by `min-height`.
   - Add a row to the traceability table for the new criterion.

3. `tasks.md`
   - Add a new task 50 at the end, in the same style as task 49:
     50.1 In `src/ui/screens.css` add a rule `.book__caption:empty` that sets `background: transparent`
          (and removes the padding paint if needed), keeping the `min-height` of `.book__caption`.
     50.2 Add a test to `tests/css-guards.test.ts`: screens.css has a `.book__caption:empty` rule with a
          transparent background, and `.book__caption` still has a `min-height`.
     50.3 Run `npm run test:run` and `npm run build`: both pass.
     50.4 Check by hand (Dr. Yatin): open the Monster Book with no monsters: no dark empty plate under the
          caption line. Tap an owned monster: its name shows on the normal plate. Tap away: the plate disappears
          again and nothing jumps.
   - Files this task may change: `src/ui/screens.css`, `tests/css-guards.test.ts`.
   - Add one note to task 35 and one to 40.2: the empty plate was found here and fixed by task 50.

Change nothing else. When finished, print the changed lines, then stop.
