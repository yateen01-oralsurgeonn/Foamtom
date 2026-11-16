# Kiro change prompts v1

Written 15 Nov 2026 by the reviewer. **Kiro makes every change; nothing here edits `.kiro/`
directly.** Each prompt is its own file in `docs/review/kiro-prompts/`, so it can be pasted
into Kiro or run from Git Bash.

Source: `SPEC-REVIEW-v1.md` (findings B1-B9, S1-S17, N1-N8) and your seven answers
(section 14 of that file).

## How to run one prompt

From the repo root (`Desktop/Foamtom`), in Git Bash:

```bash
kiro-cli chat --no-interactive --trust-tools=fs_read,fs_write "$(cat docs/review/kiro-prompts/<file>.md)"
```

Then check, before the next prompt:

```bash
git status --short        # only the file(s) named in the "Edits" column may appear
git diff --stat
```

- If any other file changed: `git checkout -- <that file>` and tell Kiro off in the next
  run, or stop and ask.
- If Kiro says an instruction conflicts with a steering file or with the requirements:
  **stop and call Dr. Yatin.** Do not rerun with a different wording.
- If the right file changed, read the diff once, then commit and push:

```bash
git add .kiro && git commit -m "spec(core-brushing-loop): <what> (Kiro CLI, prompt <id>)" && git push
```

Run the prompts **in the order below**. Each one assumes the ones before it are done.

## Part 1 — fix `core-brushing-loop` (11 runs)

| Order | Prompt file | Edits | What it does | Findings closed |
|---|---|---|---|---|
| 1 | `c01-req-signal-and-untracked.md` | requirements.md | Signal once per second; what `null` means; one rule when the tracker cannot see (−2 per second, zone unverified above 10 s); side-only switch | **B4**, S11, S12, Q4, Q7 |
| 2 | `c02-req-monsters-and-book.md` | requirements.md | Rare monster counts the session that is starting; fixed rule for choosing monsters; smoke after a defeat; 12 names; every monster goes in the Book | **B5**, **B6**, **B8**, N5, Q2, Q3 |
| 3 | `c03-req-kindness-and-properties.md` | requirements.md | Miss score from the last 7 camera sessions; whole-number health; "fled"; both disclosure sentences; duration property that counts ticks | **B7**, **B8**, S7, S8, N1, N4, Q5 |
| 4 | `c04-req-app-shell-and-edges.md` | requirements.md | Start button, one game loop, `SignalSource`, 8 s limit, wake lock, hidden pause + 60 s drop, end card, deploy; privacy and wording guard tests; Decisions (15 Nov) | **B2**, S4, S5, S6, S13, S14, S16, S17 |
| 5 | `d01-design-types-and-tick.md` | design.md s4, s5 | Read-only state, named phases, plain start inputs, the single tick rule | **B4**, **B6**, S1, S2, S3 |
| 6 | `d02-design-health-and-monsters.md` | design.md s6, s7 | New constants, untracked drain, miss window, smoke, corrected rare rule, assignment rule | **B5**, **B6**, **B8**, S8 |
| 7 | `d03-design-modules-storage-errors.md` | design.md s1, s2, s3, s8, s9, s10 | Module list for a runnable app; storage without stored miss scores; error table | **B2**, S7, S9, S10, N2, N3 |
| 8 | `d04-design-testing.md` | design.md s11 | 19 tests that can fail; valid test data | **B7**, S14 |
| 9 | `t01-tasks-new-plan.md` | tasks.md | 14 small tasks; playable at task 8, live at task 9 | **B2**, **B3**, **B9** |
| 10 | `s01-steering-small-edits.md` | steering/tech.md, steering/structure.md | Per-second signal, local voices only, one timer, one interface | S12, S16 |
| 11 | `h01-hooks.md` | new files in `.kiro/hooks/` | Three hooks: tests on logic change, privacy guard, wording check | S15 |

Why four prompts for one file: each run touches a few named sections, so a diff is short
enough to read in a minute, and a bad run can be thrown away without losing the others.

**After run 4**, read `requirements.md` top to bottom once. It is the source of truth
for runs 5 to 9, which are told to stop if they find a conflict.

**After run 9**, check these by eye in `tasks.md`:

- every task and sub-task has a `[ ]` box;
- 14 tasks, in the order of the prompt;
- task 4 has the two "TEMPORARY" constants and task 14 removes them.

## Part 2 — create the three new specs (9 runs)

Each spec takes three runs: requirements, design, tasks. Read and correct each file
before the next run. The dental and parent wording is yours to check.

| Order | Prompt file | Creates |
|---|---|---|
| 12 | `n01-new-spec-hand-tracking.md` | `.kiro/specs/hand-tracking/requirements.md` |
| 13 | `n90-new-spec-design.md` with `{{SPEC}}` = `hand-tracking` | `.../hand-tracking/design.md` |
| 14 | `n91-new-spec-tasks.md` with `{{SPEC}}` = `hand-tracking` | `.../hand-tracking/tasks.md` |
| 15 | `n02-new-spec-mirror-and-screens.md` | `.kiro/specs/mirror-and-screens/requirements.md` |
| 16, 17 | `n90`, `n91` with `{{SPEC}}` = `mirror-and-screens` | design.md, tasks.md |
| 18 | `n03-new-spec-parent-screen.md` | `.kiro/specs/parent-screen/requirements.md` |
| 19, 20 | `n90`, `n91` with `{{SPEC}}` = `parent-screen` | design.md, tasks.md |

The two shared prompts have a placeholder. Fill it in on the command line:

```bash
kiro-cli chat --no-interactive --trust-tools=fs_read,fs_write \
  "$(sed 's/{{SPEC}}/hand-tracking/g' docs/review/kiro-prompts/n90-new-spec-design.md)"
```

These prompts tell Kiro to "ask me before deciding". In `--no-interactive` mode it cannot
ask, so it will print its questions and stop. Answer them by pasting the same prompt again
with your answers added at the bottom under a line "ANSWERS FROM DR. YATIN:". Or run
these nine in the Kiro app in Spec mode, where it can ask as it goes.

**When to run Part 2.** Runs 12 to 14 (hand-tracking) can wait until the timer-only game
is live (task 9 of the build), but no later: its first task is the feasibility test,
and the answer may change the plan. Runs 15 to 20 can wait until the camera works.

## What the prompts deliberately leave alone

- `dental-rules.md`, `kid-safety-privacy.md`, `product.md`: no change.
- Zone order, 4 × 30 s, `H_MAX` 60, damage 3, floor 36, rescue 9, morning and night hours:
  no change.
- Requirement numbers: nothing is renumbered; new items get new numbers (5.6, 5.7, 7.8,
  2.6, 2.7, 10.9, 10.10, 12.8, 12.9, 13.10-13.12, 15).

## Still open (not in any prompt)

| Item | Who | When |
|---|---|---|
| ~~Monster names in prompt `c02`~~ | **Approved by Dr. Yatin, 16 Nov 2026, as written** | Done |
| "Keep brushing to blow the smoke away!" wording | Dr. Yatin | Before run 2 |
| Does the brushing hand sit on the side being brushed? Upper vs lower? | The feasibility test (hand-tracking task 1) | Before hand-tracking task 2 |
| Storyboard shot 6 says "back-left"; the zones are upper-left and lower-left | Dr. Yatin picks the wording for the shot | Before filming |
| Storyboard shot 2 claim ("stop in under a minute, skip the back teeth") | Dr. Yatin's own observation or a source | Before filming |
| `?demo` short session for judges (N6) | First item in the cut order; add only if time allows | After the camera works |
