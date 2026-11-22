Apply Dr. Yatin's decisions of 22 Nov 2026 to `.kiro/specs/parent-screen/requirements.md`.
Edit ONLY that file. Do not write design.md, tasks.md or code. Do not change any game rule,
number or stored value. Where a decision below touches a requirement, rewrite that
requirement so it states the decision plainly in EARS form. Then replace the "Open questions"
section with a "Decisions (22 Nov 2026)" section that lists each question number with its
answer in one or two lines. If applying a decision exposes a NEW contradiction, stop and list
it under a short "Open questions" section after the decisions; do not choose.

DECISIONS

Q13. The parent screen IS in the 4 Dec video. Keep the "needed for the video" tags. The nudge
     (requirement 7) is now also "needed for the video".

Q2. A "night" for the nudge:
    - only night sessions (started 17:00 to 23:59 local time), camera mode only;
    - in the last 7 calendar days including today;
    - counted once per calendar day (two night sessions on one day = at most one night);
    - a night counts for a zone when that zone's turn in a night session had 0 seconds of
      brushing seen (`secondsBrushed === 0`). Untracked seconds do not make a night count.
      Only verified zone results are used (unverified ones never count, as before).
    The approved sentence then stays word for word true.

Q3. The nudge appears when at least one zone has 2 or more such nights. It names the zone
    with the most nights; a tie goes to the first zone in `ZONE_ORDER`. One nudge at most.
    The nudge zone and the zone fact (requirement 5) are computed separately and may differ.

Q1. All time facts cover the same last 7 calendar days as the sessions-per-day rows. Three
    lines only: time with the game (sum of `durationSeconds` of all sessions in the window),
    of that the camera saw brushing (`computeVerifiedTime` over the window's sessions), and
    timer only, not checked by the camera (sum of `durationSeconds` of timer-only sessions in
    the window). No leftover line; the screen does not claim the gap.

Q4 + Q9. Zone fact (requirement 5): last 7 days, camera sessions only, verified zones only.
    Shown only when the window has 3 or more camera-mode sessions; otherwise the line
    "Not enough camera sessions yet." Wording: "Brushing was seen least during the
    upper-left turn." On a tie, name every tied turn in `ZONE_ORDER` order. If every verified
    turn had no unseen time, show "Brushing was seen in every turn." `stats.ts` is not
    changed; `parentView` filters the sessions to the window and computes what it needs.
    With no sessions at all, the screen shows only "No sessions yet." in place of the facts
    (no seven rows of zeros).

Q5 + Q6 + Q7. The always-visible disclosure on this screen is exactly these lines, in this
    order (the title screen keeps its own approved line, unchanged):
    1. "The camera picture stays on this phone. It is never saved or sent."
    2. "Brushing times and the Monster Book are saved on this phone only, until you press
       Clear all data."
    3. "The camera sees a moving hand near the mouth. It cannot see the brush, the teeth,
       or which part of the mouth is being brushed."
    4. "In camera sessions, monsters get weaker in turns where brushing was often not seen."
    5. "A monster that is nearly beaten when the time is up counts as beaten."
    6. "Every monster your child meets goes into the Monster Book, beaten or not."
    Check lines 2 and 4 against the storage and kind-proximity code; if either is not true,
    list it as a new open question.

Q8. Zone names on this screen are written with a hyphen before "turn" ("upper-right turn",
    "lower-left turn"). The nudge needs 2 or more nights, so "nights" is always plural.

Q10. Confirmed: `parentView(sessions, constants, today)`; `today` is a local calendar date
     passed in by the caller. `parentView` never reads the clock.

Q11. `parentView` skips any stored session whose numbers are out of range (any second count
     below 0 or above 30 per zone, missing fields, a `durationSeconds` below 0). Skipped
     sessions count nowhere. The properties of requirement 14 cover this.

Q12. The hold gate may use `requestAnimationFrame` and pointer-event timestamps, as
     `mirror-and-screens` 13.3 allows for effects. A keyboard hold (Space or Enter held 3 s)
     is the accessible path. No second gate.

LINES TABLE: update "Lines for Dr. Yatin to approve" to the final wording above (nudge, zone
fact, "Not enough camera sessions yet.", "Brushing was seen in every turn.", "No sessions
yet.", the six disclosure lines, the three time lines). Mark the six disclosure lines and the
nudge "decided 22 Nov"; leave every other row for his approval.

When finished, print the list of rows still waiting for his approval, then stop.
