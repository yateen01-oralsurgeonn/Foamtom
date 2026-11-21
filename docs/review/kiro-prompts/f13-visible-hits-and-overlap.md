This is a SPEC EDIT, not a build. Do not write app code. Edit only the `requirements.md`,
`design.md` and `tasks.md` of `mirror-and-screens`, and `requirements.md` and `design.md` of
`core-brushing-loop` (no task changes there). Do not untick anything. Keep requirement numbers;
add new numbers at the end of the requirement they belong to.

Findings, 21 Nov 2026. Dr. Yatin played a camera session at the laptop while brushing.
Claude recorded the screen values once a second (no images): the monster did shrink (72 px to
29 px wide over 24 s), was defeated, smoke showed 23 s over the session, and the leaving copy
stayed ~1.5 s at each zone change. What he saw: "the monster is not reducing in size", and two
monsters overlapping. Reasons: the shrink is tiny per second and is hidden by the anchor's
size jitter as the face moves; in camera mode the leaving copy and the next monster sit on the
same cheek. He saw the smoke and heard the smoke line, so the smoke only gets a small change.
Dr. Yatin decided on 21 Nov 2026 (all "needed for the video"):

1. HIT FEEDBACK. Every tick in which the active monster's health went DOWN, the monster plays
   one short "hit" flinch (a quick squash and wobble, one-shot CSS animation, at most 300 ms, no
   text, no score, no colour change, no sound beyond existing cues). A pure function
   `isHit(prevView, view)` decides it (true only when same zone, same monster, healthFraction
   lower). Restarting the animation uses a class swap on the next paint, no timer. Reduced
   motion: no flinch (size change still shows). It must respect the flash-rate rule (at most
   one hit per second by construction). Tests: `hitOnlyWhenHealthDrops`, `noHitOnZoneChange`,
   `noHitWhenReducedMotion`.
2. CLEARER SHRINK. `MIN_MONSTER_SCALE` 0.35 -> 0.2 (still never vanishes before defeat).
3. SMOKE, SMALL CHANGE ONLY. Puffs about 20 % larger and a darker outline so they read over a
   bright camera picture (for example a mid-lilac border instead of the near-white one). Keep
   the colours family, puff counts and thinning rule unchanged.
4. NO OVERLAP. While a leaving copy exists, the next zone's monster (and its name) is not shown.
   It appears when the leaving copy is removed: on `animationend`, or at the latest on the
   second paint after the zone end (so at most ~2 s, no timer), in both modes and with reduced
   motion. The frame glow, caption and voice still change at the zone end as now. Test:
   `nextMonsterWaitsForLeavingCopy` (both modes, and the second-paint fallback).
5. TIMER-ONLY SMOKE. Core 8.5 changes: in guided-timer mode the monster loses
   `DAMAGE_PER_SECOND` (3) per second, so it is defeated at 20 s and its smoke shows for the last
   10 s with the existing 'Keep brushing! Brush the smoke away!' line. Camera-mode null seconds
   keep the untracked drain of 2 (7.7 unchanged except its wording no longer names guided-timer
   mode). Name a new constant `TIMER_ONLY_DAMAGE = DAMAGE_PER_SECOND`. Existing core tests that
   assert the old timer-only rule (defeated exactly at 30 s) MUST be updated to the new rule in
   the same task, and the task must list those test files by name; that is a rule change by
   Dr. Yatin, not weakening a test.

Tasks: append to mirror-and-screens `tasks.md` new tasks 42-46 (one per fix above, in the order
5, 4, 2, 1, 3, each with files it may change, tests, `npm run test:run` + `npm run build`), plus
task 47 "Check by hand (camera)": brush one zone; each brushing second visibly flinches the
monster, it shrinks clearly, smoke readable, and no two monsters on screen at a zone change.
Mark 42-47 "needed for the video". Update the overview tables.

When finished, print the new or changed requirement numbers and the task titles 42-47, then stop.
