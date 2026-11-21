CONTEXT ADDED 21 Nov 2026 (read before the prompt below; it wins where they differ):

- Also read `.kiro/specs/hand-tracking/requirements.md` and `design.md`, including both
  "Decision ... 21 Nov 2026" sections. The camera preview (`src/ui/camera-preview.ts`),
  the monster anchor on the cheek (`src/ui/monster-anchor.ts`), the session screen
  (`src/ui/session-screen.ts`), the end card (`src/ui/end-card.ts`) and the title screen
  already exist. This spec restyles and extends them; it does not replace their behaviour
  or change their tests.
- The camera now checks only that the child is brushing at the mouth and moving
  (`REQUIRE_SIDE_MATCH` and `REQUIRE_LEVEL_MATCH` are both `false`). So the frame glow,
  the monster position and the spoken line are THE way the child knows which zone to
  brush. Say so in the frame requirement.
- The haunted-mirror frame must work in both modes: around the live mirrored camera
  preview (camera mode) and around the plain four-zone grid (timer-only mode).
- Existing spoken lines in `src/audio/lines.ts` were approved by Dr. Yatin on 19 Nov. Do
  not change them. Every NEW child-facing or parent-facing line (including the two
  suggested in scope items 1 and 5) goes in a final section "Lines for Dr. Yatin to
  approve", one per row, with where it is shown. They are not final until he approves.
- Deadline: the Kiroween video is due 4 Dec 2026. Mark each requirement "needed for the
  video" or "later", so the build order can put the video's needs first.

