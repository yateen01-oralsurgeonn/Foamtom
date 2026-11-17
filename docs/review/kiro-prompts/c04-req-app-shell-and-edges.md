This is a SPEC EDIT, not a build. Do not write app code.

Edit only this file: `.kiro/specs/core-brushing-loop/requirements.md`.
Do not create, edit or delete any other file.
Read first: every file in `.kiro/steering/`, then the file you are editing.
Keep every part of the file that is not listed below exactly as it is, word for word.
Keep the EARS style and the existing requirement numbers. Do not renumber anything.
If an instruction below conflicts with a steering file, stop and say so. Do not guess.

THEME: make the spec produce a runnable timer-only game, close the dead ends, and make
the privacy promises testable. (Decisions by Dr. Yatin Shinde, 15 Nov 2026.)

CHANGES

1. "In scope", item 3: replace with
   "3. **A plain session screen:** a start button, one monster drawn over the active zone,
   a countdown, the zone name spoken and captioned, and an end card. No camera preview in
   this spec."
   Add item 5: "5. **A runnable app:** an entry page, one game loop, and a first
   deployment to GitHub Pages, so that a timer-only game can be played from a link."

2. "Out of scope": replace the list with
   "- Real hand tracking, the camera preview, and model-file loading: the `hand-tracking`
   spec.
   - Haunted-mirror art, the title screen, and the Monster Book screen: the
   `mirror-and-screens` spec.
   - The parent screen (adult gate, facts, disclosure, 'Clear all data'): the
   `parent-screen` spec."

3. Requirement 2.4: replace with
   "2.4 THE SYSTEM SHALL NOT extend or shorten the session: it is always exactly 120
   seconds of active (tab visible) session time, regardless of the brushing signal."

4. Add after requirement 2.5:
   "2.6 WHEN the browser tab becomes hidden THE SYSTEM SHALL pause the session; WHEN the
   tab becomes visible again THE SYSTEM SHALL resume it from the same second. A pause is
   not 'the child not brushing' (requirement 2.5 still holds while visible)."
   "2.7 IF the tab stays hidden for more than 60 seconds THE SYSTEM SHALL drop the session
   without saving it and SHALL return to the start screen."

5. Requirement 11: change the title to "Session screen (plain)" and, in the note under
   it, change "placeholder screen" to "session screen". Then:
   - 11.1: replace with "11.1 (Moved to the `hand-tracking` spec: mirrored live preview
     of the front camera.)"
   - 11.2: replace with "11.2 THE SYSTEM SHALL display the session screen without a camera
     preview in this spec."
   - 11.9: replace with "11.9 THE SYSTEM SHALL be laid out for portrait, SHALL remain
     usable in landscape and in a desktop browser, and SHALL NOT show a 'rotate your
     device' block."
   - 11.12: replace with "11.12 (Moved to the `hand-tracking` spec: 20+ fps with the
     camera on, checked by hand on a real phone.)"
   Keep 11.3 to 11.8, 11.10 and 11.11 as they are.

6. Add after requirement 12.7:
   "12.8 THE SYSTEM SHALL ship a Content-Security-Policy in the entry page that allows
   only same-origin scripts, styles, images, media and connections."
   "12.9 THE SYSTEM SHALL use Web Speech voices only when the voice is marked as a local
   (on-device) voice. IF no local voice exists THE SYSTEM SHALL show the caption without
   speech."

7. Add these properties at the end of requirement 13:
   "13.10 **Privacy guard:** A test SHALL read every file under `/src/` and fail if it
   finds any of: `fetch(`, `XMLHttpRequest`, `sendBeacon`, `WebSocket`, `EventSource`,
   `toDataURL`, `toBlob`, `MediaRecorder`, `captureStream`, `document.cookie`,
   `Math.random` inside `/src/logic/`, or any string starting `http://` or `https://` (the one
   exception is the SVG namespace `http://www.w3.org/2000/svg`). The same test SHALL fail if any file under `/src/logic/` imports from `/src/ui/`,
   `/src/tracking/`, `/src/storage/` or `/src/audio/`."
   "13.11 **Wording guard:** A test SHALL check every line in `src/audio/lines.ts`: each
   has a non-empty caption; none contains a word from a banned list (prevent, cure,
   cavity-free, guarantee, diagnose, clinic, doctor, almost, lost, lose, failed, missed);
   none mentions the camera or the light."
   "13.12 **Game loop:** With a fake clock, for any pattern of late or bunched timer
   callbacks, 120 seconds of visible time SHALL produce exactly 120 ticks; hidden time
   SHALL produce none; more than 60 seconds hidden SHALL drop the session."

8. Add a new requirement after requirement 14:
   "### 15. Runnable app
   **As a child, I want to tap one big button and have the game start, so that I can play
   without a grown-up.**
   15.1 THE SYSTEM SHALL show a start screen with one large start button that has an icon,
   a spoken line and a caption. The tap on this button SHALL be the one that starts sound
   and, in a later spec, asks for the camera.
   15.2 THE SYSTEM SHALL have exactly one module that owns a timer (`src/ui/game-loop.ts`).
   It SHALL be driven by elapsed clock time, not by counting timer callbacks, and SHALL
   take its clock as an input so that tests can use a fake clock.
   15.3 THE SYSTEM SHALL reach the camera and tracker only through one interface,
   `SignalSource`, with three operations: start (answers 'ready' or 'unavailable'),
   latest (the signal for the last full second, or `null`), and stop. This spec SHALL
   provide only a source that always answers 'unavailable' and `null`.
   15.4 WHEN a session starts THE SYSTEM SHALL ask the browser to keep the screen awake,
   SHALL release that request when the session ends or the tab is hidden, and SHALL carry
   on without any message if the browser refuses.
   15.5 WHEN a session ends THE SYSTEM SHALL show an end card with the session's four
   monsters, a spoken and captioned closing line, and one button that returns to the start
   screen. The end card SHALL NOT urge the child to play again.
   15.6 THE SYSTEM SHALL build to a static folder that works when served from a
   sub-path (GitHub Pages), using relative asset paths."

9. Add a new section at the very end of the file:
   "## Decisions (2026-11-15)
   Confirmed with Dr. Yatin Shinde on 15 November 2026 after the spec review
   (`docs/review/SPEC-REVIEW-v1.md`).
   1. Zone order re-confirmed (requirement 3.2).
   2. Every monster met goes into the Monster Book, beaten or not (requirement 10.2).
   3. After a monster is beaten: 'Keep brushing! Brush the smoke away!' (requirement 7.8).
   4. Tracker cannot see: 2 health per second; a zone with more than 10 untracked seconds
      is unverified (requirements 6.3, 7.7, 9.3).
   5. Kind proximity keeps the 60% floor and the 15% rescue, and looks at the 7 most
      recent camera-mode sessions (requirement 14.1).
   6. Scope: four specs (core-brushing-loop, hand-tracking, mirror-and-screens,
      parent-screen).
   7. If the hand-tracking test shows upper and lower cannot be told apart: side-only
      checking, and parents are told (requirement 5.7)."

DO NOT TOUCH: requirements 1, 3 to 10, 14, properties 13.1 to 13.9, and the
"Decisions (2026-11-14)" section.

When finished, print a short list of the sections you changed, then stop.
