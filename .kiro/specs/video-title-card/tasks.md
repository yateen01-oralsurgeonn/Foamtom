# Tasks: video-title-card

## Implementation plan

Three small tasks. Task 1 is the pure model and its tests, plus the guard that keeps the page
out of the built site. Task 2 is the page, its styles, the animation and the type-check line.
Task 3 is the check by eye, left for Dr. Yatin.

The game is unchanged after every task. `promo/` is served by `npm run dev` only, and no task
adds it to the build.

### Rules for every task

- One task per run. A task changes only the files named under "May change". It never edits
  anything in `.kiro/`, any file under `src/`, `debug/`, `public/`, `scripts/` or `.github/`,
  `index.html`, `vite.config.ts`, `package.json`, `README.md` or any existing test.
- Tasks 1 and 2 end with `npm run test:run` and `npm run build` both passing.
- Tests are written in the same task as the code they test. Test names follow design section 6.
- Every line of text on a card comes from `titleCardModel`. No task adds a line, a name or a
  claim. If a line seems wrong, stop and ask Dr. Yatin.
- New `promo/` files contain none of `Math.random`, `requestAnimationFrame`, `setTimeout`,
  `setInterval`, `matchMedia`, `fetch`, `console` or `--cycle-`, even in a comment.

---

- [x] 1. **Card model, its tests, and the "not in the build" guard**
  - [x] 1.1 Create `promo/title-card-model.ts` per design section 3: `CardId`, `CardLineRole`, `CardLine`, `TitleCardModel`, `STAGE` (1920 x 1080), `CARD_MONSTER_ID` (`'plaque-puff'`), `StepId`, `Step`, `TIMELINE` (mirror 0 to 1000, lights 1000 to 2000, monster 2000 to 3000, text 3000 to 4000), `titleCardModel(card)` and `isStill(value)`. No DOM, no clock, no randomness, no import from the game. The two cards are frozen constants; `titleCardModel` returns the end card only for the exact string `'end'`. Write the middle dot as `\u00B7`
  - [x] 1.2 Test `startCardText`, `endCardText`, `onlyTheApprovedLines`, `stageSize` and `timelineTable` (design tests 1, 2, 5, 8, 6) in `tests/title-card-model.test.ts`. Write the middle dot as `\u00B7` in the test as well
  - [x] 1.3 Test `unknownCardIsStart` and `isStillOnlyForOne` (design tests 3, 7) with fast-check over generated strings, plus the fixed values listed in the design
  - [x] 1.4 Test `cardWording` (design test 4): the five banned word starts, the name check that excludes only the address line, and the matcher's own check (passes `FOAMTOM`, `Built with Kiro`; flags `Prevents cavities`, `Registration no. 1`, `cure`, `Guaranteed`, `Our clinic`)
  - [x] 1.5 Test `cardMonsterExists` (design test 9): `MONSTERS` has exactly one entry with id `plaque-puff`, it is `common`, and `MONSTER_LOOKS` has a row for it. Import from `../src/logic/monsters` and `../src/ui/monster-looks`
  - [x] 1.6 Create `tests/title-card-dist.test.ts` with `distHasNoPromoPage` and `buildInputUnchanged` (design tests 10, 11). Build the site once into a temp folder with the same `execFileSync` call as `tests/build-output.test.ts` (copy the few lines; do not import from that test, and do not edit it), in a `beforeAll` with a 180 000 ms timeout and an `afterAll` that removes the folder. Assert: no built file path holds `promo` or `title-card`; no built file holds the marker `FOAMTOM-PROMO-TITLE-CARD`; `vite.config.ts` has `input: 'index.html'` and no `promo`; `index.html`, every file under `src/` and `vite.config.ts` hold neither `promo/title-card` nor `title-card.html`. The page does not exist yet, so the marker and path checks pass trivially now; they guard it from task 2 on. Before finishing, run `npm run test:run` and confirm no existing file under `src/` already contains `title-card.html`
  - [x] 1.7 Run `npm run test:run` and `npm run build`. Both pass. The player sees no change
  - _Requirements: 1.3, 1.4, 3.1, 4.1–4.3, 5.1, 5.2, 5.4, 5.5, 7.1, 8.1, 8.6, 9.1–9.5, 9.7, 10.1_
  - Test files: `tests/title-card-model.test.ts`, `tests/title-card-dist.test.ts`
  - May change: `promo/title-card-model.ts`, `tests/title-card-model.test.ts`, `tests/title-card-dist.test.ts`

- [x] 2. **The page: shell, frame, monster, text, animation**
  - [x] 2.1 Create `promo/title-card.html` per design section 4.5: the CSP `<meta>` copied character for character from `index.html`, the `<title>` `FOAMTOM-PROMO-TITLE-CARD (developer page, not part of the game)`, links to `/src/ui/styles.css`, `/src/ui/frame.css`, `/src/ui/monster-art.css` and `./title-card.css`, `<div id="stage"></div>` and one `<script type="module" src="./title-card.ts">`. No inline script, no `style` attribute, no `<style>`, no `data:`
  - [x] 2.2 Create `promo/title-card.ts` per design section 4.1 and 4.2: read `card` and `still` from `location.search`; call `titleCardModel` and `isStill`; add `title-card`, `title-card--<card>` and, for still, `title-card--still` to the stage; write `--tc-<id>-delay` and `--tc-<id>-duration` for each step of `TIMELINE` with `setProperty`; build `fullyLit()` from `REGION_ORDER` and `REGION_LOOKS.active` (`activeRegion: null`, `flickering: false`) and pass it to `createMirrorFrame().paint()`; look up `CARD_MONSTER_ID` in `MONSTERS` and throw if it is missing; put `drawMonster(def)` in a `div.title-card__monster` inside `frame.glass`; build one `<p class="title-card__line title-card__line--<role>">` per model line with `textContent`. No `<a>`, no timer, no listener, no `matchMedia`, no `frameGuidance`, no `--cycle-*`
  - [x] 2.3 Create `promo/title-card.css` per design sections 4.3 and 4.4: black page, hidden scroll bars, centred 1920 x 1080 stage on `#1c1530`, the mirror wrapper (absolute, 480 px wide, `scale(1.2)`, origin top centre), fixed 560 px glass height with the monster centred and `--u: 4px`, the text block and the five line styles, the game's system font stack, and the four fades (`opacity` only, `ease-out`, fill mode `both`, times from `var(--tc-<id>-duration)` and `var(--tc-<id>-delay)`): mirror on `.title-card__mirror`, lights on `.title-card .frame-glow` (to `var(--glow-opacity)`) and `.title-card .frame-flame`, monster on `.title-card__monster`, text on `.title-card__text`. Add `.title-card .mirror-frame { animation: none; }` and the `--still` rule that sets `animation: none !important` on the stage and everything inside it. No `url(`, no `@font-face`, no `@import`, no `infinite`
  - [x] 2.4 In `tsconfig.json` change the `include` line to `["src", "debug", "promo"]`. This one line only. Run `npm run build` and fix any type error in `promo/` (not by changing `src/`)
  - [x] 2.5 Create `tests/title-card-page.test.ts` with `pageIsDevOnlyAndSafe`, `pageIsStillAndDeterministic` and `pageBuildsFromGameParts` (design tests 12, 13, 14), by source scan with `node:fs`. Compare the page's CSP `content` with the one read from `index.html`
  - [x] 2.6 Run `npm run test:run` and `npm run build`. Both pass, and `tests/title-card-dist.test.ts` still passes with the page present. In `npm run dev -- --port 5180 --strictPort`, `http://localhost:5180/promo/title-card.html` shows the start card, and `?card=end` shows the end card (a quick look only; the full check is task 3)
  - _Requirements: 1.1, 1.2, 1.5, 2.1–2.5, 3.1–3.3, 5.3, 5.5, 6.1–6.4, 7.1–7.4, 8.1–8.7, 9.6, 9.7, 10.1–10.3_
  - Test file: `tests/title-card-page.test.ts`
  - May change: `promo/title-card.html`, `promo/title-card.ts`, `promo/title-card.css`, `tsconfig.json` (the `include` line only), `tests/title-card-page.test.ts`

- [ ] 3. **Check both cards by eye (left for Dr. Yatin)**
  - [ ] 3.1 No code or test changes in this task. Run `npm run test:run` and `npm run build` first. Then run `npm run dev -- --port 5180 --strictPort` and use a browser window or DevTools device size of exactly 1920 x 1080
  - [ ] 3.2 **M1 Both cards.** Open `http://localhost:5180/promo/title-card.html?card=start` and `http://localhost:5180/promo/title-card.html?card=end`. Look at: the mirror centred and filling most of the height; all four candles lit; one friendly blue-white monster in the glass; the text below the mirror and not cut off; start card shows `FOAMTOM` and `The Haunted Mirror`; end card shows `FOAMTOM`, `Free · in your phone's browser`, `Built with Kiro` and `github.com/yateen01-oralsurgeonn/Foamtom`; no clinic name, no person's name, no health claim
  - [ ] 3.3 **M2 Animation.** Reload each card and watch: black, then the mirror fades up (1 s), the lights come on (1 s), the monster fades in (1 s), the text fades in (1 s). Then watch for 10 seconds: nothing flickers, drifts or moves
  - [ ] 3.4 **M3 Still image.** Open `?card=start&still=1` and `?card=end&still=1`. Each shows the final frame at once and looks the same as the card 10 seconds after its animation
  - [ ] 3.5 **M4 Wrong value.** Open `?card=banana`: the start card shows
  - [ ] 3.6 **M5 Network and console.** With DevTools open: only same-origin requests (no font, no model, no image from another site); no error in the console
  - [ ] 3.7 **M6 Not in the site.** Run `npm run build`, then look in `dist/`: no `promo` folder, no `title-card` file
  - [ ] 3.8 Write down anything about the look (sizes, spacing, colours) that Dr. Yatin wants changed, as a note for a later run. Do not edit the layout numbers in this task. A change to the card text goes to Dr. Yatin first
  - _Requirements: 11.1, 11.2 (and by eye: 3, 5, 6, 7, 8)_
  - Test file: none (manual)
  - May change: no files
