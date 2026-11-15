This is a SPEC EDIT, not a build. Do not write app code.

Edit only this file: `.kiro/specs/core-brushing-loop/requirements.md`.
Do not create, edit or delete any other file.
Read first: every file in `.kiro/steering/`, then the file you are editing.
Keep every part of the file that is not listed below exactly as it is, word for word.
Keep the EARS style and the existing requirement numbers. Do not renumber anything.
If an instruction below conflicts with a steering file, stop and say so. Do not guess.

THEME: which monsters appear in a session, when a rare one can appear, and what the child
does after a monster is beaten. (Decisions by Dr. Yatin Shinde, 15 Nov 2026.)

CHANGES

1. Add after requirement 7.7:
   "7.8 WHEN a monster is defeated before its zone's 30 seconds end THE SYSTEM SHALL keep
   that monster's smoke over the zone until the zone ends, and SHALL speak and caption,
   once, the line 'Keep brushing to blow the smoke away!'. WHILE the smoke is shown, each
   brushed second and each untracked second SHALL thin the smoke. The smoke SHALL carry no
   win or lose: no outcome, reward, stored value or message SHALL depend on how much smoke
   is left, and the zone SHALL still end at 30 seconds."

2. Requirement 10.2: keep the sentence and add after it:
   "Every monster met in a session goes into the Monster Book whether or not it was
   beaten, so that a tracking mistake can never cost a child a monster."

3. Requirement 10.4: keep the sentence and add the twelve names:
   "Common: Plaque Puff, Sugar Sprite, Gummy Gloop, Fuzzlefang, Crumb Goblin, Sticky Wisp,
   Molar Mumbler, Tartar Tot. Rare: Midnight Molar Ghoul, Dawn Drool Dragon, Moonlit Mint
   Phantom, Twilight Toffee Wraith."

4. Replace requirements 10.6 and 10.7 with:
   "10.6 WHEN a session starts, IF the sessions already stored for that calendar day,
   together with the session now starting, include at least one morning session AND at
   least one night session, THE SYSTEM SHALL treat the session now starting as
   rare-eligible."
   "10.7 IF the session now starting is not rare-eligible THE SYSTEM SHALL NOT place a
   rare monster in it."

5. Add after requirement 10.8:
   "10.9 WHEN a session starts THE SYSTEM SHALL choose its four monsters by this fixed
   rule. Common monsters the child does not yet own come first, in table order, followed
   by common monsters already owned, in table order starting from position
   ((number of stored sessions × 4) mod 8) and wrapping round, so that a child who owns
   them all still sees all eight in turn. IF the session is rare-eligible, exactly one rare
   monster (the first rare monster in table order that the child does not yet own, or the
   first in table order if all are owned) SHALL take the last zone (lower right) and the
   first three zones SHALL take common monsters. The four monsters in a session SHALL all
   be different."
   "10.10 THE SYSTEM SHALL NOT use randomness to choose monsters. The same stored sessions
   and the same start time SHALL always give the same four monsters."

6. Replace requirement 13.3 with:
   "13.3 **Rare monster unlock:** For any set of stored sessions for a calendar day and
   any time of day for the session now starting, the new session SHALL be rare-eligible
   only when the stored sessions together with the new one include at least one morning
   session (start 04:00–11:59 local) AND at least one night session (start 17:00–23:59
   local). Sessions classified as neither SHALL NOT contribute. A session that is not
   rare-eligible SHALL contain no rare monster. A rare-eligible session SHALL contain
   exactly one rare monster, on the last zone."

DO NOT TOUCH: requirements 1 to 6, 8, 9, 11, 12, 14, the other properties in 13, and the
"Decisions (2026-11-14)" section.

When finished, print a short list of the sections you changed, then stop.
