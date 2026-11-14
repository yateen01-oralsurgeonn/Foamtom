# Spec: core-brushing-loop — Requirements

## Introduction

This spec defines the core brushing loop for **Foamtom: The Haunted Mirror**: the pure
game logic that drives a 2-minute session, the guided-timer fallback when no camera is
available, a minimal placeholder screen, and the property-based tests that guard the
logic.

The game logic lives entirely in `/src/logic/` and is **pure** — no DOM, no camera, no
network access. The only thing that crosses the boundary from the outside world is a
per-frame brushing signal (or, in guided-timer mode, its absence). This separation lets
every rule below be property-tested with fast-check without a browser or camera.

### In scope

1. **Pure game logic:** a 2-minute session of 4 zones × 30 s, active-zone tracking,
   monster health that drops only while the active zone is brushed, session result,
   and Monster Book unlock rules (rare monsters need a morning AND a night session on
   the same day).
2. **Guided-timer mode** (no camera) running the full session with identical logic.
3. **A plain placeholder screen:** mirrored camera preview if allowed, one monster drawn
   over the active zone, a countdown, the zone name spoken and captioned.
4. **Property-based tests** (fast-check) for every property listed in `tech.md`.

### Out of scope (handled by other specs or later work)

- Haunted-mirror art and CSS frame design.
- Real MediaPipe hand/face tracking (the tracking layer that produces the brushing
  signal).
- The parent screen (UI, stats display, adult gate, "Clear all data" button).
- Deployment, build configuration, and model-file loading.
- Monster Book browsing UI (collection gallery, rarity badges, etc.).

### Steering references

All requirements below comply with the steering files in `.kiro/steering/`. Where a
steering rule is marked **[TO CONFIRM]** in `dental-rules.md`, that marker is preserved
here. Kid-safety and privacy rules override any other requirement; if a feature cannot
meet them, the feature is dropped.

---

## Requirements

### 1. Pure game logic architecture

**As a developer, I want all game logic to live in pure modules with no DOM or camera
access, so that every rule can be property-tested without a browser.**

1.1 THE SYSTEM SHALL keep zone timing, scoring, monster state, Monster Book unlocks, and
session-result logic in modules under `/src/logic/` that have no DOM or camera access.

1.2 THE SYSTEM SHALL accept only the per-frame brushing signal (defined in requirement 5)
or its absence as input to game logic; nothing else from the camera or DOM shall cross
into game logic.

1.3 THE SYSTEM SHALL make guided-timer mode use the same game-logic modules as camera
mode, with the tracking signal absent.

---

### 2. Session timing and duration

**As a child, I want the game to take exactly two minutes and tell me when each part is
done, so that I brush my whole mouth and know when I can stop.**

2.1 WHEN a brushing session starts THE SYSTEM SHALL run exactly four zones of 30 seconds
each, for a total of 120 seconds.

2.2 WHILE a zone is active THE SYSTEM SHALL count down from 30 seconds to zero before
advancing to the next zone.

2.3 WHEN the fourth zone reaches zero THE SYSTEM SHALL end the session.

2.4 THE SYSTEM SHALL NOT extend or shorten the total session duration, regardless of the
brushing signal received.

2.5 IF the child stops brushing or brushes the wrong zone THE SYSTEM SHALL still advance
the zone timer to zero and move on; the timer shall never pause or stall.

---

### 3. Zone definition and order

**As a parent, I want the game to guide my child through every part of the mouth in a
dentist-approved order, so that no area is skipped.**

3.1 THE SYSTEM SHALL define four zones: **upper left**, **upper right**, **lower left**,
and **lower right**.

3.2 Zone order **[TO CONFIRM]**: upper right → upper left → lower left → lower right.

3.3 THE SYSTEM SHALL treat zones as rough areas of the mouth (side + upper/lower), never
claiming to detect individual teeth.

3.4 THE SYSTEM SHALL treat front teeth as part of the zones on either side; no separate
"front teeth" zone exists.

3.5 WHEN a zone becomes active THE SYSTEM SHALL set it as the current active zone and mark
all other zones as inactive.

---

### 4. Zone announcement — voice and caption

**As a child who cannot read well, I want the game to say the name of each zone out loud
and show it as text, so that I know where to brush without reading.**

4.1 WHEN a zone becomes active THE SYSTEM SHALL speak the zone name aloud (for example,
"A ghoul is hiding upper left!").

4.2 WHEN a zone becomes active THE SYSTEM SHALL display a visible caption of the spoken
line.

4.3 THE SYSTEM SHALL NOT present any instruction as text only; every spoken line shall
have a visible caption and every visible instruction shall have a spoken equivalent.

4.4 WHEN audio plays THE SYSTEM SHALL ramp the volume gently and SHALL NOT produce sudden
loud sounds.

4.5 Every voice line SHALL live in one table (`src/audio/lines.ts`) alongside its caption
text, so that captions are always available for every line.

---

### 5. Brushing signal contract

**As a developer, I want a single, simple signal from the tracking layer, so that the
game logic stays pure and testable.**

5.1 THE SYSTEM SHALL accept a per-frame brushing signal with exactly this shape:

```
{ handNearMouth: boolean, side: 'left' | 'right' | 'unknown', level: 'upper' | 'lower' | 'unknown', moving: boolean }
```

5.2 THE SYSTEM SHALL treat the signal as absent (null or undefined) in guided-timer mode.

5.3 THE SYSTEM SHALL NOT pass any other camera or tracking data into game logic; the
signal above is the only bridge between tracking and logic.

5.4 IF `handNearMouth` is true and `moving` is true and `side` matches the active zone's
side and `level` matches the active zone's level THE SYSTEM SHALL treat the active zone
as being brushed.

5.5 IF `handNearMouth` is false, or `side` does not match the active zone's side, or
`level` does not match the active zone's level THE SYSTEM SHALL treat the active zone as
not being brushed.

---

### 6. Benefit of the doubt

**As a parent, I want the game to give my child credit when tracking is uncertain, so that
a bad camera angle does not punish them.**

6.1 IF the tracking signal is absent or any field is `unknown` THE SYSTEM SHALL continue
running the active zone timer; the timer SHALL NOT pause or stall.

6.2 THE SYSTEM SHALL NOT nag, prompt, or interrupt the child when tracking is uncertain
or absent.

6.3 Whether uncertain or absent tracking also reduces the active monster's health is an
**open question** for Dr. Yatin (see Open questions). Until confirmed, the system SHALL
NOT reduce monster health on uncertain or absent signals; only a fully matching signal
(per 5.4) reduces health.

---

### 7. Monster health

**As a child, I want the monster on the part I'm brushing to shrink when I brush the
right spot, so that brushing feels like defeating it.**

7.1 THE SYSTEM SHALL assign each zone a monster with a fixed maximum health.

7.2 WHILE the active zone is being brushed (signal matches per 5.4) THE SYSTEM SHALL
reduce the active monster's health.

7.3 WHILE the active zone is not being brushed, or the wrong zone is being brushed THE
SYSTEM SHALL NOT reduce the active monster's health.

7.4 WHEN a monster's health reaches zero THE SYSTEM SHALL mark that monster as **defeated**
(it "shrieks and dissolves into smoke").

7.5 IF a zone ends (30 s elapsed) with its monster still alive THE SYSTEM SHALL mark that
monster as **trapped** (not defeated).

7.6 Every monster SHALL live in one table (`src/logic/monsters.ts`) with the fields: id,
name, rarity, and unlock rule.

---

### 8. Guided-timer mode

**As a child whose phone has no working camera, I want the game to still take me through
all four zones, so that I still get a full brush.**

8.1 IF camera permission is refused, or the camera is unavailable, or tracking quality is
too poor THE SYSTEM SHALL enter guided-timer mode.

8.2 WHILE in guided-timer mode THE SYSTEM SHALL run the full 120-second session using the
same game-logic modules as camera mode.

8.3 WHILE in guided-timer mode THE SYSTEM SHALL NOT request camera access again or display
any prompt or nag for camera permission.

8.4 THE SYSTEM SHALL make guided-timer mode fully functional — every zone, every
announcement, every Monster Book unlock rule works identically to camera mode.

8.5 Whether monsters take damage in guided-timer mode (no signal) follows the same open
question as requirement 6.3.

---

### 9. Session result and storage

**As a parent, I want the game to remember how long and where my child brushed, so that I
can see the facts later.**

9.1 WHEN a session ends THE SYSTEM SHALL produce a session result containing: **date**,
**time of day** (morning or night), **seconds per zone**, and **monsters earned**.

9.2 "Seconds per zone" SHALL mean the number of seconds the child spent brushing (signal
matching per 5.4) in that zone; this value SHALL NOT exceed 30.

9.3 Whether guided-timer-mode sessions record full 30 s per zone (benefit of the doubt) or
zero is an **open question** for Dr. Yatin (see Open questions).

9.4 THE SYSTEM SHALL store the session result in `localStorage` on the device and SHALL
NOT transmit it over the network.

9.5 THE SYSTEM SHALL store no data other than brushing sessions (date, time of day,
seconds per zone, monsters earned).

9.6 THE SYSTEM SHALL NOT store names, ages, email, photos, camera frames, landmarks, or
any derived measurement.

9.7 THE SYSTEM SHALL store all session data behind one small storage module under
`/src/storage/`.

---

### 10. Monster Book unlocks

**As a child, I want to collect monsters by brushing, and I want rare monsters to appear
when I brush morning and night, so that I have a reason to come back.**

10.1 WHEN a monster is defeated (health reaches zero) THE SYSTEM SHALL mark it as earned
for the Monster Book.

10.2 WHEN the session ends at 2:00 THE SYSTEM SHALL mark all remaining trapped monsters as
earned for the Monster Book.

10.3 THE SYSTEM SHALL add all earned monsters from the session to the Monster Book.

10.4 THE SYSTEM SHALL define 10–12 monster designs, each with an id, name, rarity, and
unlock rule, in one table (`src/logic/monsters.ts`).

10.5 WHEN a session starts THE SYSTEM SHALL record the time of day as **morning** or
**night** based on the current clock time. The exact hour boundaries that separate
"morning" from "night" are an **open question** for Dr. Yatin (see Open questions).

10.6 IF a day has at least one morning session AND at least one night session THE SYSTEM
SHALL make rare monsters eligible to unlock for that day.

10.7 IF a day does not have both a morning and a night session THE SYSTEM SHALL NOT unlock
rare monsters for that day.

10.8 Whether sessions that fall outside defined morning or night hours (for example, an
afternoon brush) count toward the morning+night requirement is an **open question** for
Dr. Yatin (see Open questions).

---

### 11. Placeholder screen

**As a child, I want to see myself in the mirror with a monster on the part I need to
brush, so that I know where to brush next.**

> This requirement covers a plain, functional placeholder screen only. Haunted-mirror
> art, CSS frame design, fog, candle flicker, and cracked-glass effects are out of scope
> for this spec.

11.1 IF camera permission is granted THE SYSTEM SHALL display a mirrored live preview of
the front camera.

11.2 IF camera permission is not granted THE SYSTEM SHALL display the placeholder screen
without a camera preview (guided-timer mode).

11.3 WHILE a session is active THE SYSTEM SHALL draw one monster over the active zone on
the screen.

11.4 WHILE a session is active THE SYSTEM SHALL display a countdown timer showing the
remaining seconds in the current zone.

11.5 WHEN a zone becomes active THE SYSTEM SHALL display the zone name as a caption and
speak it aloud (cross-reference requirement 4).

11.6 WHEN the session ends OR the browser tab becomes hidden THE SYSTEM SHALL stop the
camera stream immediately.

11.7 THE SYSTEM SHALL process camera frames in the browser only; no frame, image, video,
landmark, or derived measurement SHALL be sent over the network, saved to storage, or
logged.

11.8 THE SYSTEM SHALL NOT provide screenshot, recording, or "share your mirror" features.

11.9 THE SYSTEM SHALL operate in portrait orientation.

11.10 THE SYSTEM SHALL provide touch targets of at least 48 px.

11.11 THE SYSTEM SHALL NOT use colour as the only signal for any information.

11.12 THE SYSTEM SHALL run at 20+ fps on a mid-range Android phone (2022) in Chrome with
this placeholder screen.

---

### 12. Content, tone, and wording safety

**As a parent, I want the game to be safe, gentle, and honest, so that I can trust it
with my child.**

12.1 THE SYSTEM SHALL present a cute-spooky tone, never scary. There SHALL be no blood, no
gore, no realistic teeth damage, and no jump scares.

12.2 THE SYSTEM SHALL present monsters as "cavity monsters" — a playful idea only, not a
diagnosis.

12.3 THE SYSTEM SHALL NOT claim that the game prevents cavities, cures any condition, or
replaces a dental visit.

12.4 THE SYSTEM SHALL NOT display any clinic name, phone number, address, or registration
number.

12.5 THE SYSTEM SHALL use only wording consistent with the dental rules: "Brush for two
minutes", "Don't forget the back teeth", "Brush morning and night".

12.6 THE SYSTEM SHALL NOT use dark patterns: no streak-loss guilt, no timers that pressure
the child, no purchases, and no prompts that make the child feel bad for missing a
session.

12.7 THE SYSTEM SHALL NOT include analytics, trackers, cookies, ads, or third-party
scripts.

---

### 13. Property-based tests

**As a developer, I want fast-check properties that hold for all inputs, so that the game
logic is provably correct.**

The following properties are mandated by `tech.md` and SHALL be implemented as fast-check
property-based tests in `/tests/`. Each property SHALL hold for any arbitrary input
sequence.

13.1 **Monster health:** For any sequence of brushing signals, a monster's health SHALL
decrease only while its own zone is active and the signal matches that zone. Health SHALL
NOT decrease while a different zone is active, while the signal does not match, or while
no signal is present (unless confirmed per the open question in 6.3).

13.2 **Session duration:** For any sequence of brushing signals — including none, wrong,
partial, or all-correct — the total session duration SHALL always be exactly 120 seconds
(4 × 30 s).

13.3 **Rare monster unlock:** A rare monster SHALL unlock only when the set of sessions
for a given calendar day includes both a morning and a night session. For any set of
sessions on a day without both, no rare monster SHALL unlock.

13.4 **Stats ceiling:** The total brushing time computed from stored sessions SHALL never
exceed the total elapsed wall-clock time of those sessions. (This tests the stats
computation logic in `/src/logic/`, not the parent screen UI, which is out of scope.)

13.5 **Storage round-trip:** For any set of sessions, saving to `localStorage` then
loading SHALL return an identical set of sessions.

---

## Open questions for Dr. Yatin

These items need Dr. Yatin Shinde's confirmation before the design phase can finalise
them. Items marked **[TO CONFIRM]** come directly from `dental-rules.md`.

1. **Zone order [TO CONFIRM]:** Is the order upper right → upper left → lower left →
   lower right correct, or should it be changed?

2. **Morning vs. night hours:** What clock hours define "morning" and "night" for the
   rare-monster unlock rule? For example, is morning before 12:00 and night after 17:00?
   What about a session at 3 PM — does it count as morning, night, or neither?

3. **Benefit of the doubt — monster health:** When tracking is uncertain or absent
   (guided-timer mode), should the active monster still take damage (benefit of the doubt
   extends to monster health), or should only a fully matching signal reduce health? This
   affects whether guided-timer-mode children can ever defeat a monster.

4. **Seconds per zone in guided-timer mode:** Should guided-timer-mode sessions record the
   full 30 s per zone (benefit of the doubt — child gets credit), or zero (cannot confirm
   brushing)? This affects the "zone most often missed" stat.

5. **Morning + night — minimum requirement:** Does the rare-monster rule need exactly one
   morning and one night session, or at least one of each? What if the child brushes three
   or more times in a day?

6. **Monster count:** Should the Monster Book contain 10 or 12 designs? How many should
   be classified as "rare"?
