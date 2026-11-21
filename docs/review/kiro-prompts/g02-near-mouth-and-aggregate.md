Two small changes, approved by Dr. Yatin on 21 Nov 2026 after the debug-page test.
Read first: every file in `.kiro/steering/`, then `.kiro/specs/hand-tracking/requirements.md`
(3.3, 3.6, the Decisions sections) and `design.md` (section 5.5 thresholds and the
aggregation section).

1. Tune `NEAR_MOUTH_FACE_WIDTHS` from 0.7 to 1.1 (hand-tracking decision 3 of 19 Nov:
   starting values are tuned on the debug page). Evidence: with the palm hand point, an
   adult brushing the front teeth had the palm about 0.93-0.95 face widths from the mouth
   centre, and brushing the upper back teeth about 0.6-0.8, so `handNearMouth` read false
   while he was brushing. Change it in `src/tracking/thresholds.ts`, and change the value
   in the threshold table of `.kiro/specs/hand-tracking/design.md` with a short note
   "tuned 21 Nov 2026 on the debug page". Tests that hard-code 0.7 should read the
   constant instead.

2. Bug against requirement 3.6: `aggregateSecond` in `src/tracking/aggregate-second.ts` can
   return `handNearMouth: false` with `side` or `level` not `unknown` (when fewer than half
   the frames are near the mouth, side and level are still taken from the near frames).
   Make `side` and `level` `unknown` whenever the aggregated `handNearMouth` is false. Add
   a test (a property test if one fits the existing style) that a second with
   `handNearMouth` false always has `side` and `level` equal to `unknown`.

Rules: change only `src/tracking/thresholds.ts`, `src/tracking/aggregate-second.ts`, files
in `tests/`, and that one table row in `design.md`. Do not delete or weaken tests. No
network calls, no new npm packages.

Finish by running `npm run test:run` and then `npm run build`. If either fails after two
attempts, STOP and report the output.

When finished, print the files you changed and the last lines of the test and build
output. Then stop.
