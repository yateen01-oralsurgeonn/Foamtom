# Diff review v1: Kiro's spec changes against SPEC-REVIEW-v1

Reviewer: Claude, 17 Nov 2026. Review only; nothing in `.kiro/` was edited by hand.

Diff reviewed: `git diff 2af9468..5994297 -- .kiro/` (9 files, +750 / −472). Line numbers
below are from commit **5994297**. Short names: **REQ** = `requirements.md`, **DES** =
`design.md`, **TASKS** = `tasks.md`, all in `.kiro/specs/core-brushing-loop/`.

Runs that made the diff (one commit each): s01, s02, c01, c02, c03, c04, d01, d02, d03,
d04, h01, t01. Two runs stopped on purpose and changed nothing: c01 (first try: steering
conflict, fixed by s01 + s02) and t01 (first try: speech never wired in; fixed in the
prompt). Log: `BUILD-PLAYBOOK.md` section 8.

## 1. Verdict

All 9 BLOCKERs and all 17 SHOULDs are fixed or, for B1, fixed as far as this stage can
fix them. **Nothing was made worse.** Five small leftovers (old wording that says
"absent" or "placeholder", one wrong arrow in a diagram, one sentence in 13.4) are
**partly** items; a single follow-up prompt, `f01-leftover-wording.md`, covers them
(section 5). Kiro's unasked changes are all small and all sensible (section 4).

One new question for Dr. Yatin came out of the review (section 6).

## 2. BLOCKERs

| # | Status | Evidence |
|---|---|---|
| B1 Only a quarter of the product has a spec | **Partly, by plan** | REQ 29-36 now point each missing part to a named spec (`hand-tracking`, `mirror-and-screens`, `parent-screen`); TASKS last line names them. The three specs do not exist yet: prompts `n01`-`n03`, `n90`, `n91` are written and wait for stage C/F/G. Not a follow-up item; it is the plan. |
| B2 No runnable app | **Fixed** | REQ 15.1-15.6 (552-579); DES §3 rows `game-loop.ts`, `session-screen.ts`, `end-card.ts`, `main.ts` (114-119); TASKS 1, 6, 8. |
| B3 Playable only at task 11 | **Fixed** | TASKS: task 8 "PLAYABLE timer-only game", task 9 "LIVE LINK"; storage and memory are tasks 10-14. |
| B4 Three answers to "signal is null" | **Fixed in the rules; partly in wording** | One rule: REQ 5.2 (148-150), 6.3 (185-189), 7.7 (215-218), 8.1 (234-238), 9.3 (270-274); DES tick (273-300), no mode branch except "timer-only → null" (276). Steering agrees: `tech.md` ("A `null` signal means..."), `kid-safety-privacy.md` camera bullet 4 (via s02). **Leftover:** REQ 7 ("minimal placeholder screen"), 12 and 57 ("its absence"), 61 ("tracking signal absent"), 179 ("absent"). Same meaning as `null`, but a build run may read "absent" as `undefined`. → f01. |
| B5 Rare monster needs a night session already stored | **Fixed** | REQ 10.6 (315-318), 13.3 (446-452); DES `isRareEligibleForNewSession` (496-504) and the corrected note (510-513); DES test 9 (629). |
| B6 Monster choice undefined, hidden `rareEligible` | **Fixed** | REQ 10.9, 10.10 (327-338); DES `assignMonsters` pseudocode (517-528), `StartInput` (209-215), `startSession(input)` (334-347); DES test 8 (628). |
| B7 Duration test is a tautology | **Fixed** | REQ 13.2 (439-444) counts ticks; DES `durationSeconds = ticksDone` (329); DES test 3 (623) and the note "Test 3 counts ticks" (641). TASKS 4.6 and 5.6 split it correctly (see section 4). |
| B8 Nothing to do after the monster dies | **Fixed** | Smoke: REQ 7.8 (220-225), DES "After a monster is beaten: smoke" (465-472), DES test 7 (627). New line "Keep brushing! Brush the smoke away!" in REQ 222, DES 471, TASKS 7.1. Brushed seconds still count after a defeat (DES 280-281 count before the defeat branch at 284), so a child who keeps brushing records no miss. Miss window of 7: REQ 14.1 (513-519), DES 416-425. |
| B9 Vitest fails on zero tests; 11.4 had no box | **Fixed** | TASKS 1.8 smoke test; every task and sub-task has `- [ ]` (86 boxes, none missing). |

## 3. SHOULDs

| # | Status | Evidence |
|---|---|---|
| S1 `Date` inside logic | **Fixed** | DES 133, `StartInput` 209-215, `startSession` 334-347. |
| S2 Mutable state | **Fixed** | All fields `readonly` (DES 176-237); "return a NEW state object" (299). |
| S3 No named phases | **Fixed** | `phase` (DES 205); state diagram 256-269; `pause`/`resume` (318-319). |
| S4 Pause has no limit | **Fixed** | REQ 2.7 (88-89); DES §9 tab-hidden row (581); REQ 13.12; DES test 15. |
| S5 Phone locks | **Fixed** | REQ 15.4 (570-572); DES §9 wake-lock row (583); DES test 15 "wake lock asked once and released". |
| S6 Permission box dead end | **Fixed** | REQ 8.1 "within 8 seconds" (234-238); DES §9 row (579); TASKS 6.6. |
| S7 Stored miss scores | **Fixed** | REQ 14.7 (546-548); DES §8 (556-570): `StorageData` has only `version` and `sessions`. |
| S8 Fractional health | **Fixed** | REQ 14.2 "rounded" (521-525), 13.6 (465-468); DES 430, 376-380. Timer-only starts at 60 (DES 341, 433). |
| S9 Logic imports from storage | **Fixed** | `SessionRecord` gone; DES 562-563; REQ 13.10 import rule (488-489); `structure.md` last bullet. |
| S10 Global `localStorage` | **Fixed** | `createStorage(backend)` (DES 112); DES test 13 and the Map-backed fake (646-647). |
| S11 5.5 missing `moving` | **Fixed** | REQ 159-161. |
| S12 Per-frame vs per-second | **Fixed** | REQ 12, 56, 142; `tech.md` "once per second"; DES note 349-353 sends the frames-to-second rule to `hand-tracking` (prompt `n01` has `aggregateSecond`, line 55). |
| S13 2.4 vs pause | **Fixed** | REQ 2.4 (78-79), 2.6 (84-86). |
| S14 No privacy / wording tests, no CSP | **Fixed** | REQ 12.8 (415-416), 13.10 (484-489), 13.11 (491-494); DES tests 16, 17; TASKS 1.6, 1.7, 7.3. |
| S15 No hooks | **Fixed; not yet proven to fire** | `.kiro/hooks/` has 3 files: `run-tests-on-logic-change`, `privacy-guard-on-source-change`, `wording-check-on-child-text` (`.kiro.hook` JSON, `when.type: fileEdited`, `then.type: askAgent`). Kiro chose the format; no hook has fired yet, because there is no `src/`. Check in the Kiro IDE after build task 1. |
| S16 Server-made speech voices | **Fixed** | REQ 12.9 (418-420); `tech.md` Voice bullet; DES `speaker.ts` (118); TASKS 9.1, 9.6. |
| S17 Landscape / desktop | **Fixed** | REQ 11.9 (375-377); DES 604-605; TASKS 8.4. |

NICE items, for the record: N1 `fled` **fixed** (REQ 14.3, DES 165); N2 migration **fixed**
(DES 566-567); N3 in-memory fallback **fixed** (DES 582); N4 13.4 **fixed** but one
awkward sentence (REQ 455-457, → f01); N5 names **fixed** (REQ 306-308, DES 532-547);
N6 `?demo` **not done, by decision** (first item in the cut order); N7 Book full in a week
**not in the spec, by design** (write-up note); N8 model sizes **waits for `n01`**.

## 4. What Kiro changed that was not asked for

| Run | Change | Verdict |
|---|---|---|
| s01 | Placed the new bullets where it chose; `structure.md` lost its final newline. | Fine. |
| s02 | The longer Data bullet runs onto one long line. | Fine. |
| c04 | Tried a shell command (denied, file tools only) and used the write tool instead; left an extra blank line before "Decisions (2026-11-15)". | Fine. |
| d01 | Added `monsters = zones.map(z => makeMonster(...))` to `startSession` (DES 342): the prompt used `monsters` without defining it. | Correct fix of my omission. |
| d03 | Added `speaker.ts` to the diagram (DES 64). | Fine: it is in the module list. |
| d03 | Diagram keeps `SESSION --> STATS` (DES 73); `session.ts` never uses `stats.ts`. Text still mentions a "dashed boundary" that the diagram does not draw (DES 89). | Wrong but harmless → f01. |
| d04 | Test 2 adds "(stopping at 0 if less than that is left)" (DES 622). | Correct: without it the test would fail on correct code. |
| d04 | Left the §11 intro saying every test is a fast-check property (DES 615-617); tests 1 and 14 are full enumerations. | Small → f01. |
| t01 | Moved the `durationSeconds` and result checks of design tests 3 and 4 from task 4 to task 5.6 (TASKS 4.6, 4.7, 5.6). | Correct: `toSessionResult` is built in task 5. |
| t01 | New rules and sub-tasks: test helpers live in the test file; `build.assetsInlineLimit: 0`; stylesheet linked from `index.html`, styles set by class or `element.style`; line ids in `lines.ts` must match `toView`'s `captionLineId` (5.2, 7.2); `.gitkeep` in empty folders (1.5); README limits (9.4); Pages source note (9.7); the integration test composes the calls instead of importing `main.ts` (14.4); a manual check (14.5); the game loop builds the session after the mode is known (6.2). | All sensible. Each one closes a gap a build run would otherwise hit. |

No change touched `dental-rules.md` or `product.md`. No requirement was renumbered.

## 5. Follow-up

One prompt, `docs/review/kiro-prompts/f01-leftover-wording.md`, edits REQ and DES only:

1. REQ intro (7, 12), 1.2 (57), 1.3 (61), 6.1 (179): "absent" / "its absence" /
   "placeholder" → `null` / "session screen".
2. REQ 13.4 (455-457): one plain sentence.
3. DES §2: drop the `SESSION --> STATS` arrow; "dashed boundary" → "the Logic box".
4. DES §11 intro: tests 1 and 14 check every case instead of sampling.

Result: see the log in `BUILD-PLAYBOOK.md` section 8 and section 7 below.

## 6. New question for Dr. Yatin (not changed in the spec)

**Rare monsters in a third session on the same day.** With REQ 10.6 as written, once a day
has a morning and a night session, **every** later session that day is rare-eligible,
including a "neither" session at 2 pm (Kiro pointed this out in run c02). A child could
brush a third and fourth time to collect rares faster. That is mild, and only 4 rares
exist, but it is a small pull to keep playing, which the kid-safety steering avoids.

My recommendation: **one rare-eligible session per day**, the first one that completes the
morning + night pair. It is a one-line change to 10.6 and to the design function. Waiting
for your yes; not in any prompt yet.

## 7. Follow-up result

f01 ran on 17 Nov, commit **8325fc7**, 1.12 credits. Only `requirements.md` and
`design.md` changed; all 10 edits made as written; Kiro reported no conflict.
`grep -i "absent\|placeholder"` over the spec now finds nothing. B4 and the other
leftovers are now **fixed**. Open: B1 (by plan, stages C/F/G), S15 (hooks must be seen
firing), and the question in section 6.
