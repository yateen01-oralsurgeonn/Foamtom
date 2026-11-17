---
inclusion: always
---

# Tech choices

Keep it small. One static site, no server.

- **Language:** TypeScript (strict).
- **Build:** Vite. Output is a static folder deployable to GitHub Pages.
- **Camera tracking:** MediaPipe Tasks Vision (face landmarks + hand landmarks) running
  in the browser (WASM/WebGL). Model files are copied into the site and served from the
  same origin.
- **Rendering:** HTML canvas over the mirrored `<video>`; CSS for the mirror frame.
- **Voice:** pre-recorded or synthesised audio clips shipped with the site (Web Speech API
  only as a fallback, and only with a local, on-device voice; if there is none, show the
  caption without speech). No cloud TTS at run time.
- **Storage:** `localStorage` only, behind one small module.
- **Tests:** Vitest for unit tests, **fast-check** for property-based tests.
- **Licence:** MIT.

## Architecture rules
- Keep **game logic pure** (zone timer, scoring, monster state, Monster Book unlocks,
  parent stats) in modules with no DOM or camera access, so it can be property-tested.
- Camera / tracking code produces a simple signal once per second
  `{ handNearMouth: boolean, side: 'left' | 'right' | 'unknown', level: 'upper' | 'lower' | 'unknown', moving: boolean }`
  and nothing else crosses into game logic.
- A `null` signal means the tracker cannot see the child.
- Guided-timer mode uses the same game logic with every signal treated as `null`.
- The camera and tracker sit behind one interface, `SignalSource`
  (`src/tracking/signal-source.ts`).
- Exactly one module owns a timer: `src/ui/game-loop.ts`. Its clock is passed in.

## Must-have property-based tests
- A monster only loses health while its own zone is being brushed.
- A session is always exactly 120 ticks (4 x 30 s), whatever the input sequence.
- Rare monsters unlock only on a day with both a morning and a night session.
- Parent stats never report more brushing time than elapsed time.
- Storage round-trips: save then load returns the same sessions.
- No file under `src/` makes a network call, stores a frame, or sets a cookie (privacy guard test).

## Performance
- Runs at 20+ fps on a mid-range Android phone (2022) in Chrome.
- First load under 5 MB where possible; model files lazy-loaded after the title screen.
