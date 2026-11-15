Implement task {{N}} of `.kiro/specs/{{SPEC}}/tasks.md`. Implement that ONE task and all
of its sub-tasks, and nothing else.

Read first: every file in `.kiro/steering/`, then `requirements.md`, `design.md` and
`tasks.md` in `.kiro/specs/{{SPEC}}/`. If the spec is not `core-brushing-loop`, also read
that spec's `design.md`.

Rules:
1. Create or change only the files that task {{N}} names. Do not start any other task.
2. Do not edit anything in `.kiro/`, with one exception: when the task is finished and
   the checks pass, tick the checkboxes of task {{N}} and its sub-tasks in `tasks.md`.
   Never change requirements, design, steering or hooks.
3. Follow the design exactly: same file names, function names, types and constants. If
   the design is unclear, or two parts of the spec disagree, STOP, say exactly what is
   unclear, and change nothing. Do not guess.
4. No new npm packages beyond those the task or `tech.md` names.
5. Kid safety and privacy (`kid-safety-privacy.md`) override everything: no network
   calls, no stored or logged frames or landmarks, no cookies, no third-party files, no
   `Math.random` in `src/logic/`.
6. Write the tests the task lists, in the same run, with the test names from the design.
   Do not weaken, skip or delete an existing test to make it pass.
7. Finish by running `npm run test:run` and then `npm run build`. Both must pass. If a
   check still fails after two attempts to fix it, STOP and report the failing output.

When finished, print: the files you created or changed, the test names you added, and
the last lines of the test and build output. Then stop.
