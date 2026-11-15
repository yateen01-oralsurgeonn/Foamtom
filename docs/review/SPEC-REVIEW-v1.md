# Foamtom spec review v1

Reviewer: Claude (Fable 5.2), 15 Nov 2026. Review only. Nothing in `.kiro/` was changed.
Changes reach the spec through the Kiro prompts in `KIRO-CHANGES-v1.md` (Step 3).

Files reviewed: `.kiro/steering/*.md` (5), `.kiro/specs/core-brushing-loop/` (requirements,
design, tasks), `docs/hackathon/01`, `02`, `03`.

Short names used below: **REQ** = requirements.md, **DES** = design.md, **TASKS** = tasks.md.

---

## 1. The verdict in ten lines

The spec is well written and the core idea (pure logic, one small signal, property tests) is
right. It is not yet safe to hand to Kiro task by task, for five reasons:

1. **It only covers a quarter of the product.** Hand tracking, the mirror art, the Monster
   Book screen and the parent screen have no spec. The video needs all four. (B1)
2. **Nothing in the 12 tasks makes a runnable game.** There is no start button, no game
   loop, no end screen, no entry file. The playable timer-only version (the demo safety
   net) only appears at task 11 of 12. (B2, B3)
3. **Three places where the spec contradicts itself**, so Kiro must guess: what a lost
   camera signal does in camera mode (B4), when a rare monster can appear (B5), and how
   monsters are picked for a session (B6).
4. **The headline test proves nothing.** "Session is always 120 s" checks a number that is
   hard-coded to 120. (B7)
5. **The numbers leave 40 to 84 seconds of every brush with nothing to do**, and the
   kindness rule then makes that worse over time. (B8)

Counts: 9 BLOCKER, 17 SHOULD, 8 NICE. Seven decisions are yours (section 13).

---

## 2. Findings, ranked

### BLOCKER (Kiro would build the wrong thing, or get stuck)

| # | Where | What is wrong | Fix |
|---|---|---|---|
| **B1** | REQ "Out of scope"; `03-video-storyboard.md` shots 1, 4, 5, 6 | Real hand tracking, haunted-mirror art, Monster Book screen and parent screen are "later specs" that do not exist. Shot 4 (the core demo: wrong side does nothing, right side dissolves the monster) cannot be filmed from this spec. 19 days are left. | Decide the spec list now (question Q6). Recommended: fix this spec, then three small specs: `hand-tracking`, `mirror-and-screens` (title, mirror frame, end card, Monster Book), `parent-screen`. I draft the Kiro prompts that create them before 17 Nov. |
| **B2** | TASKS (whole file); DES section 3 | No task creates a runnable app. Missing: `index.html` + `src/main.ts` wiring, a start screen with a button, a game loop that calls `tick` once a second, an end-of-session screen. DES says "the UI calls `tick` each second" but no module owns that timer. | Add three small modules and tasks: `src/ui/game-loop.ts` (the only timer in the app, clock passed in so tests use a fake clock), a start button, an end card. See the new task plan in section 10. |
| **B3** | TASKS order | Timer-only play exists only after task 11. Storage, stats, miss scores and the Monster Book all come before anything can be played. If credits or days run out at task 8 there is nothing to show. | Reorder: playable timer-only game by task 8 of the new plan, deployed to GitHub Pages at task 9. Memory features after that, camera after that. Section 10. |
| **B4** | DES section 9 "Poor light" row vs DES section 5 tick pseudocode vs REQ 6.3 and 8.1 | Three different answers to "camera mode, signal is `null`": section 9 says the tick drains like timer mode; the pseudocode branches on `state.mode`, so a `null` signal does no damage; REQ 8.1 says poor tracking "enters guided-timer mode" but `mode` is read-only. Worse: with the pseudocode, a child who brushes perfectly in a dim bathroom records 0 verified seconds, all four monsters survive, and the parent screen later says every zone was "missed". The timer-mode formula also *overwrites* health, so mixing it with camera damage could make health go **up**. | One rule for every tick, no mode branch (question Q4): signal `null` (tracker cannot see) → health −2 and count one "untracked" second; signal fully matches → health −3 and count one brushed second; anything else → no change. Timer-only mode is then simply "every signal is null". A camera-mode zone with more than 10 untracked seconds is saved as **unverified** and is left out of miss scores and parent stats, exactly like a timer-only zone. Health can now only go down. |
| **B5** | DES section 7 `isRareEligible` vs the design note under it; DES test 3 | The function needs a stored morning session AND a stored night session. At the start of tonight's session, tonight's session is not stored yet, so it returns false. The note says "the night session is rare-eligible". As coded, a rare monster only appears in a *second* night session on the same day, which almost never happens. Test 3 would lock the bug in. | Replace with `isRareEligibleForNewSession(todaysSessions, newTimeOfDay)`: true when the stored sessions for today plus the session about to start cover both morning and night. Rewrite test 3 to match. |
| **B6** | DES section 3 (`assignMonsters`) and section 5 (`startSession`); REQ 14.5 | `assignMonsters` "picks one monster per zone from the eligible pool" with no rule. Kiro will reach for `Math.random`, which breaks purity and sits badly next to REQ 14.5 ("no hidden randomness"). `startSession(mode, missScores, now)` also uses a variable `rareEligible` that is never passed in, and never says how many rare monsters appear or on which zone. | Make it a fixed rule, no randomness: commons the child does not own yet come first, in table order; when the Book has all 8, cycle by session count. In a rare-eligible session, exactly one rare monster (the first one not yet owned) takes the **last** zone. `startSession` takes one input object: `{ mode, startedAt, date, hour, pastSessions }` and works out miss scores, owned monsters and rare eligibility from `pastSessions`. |
| **B7** | DES section 11 tests 2 and 7; TASKS 6.6, 6.7 | Both tests assert `toSessionResult(finalState).durationSeconds === 120`, but DES section 5 sets `durationSeconds = 120` always. The test passes even if the state machine ends after 3 ticks or never ends. This is the property the video shows in shot 8. | Test the machine, not the constant: for any 120 signals, the session is still running after every tick 1 to 119 and has ended after tick 120; the active zone at tick *k* is `floor((k-1)/30)`; a 121st tick changes nothing. Compute `durationSeconds` by counting ticks. |
| **B8** | DES section 6 (constants); REQ 14.1, 14.2 | The sums do not fill two minutes. Full arithmetic in section 6. In short: a monster dies after 20 s of matched brushing (17 s with the rescue, 9 s at the kindness floor), then the zone has 10 to 21 s left with **nothing on screen to brush at**. A child who sensibly stops when the monster dies records "missed" seconds, so the kindness rule weakens the monster, so it dies sooner. It settles at about 16 s per zone: 65 s of brushing in a 120 s session. | Your decision (Q3). Recommended, and cheap: after a monster is beaten, its smoke stays over the zone and the voice says "Keep brushing to blow the smoke away!" until the 30 s end. No new win or lose, no logic change (brushed seconds already keep counting after defeat). Also base the miss score on the last 7 camera sessions, not all history (Q5). |
| **B9** | TASKS 1.6 and 11.4 | Two small things that stop a Kiro run. (a) 1.6 says `npm run test:run` "should pass with zero tests": Vitest exits with an error when it finds no test files. (b) Sub-task 11.4 has no `[ ]` checkbox, so Kiro's task list may skip it. | (a) Add one real smoke test in task 1 (for example, "constants add up: 4 × 30 = 120"). (b) Restore the checkbox. Both are covered by the new task plan. |

### SHOULD (will cost credits or cause a wrong detail if left)

| # | Where | What is wrong | Fix |
|---|---|---|---|
| **S1** | DES section 5 `startSession`; DES section 2 ("no `Date` dependency") | `startSession` takes `now` and calls `now.getHours()` and `formatDate(now)`. That is a `Date` inside pure logic, and tests become time-zone dependent. | The shell (`main.ts`) reads the clock once and passes plain values: `startedAt` (number), `date` (`YYYY-MM-DD` local), `hour` (0-23). Logic never touches `Date`. |
| **S2** | DES section 4 types; section 5 pseudocode | `SessionState` and `MonsterState` have mutable fields and `tick` changes the state it was given, yet section 3 calls them "pure functions, no side effects". | All fields `readonly`; `tick` returns a new state. Say so in one sentence in DES section 5. |
| **S3** | DES section 5 state diagram vs section 4 types | The diagram has named states (Idle, Zone0-3, Ended) but the type has only `isRunning: boolean`. Pause (tab hidden) is not a state at all; it is "the UI stops calling tick". | One field: `phase: 'running' \| 'paused' \| 'ended'`, with pure `pause(state)` and `resume(state)`. `tick` does nothing unless `phase` is `'running'`. The active zone stays as `activeZoneIndex`. |
| **S4** | DES section 9 "Tab hidden" | Pause has no limit. A child who leaves and never comes back leaves a session that never ends and is never saved. | If the tab stays hidden for more than 60 s, the session is dropped (not saved) and the app returns to the start screen. The 60 s check lives in `game-loop.ts` and is tested with the fake clock. |
| **S5** | REQ 11 (nothing there); kid-safety "propped by a mirror" | A propped phone that is not touched for two minutes dims and locks, often after 30 s. In timer-only mode there is no video playing, so this is certain. | Ask for a screen wake lock (`navigator.wakeLock`) when the session starts; release it at the end or when hidden; carry on silently if the browser refuses. One line in REQ 11, done inside `game-loop.ts`. |
| **S6** | REQ 8.1; DES section 9 | The browser's own camera permission box is text. A 5-year-old cannot answer it, and the promise never settles while it is open: a dead end. Model loading on a slow phone has the same problem. | After the start tap, wait at most 8 s for "camera ready". If it is not ready, start in timer-only mode. Never ask twice in a session (REQ 8.3 already says this). |
| **S7** | DES section 8; REQ 14.7 | Miss scores are stored as well as the sessions they are computed from. Two copies can disagree, and it adds two storage functions and a test for no visible gain (at most a few hundred small records). | Do not store miss scores. Work them out from stored sessions at session start. REQ 14.7 becomes "miss scores are derived from the stored sessions; nothing extra is stored; Clear all data clears them because it clears the sessions". |
| **S8** | DES section 6 ("all integers, free of floating-point drift") | Not true once kindness applies: `60 × (1 − 0.4 × missScore)` is a fraction for most miss scores (0.33 → 52.0, 0.3 → 52.8). The rescue check `health ≤ 9` then runs on fractions. | Round starting health to a whole number. With finding B4's fix (−2 or −3 per tick) every health value is then a whole number. In timer-only mode ignore kindness (start at 60) so the monster dies exactly at 30 s. |
| **S9** | DES section 3 and 7 | `SessionRecord` is declared in `src/storage/storage.ts` but used by `src/logic/monster-book.ts`, `miss-score.ts` and `stats.ts`. Logic would import from storage: the arrow points the wrong way. It is also a field-for-field copy of `SessionResult`. | Delete `SessionRecord`. Use `SessionResult` everywhere. Storage imports types from logic, never the reverse. |
| **S10** | DES section 3 `storage.ts`; section 11 "Mock localStorage" | Storage reaches for the global `localStorage`, and the in-memory fallback is hidden module state. | `createStorage(backend)` where `backend` has `getItem/setItem/removeItem`. `main.ts` passes the real `localStorage`; tests pass a `Map`-backed fake. DES test 5 also names a function `saveSessions` that the module list does not have; align the names. |
| **S11** | REQ 5.5 | 5.4 needs `moving` to be true. 5.5 lists the "not brushing" cases but leaves out `moving == false`. | Add "or `moving` is false" to 5.5. |
| **S12** | REQ introduction and 5.1 ("per-frame") vs DES section 5 ("per second") | The requirement says the logic takes a per-frame signal; the design gives it one signal per second. Nobody defines how 20+ frames become one signal. | REQ 5.1: "one brushing signal per second". The frames-to-second rule belongs in the `hand-tracking` spec as a pure function (section 10 below). |
| **S13** | REQ 2.4 vs DES section 9 "Tab hidden" | "Shall not extend the total session duration" reads as a contradiction with pausing when hidden. | Reword 2.4: "120 seconds of active (tab visible) session time". |
| **S14** | REQ 12.6, 12.7, 14.4, 14.5; REQ 11.7, 11.8 | These have no task and no test (see section 3). They are the privacy and kid-safety promises the video makes. | One "privacy guard" test that scans `src/` and fails on: `fetch(`, `XMLHttpRequest`, `sendBeacon`, `WebSocket`, `EventSource`, `toDataURL`, `toBlob`, `MediaRecorder`, `captureStream`, `document.cookie`, any `http://` or `https://` string. One "wording guard" test on the voice-line table (banned words list). Add a strict Content-Security-Policy tag in `index.html` (`default-src 'self'`; MediaPipe needs `'wasm-unsafe-eval'`). |
| **S15** | `.kiro/hooks/`, `.kiro/agents/` | Both folders are empty, so git does not track them and they are not in the repo. The rules ask for hooks, and the video's shot 8 shows them. | Have Kiro create at least two hooks: "on save of `src/**`, run the tests" and "on save of `src/**`, run the privacy guard". Small, and it is direct evidence of Kiro use. |
| **S16** | TASKS 12.4; tech.md "Web Speech API only as a fallback" | In Chrome some speech voices are produced on Google's servers. Using one sends the caption text off the device: a third-party request, against kid-safety "opening the game makes no third-party requests". | Use only voices whose `localService` is true. If there is none, show the caption without speech. Recorded clips, when you have them, replace it. |
| **S17** | REQ 11.9; product.md ("phone or tablet") | "Shall operate in portrait" says nothing about what happens in landscape, and judges will open the link on a laptop with a landscape webcam. | "Laid out for portrait; still usable in landscape and on a desktop browser; never shows a 'rotate your phone' block." |

### NICE (can wait, or is cheap polish)

| # | Where | What | Fix |
|---|---|---|---|
| N1 | DES section 4 `MonsterOutcome` | The rescue ("flees") is stored as `defeated`, so the screen cannot play a different animation and nothing records that it was a rescue. | Add outcome `'fled'`. Counts as beaten everywhere. |
| N2 | DES section 8 | Schema migration code for a v1 with no earlier version. | Keep the `version` field; drop the migration branch. |
| N3 | DES section 9 "localStorage full" | The in-memory fallback is real work for a case the video never shows. | `try/catch` around save and load; on failure the game plays on and saves nothing. |
| N4 | REQ 13.4 | "Never exceed the total elapsed wall-clock time": no wall-clock time is stored. | "Never exceed 120 s per session, or 30 s per zone." |
| N5 | REQ 10.4; storyboard shot 5 | The 12 monsters have no names. The video names one: "Midnight Molar Ghoul". | You or I supply 12 names (Q6 can cover it); Kiro types them in. |
| N6 | Judges | Judges will not brush for two minutes. | A `?demo` link that runs 4 × 8 s zones, clearly labelled "demo", never saved. The 120 s rule and its test stay for the real game. |
| N7 | DES section 5 (after B6) | With 4 monsters per session, all 8 commons are owned after 2 sessions; the 4 rares need 4 more days. The Book is full in under a week. | Fine for the hackathon. Say so in the write-up as a known limit. |
| N8 | tech.md "first load under 5 MB" | Face mesh model + hand model + the WASM runtime are likely well over 5 MB together. I have not measured them. | In the `hand-tracking` spec, have Kiro record the real sizes, and consider the small face *detector* (it gives a mouth point) instead of the full face mesh. |

---

## 3. A. Traceability

### Requirement → design → task → test

| Req | Design | Task | Test today | Gap |
|---|---|---|---|---|
| 1.1-1.3 | s2, s3 | 1, 2, 6 | none | No test that `src/logic` imports nothing from `ui`, `tracking`, `storage`. Add to the privacy guard (S14). |
| 2.1-2.5 | s5 | 6 | 6.6 (tautology, B7) | B7. Also no test for 2.2 or 2.5. |
| 3.1-3.5 | s4, s5 | 6 | none | No test of zone order or of "one active zone". Covered by the B7 rewrite. |
| 4.1-4.5 | s3 `lines.ts`, s10 | 12 | 12.6 (captions only) | 4.4 (gentle ramp) has no test. Fix: a pure `rampGain(t)` function, tested. |
| 5.1-5.5 | s4, s5 `isBrushing` | 2, 6 | inside 6.5 | No direct truth-table test of `isBrushing` (only 36 cases; test them all). |
| 6.1, 6.3 | s5 | 6 | inside 6.5 | B4. |
| 6.2 | s9 | 11 | none | Test: the voice-line table has no line about camera or light. |
| 7.1-7.5, 7.7 | s5, s6 | 4, 6 | 4.5, 6.5 | 7.4 (defeat at zero mid-zone) has no direct test. |
| 7.6 | s3 | 4 | 4.4 | OK. |
| 8.1-8.5 | s9 | 10 | 10.2, 10.3 | 10.3 mixes up "signal is null" with "camera is unavailable" (see section 4). |
| 9.1-9.3 | s4, s5 | 6 | none | No test that seconds per zone ≤ 30, or of the verified flag. |
| 9.4-9.7 | s8 | 9 | 9.5 | 9.5 and 9.6 (nothing else stored) untested. Fix: a test that the stored JSON has only the allowed keys. |
| 10.1-10.3 | s5 `toSessionResult`, s3 | 7 | none | No test of `computeMonsterBook`. |
| 10.4 | s3 | 4 | 4.4 | OK. |
| 10.5 | s7 | 3 | 3.2 | OK. |
| 10.6-10.8 | s7 | 7 | 7.3 | B5. |
| 11.1-11.12 | s10 | 11 | **none** | Whole requirement untested. See section 4 for what to fake. |
| 12.1-12.5 | - | 12 | none | Add the wording guard (S14). |
| **12.6, 12.7** | - | **none** | none | **Orphans.** S14. |
| 13.1-13.9 | s11 | 4, 5, 6, 7, 8, 9 | yes | 13.2 and 13.7 are tautologies (B7); 13.3 is wrong (B5). |
| 14.1, 14.2 | s6 | 5 | 5.3, 5.4 | OK after S8. |
| 14.3 | s6 | 4 | 4.5 | OK. |
| **14.4** | s6 | none | 6.7 covers length only | Zone order and morning/night under kindness untested. Small. |
| **14.5** | - | **none** | none | **Orphan.** Covered by B6 (no randomness; guard test bans `Math.random` in `src/logic`). |
| **14.6** | - | none (later spec) | - | **Orphan by design.** Must land in the `parent-screen` spec. The wording also discloses only half the rule (section 7). |
| 14.7 | s8 | 9 | none | S7. |

### Orphans the other way (in the design or tasks, with no requirement)

| Item | Where | Note |
|---|---|---|
| Tab-hidden pauses the timer | DES s9 | Approved by you, but no requirement line. Add REQ 2.6. |
| Schema versioning | DES s8, TASKS 9.4 | No requirement. N2. |
| In-memory storage fallback | DES s9, TASKS 9.3 | No requirement. N3. |
| "UI silently switches the mode indicator" | DES s9 | No requirement, no task, and "left to implementation". Replaced by B4. |
| Web Speech fallback | TASKS 12.4 | From tech.md, not from a requirement. S16. |
| `stats.ts` (`computeVerifiedTime`, `zoneMostMissed`) | DES s3, TASKS 8 | Only REQ 13.4 (a test) asks for it. Fine, but it belongs with the parent screen. |
| `tracking.ts` stub | DES s3, TASKS 10.1 | No requirement defines the tracking interface. Section 5. |

---

## 4. B. Testability without a camera

Everything in `src/logic/` is testable today with plain data. These are the criteria that
are not, and what to fake:

| Criterion | Fake to use | Test |
|---|---|---|
| "Tick once a second", pause, 60 s drop (2.x, S3, S4) | **Fake clock**: `game-loop` takes `{ now(): number }` and a scheduler; the test advances time by hand. | 120 fake seconds → exactly 120 ticks, even if the scheduler fires late or in bursts. |
| Camera refused / unavailable / slow (8.1, 8.3, S6) | **Fake signal source** with the interface in section 5: `start()` resolves `'ready'`, `'unavailable'`, or never. | Mode is timer-only for the last two; `start()` is called exactly once. |
| Camera stops on end or hidden (11.6) | Fake signal source that counts `stop()` calls. | `stop()` called once at end, once on hidden. |
| Any tracking rule (5.4, side, level, moving) | **Fake landmark stream**: arrays of plain `{x, y}` points for mouth and hand, saved as fixture files. | Pure `classifyFrame(landmarks)` and `aggregateSecond(frames)` (hand-tracking spec). |
| What the screen shows (11.3, 11.4, 11.5) | No fake needed: a pure `toView(state)` that returns `{ zoneId, countdown, captionLineId, healthFraction, monsterId }`. | Test `toView`; the DOM code just paints it. |
| Gentle volume (4.4) | Pure `rampGain(msSinceStart)`. | Starts at 0, never jumps more than a set step, tops out at the set level. |
| Nothing sent, saved or logged (11.7, 11.8, 12.7) | Static scan of the source files. | Privacy guard (S14). |
| Wording (12.1-12.5) | The voice-line table itself. | Wording guard: banned words; every line has a caption. |
| 20+ fps (11.12) | Cannot be automated here. | Manual check on your phone; write the number in the playbook log. |
| 48 px targets, colour not the only signal (11.10, 11.11) | - | Manual checklist item in the playbook. |

---

## 5. C. Architecture

**What is right:** the logic is separate from the DOM; only one small signal crosses in;
timer mode reuses the same logic; the tick is one second, which keeps tests to 120 steps.

**What to fix:**

1. **The camera is not behind an interface yet** (DES s3 says only "placeholder stub ...
   returns null"). Define it now, in this spec, so the timer-only build and the camera
   build share one seam:

   ```ts
   interface SignalSource {
     start(): Promise<'ready' | 'unavailable'>; // asks for the camera once
     latest(): BrushingSignal | null;           // the signal for the last full second
     stop(): void;                              // stops the camera stream
   }
   ```

   Two implementations: `nullSignalSource` (always `'unavailable'`, always `null`), which
   is all this spec needs, and the MediaPipe one in the `hand-tracking` spec. Tests use a
   scripted fake.

2. **What `null` means must be written down** (B4): `null` = the tracker cannot see a face
   (dark, no face, child walked off, model not ready). A signal with `handNearMouth: false`
   = the face is seen and the hand is not at the mouth. `'unknown'` fields = hand at mouth
   but side or level unclear.

3. **Hidden timers.** Today: an unnamed `setInterval` in the UI (B2), audio ramp timers,
   and the pause. Rule to add to DES: "`game-loop.ts` is the only module that owns a
   timer. It is driven by elapsed clock time, not by counting interval callbacks, so a
   slow phone or a throttled tab still gets exactly 120 ticks."

4. **Global state.** Today: the global `localStorage` and the in-memory fallback (S10),
   and a `Date` in `startSession` (S1). After S1 and S10 the only globals are touched in
   `main.ts`.

5. **Purity claims vs mutable types** (S2), **named states** (S3), **wrong-way import**
   (S9): see the table.

---

## 6. D. Numbers: the arithmetic

Constants: `H_MAX` 60, damage 3 per matched second, zone 30 s, floor 36, rescue at ≤ 9.

**One zone, camera mode, normal monster (60):**

| Matched seconds | Health left | Outcome |
|---|---|---|
| 20 | 60 − 60 = 0 | Defeated at second 20; 10 s of the zone left over |
| 17 | 60 − 51 = 9 | Rescued at 30 s (9 ≤ 9) |
| 16 | 60 − 48 = 12 | Trapped |

**One zone, weakest monster (36, the floor):**

| Matched seconds | Health left | Outcome |
|---|---|---|
| 12 | 36 − 36 = 0 | Defeated at second 12; 18 s left over |
| 9 | 36 − 27 = 9 | Rescued at 30 s |
| 8 | 36 − 24 = 12 | Trapped |

**Whole session (4 zones, 120 s):**

| Case | Matched brushing needed to beat all four | Share of the 120 s |
|---|---|---|
| Normal, defeat outright | 4 × 20 = 80 s | 67% |
| Normal, using the rescue | 4 × 17 = 68 s | 57% |
| All at the floor, defeat outright | 4 × 12 = 48 s | 40% |
| All at the floor, using the rescue | 4 × 9 = 36 s | 30% |

**Do the sums work for a two-minute brush?** Not on their own. The session is always 120 s
long, but the monsters only ask for 36 to 80 s of brushing. That gap is probably what
"20 s" was meant to be: slack for a tracker that misses some seconds. But when tracking is
good, the monster is gone at second 20 and the child has no on-screen reason to keep
going for the next 10.

**The feedback loop.** Miss score = share of each 30 s zone not brushed. A child who stops
when the monster dies:

- Session 1: brushes 20 s, miss = 10/30 = 0.33 → next start health = 60 × (1 − 0.4 × 0.33) = 52
- Then: 52 / 3 = 17.3 s to defeat, miss rises to 0.42 → health 49.9 ...
- It settles where `t = 20 × (1 − 0.4 × (30 − t)/30)`, which gives **t = 16.4 s per zone,
  about 65 s per session**.

So the rule meant to help a child who misses a spot also trains a child who never misses a
spot to brush for about a minute. Fix in B8 / Q3 / Q5.

**Can a child "win" without brushing every zone?**

- *By the monster rules: no.* A monster only loses health in its own zone, so each zone
  needs its own 9 to 20 s.
- *By the Monster Book: yes, and this is the bigger point.* REQ 10.2 puts **trapped**
  monsters in the Book as well as defeated ones. A child who stands still for two minutes
  in camera mode collects all four. Beating a monster changes the animation and the
  parent's numbers, nothing else. That is kind and it means a tracking mistake can never
  cost a child a monster, but you should choose it knowingly (Q2).
- *In timer-only mode: yes, always.* Every monster drains to zero with no brushing. That
  is the agreed design; those sessions are flagged unverified.
- *Honest limit:* the camera sees a moving hand near one side of the mouth. It cannot see
  the brush or the teeth. The steering already forbids claiming more; the write-up and the
  parent screen should say it in one plain sentence.

**"Never rewarding."** As the spec stands, kind proximity cannot earn a child anything
extra: missed zones do not give more monsters, rarer monsters, or more time. It only
changes whether the monster is shown beaten. That holds as long as Q2 is answered "all
monsters go in the Book". If you answer Q2 the other way (only beaten monsters count),
then missing a zone on purpose makes its monster easier to collect next time, and the
kindness rule becomes mildly rewarding. The floor limits it to 9 s, but it would exist.

**Dead ends found:**

| Dead end | Where | Fix |
|---|---|---|
| Tab hidden and never reopened: session never ends, never saves | DES s9 | S4 |
| Permission box left unanswered: game never starts | - | S6 |
| Model never finishes loading on a slow phone | - | S6 |
| Session ends: the state diagram goes to "end" with no next screen and no way to play again | DES s5 | End card with a "Monster Book" button and nothing else to tap; reload starts again (B2) |
| Phone locks mid-session | - | S5 |

No dead end exists inside `tick` itself: 120 ticks always end the session.

---

## 7. E. Kid safety and privacy

| Check | Result |
|---|---|
| No frames stored or sent | Stated well (REQ 11.7, 9.6). **Not enforced by any test.** S14. |
| No accounts, purchases, ads | Stated (REQ 12.6, 12.7, 14.5). No test. S14. |
| Nothing pushes the child to keep going | Good: fixed 120 s, no retries, no streaks, no extra time. One thing to watch: the rare-monster lock ("Brush morning AND night") must stay a plain invitation with no "you missed it" wording. Add that sentence to the Monster Book spec. |
| Third-party requests | Model files same-origin: good. Risk: Web Speech voices that are produced on a server (S16). Risk: Kiro adding a CDN font or script; the CSP tag (S14) blocks it. |
| Camera stops on end / hidden | Stated (REQ 11.6). Testable with the fake source (section 4). |
| Kind proximity disclosed | **Half disclosed.** REQ 14.6 wording covers the weaker monster only. The "so close" rescue is not mentioned. Add a second sentence: "A monster that is nearly beaten when the time is up counts as beaten." And it has no home until the `parent-screen` spec exists (B1). |
| Kind proximity never rewarding | Holds today; depends on Q2 (section 6). |
| Guilt messages | REQ 14.5 forbids them. The wording guard test (S14) should ban "almost", "lost", "failed", "missed" in **child-facing** lines. ("Missed" is allowed on the parent screen only, per dental-rules.) |
| Stored data | `startedAt` to the millisecond is more than is needed (date and time of day are already stored), but harmless and useful for ordering. Keep. |
| Adult gate, Clear all data | Later spec. Keep both; a judge will look for them. |

---

## 8. F. Dental rules

I have not changed or added any dental fact. Items that are **yours to confirm**:

| Item | Where | Status |
|---|---|---|
| Zone order: upper right → upper left → lower left → lower right | dental-rules.md, REQ 3.2 | Your brief says it is still [TO CONFIRM]. The files say you confirmed it on 14 Nov (REQ Decisions 1; `02-idea-decisions.md` row 7), and dental-rules.md has no [TO CONFIRM] mark left. I ask once more as Q1, as you asked. |
| "A full brush is 2 minutes" | dental-rules.md | Your rule. If the app or video cites a source for it, you supply the source. |
| 4 zones × 30 s; front teeth as part of the side zones | dental-rules.md | Your rule. Note for you: nothing in the game mentions inner surfaces, chewing surfaces or the tongue. That is fine for a game, as long as no line claims the mouth is "fully clean". |
| "Kids stop in under a minute and skip the back teeth" | storyboard shot 2 | Marked there as your own clinic observation. Needs your final wording or a source. |
| 20 s of detected brushing beats a monster | DES s6 | A game number, but it carries a message ("20 s per corner is enough"). Q3 fixes the message. |
| "Brush hand near the mouth on the side of the active zone" | dental-rules.md | **This needs you, as a dentist, before the tracking spec.** When a child brushes the left back teeth, is the brushing hand reliably on the left of the mouth as the camera sees it? For a right-handed child brushing the right side, the hand may sit in front of the mouth or cross it. I do not know, and I will not guess. A 30-minute test with a debug overlay settles it (first task of the `hand-tracking` spec). |
| Upper vs lower "judged roughly from hand height" | dental-rules.md | Same: likely to be a difference of a centimetre or two. If the test shows it cannot be told apart, the fallback is in Q7. |
| Left and right | everywhere | Whose left? The spec never says. It must be **the child's own left**, drawn on the left of the screen because the preview is mirrored. The raw camera frame has it the other way round. This is the most common bug in mirror apps; it goes in the tracking spec as its first test. |

---

## 9. G. Edge cases

| Case | In the spec today | Needed |
|---|---|---|
| Poor light | DES s9, contradictory (B4) | B4 rule: untracked seconds drain at 2/s, zone saved as unverified. No message to the child. |
| Second face in frame (parent, sibling) | Nothing | Tracking spec: track one face only, the largest; a second face never changes the signal. Fixture test with two faces. |
| Child leaves the frame | Nothing | It is `null` (B4): the timer runs, the monster drains slowly, the zone is unverified. No "come back" prompt. |
| Tab hidden | DES s9: pause, camera off | Add the 60 s drop (S4) and a requirement line (REQ 2.6). |
| Camera refused | REQ 8.1, 8.3: good | Add: unanswered box and non-secure page (plain `http`) count as refused (S6). |
| Slow phone | REQ 11.12 only states a target | (a) Clock-driven loop so 120 s is 120 s at any frame rate. (b) 8 s start limit (S6). (c) Tracking spec: if fewer than 5 frames arrive in a second, that second is `null`. |
| Landscape / portrait / desktop | REQ 11.9 "portrait" | S17. |
| Phone locks | Nothing | S5. |
| Sound blocked until a tap | Nothing | The start button (B2) is the tap that unlocks sound. On iPhone the `<video>` needs `playsinline` and `muted`. Both go in the screen task. |
| Storage full or blocked | DES s9 | Keep simple (N3). |
| Clock changes mid-session, or a session that crosses midnight | Nothing | Date and time of day are fixed at session start. One sentence in DES s7. |

---

## 10. H. Task plan

**Too big for one Kiro run today:**

- **Task 6** (four functions, three property tests, 25 requirements). Split in two.
- **Task 11** (camera preview, canvas, countdown, caption, privacy, layout, fps; no
  tests). Split: a tested pure view function, then the timer-only screen, and the camera
  preview moves to the tracking spec.
- **Task 12** (table, playback, fallback, wording). Split: table + guard tests, then the
  speaker.

**Proposed plan for `core-brushing-loop` (14 tasks, one module + its tests each):**

| # | Task | Module(s) | Tests | Why here |
|---|---|---|---|---|
| 1 | Project setup + smoke test + CSP + privacy guard | config, `index.html`, `src/main.ts` (empty shell) | smoke, privacy guard | Guard exists before any code does |
| 2 | Types and constants | `types.ts`, `constants.ts` | constants add up | - |
| 3 | Monster table, fixed assignment rule, resolve | `monsters.ts` | 12 = 8 + 4; no rare unless eligible; rescue at ≤ 9 | B6 |
| 4 | Session core: `startSession`, `isBrushing`, `tick`, `pause`, `resume` | `session.ts` | health only drops by the rules; 120 ticks exactly; zone order (13.1, 13.2, 13.7 rewritten) | B4, B7, S1-S3 |
| 5 | Session result + view | `session-result.ts`, `view.ts` | seconds ≤ 30; verified flags; `toView` | split from old 6 and 11 |
| 6 | Game loop | `ui/game-loop.ts`, `SignalSource` + `nullSignalSource` | fake clock: exact ticks, pause, 60 s drop, wake lock asked once | B2, S4, S5 |
| 7 | Voice lines + wording guard | `audio/lines.ts` | every line has a caption; banned words | S14 |
| 8 | **Timer-only screen, wired up** | `ui/session-screen.ts`, `main.ts` | `toView` already tested; manual check | **PLAYABLE** |
| 9 | Speaker + deploy to GitHub Pages | `audio/speaker.ts`, Pages config | `rampGain`; local voices only | **LIVE URL = safety net** |
| 10 | Time of day + storage | `time-of-day.ts`, `storage.ts` | all 24 hours; round trip; only allowed keys | S9, S10 |
| 11 | Monster Book logic | `monster-book.ts` | rare needs morning + night, counting the new session; union of earned | B5 |
| 12 | Miss scores + starting health | `miss-score.ts` | 36 ≤ health ≤ 60, whole numbers; camera sessions only; last 7 | S7, S8, Q5 |
| 13 | Parent stats | `stats.ts` | never more than 30 per zone; unverified never counted | - |
| 14 | Wire memory in: save result, start from history, end card | `main.ts`, `ui/end-card.ts` | one integration test with fake storage | closes the loop |

Then the other specs (B1), each with its own short task list:

- **`hand-tracking`** (about 6 tasks): side/level feasibility test with a debug overlay →
  pure `classifyFrame` on fixtures (left/right mirror test first) → pure `aggregateSecond`
  → camera + MediaPipe adapter behind `SignalSource`, models same-origin → mirrored
  preview with the monster pinned to the cheek → the "untracked" rule end to end.
- **`mirror-and-screens`** (about 5 tasks): title screen with the privacy line, haunted
  frame (CSS), monster and smoke drawing, Monster Book screen, end card polish.
- **`parent-screen`** (about 3 tasks): adult gate, facts + the two disclosure sentences,
  Clear all data.

About 28 Kiro task runs in all. Credit budget goes in the playbook (Step 4) once you tell
me how many credits are left.

---

## 11. I. Demo fit

| Shot | Needs | In this spec? |
|---|---|---|
| 1. Haunted mirror lights up, monster on cheek | Mirror frame art, monster art, face-pinned monster | No (B1) |
| 2. You to camera | Nothing from the build | - |
| 3. Open link, privacy card | Title screen with "The camera stays on this phone. Nothing is saved or sent." | No. Add to `mirror-and-screens`. |
| 4. Full brush; wrong side does nothing; right side → smoke | Real tracking, at least **side** | No (B1). The shot names only the wrong *side*, so upper/lower can be forgiving (Q7). |
| 5. Monster Book, rare one locked | Book screen; monster names; the lock line | Logic yes, screen no. Names missing (N5). |
| 6. Parent screen: "back-left missed 3 nights" | Parent screen; "most missed zone" over nights | Logic partly (`stats.ts`). Note: the zones are upper-left / lower-left; "back-left" is not a zone. Choose the wording for the shot. |
| 7. Light off → guided timer | Mid-session loss of tracking, visibly still running | Only after B4. |
| 8. Kiro: spec, steering, hooks, property tests | Hooks; a property test that means something | Hooks missing (S15); test is hollow (B7). |
| 9. End card | URL, GitHub link | Deploy task (new task 9). |

**In the spec but never in the video, so it can wait or shrink:** schema migration (N2);
in-memory storage fallback (N3); stored miss scores (S7); recorded voice clips (speech
from local voices is enough to film); the fps requirement as a formal criterion; all 12
monster drawings (the video shows about five; the table can hold 12 names with shared
placeholder art).

**Kind proximity is also never shown in the video.** It is your idea and the logic is one
small module, so I would keep it, but it is the first thing to cut if days run short
(Q6).

---

## 12. Steering files: small notes

No change needed to the steering files to start. Three one-line edits worth asking Kiro
for later: `tech.md` signal is "per second" not "per frame" (S12); `tech.md` Web Speech
"local voices only" (S16); `structure.md` add `src/ui/game-loop.ts` and `src/main.ts`.

---

## 13. Decisions that are yours (asked one at a time in chat)

| # | Decision | My recommendation |
|---|---|---|
| Q1 | Zone order | Keep: upper right → upper left → lower left → lower right (already confirmed 14 Nov) |
| Q2 | Does a monster that was *not* beaten still go in the Monster Book? | Yes, keep it. A tracking mistake must never cost a child a monster. |
| Q3 | What does the child do in a zone after its monster is beaten? | "Keep brushing to blow the smoke away" until the 30 s end. No new win or lose. |
| Q4 | Camera mode, tracker cannot see: what happens to the monster? | Drain at 2 per second; zone saved as unverified if more than 10 s were untracked. |
| Q5 | Kindness numbers: floor, rescue, and how far back the miss score looks | Keep floor 36 and rescue 9; look at the last 7 camera sessions only. |
| Q6 | Scope: which specs and screens for 4 Dec, and what is cut first | Four specs as in section 10; cut order: demo link, kind proximity, parent stats beyond one line. |
| Q7 | If the feasibility test shows upper/lower cannot be told apart | Judge side only; treat level as matching. Tell parents in one line. |

The design also has five notes still marked "Dr. Yatin to confirm" (1-second tick,
timer drain from elapsed time, linear kindness curve, rare eligibility at session start,
stored miss scores). After the fixes above: the first and third stand; the second and
fifth are replaced by B4 and S7; the fourth is corrected by B5. I will fold them into the
questions above rather than ask five more.
