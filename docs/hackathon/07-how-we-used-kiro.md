# How we used Kiro

Write-up v2, 26 Nov 2026, filled from the real build log (`docs/review/BUILD-PLAYBOOK.md`) and
the git history. Plain words; Dr. Yatin edits it before it goes on Devpost.

---

## The short version

I'm a dentist in India, not a programmer. Kiro wrote every line of Foamtom's code and every
spec file. My job was the dental rules, the kid-safety rules and the decisions. Kiro's job was
to turn them into specs, then into code, one small task at a time, with tests that prove the
rules hold.

An AI assistant (Claude) helped me put my rules into steering files, reviewed the specs and
ran the Kiro CLI for me; every spec and every line of code was written by Kiro.

**In numbers (14-26 Nov 2026):** 5 steering files · 5 specs (68 requirements, 95 tasks) ·
3 agent hooks · 684 tests in 84 files (38 files use property-based tests) · 219 commits, 160 of them
labelled as Kiro's work · Kiro CLI for almost every run, the Kiro IDE for the README task and to
watch the hooks fire.

## 1. Steering: my rules, written once

Five steering files in `.kiro/steering/` are read on every run:

- `dental-rules.md`: the four parts of the mouth and their order (upper right, upper left,
  lower left, lower right), 30 seconds each, what "brushing a part" means to the camera, and
  the words I am allowed to use as a dentist in India (no claim to prevent cavities, no clinic
  details).
- `kid-safety-privacy.md`: the camera never leaves the phone, nothing is stored but brushing
  times, no accounts, no ads, no nagging, no guilt, no jump scares. "If a feature cannot meet
  them, drop the feature."
- `product.md`, `tech.md`, `structure.md`: what the game is, the stack (TypeScript, Vite,
  MediaPipe, Vitest, fast-check) and where each kind of code lives.

**The strategy that made the biggest difference:** the rule "if two parts of the spec disagree,
or the spec is unclear, STOP, say exactly what is unclear, and change nothing". Kiro followed it
every time. It stopped and asked me first on these three occasions:

1. **17 Nov:** a new requirement about poor light clashed with my own kid-safety file. Kiro
   named both lines and edited nothing. I fixed the steering first, then the spec.
2. **17 Nov:** my task plan built the game's voice but never connected it to the screens. Kiro
   refused to write the task list until I decided where the wiring belonged.
3. **19 Nov:** the spec never defined what a "checked" second of brushing is, so the parent
   numbers could not be computed honestly. Kiro asked four questions; I answered them, a small
   spec fix went in, and only then did it write the code.

It did the same on the last day, when I asked for a title card for this video: six questions
before writing a single file.

## 2. Spec-driven development

Every feature went requirements (EARS) → design → tasks → code, each written by Kiro:

| Spec | Requirements | Tasks | What it covers |
|---|---|---|---|
| `core-brushing-loop` | 15 | 14 | pure game logic, the 2-minute session, the timer-only mode, storage, parent stats |
| `hand-tracking` | 11 | 12 | MediaPipe hand and face landmarks, "a hand near the mouth, moving", privacy |
| `mirror-and-screens` | 16 | 50 | the haunted mirror, monsters, smoke, the Monster Book, sound, accessibility |
| `parent-screen` | 15 | 16 | the grown-ups gate, honest facts, one allowed nudge, clear-all-data |
| `video-title-card` | 11 | 3 | the start and end cards of the demo video, a dev-only page reusing the game's own mirror |

**How the spec was structured:** game logic is pure (`src/logic/`, no DOM, no camera, no
clock); one brushing signal per second crosses in; one tick rule handles every second. The
camera sits behind one small interface, so the camera game and the timer-only game share all
the logic, and the timer-only game was playable and live at task 9, before any camera work.

**Compared with vibe coding:** each of my decisions became a one-line spec change, one Kiro
run and one commit, so the git history shows *why* the game behaves as it does. When my own
brushing test showed that the camera cannot reliably tell left from right when a child brushes
across the face (21 Nov), the change was a spec decision (`REQUIRE_SIDE_MATCH = false`), not a
hidden code patch, and the parent screen now says so in plain words.

## 3. Property-based tests

The rules a parent cares about are checked with fast-check against hundreds of random brushing
sessions on every run, not a few hand-picked examples:

- Only the current turn's monster ever loses health, and health never goes up.
- Every session is exactly 120 ticks, whatever the child does. The test counts the ticks; it
  never reads a constant back.
- A rare monster appears only on a day with a morning and a night brush.
- Parent numbers never claim more brushing than the clock allows; timer-only sessions never
  count as checked by the camera.
- Saving and loading return the same sessions, and nothing else is stored.

Guard tests protect the promises in the steering: a **privacy guard** scans every source file and
fails the build if it finds a way to send data, save a camera frame or set a cookie; a **wording guard** fails if a
child-facing line uses a banned word (for example "cure", "missed", "lost"); a **build guard**
proves the debug and video pages never reach the published site.

## 4. Agent hooks

Three hooks in `.kiro/hooks/`, all "report only, never change code":

- Save a file in `src/logic/` or `tests/` → run the tests and report failures by name, with the
  fast-check counterexample and seed.
- Save anything in `src/` → run the privacy guard.
- Save a voice line or a screen → check the wording against my dental and kid-safety rules.

In the Kiro IDE they fire on save (we recorded the test hook firing on 25 Nov). Most of the
build ran through the Kiro CLI, where IDE hooks do not run, so the same checks also ran as a
script after every CLI run (below).

## 5. How we drove Kiro

- **Kiro CLI**, non-interactive, one prompt per task, with only the file tools and the shell
  allowed. After every run a script checked: tests and build pass, the spec was not touched
  (only task ticks), no files outside the allowed folders, no network calls, no randomness in
  game logic. Only then one commit. A failed check meant no commit.
- **Kiro IDE** for the README task (hand-tracking task 11) and to check that the hooks fire on
  save.
- **Credits:** about 17 bonus credits for the first complete spec (15 runs); about 2.4 per
  build task at first and about 6 per camera-tracking run. Total used (Kiro account page,
  27 Nov 2026): **about 510 of the 4,000 hackathon bonus credits** (509.59), plus 27 of the
  50 monthly Kiro Free credits.

## 6. Not used

MCP servers, custom agents and Kiro powers were not needed: Foamtom is a static site with no
server, no accounts and no third-party services, and keeping it that way was itself a
kid-safety rule.

## 7. Known limits (honest)

- The camera sees a moving hand near the mouth. It cannot see the brush or the teeth, or which
  part of the mouth is being brushed; the game says the part out loud as guidance, and never
  claims to see it.
- In poor light, or with no camera, the game switches to a gentle two-minute timer.
- The Monster Book and parent screen in the video use sample data, and the video says so.
