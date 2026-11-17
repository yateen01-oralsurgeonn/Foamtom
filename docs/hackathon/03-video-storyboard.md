# Foamtom: The Haunted Mirror — demo video storyboard v2 (text)

Target 2:50 (hard limit: under 3:00). English. Presenter + demonstrator: Dr. Yatin. No child's face.
Music: synthesised or licensed spooky-cute loop only (no copyrighted music, no MusicGen).
No clinic name, contact or registration number on screen (DCI). No third-party trademarks.
Real-frame storyboard sheet comes once the app runs (stills from the real build).

v2 (17 Nov 2026): each shot now says which part of the build it needs and what to film if
that part is not ready. Wording changed only where the agreed spec changed: shot 4 (smoke),
shot 7 (poor light no longer switches mode). Items marked **[TO CONFIRM]** are Dr. Yatin's.

| # | Time | Shot | Words (draft) | Proves | Needs (spec / task) | If not ready |
|---|---|---|---|---|---|---|
| 1 | 0:00-0:12 | Dark bathroom. Phone propped by the mirror lights up: candle flicker, fog, cracked-glass frame. A cute cavity monster crawls onto his cheek. | Foamtom voice: "Mirror, mirror... someone forgot to brush." | Hook, the haunting interface | `mirror-and-screens` (frame, monster art); `hand-tracking` (monster pinned to the cheek) | Monster over the zone area of the frame, not pinned to the face. |
| 2 | 0:12-0:30 | Dr. Yatin to camera, normal light. | "I'm a dentist in India. Kids aged 5 to 9 brush alone, stop in under a minute, and skip the back teeth. **[TO CONFIRM: his own clinic observation, or a source]** Foamtom turns the phone by the sink into a haunted mirror that won't let them skip." | Problem, audience, why it matters (Impact) | Nothing from the build | - |
| 3 | 0:30-0:40 | Phone: open a web link. No install, no sign-up. Card: "The camera stays on this phone. Nothing is saved or sent." | - | Works anywhere; privacy | Live link (core task 9); title card (`mirror-and-screens`) | Start screen of the core game. |
| 4 | 0:40-1:30 | Full brush (speed-ramped). Voice: "A ghoul is hiding upper left!" Monster sits over that zone; brushing the WRONG side does nothing; brushing the right side makes it shriek into smoke. The smoke stays: "Keep brushing! Brush the smoke away!" 4 zones, 2:00 timer. | Short voice lines from the game | It really senses the brush (core demo) | `hand-tracking` with **side** working (the feasibility test decides). Upper/lower is not shown, so the side-only fallback is fine. | Timer-only session with the zone voice and the smoke; cut the "wrong side" moment and say "guided" not "senses". |
| 5 | 1:30-1:45 | Monster Book: every monster met so far; the rare Midnight Molar Ghoul locked: "Brush morning AND night." | - | Why a child comes back | `mirror-and-screens` (Book screen); core tasks 10-14 (memory) | End card with the session's four monsters. |
| 6 | 1:45-1:55 | Parent screen: "2:00 brushed - **[TO CONFIRM: upper left / lower left]** missed 3 nights." | "And parents see the spot that keeps getting missed." | Real-world use | `parent-screen`; camera sessions (only camera-verified zones count as missed) | Cut the shot; the 10 s go to shot 4. |
| 7 | 1:55-2:05 | Two cuts. (a) Light off mid-brush: the countdown and the monster carry on at the timer's pace. (b) Camera refused at the start: the guided timer runs the whole session. | "Bad light, or no camera? It still guides them." | Robustness | (a) `hand-tracking`; (b) core game (already the default) | (b) only. |
| 8 | 2:05-2:35 | Screen recording of Kiro: the spec, steering docs (kid-safe, no data, dentist's zone rules), a hook firing on save, a property test running. | "Built in Kiro: the spec first, my dental rules as steering, hooks that guard privacy on every save, and tests that prove a monster only loses health in its own zone." | Kiro depth (Technical) | Hooks seen firing in the Kiro IDE; tests in `src/logic` (core tasks 2-5) | Show the hook files and the test run in the terminal. |
| 9 | 2:35-2:50 | Optional: a child's hands + back of head brushing, mirror glowing. End card: "Foamtom: The Haunted Mirror - free, in your browser" + URL + GitHub. | "Two minutes. Every corner. Every night." | Memorable close | Live link; public repo with MIT in the About box | - |

## Before filming (2 Dec)

- Read every line a child hears and a parent reads, once, as a dentist.
- Shot 2 claim and shot 6 zone name confirmed (above).
- Film shot 4 in good light, with the phone where a child would prop it.
- Nothing in frame that names the clinic; no child's face.
- Keep the total under 2:55, so the upload never trims to over 3:00.
