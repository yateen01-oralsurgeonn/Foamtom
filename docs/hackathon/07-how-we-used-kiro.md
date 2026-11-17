# How we used Kiro — write-up draft v1

Draft written 17 Nov 2026, before the build. Sections marked **[FILL IN]** are filled from
the real build log (`docs/review/BUILD-PLAYBOOK.md`, section 8) before submitting.
Plain words, his voice; Dr. Yatin edits before it goes on Devpost.

---

## The short version

I'm a dentist, not a programmer. Kiro wrote every line of Foamtom's code and every spec
file. My job was the dental rules, the kid-safety rules and the decisions. Kiro's job was
to turn them into a spec, then into code, one small task at a time, with tests that prove
the rules hold.

## 1. Steering: my rules, written once

Five steering files in `.kiro/steering/` are read on every run:

- `dental-rules.md`: the four zones and their order (upper right, upper left, lower left,
  lower right), 30 seconds each, and the wording I am allowed to use under Indian dental
  advertising rules (no claims to prevent cavities, no clinic details).
- `kid-safety-privacy.md`: the camera never leaves the phone, nothing is stored but brushing
  times, no accounts, no nagging, no guilt, no jump scares. "If a feature cannot meet them,
  drop the feature."
- `product.md`, `tech.md`, `structure.md`: what the game is, the stack, and where code lives.

Steering did real work. When I asked Kiro to change how the game handles a dark bathroom,
it **refused**, because my own kid-safety file still said the opposite. It told me which
line conflicted and stopped. I fixed the steering first (one small prompt), and only then
did Kiro change the spec. It did the same once more, when my task plan built the voice but
never connected it to the screen. Both times it was right.

## 2. Specs: requirements, design, tasks

`core-brushing-loop` (`.kiro/specs/core-brushing-loop/`):

- **Requirements** in EARS form: 15 requirements, from "exactly four zones of 30 seconds"
  to "the end card never urges the child to play again".
- **Design**: pure game logic with no camera and no clock inside it; one brushing signal
  per second crosses in; one tick rule for every second. The camera sits behind one small
  interface, so the timer-only game and the camera game share all the logic.
- **Tasks**: 14 small tasks, ordered so a playable timer-only game exists at task 8 and is
  live at task 9, before any of the harder parts.

The spec was reviewed against itself before any code: nine places where Kiro would have had
to guess were found and fixed through Kiro, one prompt and one commit per change, so the git
history shows each decision. **[FILL IN: hand-tracking, mirror-and-screens, parent-screen
specs, once written.]**

## 3. Property-based tests

The rules a parent cares about are tested with fast-check against hundreds of random
brushing sessions on every run, not a few hand-picked examples:

- A monster only loses health while its own zone is brushed, and health never goes up.
- Every session is exactly 120 ticks, whatever the child does. The test counts the ticks; it
  never reads a constant back.
- A rare monster appears only when the day has a morning and a night brush.
- Parent stats never claim more brushing than the clock allows; timer-only sessions never
  count as verified.
- Saving and loading return the same sessions, and nothing else is stored.

Two guard tests protect the promises in the steering: a **privacy guard** that fails the
build if any source file could send data, save a camera frame or set a cookie, and a
**wording guard** that fails if a child-facing line uses a banned word (for example
"cure", "missed", "lost"). **[FILL IN: number of tests and runs from the final build.]**

## 4. Hooks

Three agent hooks in `.kiro/hooks/`:

- Save a file in `src/logic/` or `tests/` → run the tests, report failures by name.
- Save anything in `src/` → run the privacy guard.
- Save a voice line or a screen → check the wording against my dental and kid-safety rules.

**[FILL IN: one moment a hook caught something, if it happens.]**

## 5. How we drove Kiro

- **Kiro CLI**, non-interactive, one prompt per task, with only file tools and the shell
  allowed. After every run: a scripted check (tests, build, nothing outside the allowed
  folders, no network calls, no randomness in game logic, spec untouched), then one commit.
- The spec stage took 16 Kiro runs and about 18 credits. **[FILL IN: build runs and
  credits.]**
- **[FILL IN, Dr. Yatin to decide: whether to say that an AI reviewer (Claude) read the
  spec and wrote the change prompts. Recommended: say so in one line; all code and spec
  files were still written by Kiro.]**

## 6. Not used

MCP servers, custom agents and Powers were not needed for a static site with no server.
**[FILL IN if that changes.]**

## 7. Known limits (honest)

- The camera sees a moving hand near one side of the mouth. It cannot see the brush or the
  teeth, and the game never claims to.
- **[FILL IN from the feasibility test: whether upper/lower is judged, or side only.]**
- The Monster Book can be filled in under a week; fine for a hackathon.
