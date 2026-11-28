Make it obvious, at first sight, that Foamtom is a toothbrushing game for children. Steering and
spec first, then code and tests.

Why (Dr. Yatin, 28 Nov 2026): he sent the game link on WhatsApp to three dentists. One replied
"What exactly is that?". The name "Foamtom: The Haunted Mirror" stays (Kiroween theme), but nothing
a stranger sees first says "toothbrushing" or "children": not the title screen, not the browser tab,
not the WhatsApp link preview (the page has no preview tags, so WhatsApp shows a bare link).
His approved subtitle, exactly:

    The 2-minute toothbrushing game

Read first: `.kiro/steering/product.md`, `.kiro/steering/kid-safety-privacy.md`,
`.kiro/specs/mirror-and-screens/requirements.md`, `design.md` and `tasks.md` (title screen, the
shown-text table, section 5.5), `.kiro/specs/video-title-card/` (all three files),
`index.html`, `src/ui/title-panel.ts`, `src/ui/title-model.ts`, `src/ui/display-text.ts`,
`src/ui/screens.css`, `promo/title-card.html`, `promo/title-card.ts`, `promo/title-card-model.ts`,
`tests/display-text.test.ts`, and the tests for the title panel.

Spec first: add these as new requirements (and design notes, and new unticked tasks) in
`.kiro/specs/mirror-and-screens/` for items 1-4, and in `.kiro/specs/video-title-card/` for item 5.
Then build them, one task at a time, ticking each.

1. SUBTITLE. On the title screen, directly under the `h1` game name, a shown line (not spoken):
   `The 2-minute toothbrushing game`. Add it to `DISPLAY_TEXT` as id `subtitle`, kind `shown`.
   Clearly smaller than the name, clearly readable on a phone.

2. HOW-TO STRIP. Under the subtitle and above the start button, three small steps in one row,
   each a simple drawn icon plus a few words (shown, not spoken):
   - a toothbrush: `Pick up your brush`
   - a monster on a tooth (reuse the existing monster art): `Monsters hide on your teeth`
   - the monster turning to smoke or sparkle: `Brush them away!`
   Draw the icons as SVG files in `public/assets/` or with CSS; do NOT use the toothbrush emoji
   (older Android phones show an empty box). Add the three lines to `DISPLAY_TEXT`. The row must fit
   a 360 px wide phone without horizontal scrolling and must not push the start button below the
   fold on a 360x640 screen; if it cannot fit, shrink the icons, never the start button. The strip
   is decoration plus words: screen readers read the three lines in order; the icons are
   `aria-hidden`.

3. BROWSER TAB. `index.html` `<title>` becomes `Foamtom: the 2-minute toothbrushing game`. Add a
   toothbrush favicon `public/favicon.svg` (simple, readable at 16 px) linked from `index.html`.
   This also removes the old favicon 404.

4. LINK PREVIEW TAGS in `index.html` `<head>` (WhatsApp, Telegram, etc. read these; they make no
   request from the page):
   - `<meta name="description" content="A free 2-minute toothbrushing game for children aged 5 to 9. Monsters hide on the teeth; brushing makes them go away. The camera picture stays on the phone.">`
   - `og:title` = `Foamtom: the 2-minute toothbrushing game`
   - `og:description` = the same text as `description`
   - `og:type` = `website`
   - `og:url` = `https://yateen01-oralsurgeonn.github.io/Foamtom/`
   - `og:image` = `https://yateen01-oralsurgeonn.github.io/Foamtom/share-card.png` (absolute: WhatsApp
     ignores relative image URLs), plus `og:image:width` 1200, `og:image:height` 630, and
     `og:image:alt` = `Foamtom: a cartoon monster on a tooth in a haunted mirror, and a toothbrush`
   - `twitter:card` = `summary_large_image`
   Do NOT create `share-card.png` yourself. Dr. Yatin's assistant captures it from item 5 after
   this run and adds it to `public/`. Until then the tag points at a file that is not there yet;
   that is expected.

5. SHARE CARD PAGE (dev-only, like the existing title cards, never in `dist`):
   `promo/title-card.html?card=share` draws a 1200x630 card: the mirror frame with the monster,
   a toothbrush, the name `Foamtom`, and under it `The 2-minute toothbrushing game`. Large, plain,
   readable when WhatsApp shrinks it to a thumbnail. `&still=1` must give a still frame (no
   animation) as the start/end cards do. Do not change how `card=start` and `card=end` look.

Rules: kid safety and privacy override everything. No network calls from the game, no new npm
packages, no external fonts or images, nothing that breaks the Content-Security-Policy in
`index.html` (only `'self'` sources; no inline `<style>` or `<script>`, no data: URIs). Do not
change any spoken line in `src/audio/lines.ts`, the privacy line, the start button, game logic,
tracking, storage, the Monster Book or the Grown-ups screen. Do not change completed task lines in
any `tasks.md`, anything under `docs/`, or `README.md`. If any item conflicts with a steering or
spec line, STOP, say exactly what and where, and change nothing for that item.

Tests: add tests for the four new `DISPLAY_TEXT` entries (exact strings), that the title panel
shows the subtitle and the three steps in order between the name and the start button, and that
the steps' icons are `aria-hidden`. Add a test that reads `index.html` and checks the `<title>`,
the `description`, every `og:` tag above, `twitter:card` and the favicon link.

Finish with `npm run test:run` then `npm run build`. If either fails after two attempts, STOP and
report. Then print the files you changed, the tasks you ticked, and the last lines of the test and
build output.
