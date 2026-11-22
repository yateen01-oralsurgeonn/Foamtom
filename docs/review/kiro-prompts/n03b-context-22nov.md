CONTEXT ADDED 22 Nov 2026 (read before the prompt below; it wins where they differ):

- Also read `.kiro/specs/hand-tracking/requirements.md` and `design.md` (both "Decision ...
  21 Nov 2026" sections) and `.kiro/specs/mirror-and-screens/requirements.md` (requirement 2
  "Parent entry point", the display-only text table, and the accessibility requirement 11).
  Read `src/logic/stats.ts`, `src/logic/storage*` and `src/logic/constants.ts` as they are now.
- The camera checks ONLY that a hand is near the mouth and moving (`REQUIRE_SIDE_MATCH` and
  `REQUIRE_LEVEL_MATCH` are both `false`). It does not know which side or upper/lower is
  brushed. So:
  - Disclosure line 2 of the prompt ("near one side of the mouth") is wrong. Replace it with
    a line that says the camera sees a moving hand near the mouth and cannot see the brush,
    the teeth, or which side is brushed.
  - Drop disclosure line 6 (the `REQUIRE_LEVEL_MATCH` condition). It no longer applies.
  - The nudge is the reworded one in `dental-rules.md` (Dr. Yatin, 22 Nov): "During the
    upper-right turn, brushing was not seen on 3 nights. Try brushing it first tonight."
    The parent screen never says a zone "was missed" as if the camera saw that side. The
    "zone most often missed" fact uses the same honest wording.
- Check every disclosure line against the code as it is now (kind proximity, rescue,
  timer-only defeat at 20 s, camera defeat after 15 counted seconds). If a line is no longer
  true, do not reword it yourself: list it under "Open questions".
- How "3 nights" is counted is NOT settled (days or sessions, morning sessions, what amount
  of unseen time counts). Do not choose: put the options under "Open questions".
- The entry control on the title screen belongs to `mirror-and-screens` (its tasks 36-38,
  not built yet). This spec builds the screen behind it: gate, facts, nudge, disclosure,
  Clear all data. It receives the open handler; it does not build the title control.
- "Clear all data" must remove every key the app stores (list them from the storage code).
- Parent-facing text is display-only: it lives outside `src/audio/lines.ts` (the core
  wording guard bans "camera" there), as `mirror-and-screens` already does.
- Every NEW parent-facing line goes in a final section "Lines for Dr. Yatin to approve",
  one per row, with where it is shown. None is final until he approves.
- Deadline: the Kiroween video is due 4 Dec 2026. Mark each requirement "needed for the
  video" or "later".
- End the file with "Open questions" for Dr. Yatin. Do not decide them.

