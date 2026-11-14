# First Kiro spec — paste into Kiro (Spec mode)

Open `Desktop\Foamtom` in Kiro. In the chat panel choose **Spec** (not Vibe), then paste:

---

Create a spec called "core-brushing-loop" for Foamtom: The Haunted Mirror. Read all files in
.kiro/steering first and follow them strictly, especially kid-safety-privacy.md and
dental-rules.md.

Scope of this first spec only:
1. Pure game logic in src/logic: a 2-minute session of 4 zones x 30 s, the active zone,
   monster health that drops only while the active zone is brushed, session result,
   and the Monster Book unlock rules (rare monsters need a morning AND night session
   on the same day).
2. Guided-timer mode (no camera) that runs the full session using the same logic.
3. A plain placeholder screen: mirrored camera preview if allowed, one monster drawn
   over the active zone, a countdown, and the zone name spoken and captioned.
4. Property-based tests with fast-check for every property listed in tech.md.

Not in this spec: the haunted mirror art, the real hand tracking, the parent screen,
deployment. Those get their own specs later.

Write requirements in EARS format. Ask me before deciding anything marked [TO CONFIRM]
in dental-rules.md.

---

## After Kiro writes requirements.md
Read it, correct anything wrong (especially dental rules), then let Kiro move to design
and tasks. Run tasks one at a time.

## Later specs (one each)
2. hand-tracking (MediaPipe -> brushing signal, poor-light fallback)
3. haunted-mirror-ui (frame, fog, candles, monsters, smoke, sounds, voice)
4. monster-book + parent-screen (adult gate, clear data)
5. deploy (GitHub Pages, model files same-origin)

## Hooks to add in Kiro (judged)
- On save of src/logic/** -> run the property tests.
- On save of any user-facing text -> check against dental-rules.md wording rules and
  kid-safety-privacy.md.
