Create a new spec called "parent-screen" for Foamtom: The Haunted Mirror. In this run,
write ONLY `.kiro/specs/parent-screen/requirements.md`, in EARS format, in the same style
as `.kiro/specs/core-brushing-loop/requirements.md`. Do not write design.md or tasks.md
yet. Do not write app code. Do not edit any other file.

Read first: every file in `.kiro/steering/` (follow `kid-safety-privacy.md` and the
"Parent screen wording" and "Wording rules" sections of `dental-rules.md` strictly), then
`requirements.md` and `design.md` of `core-brushing-loop`. The numbers shown here come
from `src/logic/stats.ts` and the stored sessions defined there. Do not change any game
rule, number or stored value.

SCOPE OF THIS SPEC

1. **Adult gate.** A simple gate a 5-year-old is unlikely to pass (hold a button for
   3 seconds). No password, no account.

2. **Facts only.** Using stored sessions: sessions per day for the last 7 days; total
   time in guided sessions; of that, time the camera actually saw brushing (verified
   zones only); and the zone most often missed, from verified zones only. Timer-only
   sessions and unverified zones are shown as "guided, not checked by the camera" and are
   never counted as missed or as verified. If there is too little data, say so plainly
   instead of showing a number.

3. **One allowed nudge.** In the form already approved in `dental-rules.md`: "<Zone> was
   missed <n> nights. Try brushing it first tonight." No medical judgement, no risk
   words, no advice beyond that sentence.

4. **Plain disclosure, always visible on this screen:**
   - "The camera stays on this phone. Nothing is saved or sent."
   - "The camera sees a moving hand near one side of the mouth. It cannot see the brush
     or the teeth."
   - "The game gets easier on spots your child often misses."
   - "A monster that is nearly beaten when the time is up counts as beaten."
   - "Every monster your child meets goes into the Monster Book, beaten or not."
   - Only when `REQUIRE_LEVEL_MATCH` is false: "The camera checks which side is being
     brushed, not upper or lower."

5. **Clear all data.** One button, one confirmation, removes everything stored. After it,
   the Monster Book is empty and the facts show "no sessions yet".

6. **Wording limits.** No clinic name, phone number, address or registration number. No
   claim that the game prevents or cures anything or replaces a dental visit.

7. **Tests.** A pure `parentView(sessions, constants)` function returns every number and
   sentence the screen shows; property tests check that verified time never exceeds 30 s
   per zone, that unverified zones and timer-only sessions never appear as missed, and
   that the nudge only appears when its numbers are true. A wording test bans medical
   judgement words on this screen (risk, danger, disease, decay, cavity-free, prevent,
   cure).

OUT OF SCOPE: tracking, game rules, art beyond a plain readable layout.

Ask me before deciding anything this prompt does not settle. Do not invent dental facts.
When finished, print the requirement titles, then stop.
