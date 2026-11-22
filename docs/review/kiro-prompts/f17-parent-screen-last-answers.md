Apply Dr. Yatin's last answers of 22 Nov 2026 to `.kiro/specs/parent-screen/requirements.md`.
Edit ONLY that file. Rewrite the affected requirements in EARS form, add these answers to
"Decisions (22 Nov 2026)", and remove the "Open questions" section if nothing is left open.
If a NEW contradiction appears, keep a short "Open questions" section and stop; do not choose.

N1. The nudge has only its own rule (2 or more nights for one zone). The 3-camera-session
    minimum applies to the zone fact only, not to the nudge.
N2. (his answer) A calendar day counts as a night for a zone only when EVERY night session
    of that day had 0 seconds of brushing seen in that zone's verified turn. If any night
    session that day saw brushing in that turn, the day does not count. A night session whose
    turn is unverified neither counts nor blocks; if all of that day's night sessions are
    unverified for the zone, the day does not count.
N3. If the window has 3 or more camera-mode sessions but no verified zone result, the zone
    fact shows row 12, "Not enough camera sessions yet."
N4. `parentView` also skips a session whose zone seconds (brushed + untracked, summed over
    its zones) exceed its `durationSeconds`. Skipped sessions count nowhere.
N5. Tie wording: "Brushing was seen least during the upper-left and lower-left turns." For
    three: "...during the upper-right, upper-left and lower-left turns." Names follow
    `ZONE_ORDER`; "and" before the last; no comma before "and". (If all four tie with unseen
    time, the same rule names all four.)

LINES TABLE: Dr. Yatin APPROVED, on 22 Nov 2026, every row exactly as written: rows 1, 2, 3,
5, 6, 7, 8, 9, 10, 11, 12, 13, 21, 22, 23, 24, 25, plus the tie form of row 10 above (add it
as row 10b). Mark each "approved 22 Nov". After this, no row is waiting.

When finished, print the requirement titles and say whether anything is still open, then stop.
