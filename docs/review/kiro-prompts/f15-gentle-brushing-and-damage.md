This is a SPEC EDIT, not a build. Do not write app code. Edit the `requirements.md` and
`design.md` of `core-brushing-loop` and `hand-tracking` where these values are stated, and
append tasks to `.kiro/specs/mirror-and-screens/tasks.md`. Do not untick anything.

Measured 21 Nov 2026 on Dr. Yatin's laptop (Claude read only the debug page's yes/no readout):
brisk brushing 85% of seconds counted; gentle brushing as in the game 69% counted, 13% lost as
"near mouth but not moving"; real game play 37-47% of seconds counted (pauses, repositioning).
Camera speed was the same in the game and the debug page (about 7.5 frames per second), so speed
is not the cause. With 20 counted seconds needed out of 30, monsters were rarely defeated and
smoke rarely appeared in camera mode.

Dr. Yatin decided on 21 Nov 2026:
A. `MOVING_MIN_TRAVEL` 0.3 -> 0.2 face widths per second, so gentle, short strokes (correct
   technique) count as brushing. (Clinical decision by Dr. Yatin.)
B. `DAMAGE_PER_SECOND` 3 -> 4, so a camera-mode monster at normal health is defeated after 15
   counted brushing seconds out of 30 (not 20). Guided-timer mode does NOT change: set
   `TIMER_ONLY_DAMAGE = 3` as its own value (no longer `= DAMAGE_PER_SECOND`), still defeated at
   20 s. Untracked drain stays 2. Kind proximity, rescue threshold and H_MAX stay unchanged; say
   in the design what the floor and rescue mean in seconds now.

Update every place in those specs that states these numbers or their consequences (for example
"defeated after 20 seconds of matching brushing" for camera mode). Add a dated decision entry in
each spec you change.

Tasks: append task 48 "Gentle brushing counts and a camera monster falls after 15 brushed
seconds" to mirror-and-screens tasks.md, marked "needed for the video": files it may change are
`src/tracking/thresholds.ts`, `src/logic/constants.ts`, and the existing tests that pin the old
values (`tests/aggregate-second.test.ts`, `tests/constants.test.ts`, `tests/session.test.ts`,
`tests/thresholds.test.ts`, `tests/tracking-source-rules.test.ts`, and any other test that fails
only because it asserted the old values - it must name them in its report). Updating a test to a
rule Dr. Yatin changed is not weakening it. `npm run test:run` and `npm run build` pass. One
"Check by hand (camera)" sub-task: one camera session brushed gently; monsters are defeated in
most zones and smoke appears.

When finished, print the changed requirement numbers and task 48, then stop.
