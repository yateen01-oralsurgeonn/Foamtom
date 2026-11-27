Change the camera start limit from 8 seconds to 15 seconds, and show a friendly waiting line while
the camera gets ready. Spec first, then code and tests.

Read first: every file in `.kiro/steering/`, `.kiro/specs/core-brushing-loop/requirements.md`
(requirement 8, requirement 15) and `design.md` (the error table near "Camera not ready within 8 s"),
`.kiro/specs/hand-tracking/requirements.md` (6.3, 6.5, 6.6, 10.3) and `design.md` (the rows that
mention the 8 s limit), `.kiro/specs/mirror-and-screens/requirements.md` (13.6), `src/ui/game-loop.ts`,
`src/main.ts` and `tests/game-loop.test.ts`.

Why (Dr. Yatin, 27 Nov 2026): a cold-start test on the live GitHub Pages site measured the time from
the start tap until the camera and models are ready, with an empty cache: about 5 s on 20 Mbit/s,
about 10 s on 10 Mbit/s, about 18 s on 5 Mbit/s (his own phone on mobile data: 4-6 s). Below about
10 Mbit/s the session falls into guided-timer mode before the camera is ready. His decision, option B:
keep requirement 6.3 exactly as it is (nothing camera-related loads before the start tap, so families
who never start a game download nothing), raise the limit to 15 seconds, and tell the child what is
happening while they wait.

Build this:

1. `.kiro/specs/core-brushing-loop/requirements.md`: in 8.1 change "within 8 seconds of the start tap"
   to "within 15 seconds of the start tap". Add a new requirement 8.5:
   "WHILE the camera is starting after the start tap, and it is not ready after 1 second, THE SYSTEM
   SHALL show the caption 'Getting the mirror ready...' and speak the same words once. The line SHALL
   disappear when the session starts, in either mode." Add a short "Decision (2026-11-27): camera
   start limit 15 s" section at the end of the file with the measured numbers above and the reason.
2. Update every other spec line that states the 8 s limit to 15 s (core design error table,
   hand-tracking design rows), and nothing else in `.kiro/`. Requirement 6.3, 10.3 and mirror 13.6
   do NOT change.
3. `src/ui/game-loop.ts`: `START_TIMEOUT_MS` becomes 15000. Add `CAMERA_WAIT_LINE_DELAY_MS = 1000` next
   to it. Show and speak the waiting line through the same caption and speaker paths every other
   instruction uses; do not add a new way to show text. Use the exact text
   `Getting the mirror ready...` (ASCII dots, as in the other captions if they use ASCII; match the
   existing style). If the camera is refused or ready within 1 second, the line never appears.
4. Tests: update the existing 8 s test to 15 s (not ready at 14.9 s still waits; not ready at 15 s
   gives timer-only). New tests: the line appears after 1 s when the source has not answered; it does
   not appear when the source answers 'ready' or 'unavailable' within 1 s; it is gone once the session
   starts in either mode; it is spoken at most once per start. The existing wording guard must pass on
   the new line.
5. Do not change `camera-source.ts`, `mediapipe-loader.ts`, `thresholds.ts`, the order of the model
   downloads, or when they start.

Rules: kid safety and privacy override everything. No network calls, no new npm packages. If the new
line or the 15 s limit conflicts with any steering file or spec (for example a wording rule or a
requirement about what the start tap does), STOP, say exactly what and where, and change nothing.

Finish with `npm run test:run` then `npm run build`. If either fails after two attempts, STOP and
report. Then print the files you changed and the last lines of the test and build output.
