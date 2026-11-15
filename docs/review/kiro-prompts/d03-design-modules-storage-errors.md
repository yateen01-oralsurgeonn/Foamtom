This is a SPEC EDIT, not a build. Do not write app code.

Edit only this file: `.kiro/specs/core-brushing-loop/design.md`.
Do not create, edit or delete any other file.
Read first: every file in `.kiro/steering/`, then
`.kiro/specs/core-brushing-loop/requirements.md` (the source of truth), then the file you
are editing.
Change ONLY sections 1, 2, 3, 8, 9 and 10. Keep sections 4, 5, 6, 7 and 11 exactly as
they are, word for word.
If the requirements and an instruction below disagree, stop and say so. Do not guess.

THEME: a runnable app with one timer, the camera behind one interface, simpler storage.

SECTION 1 — OVERVIEW

1. Change "per-second brushing signal" wording to match section 5 where needed, and
   replace the "Key design decisions" list with:
   - Tick granularity is 1 second.
   - `H_MAX = 60`, `DAMAGE_PER_SECOND = 3`: a normal monster is defeated after 20 s of
     matching brushing.
   - One tick rule for both modes: a `null` signal drains 2 per second.
   - Linear kind-proximity scaling from 100% to 60% of `H_MAX`, from the last 7 camera
     sessions.
   - Rare eligibility is decided at session start and counts the session that is starting.
   - Monsters are chosen by a fixed rule, never at random.
   - `src/ui/game-loop.ts` is the only module that owns a timer.
   - The camera and tracker sit behind one interface, `SignalSource`.
   - Tab hidden pauses the session; more than 60 s hidden drops it.

SECTION 2 — ARCHITECTURE

2. Update the diagram:
   - Tracking box: `signal-source.ts` — "`SignalSource` interface + `nullSignalSource`
     (real camera in the hand-tracking spec)".
   - Logic box: add `session-result.ts` (toSessionResult), `view.ts` (toView),
     `constants.ts`.
   - UI box: replace `placeholder-screen.ts` with `game-loop.ts` (the only timer),
     `session-screen.ts` (start button, monster, countdown, caption), `end-card.ts`.
   - Add a box "Shell — `src/main.ts`": reads the clock and `localStorage` once and wires
     the parts together.
   - Arrows: SignalSource → game-loop (`latest()` once per second) → `tick` → `toView` →
     session-screen; game-loop → `toSessionResult` → storage; storage → main →
     `startSession` (past sessions). Remove the arrows that show storage feeding
     miss-score, stats and monster-book directly.
3. Replace the "Data flow" paragraph with: "`main.ts` loads past sessions and calls
   `startSession`. Once per second of visible time, `game-loop.ts` asks the
   `SignalSource` for the latest signal and calls `tick`. `toView(state)` turns the state
   into plain values that the screen paints. When the session ends, `toSessionResult`
   builds the result and storage saves it."
4. Keep the last paragraph and add: "Nothing under `src/logic/` imports from `src/ui/`,
   `src/tracking/`, `src/storage/` or `src/audio/`."

SECTION 3 — MODULE LIST

5. Replace the table rows as follows (keep the rows for `monsters.ts`,
   `time-of-day.ts`, `stats.ts` and `audio/lines.ts`, updating function names to match
   sections 5 to 7):
   - `src/logic/types.ts`: add `StartInput`; remove `MissScores` from "stored" wording.
   - `src/logic/constants.ts`: all constants from section 6 and `ZONE_ORDER`.
   - `src/logic/session.ts`: `startSession`, `isBrushing`, `tick`, `pause`, `resume`.
   - `src/logic/session-result.ts`: `toSessionResult`.
   - `src/logic/view.ts`: `toView(state)` → `{ phase, zoneId, countdown, captionLineId,
     monsterId, healthFraction, smokeFraction }`. Pure; this is what the screen tests
     check.
   - `src/logic/monster-book.ts`: `computeMonsterBook(sessions)`,
     `isRareEligibleForNewSession(todaysSessions, newTimeOfDay)`.
   - `src/logic/miss-score.ts`: `computeMissScores(sessions)` (last 7 camera sessions,
     verified zones only), `startingHealth(zone, missScores)` (rounded, 36 to 60).
   - `src/storage/storage.ts`: `createStorage(backend)` returning `saveSession(result)`,
     `loadSessions()`, `clearAll()`. `backend` is anything with `getItem`, `setItem`,
     `removeItem`. No global access inside the module.
   - `src/tracking/signal-source.ts`: the interface below and `nullSignalSource`.
     ```typescript
     interface SignalSource {
       start(): Promise<'ready' | 'unavailable'>;  // asks for the camera once
       latest(): BrushingSignal | null;            // signal for the last full second
       stop(): void;                               // stops the camera stream
     }
     ```
   - `src/ui/game-loop.ts`: the only timer. Inputs: a clock (`now()`), a scheduler, a
     `SignalSource`, a visibility source, a wake-lock helper, and callbacks for "state
     changed", "ended" and "dropped". Emits one tick per whole second of visible elapsed
     time, catching up if a callback is late. Pauses when hidden; drops the session after
     60 s hidden; asks for the wake lock at start and releases it at end or when hidden.
   - `src/ui/session-screen.ts`: start button, monster over the active zone, countdown,
     caption. Paints `toView(state)`. No camera preview in this spec.
   - `src/ui/end-card.ts`: the session's four monsters, closing line, one button back to
     the start screen.
   - `src/audio/speaker.ts`: plays a line: a clip if present, else a local Web Speech
     voice, else caption only. Contains the pure `rampGain(msSinceStart)` used for the
     gentle volume ramp.
   - `src/main.ts`: wiring only.
   Remove the rows for `src/tracking/tracking.ts` and `src/ui/placeholder-screen.ts`.

SECTION 8 — STORAGE

6. Replace `StorageData` with `{ readonly version: 1; readonly sessions: SessionResult[] }`.
   Remove the `missScores` field. Remove the `SessionRecord` interface and say: "Stored
   sessions are `SessionResult` values (section 4). Storage imports its types from
   `src/logic/types.ts`; logic never imports from storage."
7. Replace the bullets with:
   - localStorage key `foamtom:v1`.
   - "If stored data is missing, unreadable, or has a different `version`, the loader
     returns no sessions. No migration code in v1."
   - "Monster Book and miss scores are derived from `sessions` each time. Nothing else is
     stored (req 9.5, 14.7)."
   - "`clearAll()` removes the key."
8. Remove the Design-choice note about denormalised miss scores.

SECTION 9 — ERROR HANDLING

9. Replace the table rows:
   - Camera permission refused / unavailable: keep, and add "A page not served over
     HTTPS counts as unavailable."
   - New row: "Camera not ready within 8 s of the start tap (permission box left open,
     slow model load) → the session starts in timer-only mode. No second request in that
     session. (req 8.1)"
   - Poor light / no face / child out of frame: "The signal is `null` for those seconds.
     The tick rule drains 2 per second and counts them as untracked. A zone with more than
     10 untracked seconds is saved as unverified. Nothing is said to the child. (req 6.3,
     9.3)"
   - Tab hidden: "Camera stream stops. Session pauses (`pause`). On return within 60 s it
     resumes from the same second. After more than 60 s hidden the session is dropped, not
     saved, and the app shows the start screen. (req 2.6, 2.7, 11.6)"
   - `localStorage` full or blocked: "Save and load are wrapped in try/catch. On failure
     the game plays on and nothing is saved. No in-memory copy, no message to the child."
   - New row: "Screen wake lock refused or not supported → carry on silently. (req 15.4)"
10. Remove the Design-choice note "(poor light, sustained)". Keep the "(tab hidden)" note
    and add to it: "A 60 s limit was added on 2026-11-15."

SECTION 10 — SCREEN

11. Rename the section "Session screen (plain) (req 11, 15)". Replace the bullets with:
    - Start screen: one large button with an icon, a spoken line and a caption. Its tap
      unlocks sound.
    - Session: one monster over the active zone, the countdown, the zone caption, smoke
      after a defeat. Everything painted comes from `toView(state)`.
    - End card: the four monsters, a closing line, one button back to the start screen.
    - No camera preview in this spec (hand-tracking spec).
    - Layout for portrait; usable in landscape and on desktop; no rotate block. Touch
      targets ≥ 48 px. Colour is never the only signal.
    - Entry page carries a Content-Security-Policy allowing same-origin only (req 12.8).
    - Privacy lines from the old section stay as they are.

DO NOT TOUCH: sections 4, 5, 6, 7 and 11.

When finished, print a short list of what you changed, then stop.
