This is a SPEC EDIT, not a build. Do not write app code.

Edit only this file: `.kiro/specs/core-brushing-loop/requirements.md`.
Do not create, edit or delete any other file.
Read first: every file in `.kiro/steering/`, then the file you are editing.
Keep every part of the file that is not listed below exactly as it is, word for word.
Keep the EARS style and the existing requirement numbers. Do not renumber anything.
If an instruction below conflicts with a steering file, stop and say so. Do not guess.

THEME: the kind-proximity numbers, and properties that test the state machine instead of
a constant. (Decisions by Dr. Yatin Shinde, 15 Nov 2026.)

CHANGES

1. Replace requirement 14.1 with:
   "14.1 THE SYSTEM SHALL compute a miss score per zone from the child's 7 most recent
   camera-mode sessions on the device (fewer if fewer exist), using only zones marked
   verified (requirement 9.3). A zone's miss seconds in one session SHALL be 30 minus its
   brushed seconds minus its untracked seconds, never below zero. A zone's miss score
   SHALL be its total miss seconds divided by (30 × the number of verified results for
   that zone), and SHALL be 0 when there are none. Timer-only sessions and unverified
   zones SHALL NOT contribute."

2. Replace requirement 14.2 with:
   "14.2 WHEN a camera-mode session starts THE SYSTEM SHALL set each zone monster's
   starting health to normal health × (1 − 0.4 × miss score), rounded to the nearest whole
   number. Starting health SHALL never fall below 60% of normal health and SHALL never
   exceed normal health. In guided-timer mode kind proximity SHALL NOT be applied
   (requirement 8.5)."

3. Requirement 14.3: change "THE SYSTEM SHALL mark that monster as DEFEATED (it 'flees
   into smoke') rather than trapped" to "THE SYSTEM SHALL mark that monster as **fled**
   (it 'flees into smoke') rather than trapped. A fled monster SHALL count as beaten
   everywhere a defeated monster does."

4. Replace requirement 14.6 with:
   "14.6 THE PARENT SCREEN (defined in the parent-screen spec) SHALL disclose kind
   proximity in plain words, using both sentences: 'The game gets easier on spots your
   child often misses.' and 'A monster that is nearly beaten when the time is up counts as
   beaten.'"

5. Replace requirement 14.7 with:
   "14.7 Miss scores SHALL be worked out from the stored sessions each time a session
   starts. THE SYSTEM SHALL NOT store miss scores separately. The 'Clear all data' button
   clears them because it clears the sessions."

6. Replace properties 13.2 and 13.7 with:
   "13.2 **Session duration:** For any sequence of signals, in either mode: after each of
   seconds 1 to 119 the session SHALL still be running and its active zone SHALL be zone
   number floor(seconds done ÷ 30) in the order of requirement 3.2; after second 120 the
   session SHALL have ended; a further second SHALL change nothing. The recorded duration
   SHALL be the count of seconds actually processed, and SHALL equal 120 for every
   completed session. Seconds offered while the session is paused SHALL NOT be counted."
   "13.7 **Kind-proximity session duration:** Property 13.2 SHALL hold for any history of
   past sessions. Kind proximity SHALL NOT change the duration, the zone order, or the
   time-of-day classification."

7. Property 13.4: replace the first sentence with "The total verified brushing time
   computed from stored sessions SHALL never exceed 30 seconds per zone or 120 seconds per
   session." Change "Sessions with mode flag 'timer-only' SHALL have" to "Timer-only
   sessions and unverified zones SHALL have". Keep the rest.

8. Property 13.6: add at the end "Starting health SHALL always be a whole number. In
   guided-timer mode it SHALL always equal normal health."

9. Property 13.8: change "SHALL always be counted defeated" to "SHALL always be marked
   fled (counted as beaten)".

10. Replace property 13.9 with:
   "13.9 **Kind-proximity miss-score source:** For any history of sessions, miss scores
   SHALL depend only on the verified zones of the 7 most recent camera-mode sessions.
   Adding, removing or changing timer-only sessions, unverified zones, or camera-mode
   sessions older than those 7 SHALL NOT change any miss score."

DO NOT TOUCH: requirements 1 to 12, properties 13.1, 13.3 and 13.5, requirements 14.4 and
14.5, and the "Decisions (2026-11-14)" section.

When finished, print a short list of the sections you changed, then stop.
