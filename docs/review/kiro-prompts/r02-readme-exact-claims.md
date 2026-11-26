Make two sentences in `README.md` exact. Change ONLY `README.md`. Do not edit anything in
`.kiro/`, `src/`, `tests/` or any other file. Do not run the dev server.

Read first: `.kiro/steering/kid-safety-privacy.md`, `.kiro/steering/dental-rules.md`,
`src/logic/session.ts`, `src/logic/constants.ts` and the current `README.md`.

Why: Dr. Yatin's review on 26 Nov found two README sentences that say more than the game does.
The side and level checks are off (`REQUIRE_SIDE_MATCH` and `REQUIRE_LEVEL_MATCH` are false), and
brushing times ARE kept on the device (only camera pictures are never saved).

1. In the paragraph about the front camera, replace
   "to see where the toothbrush hand is"
   with exactly
   "to see whether a hand is brushing at the mouth"

2. In the "Privacy" section, replace the sentence
   "The camera stays on this phone. Nothing is saved or sent."
   with exactly
   "The camera picture stays on this phone. It is never saved or sent. Only brushing times are kept, on this device."

Change nothing else. If either old sentence is not found exactly, stop, say which one, and
change nothing.
