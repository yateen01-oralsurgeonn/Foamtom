Write the task list for the spec "{{SPEC}}". In this run, write ONLY
`.kiro/specs/{{SPEC}}/tasks.md`. Do not write app code. Do not edit any other file, and
do not change `requirements.md` or `design.md`.

Read first: every file in `.kiro/steering/`, then `requirements.md` and `design.md` in
`.kiro/specs/{{SPEC}}/`, then `.kiro/specs/core-brushing-loop/tasks.md` for the format.

Rules for this task list:
- Same format as `core-brushing-loop/tasks.md`: numbered tasks, a `- [ ]` checkbox on
  every task and every sub-task, a `_Requirements:_` line, a `Test file:` line.
- One task per run: one module (or two small ones) plus its tests. If a task names more
  than about four files, split it.
- Every task ends with `npm run test:run` and `npm run build` both passing, and names the
  files it may change. No task edits anything in `.kiro/`.
- Tests are written in the same task as the code they test.
- Order the tasks so that the game still runs after every task.
- Every requirement appears in at least one task. Manual checks are written as a
  sub-task that says exactly what to look at.
- For "hand-tracking" only: task 1 is the feasibility debug page and its checklist
  (side, level, mirror-flip, both-hands, second-face, poor-light), and task 2 does not
  start until Dr. Yatin has filled in `docs/review/TRACKING-TEST-RESULTS.md`.

When finished, print the task titles in order, then stop.
