Write the design for the spec "{{SPEC}}". In this run, write ONLY
`.kiro/specs/{{SPEC}}/design.md`. Do not write tasks.md. Do not write app code. Do not
edit any other file, and do not change `requirements.md`.

Read first: every file in `.kiro/steering/`, then `.kiro/specs/{{SPEC}}/requirements.md`,
then `requirements.md` and `design.md` of `core-brushing-loop`.

Rules for this design:
- Same sections and style as the `core-brushing-loop` design: overview, architecture
  diagram, module list, types, behaviour, error handling, testing strategy.
- Reuse what exists. Do not redefine `BrushingSignal`, `SignalSource`, `SessionResult`,
  the tick rule, any constant, or any stored value from `core-brushing-loop`.
- Everything decided by data is a pure function with a named test. Nothing under
  `src/logic/` imports from `src/ui/`, `src/tracking/`, `src/storage/` or `src/audio/`.
- No new timer outside `src/ui/game-loop.ts`, except CSS animations.
- No network calls, no stored frames or landmarks, no third-party files at run time.
- Every requirement number appears next to the design element that meets it. At the end,
  add a table "requirement → design element → test" with no empty cell; where a test is
  manual, say "manual" and what to look at.
- Where a choice is Dr. Yatin's (dental wording, a number a parent will see), write
  "Dr. Yatin to confirm" and stop short of deciding it.

When finished, print the section titles and any "Dr. Yatin to confirm" items, then stop.
