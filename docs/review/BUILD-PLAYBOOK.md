# Foamtom build playbook

For whoever drives Kiro task by task: Dr. Yatin, or a cheaper model working for him.
Written 15 Nov 2026. Deadline: **4 Dec 2026, 2 pm PT = 3:30 am IST on 5 Dec.** Submit on
the evening of 4 Dec IST.

## 0. The three rules that cannot be broken

1. **Kiro writes all app code and all spec files.** The driver never edits `src/`,
   `tests/`, `index.html`, config files or anything in `.kiro/` by hand. Not even a
   one-line fix. If something is wrong, Kiro fixes it through a prompt.
2. **One task per Kiro run.** Check, commit, push. Then the next.
3. **When in doubt, stop and call Dr. Yatin** (section 5). A wrong guess costs more than
   a pause.

Driver's own notes go in `docs/review/` only.

## 1. Before the first run

- Work in Git Bash, from the repo root: `cd ~/Desktop/Foamtom`
- `git status` must be clean and `git pull` up to date.
- Write today's Kiro credit balance in the log (section 8). In the Kiro app it is on the
  account/usage page; in the terminal chat, try `/usage`.
- `kiro-cli chat --list-models` costs nothing and shows which models you can use.

**The shell tool name.** `kiro-cli chat --help` (v3.3.0) does not print tool names. What
this machine shows: Kiro's example agent file lists the tools as `read`, `write`, `shell`,
and a Kiro log from 14 Nov lists the command tool as `execute_pwsh` (Kiro runs commands
in PowerShell on Windows). The commands below use `execute_pwsh`. **This is not yet
proven on a real run.** Task 1 proves it: Kiro's output must show `npm` actually running.
If Kiro says it was not allowed to run a command, change `execute_pwsh` to `shell`, then
to `execute_bash`. If none works, use the no-shell way in section 3b.

## 2. Order of work

| Stage | What | Runs | Prompts |
|---|---|---|---|
| A | Fix the `core-brushing-loop` spec | 11 | `KIRO-CHANGES-v1.md`, Part 1 |
| B | Build tasks 1-9 → **timer-only game live on GitHub Pages** | 9 | section 3 |
| C | Create the `hand-tracking` spec | 3 | `KIRO-CHANGES-v1.md`, runs 12-14 |
| D | Build tasks 10-14 (storage, Book, kindness, stats, wiring) | 5 | section 3 |
| E | Build `hand-tracking` (task 1 = the feasibility test; **stop for Dr. Yatin's results**) | about 6 | section 3 |
| F | Create and build `mirror-and-screens` | 3 + about 5 | runs 15-17, then section 3 |
| G | Create and build `parent-screen` | 3 + about 3 | runs 18-20, then section 3 |
| H | Film, write-up, submit | - | `docs/hackathon/03-video-storyboard.md` |

Suggested dates (IST). The live link by 20 Nov is the safety net; everything after it is
an improvement on something that already works.

| Dates | Stage |
|---|---|
| 16 Nov | A, runs 1-11. The reviewer can still read Kiro's diffs today and tomorrow. |
| 17 Nov | B, tasks 1-4. C, run 12. Reviewer's last day: `RESUME-2026-11-17.md` is written. |
| 18-20 Nov | B, tasks 5-9. **Live link.** |
| 21-22 Nov | C, runs 13-14. E, task 1: the feasibility test with Dr. Yatin. |
| 23-26 Nov | E, remaining tasks. D, tasks 10-14. |
| 27-29 Nov | F. |
| 30 Nov-1 Dec | G. (Credit-code request closes 1 Dec, 12 pm PT.) |
| 2 Dec | Film. |
| 3 Dec | Edit the video; write-up on how Kiro was used. |
| 4 Dec, evening | Submit. Nothing new is built on this day. |

If days run short, cut in the approved order (`SPEC-REVIEW-v1.md`, Q6): the `?demo` link;
upper/lower detection; parent screen down to one line of facts plus disclosure and Clear
all data; kind proximity; the art down to a CSS frame and one monster in several colours.
Never cut: the timer-only game, the privacy guard test, the hooks, the property tests.

## 3. The loop for one build task

Set the spec and the task number, then run Kiro:

```bash
SPEC=core-brushing-loop
N=1

kiro-cli chat --no-interactive --trust-tools=fs_read,fs_write,execute_pwsh \
  "$(sed -e "s/{{SPEC}}/$SPEC/g" -e "s/{{N}}/$N/g" docs/review/kiro-prompts/b00-build-task.md)" \
  | tee /tmp/kiro-task-$N.log
```

Then check:

```bash
bash docs/review/check-task.sh
```

The script prints PASS or FAIL for each of these and changes nothing:

| Check | What it means |
|---|---|
| tests | `npm run test:run` passes |
| build | `npm run build` passes |
| spec untouched | nothing in `.kiro/` changed except ticks in `tasks.md` |
| tasks.md: ticks only | the only change in `tasks.md` is `[ ]` → `[x]` |
| files in allowed places | nothing new outside `src/`, `tests/`, `public/`, config files |
| no network / frame storage | no `fetch`, `XMLHttpRequest`, `sendBeacon`, `WebSocket`, `toDataURL`, `toBlob`, `MediaRecorder`, `captureStream`, cookies or outside URLs in `src/` |
| logic: no random, no clock | no `Math.random`, `new Date` or `Date.now` in `src/logic/` |
| logic imports nothing outside | `src/logic/` imports only from `src/logic/` |
| packages | printed for you to look at: only vite, typescript, vitest, fast-check, and (in hand-tracking) `@mediapipe/tasks-vision` |

Also look yourself, every time:

- `git status --short`: are the changed files the ones the task names? One or two extra
  test helpers are fine. A different module is not.
- Did Kiro tick the task's boxes in `tasks.md`, and only this task's?
- Open one new test file. Does it use `fc.assert` / `fc.property` where the design says
  "property test"? Is any test marked `.skip` or `.todo`? (Not allowed.)

If everything passes, commit and push (section 6), fill in the log (section 8), next task.

### 3b. If no shell tool name works

Run Kiro with file tools only (`--trust-tools=fs_read,fs_write`) and add this line to the
end of the prompt: "You cannot run commands in this run. Write the files; the driver will
run the tests and the build." Then run `npm install` (task 1 only) and
`bash docs/review/check-task.sh` yourself. On a failure, use the fix prompt in section 4.

## 4. When a check fails

**First failure: one fix run.**

```bash
{ sed -e "s/{{SPEC}}/$SPEC/g" -e "s/{{N}}/$N/g" docs/review/kiro-prompts/b01-fix-task.md
  tail -n 60 /tmp/foamtom-test.log        # or foamtom-build.log, or the FAIL lines
} > /tmp/kiro-fix.txt

kiro-cli chat --no-interactive --trust-tools=fs_read,fs_write,execute_pwsh "$(cat /tmp/kiro-fix.txt)"
bash docs/review/check-task.sh
```

**Second failure on the same task: stop and call Dr. Yatin.** Do not try a third prompt,
do not reword, do not fix it by hand. Leave the working tree as it is so he can see it.

**Privacy check fails** (network call, frame storage): do not commit under any
circumstances. One fix run, quoting the FAIL lines. If Kiro argues that it needs the
call, stop and call.

**Kiro changed a file it should not have** (but not in `.kiro/`): undo just that file with
`git checkout -- <file>` (or delete it if it is new), rerun the check, and continue. Note
it in the log.

## 5. Stop and call Dr. Yatin when

1. **Kiro edited the spec without being asked**: anything in `.kiro/` other than ticking
   this task's boxes. Do not commit. Do not revert yet; he will want to see what it tried
   to change.
2. **Kiro says the spec is unclear or contradicts itself.** Copy its exact words into the
   log. This is the system working: the fix is a small spec prompt, not a guess.
3. **A test still fails after the one fix run.**
4. **Kiro weakened, skipped or deleted a test** to get a pass.
5. **A privacy check fails twice**, or Kiro adds any package not on the list.
6. **Anything dental**: wording a child or parent will read that is not already in the
   spec, any health claim, any change to zones, times or order. Never invent a dental
   fact or a source.
7. **The feasibility test** (hand-tracking task 1) is built: only Dr. Yatin can do it,
   and its results decide what comes next.
8. **A task used more than twice its credit budget** (section 7), or the balance drops
   below the "stop" line.
9. **Before deploying** for the first time (task 9), and before making the repo public if
   it is not already.

## 6. Commit and push after each task

Kiro wrote the code, so the message says so. No AI co-author line is added for a driver.

```bash
git add -A
git status --short      # last look: no node_modules, no dist, no .env
git -c user.name="$(git -C ../Hackathons config user.name)" \
    -c user.email="$(git -C ../Hackathons config user.email)" \
    commit -m "feat($SPEC): task $N - <task title> (Kiro CLI)"
git push
```

One commit per task. A fix run goes into the same commit if nothing was committed yet,
otherwise its own commit: `fix($SPEC): task $N - <what> (Kiro CLI)`.

Spec prompts (stage A, C, F, G) use `spec(...)` messages; see `KIRO-CHANGES-v1.md`.

## 7. Credit budget

**These are estimates, not measurements.** The only fact given is "about 4-5 credits per
Kiro step", and a build run has several steps (read, write, test, fix). After the first
three runs, compare the real cost with the budget and scale the rest of the table.

| Stage | Run | Budget (credits) |
|---|---|---|
| A | 11 spec prompts × 5 | 55 |
| B | task 1 setup and guards | 10 |
| B | task 2 types, constants, time of day | 5 |
| B | task 3 monsters | 10 |
| B | task 4 session core | 15 |
| B | task 5 result and view | 10 |
| B | task 6 signal source and game loop | 15 |
| B | task 7 voice lines | 5 |
| B | task 8 session screen (playable) | 15 |
| B | task 9 speaker and deploy | 10 |
| | **Subtotal: live timer-only game** | **150** |
| C | 3 spec runs × 5 | 15 |
| D | tasks 10-14 (10, 5, 10, 5, 10) | 40 |
| E | about 6 tracking tasks × 15 | 90 |
| F | 3 spec runs × 5, about 5 tasks × 15 | 90 |
| G | 3 spec runs × 5, about 3 tasks × 10 | 45 |
| | **Subtotal: everything** | **430** |
| | Fix runs and reruns, allow 30% | 130 |
| | **Total to plan for** | **about 560** |

What this means:

- **With the 4,000-credit code:** comfortable. Keep going in order. (Code arrived by email 16 Nov 2026; redeem it and write the new balance in section 8.)
- **Without it:** a small monthly allowance will not reach the live game. Spend what
  there is in this order: stage A runs 1-4 (requirements), then 5-9, then build tasks
  1-8. Stop there and wait for the code rather than starting a task that cannot finish.

Rules:

- A task that passes its checks at up to twice its budget is fine. More than twice: stop
  and call (section 5, item 8).
- **Stop line:** when the balance falls below 60 credits, finish the current task, commit,
  and call. Never start a task with fewer credits left than twice its budget.

## 8. Log

Keep this table up to date in this file (the driver may edit this file). One row per
Kiro run, including failed ones.

Credits at start (17 Nov 2026, Kiro usage page, before any run): plan 27 / 50 used;
bonus `kiroween2026` 0 / 4000 used, 46 days left. `kiro-cli` prints no credit line, so
"Used" is read from the usage page (it can lag by a minute).

**Shell tool name, proven 17 Nov (run 0):** `--trust-tools=execute_pwsh` works. Kiro ran
`git status --short` without asking and reported the tool as `shell`. Keep
`execute_pwsh` in the commands; the fallbacks were not needed.

| Date | Stage / task | Prompt | Credits before | Credits after | Used | Budget | Checks | Commit | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 17 Nov | Preflight, run 0 | one-line probe: run `git status --short` | bonus 0 | - | - | - | no file changed | none | Proves the shell tool name. |
| 17 Nov | A, run 1 | `c01-req-signal-and-untracked.md` | - | bonus 0.39 (runs 0 and 1 together) | 0.39 | 5 | **no file changed** | none | **STOPPED: Kiro reported two conflicts with steering and edited nothing.** (1) New 8.1 (mode fixed, poor light handled second by second) against `kid-safety-privacy.md` "the light is too poor to track, the game switches to guided-timer mode". (2) "per-second signal" and `null` against `tech.md` "per-frame signal". Conflict 2 is what prompt `s01` fixes, so `s01` must run before `c01`. Conflict 1 needs a one-bullet steering edit: draft prompt `s02-steering-poor-light.md`, waiting for Dr. Yatin's yes. |
| 17 Nov | A, run 2 | `s01-steering-small-edits.md` (moved before c01) | - | - | - | 5 | only `tech.md`, `structure.md` changed | 9d8e7f5 | Clean. |
| 17 Nov | A, run 3 | `s02-steering-poor-light.md` (new; Dr. Yatin's yes 17 Nov) | - | - | - | 5 | only `kid-safety-privacy.md` changed | fcd0602 | Clean. Fixes conflict 1 above. |
| 17 Nov | A, run 4 | `c01` (second try) | - | - | - | 5 | only `requirements.md` | dcd19bf | Clean. Kiro noted: 6.1 still says "absent"; 13.4 not yet aligned (c03 fixed 13.4). |
| 17 Nov | A, run 5 | `c02` | - | - | - | 5 | only `requirements.md` | 5c2b07a | Clean. New smoke wording went in. |
| 17 Nov | A, run 6 | `c03` | - | - | - | 5 | only `requirements.md` | a932dce | Clean. |
| 17 Nov | A, run 7 | `c04` | - | - | - | 5 | only `requirements.md` | 6e274d1 | Clean. Kiro tried a shell command and was denied (file tools only); it used the write tool instead. Intro still says "placeholder screen". |
| 17 Nov | A, run 8 | `d01` | - | - | - | 5 | only `design.md` | dd0b62e | Clean. Kiro added one line to `startSession` (`monsters = ...`) that the prompt left undefined. |
| 17 Nov | A, run 9 | `d02` | - | - | - | 5 | only `design.md` | 165a452 | Clean. |
| 17 Nov | A, run 10 | `d03` | - | - | - | 5 | only `design.md` | af80c60 | Clean. Added `speaker.ts` to the diagram unasked (it is in the module list, so fine). |
| 17 Nov | A, run 11 | `d04` | - | - | - | 5 | only `design.md` | 0e6b093 | Clean. Kiro added "(stopping at 0 ...)" to test 2: correct. |
| 17 Nov | A, run 12 | `h01` | - | - | - | 5 | 3 new files in `.kiro/hooks/` | 8239df7 | Format: `*.kiro.hook` JSON, `when.type: fileEdited`, `then.type: askAgent`. **Not yet proven to fire** in the Kiro IDE. |
| 17 Nov | A, run 13 | `t01` (first try) | - | - | - | 5 | **no file changed** | none | **STOPPED, correctly:** speaker built in task 9 but never wired to the screens. Dr. Yatin chose to fix it inside task 9. Prompt edited (commit after 8239df7). |
| 17 Nov | A, run 14 | `t01` (second try) | - | 16.81 (bonus) | - | 5 | only `tasks.md`; 14 tasks, 86 boxes, TEMPORARY constants in 4.1 and 14.1 | 5994297 | Clean. Kiro moved the `durationSeconds` checks of design tests 3 and 4 to task 5.6 (correct: `toSessionResult` is built in task 5). |

**Stage A total (runs 0-14, 15 Kiro calls, 13 commits to `.kiro/`): 16.81 bonus credits**,
against a budget of 55. The usage page gives no per-run figure, so per-run "Used" is left
blank; average about 1.1 credits per run. Model: `auto` (default). Scale the stage B
budget in section 7 down with care: build runs read and write far more than spec runs.

## 9. Checks only a person can do

| When | Check |
|---|---|
| After task 8 | `npm run dev`, tap start, watch one whole timer-only session: four zones in order (upper right, upper left, lower left, lower right), 30 s each, countdown correct, a caption for each zone, monster fades and is gone at 30 s, end card appears. Buttons are easy to tap. Nothing is shown by colour alone. |
| After task 8 | Hide the tab for 10 s mid-session: it resumes at the same second. Hide it for over a minute: back at the start screen, nothing saved. |
| After task 9 | Open the live link on your phone. Does the screen stay awake for the full two minutes? Is the voice gentle, with no sudden loud start? Open the browser's network panel on a laptop: every request goes to the same site, none to anyone else. |
| After task 14 | Play twice. The second session shows different monsters. Clear the site data: the next session starts fresh. |
| hand-tracking task 1 | The feasibility checklist (side, level, mirror-flip, both hands, second face, poor light). Write pass or fail for each in `docs/review/TRACKING-TEST-RESULTS.md`. Words only, no screenshots of a face. |
| After tracking works | 20+ fps on your phone; write the number in the log. |
| Before filming | Read every line a child hears and every line a parent reads, once, as a dentist. |

## 10. Stopping for the day

Write `docs/review/RESUME-<date>.md` with: the last task finished and its commit; the task
in progress and its state (clean, or uncommitted changes and why); credits left; anything
waiting for Dr. Yatin; the exact next command. Commit and push it.
