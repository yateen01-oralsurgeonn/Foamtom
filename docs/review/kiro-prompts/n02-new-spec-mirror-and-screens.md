Create a new spec called "mirror-and-screens" for Foamtom: The Haunted Mirror. In this
run, write ONLY `.kiro/specs/mirror-and-screens/requirements.md`, in EARS format, in the
same style as `.kiro/specs/core-brushing-loop/requirements.md`. Do not write design.md or
tasks.md yet. Do not write app code. Do not edit any other file.

Read first: every file in `.kiro/steering/` (follow `kid-safety-privacy.md`,
`dental-rules.md` and the Tone section of `product.md` strictly), then `requirements.md`
and `design.md` of `core-brushing-loop`. This spec changes how things look and sound. It
must not change any game rule, number, stored value or test in that spec.

SCOPE OF THIS SPEC

1. **Title screen.** The game name, one large start button (icon + spoken line +
   caption), and the plain line "The camera stays on this phone. Nothing is saved or
   sent." A small, quiet entry point to the parent screen (the gate itself belongs to the
   `parent-screen` spec). No sign-up, no install prompt.

2. **The haunted mirror frame, and the frame is the guidance.** A cursed-mirror frame
   around the play area: candle flicker, drifting fog, cracked glass, all in CSS or
   canvas. The frame must help the child know where to brush: the part of the frame
   nearest the active zone glows or flickers more, together with the monster and the
   spoken line. Colour is never the only signal.

3. **Monsters and smoke.** A drawing for each of the 12 monsters in the table
   (variations of a few base shapes are fine). Cute-spooky, never scary. States: sitting
   on the zone, shrinking as health falls, dissolving into smoke when defeated, slipping
   away as smoke when it flees, caught by the mirror when trapped. Smoke that thins while
   the child keeps brushing (uses `smokeFraction` from `toView`). All drawn in code or as
   original assets made for this project; no third-party characters or trademarks.

4. **Monster Book screen.** A grid of the 12 monsters. Owned ones shown with their name
   (spoken when tapped, with a caption). Not-yet-owned ones shown as a friendly
   silhouette. The four rare ones show one invitation: "Brush morning AND night." It is
   an invitation only: no countdown, no "you missed it", no streak, nothing lost. One
   button back.

5. **End card.** The four monsters from this session going into the Book, a closing line
   ("Two minutes. Every corner."), and buttons to the Monster Book and back to the title.
   It does not urge the child to play again.

6. **Sound.** Soft, synthesised or original sounds only (no copyrighted music). Every
   sound ramps in gently; nothing sudden or loud. Every spoken line has a caption and
   lives in `src/audio/lines.ts`.

7. **Comfort and access.** No jump scares, no flashing faster than three times a second,
   reduced motion honoured when the device asks for it, touch targets at least 48 px,
   works in portrait, usable in landscape and on a desktop browser.

8. **Tests.** Anything decided by data is a pure function with a test: which part of the
   frame glows for which zone; which drawing state a monster is in for a given view; what
   the Monster Book shows for a given set of sessions (owned, silhouette, rare line). The
   wording guard and privacy guard tests from core-brushing-loop must keep passing and
   must cover the new lines.

OUT OF SCOPE: tracking, game rules, the parent screen's contents.

Ask me before deciding anything this prompt does not settle. Do not invent dental facts.
When finished, print the requirement titles, then stop.
