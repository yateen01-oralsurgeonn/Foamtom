Small code change from a spec decision. Read first: every file in `.kiro/steering/`,
then `.kiro/specs/core-brushing-loop/requirements.md` (requirement 5.7, and 7.3) and the
"Decision, 21 Nov 2026" section of `.kiro/specs/hand-tracking/requirements.md`.

Make the code agree with core requirement 5.7 as it now reads:
1. `src/logic/constants.ts`: add `export const REQUIRE_SIDE_MATCH = false;` next to
   `REQUIRE_LEVEL_MATCH`, with a one-line comment citing req 5.7 and Dr. Yatin's decision
   of 21 Nov 2026.
2. `src/logic/session.ts`, `isBrushing`: use `(!REQUIRE_SIDE_MATCH || signal.side === zone.side)`,
   the same pattern as the level check. Update its doc comment.
3. Tests under `tests/`: any test that expects a wrong-side signal to NOT count as brushing
   must now follow the constant. Do not delete such tests: make them assert the behaviour
   for the current constant value, and add one test showing that a signal with the wrong
   `side` but the right `level`, near the mouth and moving, counts as brushing. Keep all
   property tests; if a property depended on side matching, adjust it to the rule in 5.7
   and say which one in your summary.

Rules: change only `src/logic/constants.ts`, `src/logic/session.ts` and files in `tests/`.
Do not edit anything in `.kiro/`. No network calls, no new npm packages.

Finish by running `npm run test:run` and then `npm run build`. If either fails after two
attempts, STOP and report the output.

When finished, print the files you changed, any test whose meaning changed, and the last
lines of the test and build output. Then stop.
