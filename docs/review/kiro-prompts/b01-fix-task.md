Task {{N}} of `.kiro/specs/{{SPEC}}/tasks.md` has been implemented, but a check fails. The
failing output is at the bottom of this message.

Read first: every file in `.kiro/steering/`, then `requirements.md`, `design.md` and
`tasks.md` in `.kiro/specs/{{SPEC}}/`, then the files task {{N}} names.

Rules:
1. Fix the cause. Change only the files that task {{N}} names.
2. Do not weaken, skip or delete a test to make it pass. If you believe the test is wrong
   because it disagrees with the design, STOP and say exactly where they disagree.
3. Do not edit anything in `.kiro/` except ticking task {{N}}'s checkboxes once
   everything passes.
4. No network calls, no stored frames, no new npm packages.
5. Finish by running `npm run test:run` and then `npm run build`. If either still fails,
   STOP and report the output. Do not try a third approach.

When finished, print what the cause was in one or two sentences, the files you changed,
and the last lines of the test and build output. Then stop.

FAILING OUTPUT:
