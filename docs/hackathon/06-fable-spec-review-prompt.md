# 06: Fable 5.2 spec review prompt (written 15 Nov 2026)

Purpose: have Fable review the Kiro-written spec BEFORE task 1 starts, so the cheaper Kiro build runs go smoothly.

How to start: open a terminal in `Desktop\Foamtom`, run `claude --model claude-fable-5-2`, and paste everything inside the box.

```
You are running on Fable 5.2, and my access ends 17 Nov. You are the ARCHITECT REVIEWER for Foamtom, my Kiroween hackathon entry. Kiro will do the build. Your job is to make the spec so clear that Kiro can build it one task at a time, cheaply, without guessing.

HARD RULE (hackathon rules): Kiro must write all the app code AND the spec files. You must NOT edit anything in .kiro/ or write any app code. You write only into docs/review/. Your changes reach the spec as prompts that I run through Kiro.

WHAT FOAMTOM IS: "Foamtom: The Haunted Mirror". A browser game for children aged 5-9, played at the home sink. The front camera (in the browser only, nothing uploaded) watches the child brush, and a cartoon monster sits over whichever part of the mouth hasn't been brushed yet. If the camera can't see well enough, it falls back to a timer. It has a Monster Book and a parent screen. TypeScript + Vite + MediaPipe + Vitest + fast-check. MIT licence. Deadline: 4 Dec 2 pm PT (3:30 am IST, 5 Dec). Kiro Free plan: about 4-5 credits per Kiro step. A 4,000-credit code is pending.

READ FIRST, in this order:
.kiro/steering/*.md (product, kid-safety-privacy, dental-rules, tech, structure)
.kiro/specs/core-brushing-loop/requirements.md, then design.md, then tasks.md
docs/hackathon/01-limits-sheet.md, 02-idea-decisions.md, 03-video-storyboard.md
Then tell me in 5 lines what you understand the product to be. Wait for my yes.

STEP 1 — Review (YOU). Write docs/review/SPEC-REVIEW-v1.md. Check each of these:
A. Traceability: every requirement maps to a design element AND to a task with a test. List any orphans in either direction.
B. Testability: every acceptance criterion can be checked by a Vitest or fast-check test without a camera. Where one can't, say what to mock (a fake landmark stream, a fake clock).
C. Architecture: the camera and MediaPipe sit behind ONE interface, so the game logic is pure functions and can be tested on fixtures. The game state is a single state machine with named states and transitions. Check for hidden timers and global state.
D. Numbers: H_MAX 60, damage 3/s, floor 36, rescue 9, a 20 s defeat, a 30 s flee. Do the sums work for a 2-minute brush? Can a child "win" without brushing all the zones? Is there a dead end? Show the arithmetic.
E. Kid safety and privacy: no frames stored or sent, no accounts, no purchases, nothing that pushes the child to keep going. "Kind proximity" (the weaker monster on missed zones, and the nearly-beaten monster fleeing at 30 s) must be disclosed to parents and never rewarding.
F. Dental rules: the zone order is still marked [TO CONFIRM], so ask me, and I'll decide as a dentist. Two minutes, with every zone covered.
G. Edge cases: poor light, a second face in the frame, the child leaving the frame, the tab hidden, the camera permission refused, slow phones, landscape/portrait.
H. Task plan: each of the 12 tasks small enough for ONE Kiro run (one module plus its tests, and builds clean). Split any that are too big. Order them so a playable timer-only version exists EARLY (it's the demo safety net), with the camera added after it.
I. Demo fit: does the build give everything the 3-minute video storyboard needs? Anything in the spec that the video never shows can wait.
Rank the findings: BLOCKER (Kiro would build the wrong thing or get stuck) / SHOULD / NICE. For each one: where it is (file + section), what's wrong, the fix.

STEP 2 — Ask me (YOU). Only the decisions that are mine: the zone order, the things the numbers make me choose, scope cuts. ONE question at a time in chat, with your recommended answer. Stop for my yes.

STEP 3 — Kiro change prompts (YOU). Write docs/review/KIRO-CHANGES-v1.md: a short series of prompts, each one ready to paste into Kiro (or to run with `kiro-cli chat --no-interactive --trust-tools=fs_read,fs_write "$(cat file)"` from Git Bash). One prompt per spec file per theme, so each Kiro run is small. Each prompt names the exact sections to change and the wording to use, and says what NOT to touch. BLOCKERs first.

STEP 4 — Build-run playbook (YOU). Write docs/review/BUILD-PLAYBOOK.md, so cheaper models can drive Kiro task by task:
- The exact kiro-cli command per task (check `kiro-cli chat --help` for the shell-tool name), one task per run.
- What to check after each run: tests pass, build clean, no files outside the task's scope, no network calls, no frame storage.
- When to stop and call me (spec ambiguity, a failing test after 2 tries, Kiro editing the spec without being asked).
- A credit budget per task, and the running total against what's left.
- Commit + push after each task (with -c user.name/-c user.email from the Hackathons repo config).

RULES:
- Don't invent dental facts. Where a dental claim needs a source, say so, and I'll confirm.
- Keep everything plain. Don't rewrite the spec yourself.
- Commit docs/review/ after each step, then push.
- If I stop for the day, write docs/review/RESUME-<date>.md.
```

## Steps for Dr. Yatin

1. **Fable session (about 1 hour):** paste the prompt above. Fable reads everything, you confirm its 5-line summary, it writes the review, then asks you the dentist questions one at a time (the zone order first).
2. **Kiro session (cheap):** run the prompts from `docs/review/KIRO-CHANGES-v1.md` in Kiro one at a time, BLOCKERs first. Kiro edits the spec, so the hackathon rule holds.
3. **Quick re-check (Fable or Opus, 10 minutes):** "Read the updated spec and SPEC-REVIEW-v1.md: is every BLOCKER fixed?"
4. **Build (Sonnet or Haiku drives Kiro):** follow `docs/review/BUILD-PLAYBOOK.md`, one task per run, a check after each, commit and push. The timer-only version comes first, then the camera.
5. **Call Fable or Opus back only when the playbook says to stop.**
