This is a STEERING EDIT, not a build. Do not write app code.

Edit only these two files: `.kiro/steering/tech.md` and `.kiro/steering/structure.md`.
Do not create, edit or delete any other file. Do not touch `dental-rules.md`,
`kid-safety-privacy.md` or `product.md`.
Keep every line that is not listed below exactly as it is, word for word.

These edits bring the steering in line with decisions made by Dr. Yatin Shinde on
15 Nov 2026 (see the Decisions sections of
`.kiro/specs/core-brushing-loop/requirements.md`).

`tech.md`

1. "Voice" bullet: change "(Web Speech API only as a fallback)" to "(Web Speech API only
   as a fallback, and only with a local, on-device voice; if there is none, show the
   caption without speech)".
2. "Architecture rules", second bullet: change "produces a simple per-frame signal" to
   "produces a simple signal once per second". Keep the shape unchanged. Add after it:
   "A `null` signal means the tracker cannot see the child."
3. "Architecture rules": add two bullets:
   "- The camera and tracker sit behind one interface, `SignalSource`
   (`src/tracking/signal-source.ts`)."
   "- Exactly one module owns a timer: `src/ui/game-loop.ts`. Its clock is passed in."
4. "Architecture rules", third bullet: change "with the tracking signal absent" to "with
   every signal treated as `null`".
5. "Must-have property-based tests", second bullet: change to "A session is always
   exactly 120 ticks (4 x 30 s), whatever the input sequence."
6. Add to the same list: "- No file under `src/` makes a network call, stores a frame, or
   sets a cookie (privacy guard test)."

`structure.md`

7. In the tree, add two lines:
   `/src/main.ts       wiring only (clock, storage, game loop, screens)`
   `/.github/workflows/ build + deploy to GitHub Pages`
8. Add a bullet at the end: "- Nothing under `src/logic/` imports from `src/ui/`,
   `src/tracking/`, `src/storage/` or `src/audio/`."

When finished, print the lines you changed in each file, then stop.
