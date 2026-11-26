Create a new, small spec called "video-title-card" for Foamtom: The Haunted Mirror. In this
run write ALL THREE files of `.kiro/specs/video-title-card/`: `requirements.md` (EARS, same
style as `.kiro/specs/core-brushing-loop/requirements.md`), `design.md` and `tasks.md`
(numbered tasks with checkboxes, same style as the other specs). Do not write app code. Do not
edit any other file.

Read first: every file in `.kiro/steering/`, then `design.md` of `mirror-and-screens`, then
`src/ui/mirror-frame.ts`, `src/ui/frame-art.ts`, `src/ui/frame.css`, `src/ui/monster-art.ts`,
`src/ui/monster-art.css`, `src/ui/monster-looks.ts`, `debug/tracking-debug.html` and
`vite.config.ts`.

PURPOSE

The demo video for the Kiroween submission needs a start card and an end card in the game's own
look. They are made by screen-recording a page in the dev server, at 1920 x 1080. The page
REUSES the game's existing mirror frame and monster drawing code. It adds no new art style.

SCOPE

1. **Dev-only page, never part of the site.** `promo/title-card.html` + `promo/title-card.ts`,
   like `debug/tracking-debug.html`: served by `npm run dev`, NOT added to the build input in
   `vite.config.ts`, so the published game does not change. Keep the same Content-Security-Policy
   rules as the game (no inline scripts, no inline styles set in HTML, no data: URIs, no network
   calls, no third-party files, no fonts from the web).

2. **Fixed 1920 x 1080 stage**, centred on a black page. Background near-black, as in the game.

3. **Two cards, chosen by the URL:** `?card=start` (default) and `?card=end`.
   - Start card text (exactly): title "FOAMTOM", subtitle "The Haunted Mirror".
   - End card text (exactly): "FOAMTOM", "Free · in your phone's browser", "Built with Kiro",
     and one line for the address: `github.com/yateen01-oralsurgeonn/Foamtom`.
   - No clinic name, no person's name, no registration number, no claims about health.

4. **Built from existing parts:**
   - The mirror is `createMirrorFrame()` from `src/ui/mirror-frame.ts`, scaled to fill most of
     the stage height. All four frame regions are lit as in an active session (use its own
     `paint()` with a FrameGuidance value; do not edit mirror-frame.ts).
   - One friendly monster from the existing monster drawing code sits inside the glass.
   - The text sits below or over the lower part of the glass, in the game's own fonts and colours
     (system fonts only, as the game uses).

5. **Animation, about 5 seconds, then it holds still:**
   0.0-1.0 s the mirror fades up from black; 1.0-2.0 s the frame lights come on;
   2.0-3.0 s the monster fades in; 3.0-4.0 s the text fades in; then everything holds.
   `?still=1` shows the final frame at once (for a still image). Use CSS animations or
   `requestAnimationFrame`; no `Math.random` (the same output every time).
   Respect nothing else from user settings: this page is for recording, not for children.

6. **Tests:** a pure function `titleCardModel(card)` returns the exact text lines for each
   card; unit tests check both cards' text, that an unknown `card` value falls back to the
   start card, and a wording test that bans clinic, registration, cure, prevent and
   guarantee words. The existing tests must not change.

OUT OF SCOPE: any change to the game, the mirror frame, the monster art, the build, the
published site or the steering files.

Keep it small: about 3 tasks (model + tests; page + styles + animation; a final manual check
task "open http://localhost:5180/promo/title-card.html?card=start and ?card=end at 1920 x 1080
and confirm the look", left for Dr. Yatin).

Ask me before deciding anything this prompt does not settle. When finished, print the
requirement titles and the task list, then stop.
