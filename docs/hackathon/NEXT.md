# NEXT: Foamtom, start here (written 19 Nov 2026, evening)

Start a new session from this file, on Sonnet. Also read `docs/review/BUILD-PLAYBOOK.md`
and `docs/review/DESIGN-REVIEW-hand-tracking.md`. No Claude co-author line in this repo
(check `git log --format=%B | grep -ci co-authored` is 0 before every push).

## State

- **core-brushing-loop: finished.** All 14 tasks ticked (95 tests), live on GitHub Pages.
- **hand-tracking: spec done** (requirements, design, tasks; decisions and Opus fixes A-D
  recorded; f05 put the hand landmark indices in `thresholds.ts`).
- **hand-tracking task 1 (feasibility test), parts 1A-1E built and pushed, last commit
  89af607, 170 tests, all checks pass.** Tree clean, in sync with origin.
  - 1A package + docs check (`docs/review/MEDIAPIPE-DOC-CHECK.md`; face model file is
    `blaze_face_short_range.tflite`; face detector keypoint 3 = mouth, 4 and 5 = ears)
  - 1B side/types/thresholds, 1C classifyFrame, 1D aggregateSecond (fix A in), 1E frame
    window + landmark adapters.
- **Not started:** 1F, 1G, 1H, 1I, 1J, then 1K (his brushing test), then tasks 2-11.
- Credits: bonus 51.91 / 4000 at the end of task 14 (plan 27 / 50, resets 1 Dec). Not read
  again after parts 1A-1E; read `app.kiro.dev/account/usage` and log it in the playbook.

## Decisions waiting for Dr. Yatin (ask first thing)

1. **check-task.sh allowlist.** Part 1F makes `scripts/`, 1H makes `debug/`; the script's
   "files in allowed places" check does not list them and would give a false FAIL. The
   auto-mode classifier blocked me from editing the script without his word. Options:
   (a) he lets Claude add `scripts/` and `debug/` to the allowlist (recommended, one line);
   (b) leave it and read that one FAIL by hand each time.
2. **Part 1G downloads three model files** into `public/models/` from Google's MediaPipe
   model page (Apache-2.0): the hand landmarker, `blaze_face_short_range.tflite`, and the
   face landmarker. State the exact file names and sizes to him BEFORE downloading, and wait
   for his yes. Nothing else downloads.

## Exact next commands

Helpers live in the session scratchpad and may be gone; recreate them if so.

```bash
# run one part of task 1 (P = 1F, 1G, ...): b00 with {{N}} = the part id, plus a note that
# says "do only part P, tick only P's boxes, never tick the parent '1.' line or 1K"
kiro-cli chat --no-interactive --trust-tools=fs_read,fs_write,execute_pwsh "$(cat prompt-P.txt)"
bash docs/review/check-task.sh
```

Kiro runs over about 10 minutes go to the background; run them as ONE background task
(do not nest `&` or `nohup`: that run died silently once). Commit with
`git -c user.name/-c user.email` taken from `../Hackathons`, never with `eval`.

1. Ask the two questions above.
2. Run 1F (copy-wasm + measure-assets scripts, `predev`/`prebuild`, `.gitignore`,
   `tsconfig` include `debug`).
3. After his yes on the download: 1G (models, NOTICE.txt, loader, measured sizes).
4. 1H (debug page), 1I (keep it out of `dist/`), 1J (results template + helpers).
5. **STOP at 1K.** Dr. Yatin brushes in front of the debug page at the laptop webcam
   (`npm run dev`, open `/debug/tracking-debug.html`) and fills
   `docs/review/TRACKING-TEST-RESULTS.md` (reading codes R, W, U, N; he writes both verdicts).
   Phone speed needs Android platform-tools + USB debugging. Nothing for tasks 2-11 starts
   before the results file is filled in and he has written the verdicts.

## Reminders

- Kiro stops on spec contradictions: that is correct. Do not choose for him; list options,
  ask, then run a small `f0N` spec-fix prompt. (Learned 19 Nov: the classifier blocks
  silent spec or checker changes.)
- Kiroween deadline: 4 Dec 2 pm PT = 3:30 am IST 5 Dec. Credit code redeem by 4 Dec. After
  hand-tracking come `mirror-and-screens` (Monster Book screen + child wording: stop for
  his review) and `parent-screen`. Cut order if days run short is in the playbook, section 2.

## Update 20 Nov, evening (read this first tomorrow)

- Parts 1F, 1G, 1H, 1I, 1J are all DONE and ticked (last pushed commit e99bf66; the tick of
  1H.6 and the "1H." line is in the working tree, UNCOMMITTED: the privacy hook refused the
  commit command because it read the email from config; commit it with the next change).
- Dev server stopped. Start it again: `npm run dev`, page `/debug/tracking-debug.html`.
- **Only 1K is left in task 1** (his brushing test). Do NOT start tasks 2-11.
- **First finding, reported by Dr. Yatin:** with the brush on his LEFT side the screen
  still says the RIGHT side. That is the mirror-flip check (requirement 1.8, row 1 of
  "Other checks"). Tomorrow do ONLY this first: raise the left hand, write down what `side`
  says and where the hand appears in the preview. If `side` is always the opposite, the
  conversion is flipped: report it as a spec finding, do not fix it silently, and do not
  record the 24 rows until it is understood. If it is only sometimes wrong, the 24-row test
  carries on as planned.
- He found the test wording confusing: keep each step to one short instruction, one position
  at a time. He cannot run commands himself; Claude starts and stops the server and writes
  the results file from his spoken readings.
- Console on the debug page is clean apart from MediaPipe notes (verified with Playwright and
  Chrome); the WASM file loads twice per page load (14.7 MB each): small loader fix later.

## Update 21 Nov, afternoon

- Mirror-flip check PASSED (left hand at left lower reads `left`, hand on the left of the preview).
- Side check FAILED for brushing across the face (right hand at lower left reads `right`: side comes
  from the palm, and the camera cannot see the brush head). Dr. Yatin chose option 1: the camera checks
  THAT the child brushes, not which side. Steering (dental-rules, product step 4) amended with his yes;
  spec f06 by Kiro (79f87d9); code `REQUIRE_SIDE_MATCH = false` by Kiro (2a8977e), 192 tests pass.
- Next: the LEVEL test only (24 rows, 3 tries each, both hands), one position at a time, codes RRR etc.
  Reading cells must be exactly 3 letters or left empty (tests/test-results.test.ts checks the file).
  Verdict text goes on the line BELOW "Side check:" / "Level check:".
- Later 21 Nov: NEAR_MOUTH_FACE_WIDTHS tuned 0.7 -> 1.1 (his yes) + aggregate bug fixed (req 3.6), 26f5e6b.
  Level: upper right outer RRR pass, upper right chewing WUW fail (palm hangs below the mouth).
  He chose to stop and set REQUIRE_LEVEL_MATCH=false (feabfa5 spec, 79b43a1 code, 195 tests).
  The camera now checks only: hand near the mouth + moving. Moving reads true while brushing (live).
- Still to do in task 1: section 5 "other checks" (DONE 21 Nov: 1-3 pass; second person FAIL, needs a screenshot; lights dimmed NOT done, after dark; both hands
  near, second person, lights dimmed -> null). Small spec leftover: core design.md still lists
  REQUIRE_LEVEL_MATCH default true (fix in next Kiro run). Then tasks 2-11 of hand-tracking.
