This is a SPEC EDIT, not a build. Do not write app code.

Edit only this file: `.kiro/specs/core-brushing-loop/requirements.md`.
Do not create, edit or delete any other file.
Read first: every file in `.kiro/steering/`, then the file you are editing.
Keep every part of the file that is not listed below exactly as it is, word for word.
Keep the EARS style and the existing requirement numbers. Do not renumber anything.
If an instruction below conflicts with a steering file, stop and say so. Do not guess.

THEME: the brushing signal arrives once per second, and one clear rule says what happens
when the tracker cannot see the child. (Decisions by Dr. Yatin Shinde, 15 Nov 2026.)

CHANGES

1. Introduction, second paragraph, and requirement 1.2: change "per-frame brushing signal"
   to "per-second brushing signal".

2. Requirement 5.1: change the lead-in to
   "THE SYSTEM SHALL accept one brushing signal per second with exactly this shape:".
   Keep the shape itself unchanged.

3. Replace requirement 5.2 with:
   "5.2 THE SYSTEM SHALL treat a signal of `null` as 'the tracker cannot see the child'
   (too dark, no face in view, child out of the frame, or tracker not ready). In
   guided-timer mode THE SYSTEM SHALL treat every signal as `null`."

4. Requirement 5.5: add the missing case, so the list reads
   "IF `handNearMouth` is false, or `moving` is false, or `side` does not match ..., or
   `level` does not match ...".

5. Add after 5.5:
   "5.6 A signal that is present with `handNearMouth` false SHALL mean: the face is seen
   and the hand is not at the mouth. A signal with `side` or `level` equal to `unknown`
   SHALL mean: the hand is at the mouth but that side or level is unclear."
   "5.7 THE SYSTEM SHALL hold one constant, `REQUIRE_LEVEL_MATCH`, default `true`. WHEN it
   is `false` THE SYSTEM SHALL ignore `level` in 5.4 and 5.5 (side-only checking). It is
   set to `false` only by Dr. Yatin's decision if the hand-tracking test shows that upper
   and lower cannot be told apart."

6. Replace requirement 6.3 with:
   "6.3 IF the signal is present and does not fully match the active zone (per 5.4),
   including when any field is `unknown`, THE SYSTEM SHALL NOT reduce the active monster's
   health. IF the signal is `null`, in either mode, THE SYSTEM SHALL reduce the active
   monster's health by the untracked drain (requirement 7.7) and SHALL count that second as
   an untracked second for the zone."

7. Requirement 7.3: add at the end "(signal present and not matching)".

8. Replace requirement 7.7 with:
   "7.7 WHILE the signal is `null` (guided-timer mode, or camera mode when the tracker
   cannot see the child) THE SYSTEM SHALL reduce the active monster's health by 2 per
   second (the untracked drain), so that a normal-strength monster reaches zero at exactly
   30 seconds of untracked time. Health SHALL never increase."

9. Replace requirement 8.1 with:
   "8.1 IF camera permission is refused, or the camera is unavailable, or the camera is
   not ready within 8 seconds of the start tap, THE SYSTEM SHALL run the session in
   guided-timer mode. The mode SHALL be fixed for the whole session. Poor tracking during
   a camera-mode session SHALL be handled second by second (requirements 6.3 and 9.3), not
   by changing mode."

10. Replace requirement 8.5 with:
   "8.5 WHILE in guided-timer mode every monster SHALL start at normal health (kind
   proximity is not applied) and SHALL lose 2 health per second (per 7.7), so that it is
   defeated exactly at the end of its 30 seconds."

11. Requirement 9.1: change "**seconds per zone** (each marked as verified or unverified)"
    to "for each zone: **brushed seconds**, **untracked seconds**, and a **verified**
    flag".

12. Replace requirements 9.2 and 9.3 with:
   "9.2 'Brushed seconds' SHALL mean the number of seconds the signal matched that zone
   (per 5.4). 'Untracked seconds' SHALL mean the number of seconds the signal was `null`
   in that zone during a camera-mode session. Brushed seconds plus untracked seconds SHALL
   NOT exceed 30."
   "9.3 SESSIONS with mode flag 'timer-only' SHALL record 30 brushed seconds and 0
   untracked seconds per zone, with every zone marked **unverified**. SESSIONS with mode
   flag 'camera' SHALL mark a zone **verified** only when its untracked seconds are 10 or
   fewer; otherwise the zone SHALL be marked **unverified**. Unverified zones SHALL NOT be
   counted in parent stats or in miss scores."

13. Requirement 9.5: change the bracket to "(date, time of day, mode, and for each zone:
    brushed seconds, untracked seconds, verified flag, monster, outcome; monsters
    earned)".

14. Replace requirement 13.1 with:
   "13.1 **Monster health:** For any sequence of 120 signals, in either mode, and for any
   history of past sessions: on every second the active monster's health SHALL change by
   exactly −3 when the signal matches the active zone (per 5.4), by exactly −2 when the
   signal is `null`, and by 0 otherwise, never going below zero. Only the active zone's
   monster SHALL change. Health SHALL always be a whole number and SHALL never increase."

DO NOT TOUCH: requirements 2, 3, 4, 10, 11, 12, 14, properties 13.2 to 13.9, and the
"Decisions (2026-11-14)" section. Later prompts cover those.

When finished, print a short list of the sections you changed, then stop.
