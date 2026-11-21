Dr. Yatin's decision, 21 Nov 2026, on the conflict you reported in task 4 of
`.kiro/specs/hand-tracking/tasks.md` (4.1 restart on resume vs 4.3 "start() once per
session" in `gameLoopExactTicks`):

The "once per session" rule predates restart-on-resume. Change it to: in camera mode,
`start()` is called once when the session starts plus exactly once for each resume that
does not drop the session; in timer-only mode it is never called again. Do not loosen it
further (it must stay an exact count, not "at least").

Do this:
1. In `.kiro/specs/hand-tracking/tasks.md`, task 4.3 only: replace "`start()` once per
   session" (or its wording there) with the rule above, and add "(changed 21 Nov 2026 by
   Dr. Yatin's decision, restart on resume)". Change nothing else in `.kiro/`.
2. In `tests/game-loop.test.ts`, change the `startCalls` assertion in `gameLoopExactTicks`
   to the exact count from the rule above, computed from the generated visibility events.
   Do not change any other assertion of that test.
3. Keep your task 4 code and the four `gameLoopResumeRestart` tests already in the working
   tree.
4. Run `npm run test:run` and `npm run build`. If both pass, tick task 4 and its
   sub-tasks. If either fails after two attempts, STOP and report.

When finished, print the new 4.3 text, the changed assertion, and the last lines of the
test and build output. Then stop.
