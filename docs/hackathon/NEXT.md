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
- Second person: PASS (161ab34+). Open idea for Dr. Yatin, not decided: follow the face that has a hand at
  its mouth instead of the largest face (a sibling leaning in closer than the brushing child takes over).
- 21 Nov ~16:30: TASK 1 COMPLETE (all section-5 checks pass, CSP clean, verdicts initialled YGS).
  f08 rewrote task 2 for the decisions; TASK 2 DONE (ba0abe6, 199 tests). Next: tasks 3-9 via b00
  (one per run, check-task.sh, commit, push), then task 10 = his phone checks, task 11 README.
  Leftover small spec text: core design.md ~line 311 and test table ~line 620 still describe level-only matching.
- 21 Nov ~16:45: TASKS 3-9 DONE (f09 settled task 4 start() count by his decision). 9.5 checked by Claude
  in Playwright (no model requests on title, same origin only). 9.6 by Dr. Yatin in Edge: camera allowed ->
  mirror + monster on cheek, monster shrank to smoke while brushing; camera blocked -> timer only, no
  mirror, no nagging. Small later fixes: WASM loads twice; models still download when camera refused.
  Next: task 10 (real phone checks, him) and task 11 (README) - he wants to do task 11 in the Kiro IDE
  (Start task link), for the judges' "IDE or CLI" question and the video. Hooks still untested in the IDE.
- 21 Nov ~17:15: task 11 built by HIM in the Kiro IDE (b25dffb, + tasks.meta.json; checker now allows it).
  Task 10 on his Motorola Edge 50 Neo: 10.2-10.10 PASS (5fa2f2b). 10.1 speed judged by eye (his choice 3):
  mirror smooth, monster shrinks with a small noticeable lag (by design: 1-second windows + 1 tick/s).
  10.1 fps numbers still open (options: USB remote debugging, or a ?speed=1 counter via spec change).
  hand-tracking spec otherwise COMPLETE. Next: specs mirror-and-screens and parent-screen (not yet written).

## Update 21 Nov, evening (~20:00)

- mirror-and-screens: requirements + decisions (b21e53b), design.md by Kiro (81193e8; context note
  n90b), tasks.md by Kiro: 41 tasks / 242 boxes. Tasks 1-32 = needed for the video, 33-40 = later,
  41 = tooth shapes, WAITING for Dr. Yatin (design section 10: no tooth motif / cartoon tooth on the
  two Molar monsters / fangs on Fuzzlefang). Task 41 must not start without his answer in the prompt.
- Build loop: b00 with SPEC=mirror-and-screens, one task per run, check-task.sh, commit, push.
- Manual checks (browser/phone) stay unticked until Dr. Yatin does them; 32.5 phone speed is his.
- 21 Nov ~20:30: mirror-and-screens tasks 1-31 BUILT by Kiro CLI and pushed (434 tests, 62 files); task 32.1 done.
  Tooth shapes = option 1 (no tooth motif; f11, task 41 closed); smoke wording f11b. Open: hand checks
  13.5, 13.6, 15.4, 16.4, 18.4, 21.4, 24.5, 28.7, 29.2, 30.3, 32.2-32.11 (32.5 phone fps row is his).
  Later tasks 33-40 not started. Build loop script tolerates "Check by hand" boxes; note Kiro once
  wrote "[x]31." with no space (fixed by hand).
- 21 Nov ~20:50: Dr. Yatin raised 3-4 min brushing (his clinical view), chose 3 min / 45 s per zone, then
  DROPPED the change before anything was edited. Game stays 2 minutes; do not re-propose unasked.
  Browser hand checks done by Claude: docs/review/MIRROR-SCREENS-CHECKS.md (boxes not ticked). Foamtom dev
  server runs on port 5180 (5173 = SafeRefer). Finding: MediaPipe telemetry POST to odml.pa.googleapis.com
  blocked by CSP; option to switch off at source, his call.
- 21 Nov ~21:50: his camera play showed "monster not shrinking" + overlap. Recording of his real brushing:
  debug page 88% brushing seconds; game DID shrink/defeat/smoke but too subtle, leaving copy overlapped
  ~1.5 s on the same cheek. f13 spec + tasks 42-46 built: timer-only defeat at 20 s (core 8.5/8.6),
  next monster waits for leaving copy (max 2 paints), MIN_MONSTER_SCALE 0.2, hit flinch each damaged
  tick (fx-no-hit with reduced motion), smoke +20% with #8a6fc4 outline. Verified timer-only in
  Playwright. Open: task 47 = his camera check. Build loop now repairs Kiro tick slips (mojibake, "[x]N").
- 21 Nov ~22:45: MEASURED his brushing (debug page + game, readings only): speed same (~7.5 fps);
  gentle strokes lost as "not moving"; game counted 37-47%. He approved f15: MOVING_MIN_TRAVEL 0.2,
  DAMAGE_PER_SECOND 4 (camera beaten after 15 counted s), TIMER_ONLY_DAMAGE 3 (timer-only still 20 s).
  Task 48 built (475 tests). His camera run: 3 of 4 monsters beaten + smoke; 47 + 48.5 PASSED (his word).
  Watch: upper-left zone varied (3 counted s in last run). Next: remaining hand checks (sound, phone,
  monster look 15.4/32.9), later tasks 33-40, parent-screen spec, video.

## Update 22 Nov (parent-screen spec)

- parent-screen spec COMPLETE: requirements (dbeced5, all 25+ lines approved by Dr. Yatin), design (ade3dab),
  f18 (3533da6), tasks (16 tasks / 75 boxes). Prompts n03b, f16, f17, n90c, f18 in docs/review/kiro-prompts/.
- His decisions 22 Nov: honest nudge "During the upper-right turn, brushing was not seen on 3 nights. Try
  brushing it first tonight." (dental-rules.md); night = night session 17:00-23:59, last 7 days, 0 s seen,
  every night session that day; nudge from 2 nights, most nights, tie = ZONE_ORDER; 3 time lines over 7 days;
  zone fact after 3+ camera sessions; six-line honest disclosure; parent screen IS in the video.
- Build order (his yes): mirror-and-screens tasks 36-38 (Grown-ups entry control) FIRST, then parent-screen
  tasks 1-15 via b00 (SPEC=parent-screen), then 16 = his manual checks. Task 15 stops if 36-38 are not done.
- Small leftover text: design.md line ~43, section 1.2 stage D row and section 9 row 15.3 still say the
  index.html link awaits approval (it was approved, f18). Fix in the next spec-fix run.
