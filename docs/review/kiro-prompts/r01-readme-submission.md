Update `README.md` for the Kiroween 2026 submission. Change ONLY `README.md`. Do not edit
anything in `.kiro/`, `src/`, `tests/` or any other file. Do not run the dev server.

Read first: every file in `.kiro/steering/` (follow the wording rules in `dental-rules.md` and
`kid-safety-privacy.md`), the current `README.md`, `public/models/NOTICE.txt`, `package.json`
and `docs/hackathon/07-how-we-used-kiro.md`.

Keep every existing section and its meaning. Add these, in plain short sentences:

1. Directly under the first paragraph, two lines:
   - **Play it:** https://yateen01-oralsurgeonn.github.io/Foamtom/ (free, in a phone or
     computer browser; no install, no sign-up).
   - **Demo video:** the literal text `VIDEO_LINK` (Dr. Yatin replaces it with the YouTube link
     at submission; leave it exactly as `VIDEO_LINK`).

2. A section **"Testing it (for judges)"** after "Privacy": no login is needed; allow the camera
   to play with camera checking, or refuse it to play in guided-timer mode; it works in a phone
   browser and on a computer with a webcam; a full game is two minutes; the Monster Book and the
   Grown-ups screen fill up after a few games.

3. A section **"Built with Kiro"** before "Licence": Foamtom was made for the Kiroween 2026
   hackathon (Costume Contest). Kiro wrote every spec and every line of code. Point to
   `.kiro/steering/` (the dentist's rules and the kid-safety rules), `.kiro/specs/` (five specs:
   core-brushing-loop, hand-tracking, mirror-and-screens, parent-screen, video-title-card),
   `.kiro/hooks/` (three report-only hooks) and `docs/hackathon/07-how-we-used-kiro.md` for the
   full story. Include this sentence exactly: "An AI assistant (Claude) helped put the rules into
   steering files, reviewed the specs and ran the Kiro CLI; every spec and every line of code
   was written by Kiro."

4. A section **"Third-party and pre-existing work"** before "Licence": the only pre-existing
   work used is the MediaPipe Tasks Vision library (`@mediapipe/tasks-vision`, Apache-2.0) and
   three MediaPipe model files in `public/models/` (`hand_landmarker.task`,
   `blaze_face_short_range.tflite`, `face_landmarker.task`, Apache-2.0, see
   `public/models/NOTICE.txt`), plus the standard dev tools in `package.json` (Vite, TypeScript,
   Vitest, fast-check). Spoken lines use the voices already on the player's device. Everything
   else was built during the hackathon, from 14 Nov 2026.

No medical claims (do not say the game prevents or cures anything), no clinic name, no
registration number. Do not invent facts that are not in the files above.

When finished, print the new section headings and the full text of the sections you added, then
stop.
