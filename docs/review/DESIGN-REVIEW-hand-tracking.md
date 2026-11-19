# Design review: hand-tracking (19 Nov 2026)

Reviewer: Opus, on `design.md` at 5e7a285 (869 lines), against `hand-tracking/requirements.md`
and `core-brushing-loop`. Verdict: sound. Left/right maths correct, privacy guarded twice,
feasibility test first, camera code lazy. Four fixes before `n91`, then the build.

## Dr. Yatin's confirmations (design section 14)

1. Overall verdict for the side and level checks: no automatic count. The results file
   records counts; Dr. Yatin writes the verdict himself (per surface: 2 of 3 right = pass).
2. `HAND_POINT` may move from `palm` to `wrist` or `fingertips` if that point passes where
   the palm fails, with his yes.
3. CSP: adding only `'wasm-unsafe-eval'` to `script-src` is allowed. Anything more (`blob:`,
   `'unsafe-eval'`, a host), or any exception to the privacy guard: work stops, he decides.

## Fixes (waiting for his yes on A-D)

**A. Majority for side and level over near-mouth frames.** Core 6.3: `null` drains 2/s but
`unknown` drains 0. Design 5.4 takes the majority over ALL frames, so a second with the hand
at the mouth in 55% of frames, some in the dead zone, gives `side: unknown` even when every
clear reading agreed, and correct brushing does nothing to the monster. Change: `side` and
`level` by strict majority among frames with `handNearMouth` true; `handNearMouth` stays a
majority of all frames. Add one clarifying line to requirement 4.4. Update tests 9
(`aggregateMajority`) and the 5.4 note on 11.4f.

**B. Add reading code N (null) to the results file (7.2).** The hand and brush cover the
mouth while brushing, so the face detector may lose the mouth point and the signal goes
`null`. R/W/U hides that. Codes become R, W, U, N; N counts as not right. Many N while
brushing = try `FACE_MODEL = 'mesh'`. Update `surfacePasses` and `resultsFileIsWordsOnly`.

**C. No skipped test.** `resultsFileIsWordsOnly` is "skipped before the file exists"; the
playbook forbids `.skip`. Task 1 creates the empty results template (headings, empty
rows), so the test always runs.

**D. Say what 20 fps means.** Req 10.4 asks for 20 fps; design caps tracking at 10/s
(`TRACK_MIN_INTERVAL_MS` 100). State: 20 fps = picture and drawing; the tracking rate is
recorded on its own line in results section 7 and must give at least 5 frames in a normal
second (req 10.5).

## Risks, no change

- First session on mobile data: WASM + hand model probably 15-20 MB (estimate; task 1
  measures). The 8-second start limit will likely give timer-only the first time; later
  sessions load from the browser cache.
- Phone checks need Android platform-tools (`adb`) and USB debugging for `adb reverse`.
  The laptop webcam at `localhost` covers every check except phone speed.
- BlazeFace short-range gives 6 points incl. mouth centre and both ear tragions, matching the
  design; task 1 still verifies against the installed package.
- The one-line `game-loop.ts` restart edit is acceptable and tested.

## Next (Sonnet drives)

1. Write `kiro-prompts/f04-hand-tracking-design-fixes.md` (design.md section 14 + A-D,
   one line in req 4.4); run with `--trust-tools=fs_read,fs_write`; commit, push.
2. `n91` with SPEC=hand-tracking; commit, push.
3. Build task 1 (feasibility test) with `b00`; `check-task.sh`; commit, push; STOP.
4. Dr. Yatin runs the brushing test and fills `TRACKING-TEST-RESULTS.md`. Nothing for
   requirements 5-8 starts before that.

No Claude co-author line in this repo.
