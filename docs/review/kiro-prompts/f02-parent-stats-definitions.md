This is a SPEC EDIT, not a build. Do not write app code.

Edit only these three files: `.kiro/specs/core-brushing-loop/requirements.md`,
`.kiro/specs/core-brushing-loop/design.md` and `.kiro/specs/core-brushing-loop/tasks.md`.
Do not create, edit or delete any other file.
Keep every part of the files that is not listed below exactly as it is, word for word.
Keep the EARS style and the existing requirement and task numbers. Do not renumber anything.
If an instruction below conflicts with a steering file or with another requirement,
stop and say so. Do not guess.

THEME: define the two parent-stats functions that task 13 left open. Dr. Yatin approved
all four decisions on 19 Nov 2026. No rule changes elsewhere.

1. `design.md`, section 3, row `src/logic/stats.ts`: replace the sentence about
   `computeVerifiedTime` and `zoneMostMissed` with:
   - `computeVerifiedTime(sessions)` returns the sum of `secondsBrushed` over the
     verified zones of camera-mode sessions. Untracked seconds are not counted.
     Timer-only sessions and unverified zones add 0. So it never exceeds 30 per zone or
     120 per session.
   - `zoneMostMissed(sessions)` returns `ZoneId | null`. It uses ALL stored camera-mode
     sessions (not the 7-session window of `computeMissScores`) and their verified
     zones only. The miss of a zone is the average over those verified zones of
     `max(0, 30 - secondsBrushed - secondsUntracked)`. It returns the zone with the
     highest average; a tie goes to the first zone in `ZONE_ORDER`. It returns `null`
     when there is no verified camera data. It does not call `computeMissScores`.
   Keep "Pure." and the note that the parent screen UI is out of scope.
2. `requirements.md`, requirement 13.4: add one sentence at the end of the paragraph,
   before the parenthesis: "Verified time counts `secondsBrushed` only, and 'zone most
   often missed' is taken over all stored camera-mode sessions."
3. `tasks.md`, sub-task 13.1: after the existing text add: "`computeVerifiedTime` sums
   `secondsBrushed` over verified zones of camera sessions; `zoneMostMissed` returns
   `ZoneId | null`, uses all stored camera sessions, averages the per-zone miss, ties go
   to the first zone in `ZONE_ORDER`, and does not reuse `computeMissScores`." Do not
   tick any box.

When finished, print the three changed passages and stop.
