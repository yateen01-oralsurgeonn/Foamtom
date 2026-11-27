# Spec: core-brushing-loop — Requirements

## Introduction

This spec defines the core brushing loop for **Foamtom: The Haunted Mirror**: the pure
game logic that drives a 2-minute session, the guided-timer fallback when no camera is
available, a plain session screen, a runnable app, and the property-based tests that guard the
logic.

The game logic lives entirely in `/src/logic/` and is **pure** — no DOM, no camera, no
network access. The only thing that crosses the boundary from the outside world is a
per-second brushing signal, or `null` when the tracker cannot see the child (in guided-timer mode every signal is `null`). This separation lets
every rule below be property-tested with fast-check without a browser or camera.

### In scope

1. **Pure game logic:** a 2-minute session of 4 zones × 30 s, active-zone tracking,
   monster health that drops only while the active zone is brushed, session result,
   and Monster Book unlock rules (rare monsters need a morning AND a night session on
   the same day).
2. **Guided-timer mode** (no camera) running the full session with identical logic.
3. **A plain session screen:** a start button, one monster drawn over the active zone,
   a countdown, the zone name spoken and captioned, and an end card. No camera preview in
   this spec.
4. **Property-based tests** (fast-check) for every property listed in `tech.md`.
5. **A runnable app:** an entry page, one game loop, and a first
   deployment to GitHub Pages, so that a timer-only game can be played from a link.

### Out of scope (handled by other specs or later work)

- Real hand tracking, the camera preview, and model-file loading: the `hand-tracking`
  spec.
- Haunted-mirror art, the title screen, and the Monster Book screen: the
  `mirror-and-screens` spec.
- The parent screen (adult gate, facts, disclosure, 'Clear all data'): the
  `parent-screen` spec.

### Steering references

All requirements below comply with the steering files in `.kiro/steering/`. Kid-safety
and privacy rules override any other requirement; if a feature cannot meet them, the
feature is dropped.

---

## Requirements

### 1. Pure game logic architecture

**As a developer, I want all game logic to live in pure modules with no DOM or camera
access, so that every rule can be property-tested without a browser.**

1.1 THE SYSTEM SHALL keep zone timing, scoring, monster state, Monster Book unlocks, and
session-result logic in modules under `/src/logic/` that have no DOM or camera access.

1.2 THE SYSTEM SHALL accept only the per-second brushing signal (defined in requirement 5)
or `null` as input to game logic; nothing else from the camera or DOM shall cross
into game logic.

1.3 THE SYSTEM SHALL make guided-timer mode use the same game-logic modules as camera
mode, with every signal treated as `null` (requirement 5.2).

---

### 2. Session timing and duration

**As a child, I want the game to take exactly two minutes and tell me when each part is
done, so that I brush my whole mouth and know when I can stop.**

2.1 WHEN a brushing session starts THE SYSTEM SHALL run exactly four zones of 30 seconds
each, for a total of 120 seconds.

2.2 WHILE a zone is active THE SYSTEM SHALL count down from 30 seconds to zero before
advancing to the next zone.

2.3 WHEN the fourth zone reaches zero THE SYSTEM SHALL end the session.

2.4 THE SYSTEM SHALL NOT extend or shorten the session: it is always exactly 120
seconds of active (tab visible) session time, regardless of the brushing signal.

2.5 IF the child stops brushing or brushes the wrong zone THE SYSTEM SHALL still advance
the zone timer to zero and move on; the timer shall never pause or stall.

2.6 WHEN the browser tab becomes hidden THE SYSTEM SHALL pause the session; WHEN the
tab becomes visible again THE SYSTEM SHALL resume it from the same second. A pause is
not 'the child not brushing' (requirement 2.5 still holds while visible).

2.7 IF the tab stays hidden for more than 60 seconds THE SYSTEM SHALL drop the session
without saving it and SHALL return to the start screen.

---

### 3. Zone definition and order

**As a parent, I want the game to guide my child through every part of the mouth in a
dentist-approved order, so that no area is skipped.**

3.1 THE SYSTEM SHALL define four zones: **upper left**, **upper right**, **lower left**,
and **lower right**.

3.2 THE SYSTEM SHALL order zones as: upper right → upper left → lower left → lower
right.

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

5.1 THE SYSTEM SHALL accept one brushing signal per second with exactly this shape:

```
{ handNearMouth: boolean, side: 'left' | 'right' | 'unknown', level: 'upper' | 'lower' | 'unknown', moving: boolean }
```

5.2 THE SYSTEM SHALL treat a signal of `null` as "the tracker cannot see the child"
(too dark, no face in view, child out of the frame, or tracker not ready). In
guided-timer mode THE SYSTEM SHALL treat every signal as `null`.

5.3 THE SYSTEM SHALL NOT pass any other camera or tracking data into game logic; the
signal above is the only bridge between tracking and logic.

5.4 IF `handNearMouth` is true and `moving` is true and, as far as requirement 5.7
requires, `side` matches the active zone's side and `level` matches the active zone's
level THE SYSTEM SHALL treat the active zone as being brushed.

5.5 IF `handNearMouth` is false, or `moving` is false, or, as far as requirement 5.7
requires, `side` does not match the active zone's side or `level` does not match the
active zone's level THE SYSTEM SHALL treat the active zone as not being brushed.

5.6 A signal that is present with `handNearMouth` false SHALL mean: the face is seen and
the hand is not at the mouth. A signal with `side` or `level` equal to `unknown` SHALL
mean: the hand is at the mouth but that side or level is unclear.

5.7 THE SYSTEM SHALL hold one constant, `REQUIRE_LEVEL_MATCH`, default `true`. WHEN it is
`false` THE SYSTEM SHALL ignore `level` in 5.4 and 5.5 (side-only checking). It is set to
`false` only by Dr. Yatin's decision if the hand-tracking test shows that upper and lower
cannot be told apart. `REQUIRE_LEVEL_MATCH` is now `false`, by Dr. Yatin's decision of
21 Nov 2026 (the level check failed: the palm hangs below the mouth for the chewing
surface of the upper teeth).
THE SYSTEM SHALL also hold a second constant, `REQUIRE_SIDE_MATCH`, set to `false` by
Dr. Yatin's decision of 21 Nov 2026 (the side check failed for brushing across the face).
WHEN it is `false` THE SYSTEM SHALL ignore `side` in 5.4 and 5.5.
With both constants `false`, a present signal counts as brushing when `handNearMouth` and
`moving` are both true; the game guides which zone, and the camera checks only that the
child is brushing at the mouth.

---

### 6. Benefit of the doubt

**As a parent, I want the game to give my child credit when tracking is uncertain, so that
a bad camera angle does not punish them.**

6.1 IF the signal is `null` or any field is `unknown` THE SYSTEM SHALL continue
running the active zone timer; the timer SHALL NOT pause or stall.

6.2 THE SYSTEM SHALL NOT nag, prompt, or interrupt the child when tracking is uncertain
or the signal is `null`.

6.3 IF the signal is present and does not fully match the active zone (per 5.4),
including when a field that requirement 5.7 requires is `unknown`, THE SYSTEM SHALL NOT reduce the active monster's
health. IF the signal is `null`, in either mode, THE SYSTEM SHALL count that second as
an untracked second for the zone. In a camera-mode session THE SYSTEM SHALL also reduce
the active monster's health by the untracked drain (requirement 7.7). In guided-timer
mode THE SYSTEM SHALL instead reduce it by `TIMER_ONLY_DAMAGE` (requirement 8.5).

---

### 7. Monster health

**As a child, I want the monster on the part I'm brushing to shrink when I brush the
right spot, so that brushing feels like defeating it.**

7.1 THE SYSTEM SHALL assign each zone a monster with a fixed maximum health.

7.2 WHILE the active zone is being brushed (signal matches per 5.4) THE SYSTEM SHALL
reduce the active monster's health by `DAMAGE_PER_SECOND` (4) per second, so that a
camera-mode monster at normal health (60) is defeated after 15 counted brushing seconds
out of the zone's 30 (changed 21 Nov 2026 by Dr. Yatin: it was 3 per second and 20
counted seconds). A monster that starts below normal health (kind proximity, requirement
14) is defeated sooner.

7.3 WHILE the active zone is not being brushed THE SYSTEM SHALL NOT reduce the active
monster's health (signal present and not matching per 5.4).

7.4 WHEN a monster's health reaches zero THE SYSTEM SHALL mark that monster as **defeated**
(it "shrieks and dissolves into smoke").

7.5 IF a zone ends (30 s elapsed) with its monster still alive THE SYSTEM SHALL mark that
monster as **trapped** (not defeated).

7.6 Every monster SHALL live in one table (`src/logic/monsters.ts`) with the fields: id,
name, rarity, and unlock rule.

7.7 WHILE the signal is `null` in a camera-mode session (the tracker cannot see the
child) THE SYSTEM SHALL reduce the active monster's health by 2 per second (the untracked
drain), so that a normal-strength monster reaches zero after 30 seconds of untracked time.
Health SHALL never increase. (Guided-timer mode is covered by requirement 8.5.)

7.8 WHEN a monster is defeated before its zone's 30 seconds end THE SYSTEM SHALL keep
that monster's smoke over the zone until the zone ends, and SHALL speak and caption,
once, the line 'Keep brushing! Brush the smoke away!'. WHILE the smoke is shown, each
brushed second and each untracked second SHALL thin the smoke. The smoke SHALL carry no
win or lose: no outcome, reward, stored value or message SHALL depend on how much smoke
is left, and the zone SHALL still end at 30 seconds. In guided-timer mode every second
SHALL thin the smoke (requirement 8.5), because every second is a timer second.

---

### 8. Guided-timer mode

**As a child whose phone has no working camera, I want the game to still take me through
all four zones, so that I still get a full brush.**

8.1 IF camera permission is refused, or the camera is unavailable, or the camera is not
ready within 15 seconds of the start tap, THE SYSTEM SHALL run the session in guided-timer
mode. The mode SHALL be fixed for the whole session. Poor tracking during a camera-mode
session SHALL be handled second by second (requirements 6.3 and 9.3), not by changing
mode.

8.2 WHILE in guided-timer mode THE SYSTEM SHALL run the full 120-second session using the
same game-logic modules as camera mode.

8.3 WHILE in guided-timer mode THE SYSTEM SHALL NOT request camera access again or display
any prompt or nag for camera permission.

8.4 THE SYSTEM SHALL make guided-timer mode fully functional — every zone, every
announcement, every Monster Book unlock rule works identically to camera mode.

8.5 WHILE in guided-timer mode every monster SHALL start at normal health (kind proximity
is not applied) and SHALL lose `TIMER_ONLY_DAMAGE` (3) health per second, so that it is
defeated after 20 seconds of its zone. Its smoke SHALL then show for the last 10 seconds
of the zone, with the line of requirement 7.8 ('Keep brushing! Brush the smoke away!').
This rule changed on 21 Nov 2026 by Dr. Yatin's decision (it was 2 per second and
defeat at 30 seconds), so that the smoke can be seen in a guided-timer session. It is a
rule change, not a weakening of a test.

8.6 THE SYSTEM SHALL hold a constant `TIMER_ONLY_DAMAGE` with its own value, 3, as the
health lost per second in guided-timer mode (requirement 8.5). Since 21 Nov 2026 it is no
longer equal to `DAMAGE_PER_SECOND` (4, requirement 7.2) and SHALL NOT be defined as
`DAMAGE_PER_SECOND`, so that the two rules can be read and tested apart and a change to
one cannot move the other.

8.7 WHILE the camera is starting after the start tap, and it is not ready after 1 second,
THE SYSTEM SHALL show the caption 'Getting the mirror ready...' and speak the same words
once. The line SHALL disappear when the session starts, in either mode. (Added 27 Nov 2026
with the 15-second limit of requirement 8.1; see "Decision (2026-11-27)" below. The number
8.7 is used because 8.5 and 8.6 are taken.) The line is the `waiting` line of
`src/audio/lines.ts`. It SHALL NOT appear when the camera is refused or ready within 1
second, and SHALL be shown at most once per start tap.

---

### 9. Session result and storage

**As a parent, I want the game to remember how long and where my child brushed, so that I
can see the facts later.**

9.1 WHEN a session ends THE SYSTEM SHALL produce a session result containing: **date**,
**time of day** (morning, night, or neither), **mode** (camera or timer-only), for each
zone: **brushed seconds**, **untracked seconds**, and a **verified** flag, and
**monsters earned**.

9.2 "Brushed seconds" SHALL mean the number of seconds the signal matched that zone (per
5.4). "Untracked seconds" SHALL mean the number of seconds the signal was `null` in that
zone during a camera-mode session. Brushed seconds plus untracked seconds SHALL NOT
exceed 30.

9.3 SESSIONS with mode flag "timer-only" SHALL record 30 brushed seconds and 0 untracked
seconds per zone, with every zone marked **unverified**. SESSIONS with mode flag "camera"
SHALL mark a zone **verified** only when its untracked seconds are 10 or fewer; otherwise
the zone SHALL be marked **unverified**. Unverified zones SHALL NOT be counted in parent
stats or in miss scores.

9.4 THE SYSTEM SHALL store the session result in `localStorage` on the device and SHALL
NOT transmit it over the network.

9.5 THE SYSTEM SHALL store no data other than brushing sessions (date, time of day, mode,
and for each zone: brushed seconds, untracked seconds, verified flag, monster, outcome;
monsters earned).

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
earned for the Monster Book. Every monster met in a session goes into the Monster Book
whether or not it was beaten, so that a tracking mistake can never cost a child a monster.

10.3 THE SYSTEM SHALL add all earned monsters from the session to the Monster Book.

10.4 THE SYSTEM SHALL define exactly 12 monster designs — 8 common and 4 rare — each
with an id, name, rarity, and unlock rule, in one table (`src/logic/monsters.ts`). Common: Plaque Puff, Sugar Sprite,
Gummy Gloop, Fuzzlefang, Crumb Goblin, Sticky Wisp, Molar Mumbler, Tartar Tot. Rare:
Midnight Molar Ghoul, Dawn Drool Dragon, Moonlit Mint Phantom, Twilight Toffee Wraith.

10.5 WHEN a session starts THE SYSTEM SHALL record the time of day as **morning**,
**night**, or **neither** based on the session start time in local time: morning =
04:00–11:59, night = 17:00–23:59, neither = any other time (00:00–03:59 or
12:00–16:59).

10.6 WHEN a session starts, IF the sessions already stored for that calendar day,
together with the session now starting, include at least one morning session AND at
least one night session, THE SYSTEM SHALL treat the session now starting as
rare-eligible.

10.7 IF the session now starting is not rare-eligible THE SYSTEM SHALL NOT place a
rare monster in it.

10.8 SESSIONS recorded as **neither** (outside morning and night hours) SHALL count as
normal sessions (saved, monsters earned) but SHALL NOT count toward the morning+night
requirement for rare-monster eligibility.

10.9 WHEN a session starts THE SYSTEM SHALL choose its four monsters by this fixed
rule. Common monsters the child does not yet own come first, in table order, followed
by common monsters already owned, in table order starting from position
((number of stored sessions × 4) mod 8) and wrapping round, so that a child who owns
them all still sees all eight in turn. IF the session is rare-eligible, exactly one rare
monster (the first rare monster in table order that the child does not yet own, or the
first in table order if all are owned) SHALL take the last zone (lower right) and the
first three zones SHALL take common monsters. The four monsters in a session SHALL all
be different.

10.10 THE SYSTEM SHALL NOT use randomness to choose monsters. The same stored sessions
and the same start time SHALL always give the same four monsters.

---

### 11. Session screen (plain)

**As a child, I want to see myself in the mirror with a monster on the part I need to
brush, so that I know where to brush next.**

> This requirement covers a plain, functional session screen only. Haunted-mirror
> art, CSS frame design, fog, candle flicker, and cracked-glass effects are out of scope
> for this spec.

11.1 (Moved to the `hand-tracking` spec: mirrored live preview
of the front camera.)

11.2 THE SYSTEM SHALL display the session screen without a camera
preview in this spec.

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

11.9 THE SYSTEM SHALL be laid out for portrait, SHALL remain
usable in landscape and in a desktop browser, and SHALL NOT show a 'rotate your
device' block.

11.10 THE SYSTEM SHALL provide touch targets of at least 48 px.

11.11 THE SYSTEM SHALL NOT use colour as the only signal for any information.

11.12 (Moved to the `hand-tracking` spec: 20+ fps with the
camera on, checked by hand on a real phone.)

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

12.8 THE SYSTEM SHALL ship a Content-Security-Policy in the entry page that allows
only same-origin scripts, styles, images, media and connections.

12.9 THE SYSTEM SHALL use Web Speech voices only when the voice is marked as a local
(on-device) voice. IF no local voice exists THE SYSTEM SHALL show the caption without
speech.

---

### 13. Property-based tests

**As a developer, I want fast-check properties that hold for all inputs, so that the game
logic is provably correct.**

The following properties are mandated by `tech.md` and by requirement 14, and SHALL be
implemented as fast-check property-based tests in `/tests/`. Each property SHALL hold for
any arbitrary input sequence.

13.1 **Monster health:** For any sequence of 120 signals, in either mode, and for any
history of past sessions: on every second the active monster's health SHALL change by
exactly −4 (`DAMAGE_PER_SECOND`) when the signal matches the active zone (per 5.4), by exactly −2 when the
signal is `null` in camera mode, by exactly −3 (`TIMER_ONLY_DAMAGE`) on every second of
guided-timer mode, and by 0 otherwise, never going below zero. Only the active zone's
monster SHALL change. Health SHALL always be a whole number and SHALL never increase.

13.2 **Session duration:** For any sequence of signals, in either mode: after each of
seconds 1 to 119 the session SHALL still be running and its active zone SHALL be zone
number floor(seconds done ÷ 30) in the order of requirement 3.2; after second 120 the
session SHALL have ended; a further second SHALL change nothing. The recorded duration
SHALL be the count of seconds actually processed, and SHALL equal 120 for every
completed session. Seconds offered while the session is paused SHALL NOT be counted.

13.3 **Rare monster unlock:** For any set of stored sessions for a calendar day and
any time of day for the session now starting, the new session SHALL be rare-eligible
only when the stored sessions together with the new one include at least one morning
session (start 04:00–11:59 local) AND at least one night session (start 17:00–23:59
local). Sessions classified as neither SHALL NOT contribute. A session that is not
rare-eligible SHALL contain no rare monster. A rare-eligible session SHALL contain
exactly one rare monster, on the last zone.

13.4 **Stats ceiling:** The total verified brushing time computed from stored sessions
SHALL never exceed 30 seconds per zone or 120 seconds per session. Timer-only
sessions and unverified zones SHALL NOT be counted as verified brushing in parent stats or
in "zone most often missed". Verified time counts `secondsBrushed` only, and 'zone most
often missed' is taken over all stored camera-mode sessions. (This
tests the stats computation logic in `/src/logic/`, not the parent screen UI, which is out
of scope.)

13.5 **Storage round-trip:** For any set of sessions (including mode flag and
verified/unverified seconds-per-zone flags), saving to `localStorage` then loading SHALL
return an identical set of sessions.

13.6 **Kind-proximity starting health:** For any history of past sessions, each zone
monster's starting health SHALL never exceed normal health and SHALL never fall below the
floor (60% of normal health). Starting health SHALL always be a whole number. In
guided-timer mode it SHALL always equal normal health.

13.7 **Kind-proximity session duration:** Property 13.2 SHALL hold for any history of
past sessions. Kind proximity SHALL NOT change the duration, the zone order, or the
time-of-day classification.

13.8 **Kind-proximity "so close" rescue:** For any zone, a monster with 15% of normal
health or less remaining when its 30 s end SHALL always be marked fled (counted as
beaten). A monster
above 15% of normal health at zone end SHALL be trapped (not defeated).

13.9 **Kind-proximity miss-score source:** For any history of sessions, miss scores
SHALL depend only on the verified zones of the 7 most recent camera-mode sessions.
Adding, removing or changing timer-only sessions, unverified zones, or camera-mode
sessions older than those 7 SHALL NOT change any miss score.

13.10 **Privacy guard:** A test SHALL read every file under `/src/` and fail if it
finds any of: `fetch(`, `XMLHttpRequest`, `sendBeacon`, `WebSocket`, `EventSource`,
`toDataURL`, `toBlob`, `MediaRecorder`, `captureStream`, `document.cookie`,
`Math.random` inside `/src/logic/`, or any string starting `http://` or `https://` (the one
exception is the SVG namespace `http://www.w3.org/2000/svg`). The same test SHALL fail if any file under `/src/logic/` imports from `/src/ui/`,
`/src/tracking/`, `/src/storage/` or `/src/audio/`.

13.11 **Wording guard:** A test SHALL check every line in `src/audio/lines.ts`: each
has a non-empty caption; none contains a word from a banned list (prevent, cure,
cavity-free, guarantee, diagnose, clinic, doctor, almost, lost, lose, failed, missed);
none mentions the camera or the light.

13.12 **Game loop:** With a fake clock, for any pattern of late or bunched timer
callbacks, 120 seconds of visible time SHALL produce exactly 120 ticks; hidden time
SHALL produce none; more than 60 seconds hidden SHALL drop the session.

---

### 14. Kind proximity

**As a child who keeps missing a spot, I want that spot's monster to be easier to beat, so
that I win there and learn to brush it.**

"Kind proximity" is Dr. Yatin's adaptation of the "pass proximity" mechanic from
match-three games, with every manipulative part removed. It makes a zone's monster easier
on spots the child often misses, so the child can win there and build the habit of
brushing that area. It never changes the rules of the session, never pressures the child,
and never shows guilt.

14.1 THE SYSTEM SHALL compute a miss score per zone from the child's 7 most recent
camera-mode sessions on the device (fewer if fewer exist), using only zones marked
verified (requirement 9.3). A zone's miss seconds in one session SHALL be 30 minus its
brushed seconds minus its untracked seconds, never below zero. A zone's miss score
SHALL be its total miss seconds divided by (30 × the number of verified results for
that zone), and SHALL be 0 when there are none. Timer-only sessions and unverified
zones SHALL NOT contribute.

14.2 WHEN a camera-mode session starts THE SYSTEM SHALL set each zone monster's
starting health to normal health × (1 − 0.4 × miss score), rounded to the nearest whole
number. Starting health SHALL never fall below 60% of normal health and SHALL never
exceed normal health. In guided-timer mode kind proximity SHALL NOT be applied
(requirement 8.5).

14.3 WHEN a zone's 30 seconds end AND its monster has 15% of normal health or less
remaining, THE SYSTEM SHALL mark that monster as **fled** (it "flees into smoke")
rather than trapped. A fled monster SHALL count as beaten everywhere a defeated monster
does — the "so close" rescue. This refines requirement 7.5 for the kind-proximity
case.

14.4 THE SYSTEM SHALL NOT change session length (still exactly 120 seconds, 4 × 30
seconds), zone order (requirement 3.2), or the morning/night rules (requirement 10.5) as a
result of kind proximity.

14.5 THE SYSTEM SHALL NOT offer extra time, moves, retries, purchases, ads, or anything
to buy. THE SYSTEM SHALL NOT use hidden randomness to manipulate outcomes. THE SYSTEM
SHALL NOT display "you almost lost" or any guilt message.

14.6 THE PARENT SCREEN (defined in the parent-screen spec) SHALL disclose kind
proximity in plain words, using both sentences: 'The game gets easier on spots your
child often misses.' and 'A monster that is nearly beaten when the time is up counts as
beaten.'

14.7 Miss scores SHALL be worked out from the stored sessions each time a session
starts. THE SYSTEM SHALL NOT store miss scores separately. The 'Clear all data' button
clears them because it clears the sessions.

---

### 15. Runnable app

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
sub-path (GitHub Pages), using relative asset paths.

---

## Decisions (2026-11-14)

The following items were confirmed with Dr. Yatin Shinde on 14 November 2026 and are
reflected in the requirements above.

1. **Zone order** confirmed: upper right → upper left → lower left → lower right
   (requirement 3.2).

2. **Morning and night hours:** morning = 04:00–11:59, night = 17:00–23:59; any other
   start time counts as neither (requirement 10.5).

3. **Timer-only monster health:** in guided-timer mode the active monster's health drains
   with the zone timer so it is always defeated by the end of its 30 seconds (requirements
   7.7 and 8.5). *Changed on 21 Nov 2026: see "Decisions (2026-11-21)" below. It is now
   defeated at 20 seconds.*

4. **Timer-only session recording:** timer-only sessions are flagged and their seconds per
   zone are marked unverified, not counted as verified brushing (requirement 9.3).

5. **Rare monster rule:** a day needs at least one morning and at least one night session
   for rare monsters to be eligible (requirement 10.6).

6. **Monster count:** the Monster Book has 12 designs — 8 common and 4 rare (requirement
   10.4).

7. **Kind proximity adopted:** see requirement 14.


## Decisions (2026-11-15)

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
   checking, and parents are told (requirement 5.7).


## Decisions (2026-11-21)

Dr. Yatin Shinde decided this on 21 November 2026, after he played a camera session at the
laptop while brushing (needed for the video).

1. **Timer-only smoke.** In guided-timer mode the monster loses `TIMER_ONLY_DAMAGE` (3) per
   second (written as `DAMAGE_PER_SECOND` (3) until the second decision below), so it is defeated at 20 seconds and its smoke shows for the last 10 seconds, with
   the existing line 'Keep brushing! Brush the smoke away!' (requirements 7.8, 8.5, 8.6).
   Reason: the smoke was never seen in a guided-timer session, because the monster was
   defeated on the last second. A second, camera-mode second with no tracking keeps the
   untracked drain of 2 (requirement 7.7). The old test rule 'defeated exactly at 30
   seconds' is replaced by this one; the tests that pinned it are updated in the same task.


## Decision (2026-11-21, evening): gentle brushing counts, camera monster falls at 15 s

Dr. Yatin Shinde decided this on 21 November 2026, after measuring camera mode on his laptop
(a person read only the debug page's yes/no readout). Brisk brushing counted 85% of seconds.
Gentle brushing as in the game counted 69%, with 13% lost as "near mouth but not moving".
Real game play counted 37-47% of seconds (pauses, repositioning). Camera speed was the same in
the game and the debug page (about 7.5 frames per second), so speed was not the cause. With 20
counted seconds needed out of 30, monsters were rarely defeated and smoke rarely appeared in
camera mode.

1. **`MOVING_MIN_TRAVEL` 0.3 -> 0.2 face widths per second** (hand-tracking spec, requirement
   4.5), so gentle, short strokes (correct technique) count as brushing. Clinical decision by
   Dr. Yatin.
2. **`DAMAGE_PER_SECOND` 3 -> 4** (requirements 7.2, 13.1). A camera-mode monster at normal
   health (60) is defeated after 15 counted brushing seconds out of 30 (it was 20).
3. **`TIMER_ONLY_DAMAGE = 3` as its own value**, no longer `= DAMAGE_PER_SECOND`
   (requirements 8.5, 8.6). Guided-timer mode does not change: defeated at 20 s, smoke for
   the last 10 s.
4. **Unchanged:** untracked drain 2 (requirement 7.7), `H_MAX` 60, kind proximity (floor 36
   = 60% of normal health, requirement 14.2) and the "so close" rescue threshold 9 (15% of
   normal health, requirement 14.3). In seconds of counted brushing at 4 per second: a
   normal monster (60) is defeated at 15 s and flees (rescued) at 13 s (52 damage leaves 8,
   which is 9 or less; 12 s leaves 12, which is trapped). A monster at the floor (36) is
   defeated at 9 s and flees at 7 s (28 damage leaves 8; 6 s leaves 12, which is trapped).
   Untracked seconds still cost 2 each and are not counted brushing.

The tests that pinned the old values are updated in the same task (mirror-and-screens task
48). Changing a test to a rule Dr. Yatin changed is not weakening it.


## Decision (2026-11-27): camera start limit 15 s

Dr. Yatin Shinde decided this on 27 November 2026, option B, after a cold-start test on the live
GitHub Pages site. He measured the time from the start tap until the camera and models were
ready, with an empty cache: about 5 s on a 20 Mbit/s connection, about 10 s on 10 Mbit/s and
about 18 s on 5 Mbit/s (his own phone on mobile data: 4-6 s). Below about 10 Mbit/s the session
fell into guided-timer mode before the camera was ready, because the limit was 8 s.

1. **The limit is 15 seconds** (requirement 8.1; it was 8 seconds). It is `START_TIMEOUT_MS` in
   `src/ui/game-loop.ts`.
2. **Requirement 6.3 of the hand-tracking spec does not change.** Nothing camera-related loads
   before the start tap, so a family that never starts a game downloads nothing.
3. **The child is told what is happening** (requirement 8.7): after 1 second
   (`CAMERA_WAIT_LINE_DELAY_MS`) the caption and voice line 'Getting the mirror ready...' show
   once, and go when the session starts. The line is shown through the same caption and
   speaker paths as every other line. Reason: a wait of up to 15 s with a silent screen looks
   like a broken game to a 5-year-old.
4. **Unchanged:** the order and start of the model downloads, `camera-source.ts`,
   `mediapipe-loader.ts`, `thresholds.ts`, and hand-tracking requirements 6.3 and 10.3 and
   mirror-and-screens requirement 13.6.
