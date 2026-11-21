This is a SPEC EDIT, not a build. Do not write app code. Edit only
`.kiro/specs/hand-tracking/requirements.md`, `design.md` and `tasks.md`. Do not untick anything.

Finding, 21 Nov 2026 (browser check of mirror-and-screens, docs/review/MIRROR-SCREENS-CHECKS.md):
`@mediapipe/tasks-vision` 1.2.3 has built-in usage logging with no public off switch. Every
task creates a logger (class `xh` in `vision_bundle.mjs`) that every 60 s and on close POSTs
protobuf usage stats (task type, running mode, OS, library version, latency numbers; no images
or landmarks) to `https://odml.pa.googleapis.com/v1/log`. Our CSP blocked both attempts, so
nothing was sent. Dr. Yatin decided on 21 Nov 2026: switch it off at the source as well, and
keep the CSP as the second guard.

1. Add requirement 9.6: THE build SHALL remove MediaPipe's usage-logging network call from the
   game and the debug page, in `npm run dev` and `npm run build`, with no new npm package and
   without editing `node_modules`. If the expected code is not found (for example after a
   MediaPipe update), the build SHALL fail with a clear message instead of shipping the call.
   The built `dist/` SHALL NOT contain the text `odml.pa.googleapis.com`.
2. Pin `@mediapipe/tasks-vision` to exactly `1.2.3` in package.json (no caret), since the
   removal matches that version's code. Say this in 9.6.
3. Design: a small Vite plugin written inline (a pure function `stripMediapipeLogging(code)`
   in its own file, e.g. `scripts/strip-mediapipe-logging.mjs` or under `src/build/` - choose
   the place the checker allows and name it), used by `vite.config.ts` for build and for dev
   dependency pre-bundling (`optimizeDeps`), so both paths are covered. The function makes the
   logger send nothing (no request at all, not a request to another address); it does not
   change detection behaviour. Name its tests: `stripsLoggingCall` (fixture string -> no
   endpoint, no send), `failsWhenPatternMissing`, and extend `build-output` with
   `noMediapipeTelemetryInDist`.
4. Tasks: add task 12 "Switch off MediaPipe usage logging at the source", with the files it
   may change (package.json version pin, vite.config.ts, the new plugin file, tests), the three
   tests, `npm run test:run` and `npm run build` passing, and one "Check by hand" sub-task:
   `npm run dev`, start a session, Network panel shows no request to odml.pa.googleapis.com and
   the console shows no CSP error for it.

When finished, print requirement 9.6, the design section you added and task 12, then stop.
