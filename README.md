# Foamtom: The Haunted Mirror

A free browser game for children aged 5 to 9. Cute-spooky cavity monsters hide over four
parts of the mouth. The child brushes for two minutes, one part at a time, and each
monster dissolves into smoke when its part has been brushed. The game speaks every
instruction aloud and shows it as a caption.

- **Play it:** https://yateen01-oralsurgeonn.github.io/Foamtom/ (free, in a phone or
  computer browser; no install, no sign-up).
- **Demo video:** https://youtu.be/TQwEwnyls5o

Brush for two minutes. Don't forget the back teeth. Brush morning and night.

The game uses the front camera, when the player allows it, to see whether a hand is brushing at the mouth. When the camera is not allowed or not available, the game works in guided-timer mode: a
two-minute timer walks through four parts of the mouth, 30 seconds each.

## Privacy

The camera picture stays on this phone. It is never saved or sent. Only brushing times are kept, on this device.

The game has no accounts, no ads, no analytics and no cookies, and it loads nothing from
other websites.

## Testing it (for judges)

- No login is needed.
- Allow the camera to play with camera checking. Refuse it to play in guided-timer mode.
- It works in a phone browser and on a computer with a webcam.
- A full game is two minutes.
- The Monster Book and the Grown-ups screen fill up after a few games.

## Run it

You need Node.js 22 or newer.

```
npm install
npm run dev        # play locally
npm run test:run   # run the tests
npm run build      # build the static site into dist/
```

With `npm run dev` there is also a tracking debug page at `/debug/tracking-debug.html`. It is
for development only. It is not linked from the game and is not part of the built site.

The `dist/` folder is a static site and works from any sub-path, including GitHub Pages.
Pushing to `main` runs the tests, builds the site and publishes it with the workflow in
`.github/workflows/pages.yml`. In the repository settings, set Pages > Source to
"GitHub Actions".

## Built with Kiro

Foamtom was made for the Kiroween 2026 hackathon (Costume Contest). Kiro wrote every spec and
every line of code.

- `.kiro/steering/` holds the dentist's rules and the kid-safety rules.
- `.kiro/specs/` holds five specs: core-brushing-loop, hand-tracking, mirror-and-screens,
  parent-screen and video-title-card.
- `.kiro/hooks/` holds three hooks. They only report; they never change code.
- `docs/hackathon/07-how-we-used-kiro.md` tells the full story.

An AI assistant (Claude) helped put the rules into steering files, reviewed the specs and ran the Kiro CLI; every spec and every line of code was written by Kiro.

## What's next

Dr. Yatin's own camera tests showed two things the camera can't do yet: tell which side of the
mouth is being brushed, and tell small circles from scrubbing. Both need a point that follows the
brush rather than the palm, such as fingertip tracking or a brightly coloured brush handle. The
test page (`debug/tracking-debug.html`, development only) and the measured results
(`docs/review/TRACKING-TEST-RESULTS.md`, sections 10 and 11) are in this repo for that work.

Then: spoken "small circles" reminders with pictures, Marathi and Hindi voices, short trials with
families of young patients (with the parents' consent), and a printable brushing chart that pairs
with the Monster Book.

## Third-party and pre-existing work

The only pre-existing work used is:

- The MediaPipe Tasks Vision library (`@mediapipe/tasks-vision`, Apache-2.0).
- Three MediaPipe model files in `public/models/`: `hand_landmarker.task`,
  `blaze_face_short_range.tflite` and `face_landmarker.task` (Apache-2.0, see
  `public/models/NOTICE.txt`).
- The standard dev tools in `package.json`: Vite, TypeScript, Vitest and fast-check.

Spoken lines use the voices already on the player's device. Everything else was built during
the hackathon, from 14 Nov 2026.

## Licence

MIT. See `LICENSE`.
