This is a STEERING EDIT, not a build. Do not write app code.

Edit only this file: `.kiro/steering/kid-safety-privacy.md`.
Do not create, edit or delete any other file.
Keep every line that is not listed below exactly as it is, word for word.

This edit brings the steering in line with a decision made by Dr. Yatin Shinde on
15 Nov 2026 and confirmed on 17 Nov 2026: when the tracker cannot see the child during a
camera session, the game does not change mode; it carries on second by second at the
guided timer's pace, and that zone is saved as unverified.

CHANGES

1. "Camera" section, fourth bullet. Replace

   "- If camera permission is refused, or the light is too poor to track, the game switches to
   **guided-timer mode** and still works fully. Never nag the child for camera access."

   with

   "- If camera permission is refused, or the camera is not ready in time, the game runs in
   **guided-timer mode** and still works fully. If the light becomes too poor to track
   during a camera session, the game carries on for those seconds at the guided timer's
   pace and still works fully; a zone with too many unseen seconds is saved as unverified.
   Never nag the child for camera access."

2. "Data" section, second bullet. Change the bracket
   "(date, time of day, seconds per zone, monsters earned)"
   to
   "(date, time of day, camera or timer mode, and for each zone: seconds, a verified
   flag, the monster and its outcome; monsters earned)".
   Keep the rest of the bullet unchanged.

When finished, print the lines you changed, then stop.
