CONTEXT ADDED 22 Nov 2026 for the parent-screen design (read before the prompt below):

- Also read `requirements.md` and `design.md` of `mirror-and-screens` (the display-only text
  table, requirement 2 entry point, accessibility requirement 11) and the existing files
  `src/logic/stats.ts`, `src/logic/storage*`, `src/logic/miss-score.ts`,
  `src/logic/time-of-day.ts`, `src/ui/display-text.ts`, the title screen files and
  `src/main.ts`. Reuse them; do not change their behaviour or their tests.
- The parent-screen requirements' "Decisions (22 Nov 2026)" and every row of "Lines for
  Dr. Yatin to approve" are settled and approved. Use the lines word for word; do not invent
  new parent-facing text. Nothing should be "Dr. Yatin to confirm" unless the requirements
  leave it open.
- The title-screen entry control is `mirror-and-screens` tasks 36-38 (not built). Design
  how `main.ts` opens this screen with one handler, and say whether this spec's tasks may
  wire it (state the dependency; do not design the control itself).
- Keep each requirement's "needed for the video" / "later" mark next to its design element,
  so the task list builds the video's needs first (deadline 4 Dec 2026).

