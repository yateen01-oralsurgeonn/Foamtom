# Spec: mirror-and-screens - Requirements

## Introduction

This spec defines how **Foamtom: The Haunted Mirror** looks and sounds: the title screen,
the haunted-mirror frame, the twelve monster drawings and their smoke, the Monster Book
screen, the end card, the soft sounds, and the comfort and access rules that go with them.

The frame is not decoration. Since 21 Nov 2026 the camera checks only that the child is
brushing at the mouth and moving (`REQUIRE_SIDE_MATCH` and `REQUIRE_LEVEL_MATCH` are both
`false`, core requirement 5.7). The game tells the child **which** part of the mouth to
brush, and the frame glow, the monster position and the spoken line are the only ways it
can do so. That is what makes this a Costume Contest entry: the haunting interface helps
the app work.

This spec changes **how things look and sound**. It does not change any game rule, number,
stored value or test of `core-brushing-loop` or `hand-tracking`. The title screen, camera
preview (`src/ui/camera-preview.ts`), monster anchor (`src/ui/monster-anchor.ts`), session
screen (`src/ui/session-screen.ts`) and end card (`src/ui/end-card.ts`) already exist. This
spec restyles and extends them; it does not replace their behaviour or change their tests.

Everything decided by data is a pure function with a test (requirement 15). Everything
drawn comes from plain values: `toView(state)` (core design section 3), the monster's
outcome at zone end, and the stored sessions. Nothing drawn or played reads the camera.

### In scope

1. **Title screen** (requirement 1) and the **parent entry point** on it (requirement 2).
2. **The haunted-mirror frame as guidance** (requirement 3) and its **look**, in both camera
   mode and timer-only mode (requirement 4).
3. **Twelve monster drawings** (requirement 5) and their **states and smoke** (requirement 6).
4. **Monster Book screen** (requirement 7) and its **rare-monster invitation** (requirement 8).
5. **End card** (requirement 9).
6. **Sound** (requirement 10).
7. **Comfort and access** (requirements 11 and 12).
8. **Assets, privacy and the Content-Security-Policy** (requirement 13), **wording**
   (requirement 14) and **tests** (requirement 15).

### Out of scope

- Tracking, the camera, model loading: `hand-tracking`.
- Game rules, health, scoring, zone order, monster choice, Monster Book unlock rules,
  storage: `core-brushing-loop`.
- The parent screen, its adult gate and its contents: `parent-screen`. This spec provides
  only the small entry control on the title screen (requirement 2).
- Any change to an existing spoken line in `src/audio/lines.ts` (approved by Dr. Yatin on
  19 Nov 2026).
- Screenshots, recording, sharing, accounts, ads, purchases, analytics.

### Steering references

All requirements below comply with the steering files in `.kiro/steering/`.
`kid-safety-privacy.md` overrides any other requirement here. The Tone section of
`product.md` is strict: cute-spooky, never scary, no gore, no jump scares, no sudden loud
sounds; a 5-year-old should giggle, not cry; monsters are defeated, not hurt.
`dental-rules.md` belongs to Dr. Yatin and is not changed by this spec. A requirement
marked **[TO CONFIRM]** needs his answer before it is built (see "Open questions").

### Priority for the Kiroween video (due 4 Dec 2026)

Each requirement carries one tag: **needed for the video** or **later**. The build order
puts every "needed for the video" requirement first.

| # | Requirement | Tag |
|---|-------------|-----|
| 1 | Title screen | needed for the video |
| 2 | Parent entry point | later |
| 3 | The frame is the guidance | needed for the video |
| 4 | Haunted-mirror look, in both modes | needed for the video |
| 5 | Monster drawings | needed for the video |
| 6 | Monster states and smoke | needed for the video |
| 7 | Monster Book screen | needed for the video |
| 8 | Rare-monster invitation | later |
| 9 | End card | needed for the video |
| 10 | Sound | needed for the video |
| 11 | Comfort: motion, flashing, targets, colour | needed for the video |
| 12 | Landscape and desktop | later |
| 13 | Original assets, privacy, CSP, no new timers | needed for the video |
| 14 | Wording of new lines | needed for the video |
| 15 | Tests | needed for the video |
| 16 | Looks and sounds only | needed for the video |

---

## Requirements

### 1. Title screen

**Tag: needed for the video.**

**As a child, I want one big button that starts the game, and as a parent, I want to see
at a glance that the camera picture stays on the phone, so that we can start without
reading or signing up.**

1.1 THE SYSTEM SHALL show a title screen with the game name ("Foamtom: The Haunted Mirror"),
exactly one large start button, and the privacy line (1.3).

1.2 THE start button SHALL carry an icon, a short label, the spoken line `start` and its
caption (core requirement 15.1). Its tap SHALL be the one that unlocks sound. THE
existing `start` line SHALL NOT change.

1.3 THE title screen SHALL show the plain line "The camera stays on this phone. Nothing is
saved or sent." as visible text. It is a parent-facing line: it is shown, not spoken, and
it is not an instruction. Because the core wording guard (core requirement 13.11) forbids
the word "camera" in `src/audio/lines.ts`, this line SHALL live in a second table of
display-only text outside `lines.ts` (the design names the file), and the guard of
requirement 14.4 SHALL cover it.

1.4 THE title screen SHALL NOT ask for a sign-up, a name, an age or an email, SHALL NOT show
or trigger an install prompt, and SHALL NOT ask for the camera. The camera is asked for
only after the start tap (core requirement 15.1, hand-tracking requirement 6.3).

1.5 THE title screen SHALL load no camera code, model file or WASM file
(hand-tracking requirement 6.3) and SHALL make no network request.

1.6 THE start button and the privacy line SHALL both be visible without scrolling in a
portrait viewport of 360 x 640 px.

1.7 THE title screen SHALL NOT pressure the child: no countdown, no flashing, no sound
before the start tap, no message about streaks or earlier sessions.

---

### 2. Parent entry point

**Tag: later.**

**As a parent, I want a small way to reach the grown-ups' screen, so that I can find it
without it tempting my child.**

2.1 THE title screen SHALL carry one small, quiet control that opens the parent screen. THE
control SHALL call one handler passed in by `main.ts`. The adult gate and everything behind
it belong to the `parent-screen` spec; this spec SHALL NOT build, mock or bypass them.

2.2 THE control SHALL have a touch target of at least 48 px (requirement 11.4), SHALL NOT
be a second large button, and SHALL be smaller and quieter than the start button, so that a
child is not drawn to it. Its visible mark SHALL be an icon; its label is an accessible
name (the line is in "Lines for Dr. Yatin to approve").

2.3 THE control SHALL NOT be shown on the session screen or the end card.

---

### 3. The frame is the guidance

**Tag: needed for the video.**

**As a child who cannot read well, I want the mirror itself to show me where to brush, so
that I know which part of my mouth is next without anyone telling me.**

3.1 THE SYSTEM SHALL treat the haunted-mirror frame, the monster position and the spoken
line as the way the child learns which zone to brush. The camera does not check the side or
the level (core requirement 5.7; `dental-rules.md`), so the frame SHALL NOT be designed as
decoration that the game can do without.

3.2 THE frame SHALL have four regions, one per zone, at the four corners of the play area,
described in screen terms with the child's own left on the left of the screen (the same
layout as the session screen's four-zone grid and the mirrored preview, hand-tracking
requirement 8.2): upper left is the top-left corner, upper right the top-right, lower left
the bottom-left, lower right the bottom-right.

3.3 THE mapping from zone to frame region SHALL be one pure function, `frameGuidance`, with
a table of four rows. It SHALL NOT swap, negate or invert left and right (hand-tracking
requirement 2.2: `src/tracking/side.ts` holds the only swap). The frame SHALL NOT be drawn
inside the mirrored (`scaleX(-1)`) element, so that its art is not flipped
(hand-tracking requirement 9.1).

3.4 WHILE a zone is active THE SYSTEM SHALL make the frame region nearest that zone glow
brighter and flicker more than the other three regions. "Flicker more" means a larger and
more irregular change in brightness; it SHALL NOT mean a faster one (requirement 11.2).

3.5 THE guidance SHALL NOT rely on colour alone (core requirement 11.11). The active region
SHALL differ from the others in at least three ways that do not depend on hue: brightness,
size of the glow, and a lit-candle ornament (or an equally clear shape) that is shown at the
active region only.

3.6 WHEN a zone becomes active THE SYSTEM SHALL move the glow to the new region at the same
moment the zone's line is spoken and captioned and the zone's monster appears, so that the
three agree.

3.7 WHILE a zone is active, including after its monster is defeated and its smoke is
showing (core requirement 7.8), THE glow SHALL stay on that zone's region until the zone
ends. The child is still meant to brush that zone.

3.8 THE glow SHALL depend only on the active zone and the session phase (from `toView`). It
SHALL NOT change with whether the child is brushing, whether the tracker sees the child,
or the mode. This keeps core requirement 6.2 (no nagging when tracking is uncertain).

3.9 WHEN the session phase is `paused`, THE region SHALL stay lit and the flicker SHALL
stop. WHEN no session is running (title screen, end card, Monster Book), no region SHALL
glow.

3.10 THE frame SHALL surround the play area and SHALL NOT cover the live preview, the
monster's position, the countdown or the caption.

---

### 4. Haunted-mirror look, in both modes

**Tag: needed for the video.**

**As a child, I want to feel I am brushing in front of a cute haunted mirror, so that
brushing is fun.**

4.1 THE SYSTEM SHALL draw a cursed-mirror frame with these effects, in CSS or on a canvas:
candle flicker, drifting fog, and cracked glass.

4.2 THE look SHALL be cute-spooky and never scary: no blood, no gore, no realistic damage,
no dark flash, no screen shake, no faces or figures in the fog. The cracks are a drawn
pattern on the glass and SHALL NOT look like a broken screen.

4.3 WHILE a camera-mode session is active THE frame SHALL surround the live, mirrored
camera preview (hand-tracking requirement 8.1).

4.4 WHILE a timer-only session is active THE frame SHALL surround the plain four-zone grid
of the session screen, with no camera preview (hand-tracking requirement 8.6). The same
frame component and the same `frameGuidance` function SHALL be used in both modes.

4.5 THE fog and cracks SHALL stay behind the caption and the countdown, and SHALL NOT lower
the legibility of either (requirement 11.7). Fog SHALL NOT hide the face in the preview or
the monster.

4.6 NO effect SHALL appear suddenly. Each effect SHALL fade in when a screen opens.

4.7 THE effects SHALL NOT take a camera-mode session below 20 frames per second on a
mid-range 2022 Android phone in Chrome (`tech.md`; hand-tracking requirement 10.4). THE
check SHALL be repeated by hand with the effects on, and the result recorded in
`docs/review/TRACKING-TEST-RESULTS.md` (words only).

---

### 5. Monster drawings

**Tag: needed for the video.**

**As a child, I want each monster to look friendly and different, so that I like meeting
them and can tell them apart.**

5.1 THE SYSTEM SHALL provide one drawing for each of the 12 monsters in the table
`src/logic/monsters.ts`, by id: Plaque Puff, Sugar Sprite, Gummy Gloop, Fuzzlefang, Crumb
Goblin, Sticky Wisp, Molar Mumbler, Tartar Tot, Midnight Molar Ghoul, Dawn Drool Dragon,
Moonlit Mint Phantom, Twilight Toffee Wraith. Variations of a few base shapes are allowed.

5.2 THE designs SHALL differ from each other in at least one feature of shape (for example
ears, horns, tail, number of eyes), not in colour alone.

5.3 EVERY monster SHALL be cute-spooky: big friendly eyes, a mischievous or silly face, no
blood, no wounds, no dripping, no realistic teeth, no sharp or large teeth, no bulging or
angry eyes.

5.4 RARE monsters SHALL be marked by a star (as the existing drawing does) and by a
different silhouette detail, not by colour alone.

5.5 EVERY drawing SHALL be made in code or as original assets made for this project
(requirement 13.1), and SHALL read clearly at the size of a Monster Book cell and at the
size used on the cheek.

5.6 THE drawing function SHALL keep the signature `drawMonster(def: MonsterDef): HTMLElement`
and the accessible name (the monster's name) it has now, so that the session screen, the
end card and their tests keep working.

---

### 6. Monster states and smoke

**Tag: needed for the video.**

**As a child, I want to see the monster shrink as I brush and puff into smoke when I win,
so that brushing feels like a game.**

6.1 THE SYSTEM SHALL decide which drawing state a monster is in by one pure function,
`monsterDrawState`, whose inputs are the `View` from `toView` and, at the end of a zone,
the monster's outcome. The design SHALL get the outcome to the function without changing
`toView`, its output type or its tests.

6.2 THE states SHALL be:

- **sitting:** pending and at full health (`healthFraction` is 1), on the zone;
- **shrinking:** pending, `healthFraction` above 0 and below 1; the monster is drawn smaller
  as `healthFraction` falls, and never smaller than a floor above zero, so that it does not
  vanish before it is defeated (as the session screen does now);
- **defeated:** `healthFraction` is 0 and `smokeFraction` is above 0; the monster has
  dissolved into smoke and the smoke is showing;
- **gone:** `healthFraction` is 0 and `smokeFraction` is 0;
- **fled:** the zone has ended and the monster's outcome is `fled`; it slips away as smoke;
- **trapped:** the zone has ended and the monster's outcome is `trapped`; it is caught by
  the mirror.

6.3 WHEN a zone ends THE monster of that zone SHALL be shown once, briefly, in the state
for its outcome (defeated: dissolves into smoke; fled: slips away as smoke; trapped: caught
by the mirror), and the next zone's monster SHALL appear at once. This animation SHALL NOT
delay, pause or shorten the timer or the next zone (core requirement 2.5).

6.4 THE trapped state SHALL be friendly: the monster waves, or sleeps, inside the glass. It
SHALL NOT look sad, hurt or punished, and nothing SHALL say or show that the child failed.
A trapped monster still goes into the Monster Book (core requirement 10.2).

6.5 WHILE smoke is showing THE smoke SHALL thin as `smokeFraction` falls (core requirement
7.8). The thinning SHALL be visible in the number or size of the puffs as well as in their
opacity, so that it does not depend on seeing faint contrast.

6.6 THE smoke SHALL carry no win or lose: no text, score, colour change or sound that
depends on how much smoke is left (core requirement 7.8).

6.7 EVERY `View` SHALL map to exactly one state, and the same `View` SHALL always give the
same state. `monsterDrawState` SHALL have no DOM, no clock and no randomness.

6.8 THE sound that goes with a monster leaving is covered by requirement 10. The picture
SHALL be complete without the sound.

---

### 7. Monster Book screen

**Tag: needed for the video.**

**As a child, I want to see the monsters I have met and hear their names, so that I want to
meet the rest.**

7.1 THE SYSTEM SHALL provide a Monster Book screen with a grid of the 12 monsters, in the
order of the table `src/logic/monsters.ts` (8 common, then 4 rare).

7.2 THE Monster Book SHALL show a monster as **owned** when its id is in the union of
`monstersEarned` over the stored sessions (`computeMonsterBook`, core requirement 10.3).
No other rule SHALL decide it.

7.3 AN owned monster SHALL be shown with its drawing and its name as visible text.

7.4 WHEN the child taps an owned monster THE SYSTEM SHALL speak its name and show the same
words as a caption. A new tap SHALL replace the name being said and SHALL NOT queue behind
it. Where the name lives, and how it passes the wording guard, is an open question
(Open question 3).

7.5 A monster that is not owned SHALL be shown as a friendly silhouette with no name. The
silhouette SHALL NOT show or speak the monster's name, and SHALL NOT use a padlock, a cross,
a grey "lost" look, a number, or a countdown. Rare silhouettes SHALL still carry the rare
star (requirement 5.4).

7.6 THE Monster Book SHALL read the stored sessions each time it opens, through the
existing storage module, and SHALL store nothing new (core requirement 9.5). IF the
sessions cannot be read, THE Book SHALL show every monster as a silhouette and SHALL show no
message.

7.7 THE screen SHALL have one button that goes back, with an icon, a label and an
accessible name, and a touch target of at least 48 px. It SHALL go back to the screen the
Book was opened from.

7.8 THE Book SHALL be opened from the end card (requirement 9.3). **[TO CONFIRM]** whether
it can also be opened from the title screen (Open question 1). Until he answers, the title
screen SHALL NOT carry a Book button, so that it keeps one large button (requirement 1.1).

7.9 THE tap that opens the Book SHALL unlock sound if it is not unlocked yet, so that names
are spoken whichever screen the child came from.

7.10 THE Book SHALL NOT start the camera, SHALL NOT make a network request, and SHALL NOT
show the frame glow (requirement 3.9).

---

### 8. Rare-monster invitation

**Tag: later.**

**As a child, I want to know the rare monsters exist and how to meet them, without being
told off, so that I have something to look forward to.**

8.1 THE four rare monsters that are not owned SHALL show one invitation, with the words
"Brush morning AND night.", as a caption and spoken when a rare silhouette is tapped. **[TO
CONFIRM]** whether it is one line for the whole rare group or one on each rare silhouette
(Open question 4).

8.2 THE invitation SHALL be an invitation only: no countdown, no "you missed it", no
streak, no count of days, no word about what was or was not brushed today, nothing lost.

8.3 THE invitation SHALL be the same whatever the stored sessions say about today. WHEN all
four rare monsters are owned, THE invitation SHALL NOT be shown.

8.4 THE invitation SHALL NOT change the unlock rule, which belongs to core requirement
10.6. It SHALL NOT claim anything that the rule does not do.

---

### 9. End card

**Tag: needed for the video.**

**As a child, I want to see my monsters go into the Book and hear a kind goodbye, so that I
feel proud and can stop.**

9.1 WHEN a session ends THE end card SHALL show the four monsters of that session going
into the Monster Book, one drawing each, including trapped and fled ones (core requirement
10.2). The drawings SHALL use `drawMonster` (requirement 5.6).

9.2 THE end card SHALL speak and caption the closing line "Two minutes. Every corner.". It
is a new line and is listed in "Lines for Dr. Yatin to approve". The existing `end` line is
not changed (Open question 2 asks whether the new line replaces it or follows it).

9.3 THE end card SHALL have two buttons: one to the Monster Book and one back to the
title screen. Each SHALL have an icon, a label and an accessible name, and a touch target
of at least 48 px, and both SHALL be visible without scrolling in a portrait viewport of
360 x 640 px.

9.4 THE end card SHALL NOT urge the child to play again: no "again", no "next", no
"tomorrow", no "come back", no streak, no score, no reward count, no timer, and no button
whose purpose is to start another session.

9.5 THE end card SHALL appear only after the session ends (core requirement 15.5). The
camera is already stopped by then (core requirement 11.6).

---

### 10. Sound

**Tag: needed for the video.**

**As a child, I want soft, friendly sounds, so that I giggle and never jump.**

10.1 THE SYSTEM SHALL use only sounds made in the browser (synthesised with Web Audio) or
original recordings made for this project. It SHALL NOT use copyrighted music or sounds
from a third party. Each shipped audio file SHALL be listed with its source in a notice
file, as the models are.

10.2 EVERY sound SHALL start from silence and rise gently. No sound SHALL rise faster than
`GAIN_STEP_PER_MS` or exceed `GAIN_LEVEL` (`src/audio/speaker.ts`; core requirement 4.4),
and no sound SHALL be a sudden loud sound or a sharp attack.

10.3 THE effect sounds SHALL be quieter than the voice, so that spoken words stay clear.

10.4 THE SYSTEM SHALL have a soft sound for: a monster defeated (a small squeak or poof,
silly rather than frightening, never a scream), a monster that flees, a monster trapped by
the mirror, a new zone, and the end card. No sound SHALL depend on the child's brushing
speed or on the signal.

10.5 EVERY sound SHALL be described as plain data (its envelope and pitch), so that its
loudness and rise can be tested without a speaker (requirement 15).

10.6 NO sound SHALL be the only signal for anything (core requirement 11.11). Every event
that has a sound SHALL also show a change on screen (requirement 6).

10.7 THE title screen SHALL be silent until the start tap (core requirement 15.1). WHEN the
session is paused, dropped or ends, THE SYSTEM SHALL stop all sounds, as it already stops
speech.

10.8 IF audio is not available or fails, THE game SHALL carry on silently, with every
caption shown.

10.9 EVERY spoken line SHALL have a caption and live in `src/audio/lines.ts` (core
requirement 4.5), except the one case in Open question 3.

10.10 THIS spec SHALL NOT add background music.

---

### 11. Comfort: motion, flashing, targets, colour

**Tag: needed for the video.**

**As a child and as a parent, I want nothing to startle or hurt, so that the game is safe
to use every day.**

11.1 THE SYSTEM SHALL have no jump scares: nothing appears suddenly at full size, full
brightness or full volume. Monsters, smoke, fog and sounds ease in.

11.2 NO element SHALL flash faster than three times a second. Every looping effect (candle
flicker, glow, fog, smoke) SHALL have a cycle time of at least 334 ms, including the
stronger flicker at the active region (requirement 3.4). THE cycle times SHALL be listed
in one table, so that a test can read them (requirement 15.5). The flicker SHALL be a small
change in brightness, never a switch between light and dark.

11.3 WHEN the device asks for reduced motion (`prefers-reduced-motion: reduce`) THE SYSTEM
SHALL turn off the candle flicker, the fog drift, the smoke drift, the monster leaving
animations and the end-card "going into the Book" movement. THE game SHALL still show every
state: the active region stays lit with its ornament (requirement 3.5), the monster still
changes size with its health, and the smoke still thins. A state change MAY use a plain fade
or no transition. WHEN the preference changes while the game is open, THE SYSTEM SHALL
follow it. The choice SHALL be one pure function, `effectsFor(prefersReducedMotion)`.

11.4 EVERY tappable thing SHALL have a touch target of at least 48 px (core requirement
11.10): the start button, the parent control, each Book cell, the Book's back button and the
end-card buttons.

11.5 THE game SHALL NOT use colour as the only signal (core requirement 11.11): the active
zone (requirement 3.5), rare monsters (requirement 5.4), owned or not owned (a drawing and a
name against a silhouette), and the smoke (requirement 6.5).

11.6 THE game SHALL work in portrait, one-handed, on a phone propped by a mirror.

11.7 CAPTIONS SHALL keep a contrast ratio of at least 4.5 to 1 against what is behind them,
over the fog and the frame.

11.8 THE frame, fog and cracks SHALL be hidden from screen readers (decorative). The
caption of the active zone is what a screen reader reads.

---

### 12. Landscape and desktop

**Tag: later.**

**As a parent holding the phone sideways, or a judge on a laptop, I want the game to work
without fuss, so that I can see it all.**

12.1 THE game SHALL remain usable in landscape and in a desktop browser, with no "rotate
your device" block (core requirement 11.9). The frame SHALL scale with the play area and
SHALL NOT clip the preview, caption, countdown or buttons.

12.2 THE Monster Book grid SHALL reflow to the width and SHALL scroll if it does not fit.

12.3 ON a desktop browser every button SHALL work with the mouse and the keyboard, with a
visible focus mark.

---

### 13. Original assets, privacy, CSP, no new timers

**Tag: needed for the video.**

**As a parent, I want to know the game loads nothing from elsewhere and watches nothing, so
that I can trust it.**

13.1 ALL drawings, the frame and the sounds SHALL be made in code or as original assets
made for this project, under the MIT licence of the project. THE game SHALL NOT use
third-party characters, trademarks, icon packs, web fonts or images, and SHALL NOT load any
of them from another host.

13.2 THE new styling SHALL work under the existing Content-Security-Policy of `index.html`,
which allows same-origin only and no `'unsafe-inline'`: styles come from the stylesheet or
from `element.style`, and any SVG is built with the SVG namespace (the one exception of core
requirement 13.10). THE CSP test of hand-tracking SHALL keep passing unchanged.

13.3 THE frame, fog, flicker, smoke and end-card movement SHALL use CSS animation and
transition, or a canvas drawn with `requestAnimationFrame`. NO file added by this spec SHALL
call `setInterval` or `setTimeout`. `src/ui/game-loop.ts` stays the only module that owns a
timer (`tech.md`). Looping effects SHALL stop while the tab is hidden.

13.4 NOTHING drawn or played SHALL read a camera frame, a landmark or a `DrawValue`, except
the existing monster placement of `camera-preview.ts` and `monster-anchor.ts` (hand-tracking
requirement 8). THE frame glow, monster states and Book SHALL be driven only by `toView`,
the monster's outcome and the stored sessions.

13.5 THIS spec SHALL NOT add any network call, storage key, cookie or log. THE privacy guard
(core requirement 13.10) and the tracking guard (hand-tracking requirement 9.5) SHALL keep
passing and SHALL scan every new file.

13.6 THE first load SHALL stay under 5 MB and the camera code, models and WASM SHALL still
load only after the start tap. The tests `firstLoadUnder5MB` and `cameraCodeIsLazy`
(hand-tracking section 12) SHALL keep passing.

---

### 14. Wording of new lines

**Tag: needed for the video.**

**As Dr. Yatin, I want to approve every new word a child or parent sees or hears, so that
the wording stays within the dental rules.**

14.1 EVERY new child-facing or parent-facing line (spoken, captioned, shown as a label, or
read by a screen reader) SHALL be listed, one per row, in the final section "Lines for Dr.
Yatin to approve", with where it is shown. A new line is not final until he approves it.
WHEN he changes a line, that section and the code SHALL be updated to match.

14.2 THE seven existing lines in `src/audio/lines.ts` (`start`, the four `zone-` lines,
`smoke`, `end`) SHALL NOT change. A test SHALL pin their exact text and caption
(requirement 15.7).

14.3 EVERY new spoken line SHALL have a caption and, with the one exception in Open question
3, SHALL be added to `src/audio/lines.ts`, so that the existing wording guard (core
requirement 13.11) covers it without any change to that test.

14.4 A NEW guard test SHALL check every line of the second table (requirement 1.3) and every
new label against the banned list of core requirement 13.11 (without the rule about the
camera and the light, which this one sentence needs), and SHALL check all new lines against a
second list of words that urge or scare, matched as whole words: again, tomorrow, "come
back", streak, hurry, blood, gore, kill, die, dead, hurt, scream. The core test itself SHALL
NOT be edited.

14.5 NO new line SHALL claim that the game prevents cavities, cures anything, or replaces a
dental visit, or SHALL carry a clinic name, phone number, address or registration number
(`dental-rules.md`). No line SHALL make a medical judgement. No line SHALL say the child
missed, lost or failed anything.

---

### 15. Tests

**Tag: needed for the video.**

**As a developer, I want every decision made by data to be a pure function with a test, so
that the screens can be restyled without breaking the rules.**

15.1 **Frame guidance:** `frameGuidance` SHALL be tested for all four zones and the
non-running phases. Properties: each zone gives exactly one region; the four regions are
different; upper-left is top-left, upper-right top-right, lower-left bottom-left,
lower-right bottom-right (the same layout as the session screen grid); no region for the
`ended` phase or when there is no session; the result does not change when only the mode,
the signal, or the monster's health changes; the zone's region stays the same after its
monster is defeated.

15.2 **Monster drawing state:** `monsterDrawState` SHALL be tested over generated `View`
values and outcomes. Properties: every input gives exactly one state; `healthFraction` 1 is
sitting; between 0 and 1 is shrinking; 0 with `smokeFraction` above 0 is defeated; 0 with
`smokeFraction` 0 is gone; at zone end, `fled` gives fled, `trapped` gives trapped; the
drawn size never rises as `healthFraction` falls; the smoke density never rises as
`smokeFraction` falls; the same input gives the same state.

15.3 **Monster Book view:** a pure function, `monsterBookView(sessions)`, SHALL be tested.
Properties: always 12 entries, in table order; an entry is owned exactly when its id is in
`computeMonsterBook(sessions).unlockedIds`; an entry that is not owned carries no name;
rare entries carry the rare flag whether owned or not; the rare invitation flag is true
exactly for rare entries that are not owned; the result is the same for any order of the
sessions and for any dates and times of day on them, given the same earned monsters; empty
sessions give 12 silhouettes.

15.4 **Reduced motion:** `effectsFor(true)` SHALL turn off every moving effect and leave
the glow region, the ornament, the size change and the smoke thinning on; `effectsFor(false)`
SHALL leave them all on.

15.5 **Flash rate:** a test SHALL read the table of cycle times (requirement 11.2) and fail
if any looping effect has a cycle shorter than 334 ms.

15.6 **Sound:** a test SHALL check every sound's data: it starts at gain 0, never rises
faster than `GAIN_STEP_PER_MS`, never exceeds `GAIN_LEVEL`, and its peak is lower than the
voice level.

15.7 **Wording:** the existing wording guard SHALL keep passing and, because new spoken
lines are added to `lines.ts`, SHALL cover them without change. THE new guard of
requirement 14.4 SHALL pass. A pin test SHALL fail if the text or caption of any of the seven
existing lines changes.

15.8 **No new timers:** a test SHALL fail if any file added by this spec calls `setInterval`
or `setTimeout`, and the privacy guard and tracking guard SHALL keep passing.

15.9 **Screens:** where the existing tests can check the DOM, new tests SHALL check, with a
fake speaker: tapping an owned monster says its name once and replaces any earlier name;
tapping a silhouette never says a monster's name; the end card has no urging text; the title
screen shows the privacy line and one large button.

15.10 **Nothing broken:** every existing test SHALL pass unchanged, in particular
`view.test.ts`, `lines.test.ts`, `camera-preview.test.ts`, `monster-anchor.test.ts`,
`privacy-guard.test.ts`, `tracking-guards.test.ts` and `csp.test.ts`.

---

### 16. Looks and sounds only

**Tag: needed for the video.**

**As Dr. Yatin, I want this spec to change nothing about the rules, so that the dental rules
and the game numbers stay as I set them.**

16.1 THIS spec SHALL NOT change any game rule, constant, number, stored value, storage
schema, or test of `core-brushing-loop` or `hand-tracking`, and SHALL NOT change
`toView`, its output type, `SignalSource`, or the signal.

16.2 THE new pure functions (`frameGuidance`, `monsterDrawState`, `monsterBookView`,
`effectsFor`) SHALL have no DOM, no clock and no randomness. They MAY import from
`src/logic/`. Nothing under `src/logic/` SHALL import from them (`structure.md`).

16.3 THE screens SHALL NOT make their own game decisions. What is drawn comes from the
pure functions above; the screens only paint.

---

## Open questions for Dr. Yatin

These are not settled by the prompt. Each has the default used in the requirements above.

1. **Monster Book from the title screen.** The brief gives the title screen one large
   button, a privacy line and a quiet parent entry. As written, the Book can be reached only
   from the end card, so a child cannot look at it before brushing. Should the title screen
   get a second, smaller Book button? Default: no (requirement 7.8).
2. **Closing line on the end card.** The existing `end` line ("Well done! Two minutes of
   brushing!") cannot be changed. Should "Two minutes. Every corner." replace it on the end
   card, or be said after it? Default: it is the end card's closing line, and `end` stays in
   `lines.ts` unchanged (requirement 9.2).
3. **Where the spoken monster names live.** Rule 4.5 puts every spoken line in `lines.ts`,
   and the wording guard rejects any line containing "light" as plain text. "Twilight Toffee
   Wraith" contains it, so that name cannot be added to `lines.ts` as it stands. The options
   are: (a) change the guard to match whole words (this edits an existing test); (b) say the
   name from the `monsters.ts` table, with a caption, and cover it with the new guard of
   requirement 14.4; (c) leave this one name unspoken. Which one? No default is built until
   he answers; the other eleven names are not affected.
4. **One invitation or four.** "The four rare ones show one invitation": one line for the
   rare group, or the same line on each rare silhouette? Default: one line for the group,
   also spoken when a rare silhouette is tapped (requirement 8.1).
5. **Mute.** There is no mute button in the brief. Parents can turn the phone's volume
   down. Should the game have its own sound off control? Default: no.

Assumption: the smallest phone to support is a 360 x 640 px portrait viewport
(requirements 1.6 and 9.3).

---

## Lines for Dr. Yatin to approve

Every NEW child-facing or parent-facing line of this spec is below, one per row. None is
final until he approves it. The existing seven lines in `src/audio/lines.ts` are not listed
because they are approved (19 Nov 2026) and unchanged. "Spoken" means spoken and captioned.
"Shown" means visible text only. "Name only" means read by a screen reader, not seen.

| # | Proposed text | Kind | Where it is shown |
|---|---------------|------|-------------------|
| 1 | The camera stays on this phone. Nothing is saved or sent. | Shown (not spoken) | Title screen, under the start button. Kept outside `lines.ts` because the wording guard forbids "camera" there (requirement 1.3). |
| 2 | Two minutes. Every corner. | Spoken | End card, as the closing line (requirement 9.2; Open question 2). |
| 3 | Brush morning AND night. | Spoken | Monster Book, for the rare monsters not yet owned (requirement 8.1; Open question 4). |
| 4 | Plaque Puff | Spoken, and shown | Monster Book, owned cell, on tap. |
| 5 | Sugar Sprite | Spoken, and shown | Monster Book, owned cell, on tap. |
| 6 | Gummy Gloop | Spoken, and shown | Monster Book, owned cell, on tap. |
| 7 | Fuzzlefang | Spoken, and shown | Monster Book, owned cell, on tap. |
| 8 | Crumb Goblin | Spoken, and shown | Monster Book, owned cell, on tap. |
| 9 | Sticky Wisp | Spoken, and shown | Monster Book, owned cell, on tap. |
| 10 | Molar Mumbler | Spoken, and shown | Monster Book, owned cell, on tap. |
| 11 | Tartar Tot | Spoken, and shown | Monster Book, owned cell, on tap. |
| 12 | Midnight Molar Ghoul | Spoken, and shown | Monster Book, owned cell, on tap. |
| 13 | Dawn Drool Dragon | Spoken, and shown | Monster Book, owned cell, on tap. |
| 14 | Moonlit Mint Phantom | Spoken, and shown | Monster Book, owned cell, on tap. |
| 15 | Twilight Toffee Wraith | Spoken, and shown | Monster Book, owned cell, on tap. Contains "light": see Open question 3. |
| 16 | Monster Book | Shown | Heading of the Monster Book screen; label of the end-card button that opens it. |
| 17 | Back | Shown | Label of the Monster Book's back button. |
| 18 | Grown-ups | Name only (the control shows an icon) | Title screen, the small parent entry control (requirement 2.2). |
| 19 | Not met yet | Name only | Monster Book, each silhouette. |

The names in rows 4 to 15 are the names already approved on 14 Nov 2026 in the monster
table. They are listed because speaking them is new.
