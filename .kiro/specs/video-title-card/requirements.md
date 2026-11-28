# Spec: video-title-card — Requirements

## Introduction

The demo video for the Kiroween submission needs a start card and an end card that look like
the game. This spec adds one **developer-only page**, `promo/title-card.html`, that Dr. Yatin
screen-records at 1920 x 1080. The page reuses the game's mirror frame and monster drawing
code. It adds no new art style, and it is not part of the published site.

### In scope

1. A dev-only page and its three small files (`title-card.html`, `title-card.ts`,
   `title-card.css`) and one pure model file (`title-card-model.ts`), all under `promo/`.
2. Two cards chosen by the URL: `?card=start` (default) and `?card=end`.
3. A fixed 1920 x 1080 stage, an animation of about 5 seconds, and a `?still=1` mode for a
   still image.
4. Tests for the text, the card choice, the wording and the "not in the build" rule.
5. One line in `tsconfig.json` (`"promo"` added to `include`), so `npm run build` type-checks
   the new files. Approved by Dr. Yatin on 26 Nov 2026.

### Out of scope

- Any change to the game, the mirror frame, the monster art, the build, the published site, an
  existing test or a steering file.
- Sound, music, voice, captions, a title for the child, or any link from the game to the page.
- Settings, accessibility options or a way to change the cards at run time. The page is for
  recording a video, not for children.

### Steering references

All requirements below comply with `.kiro/steering/`. Where they meet, the privacy and wording
rules win. In particular: no clinic name, no person's name, no registration number and no
health claim on either card (`product.md`, `dental-rules.md`), and no network call, cookie,
storage or third-party file (`kid-safety-privacy.md`, `tech.md`).

### Decisions of 26 Nov 2026 (Dr. Yatin)

| # | Question | Decision |
|---|----------|----------|
| 1 | Type-checking | Yes. `"promo"` is added to `include` in `tsconfig.json`. That one line only. |
| 2 | Port for the manual check | `npm run dev -- --port 5180 --strictPort`. No config change. |
| 3 | Frame lights | All four regions bright (`active`). The mirror is fully awake. The page builds that `FrameGuidance` value itself. `frameGuidance()` and `mirror-frame.ts` are not changed. |
| 4 | Monster | `plaque-puff`, looked up from `MONSTERS`, not hard-coded. |
| 5 | Holds still | Yes. Fully still after the animation. The page writes no `--cycle-*` variables. `?still=1` is an exact match of the final frame. |
| 6 | Files | `promo/title-card-model.ts` (pure, no DOM). The "no promo page in `dist/`" guard test is in task 1. |

---

## Requirements

### 1. A developer page that is not part of the site

**As the author, I want the cards on a page that only the dev server serves, so that the
published game does not change.**

1.1 THE SYSTEM SHALL provide the page as `promo/title-card.html` with the scripts and styles
`promo/title-card.ts`, `promo/title-card-model.ts` and `promo/title-card.css`.

1.2 WHEN `npm run dev` is running THE SYSTEM SHALL serve the page at
`/promo/title-card.html`.

1.3 THE SYSTEM SHALL NOT add the page to the build input in `vite.config.ts`. The build input
stays `index.html` only, and no file from `promo/` appears in the output of `npm run build`.

1.4 THE SYSTEM SHALL NOT mention the page in `index.html`, in any file under `src/` or in
`vite.config.ts`. Nothing in the game links to it.

1.5 THE SYSTEM SHALL give the page a `<title>` that holds the marker `FOAMTOM-PROMO-TITLE-CARD`
and says it is a developer page, so a test can look for the marker in the build output.

---

### 2. Same safety rules as the game

**As a parent, I want the developer page to follow the same rules as the game, so that no
exception to the privacy rules exists anywhere in the repository.**

2.1 THE SYSTEM SHALL give the page a Content-Security-Policy `<meta>` whose `content` is
identical to the one in `index.html`.

2.2 THE SYSTEM SHALL NOT use an inline script, an inline `<style>` element or a `style=""`
attribute in the HTML. Styles come from same-origin stylesheets and from `element.style` and
`setProperty` in `title-card.ts`.

2.3 THE SYSTEM SHALL NOT use a `data:` URI, a third-party file, a web font, `@font-face` or
`url(` in the page files. Text uses the game's system font stack.

2.4 THE SYSTEM SHALL NOT make a network call, open the camera, read or write `localStorage`,
set a cookie, play a sound, or write to the console from the page files.

2.5 THE SYSTEM SHALL import from the game only the mirror frame, the frame guidance types and
tables, the monster drawing code, the monster table and the monster look table. It SHALL NOT
import from `src/tracking/`, `src/storage/` or `src/audio/`.

---

### 3. A fixed stage

**As the author, I want a stage of exactly 1920 x 1080, so that every recording and still
image has the same frame.**

3.1 THE SYSTEM SHALL draw all content inside one stage element that is exactly 1920 px wide
and 1080 px high, and does not scale to the window.

3.2 THE SYSTEM SHALL centre the stage horizontally and vertically on a black (`#000`) page,
and hide scroll bars, so that a 1920 x 1080 window shows the stage and nothing else.

3.3 THE SYSTEM SHALL give the stage the game's near-black background, `#1c1530`.

---

### 4. Two cards chosen by the URL

**As the author, I want one URL per card, so that I can record the start and the end in two
takes.**

4.1 WHEN the URL has `?card=start`, or no `card` parameter THE SYSTEM SHALL show the start
card.

4.2 WHEN the URL has `?card=end` THE SYSTEM SHALL show the end card.

4.3 IF the `card` value is anything else (empty, other text, another case such as `END`) THEN
THE SYSTEM SHALL show the start card.

4.4 THE SYSTEM SHALL read the card only once, when the page loads, and SHALL NOT accept any
other way to choose it (no key, no button, no storage).

---

### 5. Card text

**As a viewer of the video, I want short, exact text, so that the cards read clearly and say
nothing that is not true.**

5.1 THE SYSTEM SHALL show on the start card exactly two lines: the title `FOAMTOM` and the
subtitle `The Haunted Mirror`.

5.2 THE SYSTEM SHALL show on the end card exactly four lines, in this order: `FOAMTOM`,
`Free · in your phone's browser` (the dot is the middle dot, U+00B7), `Built with Kiro`, and
the address `github.com/yateen01-oralsurgeonn/Foamtom`.

5.3 THE SYSTEM SHALL draw the address as plain text, not as a link.

5.4 THE SYSTEM SHALL NOT show any other text on the page: no clinic name, no person's name, no
registration number, no phone number, and no claim about health, cavities, prevention or cure.
The only handle-like text is the exact address of requirement 5.2.

5.5 THE SYSTEM SHALL take every line of text from one pure function, `titleCardModel(card)`,
in `promo/title-card-model.ts`, and the page SHALL NOT hold any card text of its own.

---

### 6. The mirror frame, fully awake

**As the author, I want the game's own frame on the card, so that the video starts and ends
in the same look as the game.**

6.1 THE SYSTEM SHALL build the mirror with `createMirrorFrame()` from `src/ui/mirror-frame.ts`
and SHALL NOT edit `mirror-frame.ts`, `frame-art.ts` or `frame.css`.

6.2 THE SYSTEM SHALL light all four frame regions at the level `active`, by calling the
frame's own `paint()` with a `FrameGuidance` value that the page builds from `REGION_ORDER`
and `REGION_LOOKS.active`, with `activeRegion` `null` and `flickering` `false`. THE SYSTEM
SHALL NOT call or change `frameGuidance()`.

6.3 THE SYSTEM SHALL scale the frame with the page's own stylesheet (a transform on a wrapper
element) so that the frame is at least 60 % and at most 100 % of the stage height, centred
horizontally, and SHALL NOT change the frame's own rules.

6.4 THE SYSTEM SHALL give the glass a fixed height in the page's stylesheet, because no camera
picture is inside it.

---

### 7. One friendly monster

**As a viewer, I want one of the game's monsters in the mirror, so that the card says "game"
at a glance.**

7.1 THE SYSTEM SHALL draw the monster with `drawMonster()` from `src/ui/monster-art.ts`, for
the entry of `MONSTERS` whose id is `plaque-puff`. The page SHALL look the entry up in
`MONSTERS` and SHALL NOT build a `MonsterDef` of its own.

7.2 THE SYSTEM SHALL place the monster inside the glass (`.mirror-frame__glass`), centred, and
size it only with the `--u` variable that the monster stylesheet already defines.

7.3 THE SYSTEM SHALL show the monster in its normal sitting look: no smoke, no hit squash, no
leaving copy, no star or crest (`plaque-puff` is a common monster).

7.4 IF the `plaque-puff` entry is missing from `MONSTERS` THEN THE SYSTEM SHALL fail loudly
(throw an error) and SHALL NOT draw a different monster.

---

### 8. Animation, and holding still

**As the author, I want a short fade-in that ends in a still picture, so that I can record
the card and cut it at any point after the fade.**

8.1 THE SYSTEM SHALL run these steps in order, each as a fade of `opacity` from 0 to its final
value:

| Step | From | To | What fades in |
|------|------|----|---------------|
| 1 | 0.0 s | 1.0 s | The mirror (frame, glass, fog, cracks, unlit candles), from black |
| 2 | 1.0 s | 2.0 s | The frame lights: the four glows and the four flames |
| 3 | 2.0 s | 3.0 s | The monster |
| 4 | 3.0 s | 4.0 s | The text |

8.2 WHEN step 4 has finished THE SYSTEM SHALL hold completely still: no flicker, no fog
drift, no movement, no repeating animation of any kind, until the page is closed.

8.3 THE SYSTEM SHALL write no `--cycle-*` CSS variable. WHERE the frame's stylesheet takes a
repeating animation's duration from a `--cycle-*` variable THE SYSTEM SHALL leave the
variable undefined, so that the repeating animation does not run.

8.4 THE SYSTEM SHALL switch off the frame's own one-shot fade (`frame-fade-in` on
`.mirror-frame`) with the page's stylesheet, so that step 1 is the only fade of the mirror.

8.5 THE SYSTEM SHALL do the animation with CSS animations only. It SHALL NOT use
`requestAnimationFrame`, `setTimeout`, `setInterval` or `Math.random`, and the page SHALL look
the same on every load.

8.6 WHEN the URL has `?still=1` THE SYSTEM SHALL show the final frame at once, with no
animation, and that picture SHALL be exactly the picture that the animation ends on. Any
other value of `still`, or no `still`, runs the animation.

8.7 THE SYSTEM SHALL ignore the user's motion settings (`prefers-reduced-motion`) and every
other user setting. The page is for recording, not for children.

---

### 9. Tests

**As the author, I want the text and the "not in the site" rule pinned by tests, so that a
later edit cannot leak the page into the game or put a wrong word on a card.**

9.1 THE SYSTEM SHALL test that `titleCardModel('start')` returns exactly the lines of
requirement 5.1 and `titleCardModel('end')` exactly the lines of requirement 5.2, including
the middle dot.

9.2 THE SYSTEM SHALL test that `titleCardModel` returns the start card for `null`,
`undefined`, the empty string, `END`, `Start ` and any other text (property test over generated
strings that are neither `start` nor `end`).

9.3 THE SYSTEM SHALL test, in a wording test, that no line of either card contains a word that
starts with `clinic`, `registr`, `cure`, `prevent` or `guarantee` (case-insensitive, at the
start of a word), and that no line other than the address holds a person's name (`yatin`,
`shinde`, `dr.`).

9.4 THE SYSTEM SHALL test that the timeline table has the four steps of requirement 8.1 in
order, with no gap and no overlap, and that `isStill` is true only for the value `1`.

9.5 THE SYSTEM SHALL test that the built site has no file from `promo/` (no file name with
`promo` or `title-card`, no file that holds the marker of requirement 1.5), that
`vite.config.ts` still has the single input `index.html` and no mention of `promo`, and that
`index.html` and the files under `src/` do not mention the page.

9.6 THE SYSTEM SHALL test the page files by source scan: the rules of requirements 2.1 to 2.5,
8.3 and 8.5, that `promo/title-card.ts` calls `createMirrorFrame` and `drawMonster`, looks the
monster up in `MONSTERS`, and does not call `frameGuidance`.

9.7 THE SYSTEM SHALL leave every existing test unchanged and passing.

---

### 10. Nothing else changes

**As the author, I want this spec to touch nothing but `promo/` and one line of
`tsconfig.json`, so that the game that is judged is the game that was tested.**

10.1 THE SYSTEM SHALL NOT edit any file under `src/`, `debug/`, `public/`, `scripts/`,
`.github/` or `.kiro/steering/`, nor `index.html`, `vite.config.ts`, `package.json`, `README.md`
or any existing test.

10.2 THE SYSTEM SHALL add `"promo"` to the `include` list in `tsconfig.json`, and SHALL make
no other change to that file.

10.3 THE SYSTEM SHALL add no dependency and no npm script.

---

### 11. A check by eye, left for Dr. Yatin

**As the author, I want to look at both cards at the real size before I record, so that I
record only what I have approved.**

11.1 THE SYSTEM SHALL list, as the last task and without any code change, the manual check of
`http://localhost:5180/promo/title-card.html?card=start` and `?card=end` at 1920 x 1080, run
with `npm run dev -- --port 5180 --strictPort`.

11.2 THE SYSTEM SHALL leave that task unchecked, for Dr. Yatin to check himself.


---

### 12. A share card for link previews (added 28 Nov 2026)

**As the author, I want a 1200 x 630 picture that says "toothbrushing game", so that a link to
the game shows a clear preview in WhatsApp and similar apps.**

This requirement adds a third card to the same developer page. It is a new card; the start
card and the end card are not changed. It overrides requirements 3.1, 5.4 and 10.1 only for the
share card and only as written here (those requirements describe the two video cards).

12.1 WHEN the URL has `?card=share` THE SYSTEM SHALL show the share card. Any other value of
`card` behaves as before (requirement 4.3): the start card.

12.2 THE share card SHALL be drawn in one stage exactly 1200 px wide and 630 px high, centred on
a black page like the other cards, on the background `#1c1530`. The two video cards stay
1920 x 1080 (requirement 3.1). The model holds the size as `SHARE_STAGE`; `STAGE` does not
change.

12.3 THE share card SHALL show exactly two lines of text: the title `Foamtom` and, under it,
the subtitle `The 2-minute toothbrushing game` (approved by Dr. Yatin on 28 Nov 2026). Both come
from `titleCardModel('share')`; the page holds no text of its own (requirement 5.5). The
claim, name, clinic and health rules of requirement 5.4 apply to these lines.

12.4 THE share card SHALL show the mirror frame (built with `createMirrorFrame()` and lit as in
requirement 6.2) with the monster `plaque-puff` on a tooth inside the glass, and a large
toothbrush beside the text. The tooth, the toothbrush and the monster are the game's own
drawings (`src/ui/howto-icons.ts`, `drawMonster`); the page draws no new art style. THE share
card SHALL NOT show a person, a child's face, a clinic, a score or a brush technique.

12.5 THE share card SHALL be large and plain, so that it reads when an app shrinks it to a
thumbnail: the name at least 100 px, the subtitle at least 48 px, text colour with a contrast of
at least 4.5 to 1 against `#1c1530`.

12.6 WHEN the URL has `&still=1` THE SYSTEM SHALL show the final frame at once, with no
animation, exactly as for the other cards (requirement 8.6). Without it the card runs the same
four fades of requirement 8.1; the toothbrush fades in with the text.

12.7 THE page files SHALL follow requirements 2.1 to 2.4 and 8.3 to 8.5 (no network, no
storage, no timer, no `url(`, no `data:`). The one new import allowed in `title-card.ts` is
`../src/ui/howto-icons`. The page SHALL NOT export, save or capture an image itself: Dr.
Yatin's assistant captures `public/share-card.png` from the still card after this run. The
page SHALL NOT create `public/share-card.png`.

12.8 THE share card SHALL NOT be added to the build input, and nothing in the game links to
it (requirements 1.3, 1.4). The existing "not in the build" tests keep passing.

12.9 THE two existing tests that name the two cards SHALL change only as far as this card
needs: `unknownCardIsStart` excludes `share` from its generated strings, and
`pageIsDevOnlyAndSafe` allows the one import of requirement 12.7. No assertion about the start
or end card is weakened. `startCardText` and `endCardText` are not changed.
