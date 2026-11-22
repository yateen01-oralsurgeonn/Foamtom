# Spec: parent-screen - Requirements

## Introduction

This spec defines the grown-ups' screen of **Foamtom: The Haunted Mirror**: an adult gate, a
few facts worked out from the brushing sessions stored on the device, one allowed nudge, a
plain disclosure of how the game works, and a "Clear all data" button.

The screen reports facts and nothing else. It never judges the child, never says a part of
the mouth "was missed" as if the camera had seen that side, and never claims that the game
prevents or cures anything. Since 21 Nov 2026 the camera checks only that a hand is near the
mouth and moving (`REQUIRE_SIDE_MATCH` and `REQUIRE_LEVEL_MATCH` are both `false`, core
requirement 5.7). It does not know which side, or upper or lower, is brushed. Every sentence
below is written to stay true under that limit.

Every number and every sentence the screen shows comes from one pure function,
`parentView`, so that it can be property-tested without a browser. The screen only paints
what `parentView` returns.

This spec changes no game rule, number, stored value, storage schema or existing test. It
reads the stored sessions through the existing storage module and the existing functions of
`src/logic/stats.ts`.

### Context added 22 Nov 2026 (it wins over the original prompt where they differ)

1. The camera checks only a moving hand near the mouth. The original disclosure line 2
   ("near one side of the mouth") is replaced by a line that says the camera cannot see the
   brush, the teeth, or which side is brushed (requirement 8.2).
2. The original disclosure line 6 (the `REQUIRE_LEVEL_MATCH` condition) is dropped. It no
   longer applies.
3. The nudge is the sentence reworded by Dr. Yatin on 22 Nov 2026 in `dental-rules.md`, not
   the form "<Zone> was missed <n> nights" (requirement 7).
4. The entry control on the title screen belongs to `mirror-and-screens` (its tasks 36 to 38,
   not built yet). This spec builds the screen behind it and receives its open handler
   (requirement 1).
5. How "3 nights" is counted is not settled. It is an open question, not decided here.

### In scope

1. **Adult gate** (requirement 2).
2. **Facts:** sessions per day for the last 7 days, time played, time the camera saw
   brushing, time guided and not checked by the camera, and the part of the mouth where
   brushing was seen least (requirements 3 to 6).
3. **One allowed nudge** (requirement 7).
4. **Plain disclosure**, always visible on the screen (requirement 8).
5. **Clear all data** (requirement 9).
6. **Wording limits**, **display-only text**, **comfort and access** (requirements 10 to 12).
7. **The pure function `parentView`** and its **tests** (requirements 13 and 14).

### Out of scope

- The title-screen entry control: `mirror-and-screens` (tasks 36 to 38).
- Tracking, the camera, game rules, kind proximity, monster rules, stored values.
- Changing `src/logic/stats.ts`, `src/storage/storage.ts` or any other existing file.
  Where this spec finds a gap in them, it lists it under "Open questions".
- Art beyond a plain, readable layout. No fog, no candle flicker, no monsters, no sound.
- Accounts, passwords, sharing, export, analytics, charts that need a library.
- Any medical judgement, advice or advertising.

### Steering references

All requirements below comply with the steering files in `.kiro/steering/`.
`kid-safety-privacy.md` overrides any other requirement here. The "Parent screen wording"
and "Wording rules" sections of `dental-rules.md` are followed strictly and belong to
Dr. Yatin. Every new line of text is listed in "Lines for Dr. Yatin to approve" and is not
final until he approves it.

### Priority for the Kiroween video (due 4 Dec 2026)

Each requirement carries one tag: **needed for the video** or **later**. The tags assume the
parent screen is shown in the video (see Open question 13).

| # | Requirement | Tag |
|---|-------------|-----|
| 1 | Entry handler and screen shape | needed for the video |
| 2 | Adult gate | needed for the video |
| 3 | Fact: sessions per day, last 7 days | needed for the video |
| 4 | Facts: time played, camera saw brushing, guided | needed for the video |
| 5 | Fact: where brushing was seen least | needed for the video |
| 6 | Too little data | needed for the video |
| 7 | The nudge | later |
| 8 | Plain disclosure | needed for the video |
| 9 | Clear all data | needed for the video |
| 10 | Wording limits | needed for the video |
| 11 | Display-only text and approval | needed for the video |
| 12 | Comfort and access | needed for the video |
| 13 | `parentView` is pure | needed for the video |
| 14 | Tests | needed for the video (the nudge tests: later) |
| 15 | Nothing else changes | needed for the video |

---

## Requirements

### 1. Entry handler and screen shape

**Tag: needed for the video.**

**As a parent, I want to reach the grown-ups' screen from the title screen and come back,
so that I can see the facts without my child starting a session by accident.**

1.1 THE SYSTEM SHALL provide the parent screen as a screen that `main.ts` opens by calling
one function. THE title-screen control of `mirror-and-screens` (requirement 2.1) SHALL call
the handler `main.ts` passes to it; this spec SHALL NOT build, mock or bypass that control.

1.2 WHEN the parent screen opens THE SYSTEM SHALL show the adult gate (requirement 2) first.
No fact, no disclosure line and no button other than the gate and Back SHALL be shown or
readable by a screen reader before the gate is passed.

1.3 THE parent screen SHALL have one Back control that returns to the title screen through
one handler passed in by `main.ts`. It SHALL carry an icon, the approved label "Back" and an
accessible name.

1.4 THE parent screen SHALL NOT start the camera, ask for camera permission, load camera
code, a model file or WASM, play any sound, or speak. It SHALL make no network request.

1.5 THE parent screen SHALL NOT be reachable from the session screen or the end card.

1.6 WHEN the parent screen opens THE SYSTEM SHALL read the stored sessions through the
existing storage module (`loadSessions`) and SHALL keep no copy of them after the screen
closes. IF the sessions cannot be read THE screen SHALL treat them as no sessions
(requirement 6.1) and SHALL show no error message.

1.7 THE layout SHALL be plain and readable: headings, short lines of text, numbers and
buttons. No fog, no flicker, no animation other than the gate progress mark
(requirement 2.5).

---

### 2. Adult gate

**Tag: needed for the video.**

**As a parent, I want a simple gate that a young child is unlikely to pass, so that the
child does not wander into the grown-ups' screen or press "Clear all data".**

2.1 THE gate SHALL be one large button that must be held down for `GATE_HOLD_SECONDS`
seconds. `GATE_HOLD_SECONDS` SHALL be a constant with the value 3 (the example in
`kid-safety-privacy.md`).

2.2 THE gate SHALL NOT use a password, a PIN, a name, an account or any stored value. Whether
the gate is passed SHALL be held in memory only, and SHALL be forgotten each time the parent
screen closes, so that the gate shows again at the next opening.

2.3 WHEN the button has been held for `GATE_HOLD_SECONDS` seconds in one unbroken hold THE
SYSTEM SHALL open the parent screen's contents (requirements 3 to 9).

2.4 IF the hold ends early (finger or pointer lifted, pointer cancelled, pointer leaving the
button, key released, focus lost, or the tab hidden) THE SYSTEM SHALL reset the hold to zero
and SHALL show no error and no message. Holding for a total of 3 seconds in several short
holds SHALL NOT pass the gate.

2.5 WHILE the button is held THE SYSTEM SHALL show the progress of the hold with a mark that
does not depend on colour (for example a ring that fills, or a count of seconds), and SHALL
NOT flash faster than three times a second. WHEN the device asks for reduced motion
(`prefers-reduced-motion: reduce`) THE progress mark SHALL show its steps without smooth
movement; it SHALL still be shown.

2.6 THE hold SHALL be measured against an injected clock (the same style as core
requirement 15.2), so that tests can use a fake clock. THE gate SHALL NOT call `setInterval`
or `setTimeout`. How the hold is checked while the button is down is decided in `design.md`
(Open question 12).

2.7 THE gate SHALL work with the keyboard: holding Space or Enter on the focused button for
`GATE_HOLD_SECONDS` seconds SHALL pass it, with a visible focus mark.

2.8 THE gate button SHALL have a touch target of at least 48 px and an accessible name made
from its label and the instruction line of the approval table.

2.9 THE gate SHALL be shown as text with an icon. It SHALL NOT be spoken, because a spoken
instruction would help a child to pass it (see requirement 11.1).

---

### 3. Fact: sessions per day, last 7 days

**Tag: needed for the video.**

**As a parent, I want to see how many times my child brushed on each of the last seven days,
so that I know whether brushing is happening.**

3.1 THE SYSTEM SHALL show seven rows, one per calendar day, from six days before today up to
today, oldest first. Each row SHALL show the date and the number of stored sessions whose
`date` equals that day.

3.2 EVERY stored session SHALL count, whatever its mode (camera or timer-only) and its time
of day (morning, night or neither). A day with no sessions SHALL show 0, not a blank.

3.3 A session dated after today, or before the seventh day, SHALL NOT appear in these rows.

3.4 THE rows SHALL NOT show a streak, a total of days in a row, a comparison with other
days, a target, a colour that rates the day, or any word of praise or blame. Numbers only.

3.5 THE day arithmetic SHALL be done on the `YYYY-MM-DD` strings of the sessions and of
"today" (requirement 13.2). It SHALL NOT read the clock and SHALL NOT depend on the time zone
of the machine running the test.

---

### 4. Facts: time played, camera saw brushing, guided

**Tag: needed for the video.**

**As a parent, I want to see how much time was played and how much of it the camera
actually saw brushing, so that I know how much to trust the numbers.**

4.1 THE SYSTEM SHALL show three durations, each as whole minutes and seconds:

- **Time played:** the sum of `durationSeconds` of the stored sessions.
- **Camera saw brushing:** the result of `computeVerifiedTime` in `src/logic/stats.ts`,
  that is, the `secondsBrushed` of verified zones of camera-mode sessions.
- **Guided, not checked by the camera:** 30 seconds (`ZONE_DURATION`) for every zone result
  that belongs to a timer-only session or is unverified.

The reading of "time played" is a working one: see Open question 1.

4.2 THE SYSTEM SHALL use `computeVerifiedTime` unchanged and SHALL NOT recompute verified
time a second way.

4.3 TIMER-ONLY sessions and unverified zones SHALL NOT be counted as "camera saw brushing",
and SHALL NOT be counted as missed or as "brushing not seen" anywhere on the screen. They
appear only in "Guided, not checked by the camera".

4.4 THE "camera saw brushing" duration SHALL NOT exceed 30 seconds per verified zone result,
SHALL NOT exceed 120 seconds per camera-mode session, and SHALL NOT exceed the "time played"
duration. THE sum of "camera saw brushing" and "guided, not checked" SHALL NOT exceed "time
played". (This follows `tech.md`: parent stats never report more brushing time than elapsed
time. It holds for valid stored sessions; see Open question 11 for odd stored data.)

4.5 THE durations SHALL be shown in whole seconds without rounding up, so that no duration
is shown as longer than it is.

4.6 THE screen SHALL show the three durations as facts, with no target, no percentage, no
rating and no comparison. The three labels SHALL be the approved lines of "Lines for
Dr. Yatin to approve".

---

### 5. Fact: where brushing was seen least

**Tag: needed for the video.**

**As a parent, I want to know which turn of the brush most often had no brushing seen, so
that I can help my child with it, without the screen claiming more than the camera knows.**

5.1 THE SYSTEM SHALL show one zone, the result of `zoneMostMissed` in `src/logic/stats.ts`,
which uses all stored camera-mode sessions and their verified zones only. THE sentence
SHALL be the approved wording that says brushing was seen least during that zone's turn. THE
screen SHALL NOT say a zone "was missed", "skipped" or "not brushed", and SHALL NOT claim
that the camera saw which side or which teeth were brushed (`dental-rules.md`, "Parent
screen wording").

5.2 THE SYSTEM SHALL use `zoneMostMissed` unchanged. IF the highest average of "brushing not
seen" seconds over the verified zone results is 0 (so that every verified zone was fully
seen), THE SYSTEM SHALL NOT show a zone, because `zoneMostMissed` then returns the first
zone in order and showing it would be untrue. In that case the screen SHALL show nothing for
this fact. What it shows instead is decided in Open question 9.

5.3 TIMER-ONLY sessions and unverified zones SHALL NOT contribute to this fact
(core requirement 13.4).

5.4 THE fact SHALL be shown only when the data is sufficient (requirement 6).

5.5 WHEN two or more zones have the same highest positive average, `zoneMostMissed` returns
the first in `ZONE_ORDER`. How the screen shows a tie is decided in Open question 9.

---

### 6. Too little data

**Tag: needed for the video.**

**As a parent, I want the screen to say plainly when it has too little to show, so that I am
not given a number that means nothing.**

6.1 IF there are no stored sessions THE SYSTEM SHALL show the line "No sessions yet." in
place of the facts of requirements 4 and 5, and SHALL show the seven day rows of
requirement 3 with 0 in each, or the line alone (Open question 4).

6.2 IF there are stored sessions but fewer than the minimum needed for a fact THE SYSTEM
SHALL show a plain line saying so, in place of that fact's number or zone. THE minimum for
each fact SHALL be a named constant whose value Dr. Yatin sets (Open question 4). This spec
SHALL NOT choose the values.

6.3 THE screen SHALL NOT show a number or a zone that comes from fewer data than that
minimum, and SHALL NOT show 0 as if it were a finding.

6.4 THE "too little data" lines SHALL NOT blame, urge or advise (no "brush more", "try again"
or "keep going").

---

### 7. The nudge

**Tag: later.**

**As a parent, I want one short suggestion for tonight, in words Dr. Yatin has approved, so
that I know what to try.**

7.1 THE SYSTEM SHALL show at most one nudge, in exactly this form, approved by Dr. Yatin on
22 Nov 2026 (`dental-rules.md`):

> During the upper-right turn, brushing was not seen on 3 nights. Try brushing it first
> tonight.

Only the zone name and the number change. No other word of the sentence SHALL change, and the
screen SHALL NOT add any other advice, medical judgement, risk word, comparison or
encouragement to it.

7.2 THE nudge SHALL be shown only when its number is true: the number SHALL equal the count
produced by the counting rule of Open question 2 for that zone, from the stored sessions, and
SHALL be at least the minimum of Open question 3. This spec SHALL NOT choose the counting
rule or the minimum.

7.3 THE nudge SHALL use only verified zones of camera-mode sessions. Timer-only sessions and
unverified zones SHALL NOT be counted as nights on which brushing was not seen, and SHALL NOT
make a nudge appear.

7.4 THE nudge SHALL NOT appear when the data is too little (requirement 6), and SHALL NOT
appear after "Clear all data".

7.5 THE screen SHALL NOT say a zone "was missed", and SHALL NOT claim that the camera saw
which side was brushed (requirement 5.1).

7.6 THE nudge SHALL NOT carry a colour, icon, bell, badge or sound that makes it urgent, and
SHALL NOT be shown to the child.

7.7 WHICH zone the nudge names when several qualify, and how the number is written for 1
night, are decided in Open questions 3 and 8.

---

### 8. Plain disclosure

**Tag: needed for the video.**

**As a parent, I want to know in plain words what the camera does and how the game adapts,
so that I can trust it.**

8.1 THE SYSTEM SHALL show the disclosure block on the unlocked screen at all times: not
collapsed, not behind a tap, and in every data state (no sessions, too little data, enough
data, after "Clear all data"). It SHALL contain exactly these five lines, in this order, and
no sixth line:

1. "The camera stays on this phone. Nothing is saved or sent." (the approved privacy line of
   `mirror-and-screens` requirement 1.3.)
2. A line saying that the camera sees a moving hand near the mouth, and cannot see the brush,
   the teeth, or which side is brushed. (Replaces the original line 2. See the table of
   lines.)
3. "The game gets easier on spots your child often misses." (core requirement 14.6.)
4. "A monster that is nearly beaten when the time is up counts as beaten." (core requirement
   14.6.)
5. "Every monster your child meets goes into the Monster Book, beaten or not."

8.2 THE disclosure SHALL NOT include the condition on `REQUIRE_LEVEL_MATCH` (the original line
6). It no longer applies.

8.3 THE text of each line SHALL be the approved text of "Lines for Dr. Yatin to approve". THE
SYSTEM SHALL NOT reword any line itself. WHEN a line is found no longer true against the code
it SHALL be listed under "Open questions", not changed here.

8.4 LINE 2 is true only while `REQUIRE_SIDE_MATCH` and `REQUIRE_LEVEL_MATCH` are both
`false`. IF either constant passed to `parentView` is `true` THE test of requirement 14.8
SHALL fail, so that Dr. Yatin must approve new wording. `parentView` SHALL NOT silently show
a false line.

8.5 EVERY line of the disclosure SHALL be checked against the code. The result as of
22 Nov 2026 is in the table below. A line marked "check" is listed under "Open questions".

| Line | Checked against | Result |
|------|-----------------|--------|
| 1 | `src/storage/storage.ts` stores sessions in `localStorage` only; no frame, landmark or image is stored (core 9.5, 9.6) | True for the camera picture. The same screen also shows the saved sessions: check (Open question 6) |
| 2 (new) | `src/logic/constants.ts`: `REQUIRE_SIDE_MATCH` and `REQUIRE_LEVEL_MATCH` are `false`; `isBrushing` in `src/logic/session.ts` tests only `handNearMouth` and `moving` | True |
| 3 | `src/logic/miss-score.ts`: starting health falls to a floor of 36 for zones with a high miss score, from the 7 most recent camera-mode sessions, verified zones only; `session.ts` applies it in camera mode only and gives every timer-only monster 60 | True for camera sessions. "Spots" and "misses" suggest the camera sees the spot: check (Open question 5) |
| 4 | `src/logic/monsters.ts` `resolveMonster`: a pending monster at health 9 or less when its zone ends is `fled`, and a fled monster counts as beaten (core 14.3). In timer-only mode every monster is defeated at 20 s, so the rule never applies | True |
| 5 | `src/logic/session-result.ts`: `monstersEarned` is the four monsters of every session; `computeMonsterBook` takes the union (core 10.2, 10.3) | True |

The camera-mode rule (a normal monster is defeated after 15 counted seconds, `DAMAGE_PER_SECOND`
4) and the guided-timer rule (defeat at 20 s, `TIMER_ONLY_DAMAGE` 3) are not stated in any
disclosure line, so no line is made false by them. THE disclosure SHALL NOT state either number.

---

### 9. Clear all data

**Tag: needed for the video.**

**As a parent, I want one button that removes everything the game has stored, so that I
stay in control of the data.**

9.1 THE parent screen SHALL have one button labelled "Clear all data" (`kid-safety-privacy.md`)
with an icon, an accessible name and a touch target of at least 48 px.

9.2 WHEN the button is pressed THE SYSTEM SHALL show one confirmation with two buttons, one
that clears and one that keeps. Nothing SHALL be removed before the clearing button of the
confirmation is pressed. One press of the confirmation is enough: there SHALL NOT be a second
confirmation.

9.3 WHEN the clearing button is pressed THE SYSTEM SHALL remove every key the app stores. As
of 22 Nov 2026 the storage code stores exactly one key, `foamtom:v1` (`STORAGE_KEY` in
`src/storage/storage.ts`; no other file under `src/` calls `setItem`). THE list of stored
keys SHALL live in one place in the storage module, so that storing and clearing cannot
disagree, and a guard test SHALL fail if any file under `src/` writes a key that is not in
that list (requirement 14.10).

9.4 THE SYSTEM SHALL hold no copy of the cleared data in memory. After clearing:

- the Monster Book SHALL show no owned monster (it reads the stored sessions each time it
  opens, `mirror-and-screens` requirement 7.6);
- kind proximity SHALL start from no history, and rare eligibility from no sessions (both are
  worked out from the stored sessions each time, core requirement 14.7);
- the parent screen SHALL show "No sessions yet." (requirement 6.1), no nudge, and the
  disclosure block (requirement 8.1).

9.5 IF the stored sessions can still be read after the clear (for example storage is blocked)
THE SYSTEM SHALL NOT claim they were cleared. It SHALL show the approved line for that case
instead of the "No sessions yet." line.

9.6 THE button SHALL NOT be shown or reachable before the gate is passed (requirement 1.2).

---

### 10. Wording limits

**Tag: needed for the video.**

**As Dr. Yatin, I want every word on this screen to stay inside the dental rules, so that the
app stays within the Indian dental advertising code.**

10.1 NO text on the parent screen SHALL claim that the game prevents or cures anything,
promises any result, or replaces a dental visit.

10.2 NO text SHALL contain a clinic name, phone number, address or registration number.

10.3 NO text SHALL make a medical judgement or use a risk word. In particular the words
risk, danger, disease, decay, cavity-free, prevent and cure (and their forms, such as
"prevents", "risky", "decayed", "cures") SHALL NOT appear. Neither SHALL guarantee, diagnose,
clinic or doctor, from the wording guard of core requirement 13.11.

10.4 NO text SHALL say, as a statement about the child, that a zone "was missed", "skipped"
or "not brushed". The only allowed forms are the nudge of requirement 7.1 and the sentence of
requirement 5.1 ("brushing was not seen" / "seen least"), which describe what the camera saw.

10.5 NO text SHALL urge, scare or guilt: no streak, no "again", no "don't forget your
child's…", no "you should", no praise score, no red or green rating (core requirements
12.6 and 14.5).

10.6 THE word "cavity" MAY appear only inside the monster idea the game already uses, and
SHALL NOT appear on this screen.

---

### 11. Display-only text and approval

**Tag: needed for the video.**

**As Dr. Yatin, I want to approve every new word a parent sees, and I want parent-facing text
kept apart from the child's spoken lines, so that the wording guards stay simple.**

11.1 EVERY line of the parent screen SHALL be display-only text: shown, not spoken, and never
added to `src/audio/lines.ts`. The core wording guard (core requirement 13.11) bans the
word "camera" there. The parent-facing text SHALL live in a display-only table outside
`lines.ts`, as `mirror-and-screens` already does (`src/ui/display-text.ts`); `design.md`
decides whether it is that table or a new one.

11.2 THE wording guard of `mirror-and-screens` (requirement 14.4) SHALL cover the table that
holds the parent text, or a new test of requirement 14.7 SHALL do so. No existing test SHALL
be changed.

11.3 EVERY new line, label and sentence template of this screen SHALL be listed, one per row,
in the final table "Lines for Dr. Yatin to approve" with where it is shown. A line is not
final until he approves it. WHEN he changes a line, the table and the code SHALL be updated
to match.

11.4 THE code SHALL NOT contain a parent-facing string that is not in that table, except the
numbers, dates and zone names a template fills in (requirement 13.4).

---

### 12. Comfort and access

**Tag: needed for the video.**

**As a parent, I want the screen to be easy to use with one hand on a phone, and as a
person who needs a keyboard or a screen reader, I want it to work for me.**

12.1 EVERY button SHALL have a touch target of at least 48 px: the gate button, Back, "Clear
all data" and the two buttons of the confirmation (core requirement 11.10).

12.2 THE screen SHALL work in portrait at 360 px width, one-handed, and SHALL remain usable
in landscape and in a desktop browser (core requirement 11.9). Content MAY scroll
vertically. Back and "Clear all data" SHALL be reachable by scrolling and by keyboard.

12.3 COLOUR SHALL NOT be the only signal for anything on this screen (core requirement
11.11). Text SHALL keep a contrast ratio of at least 4.5 to 1 against its background.

12.4 EVERY button SHALL work with the mouse and the keyboard, with a visible focus mark.
Headings SHALL be real headings, so that a screen reader can move between the gate, the
facts and the disclosure.

12.5 THE parent screen SHALL NOT use any effect that flashes faster than three times a
second, and SHALL follow `prefers-reduced-motion` (requirement 2.5).

12.6 NEW files of this spec SHALL NOT call `setInterval` or `setTimeout`. `src/ui/game-loop.ts`
stays the only module that owns a timer (`tech.md`).

---

### 13. `parentView` is pure

**Tag: needed for the video.**

**As a developer, I want everything the screen shows to come from one pure function, so that
it can be property-tested without a browser.**

13.1 THE SYSTEM SHALL provide a pure function `parentView` that returns every number and
every sentence the parent screen shows after the gate: the seven day rows, the three
durations, the zone and its sentence (or the reason none is shown), the "too little data"
and "No sessions yet." lines, the nudge (or none) and the five disclosure lines. THE screen
SHALL only paint this result and SHALL NOT make its own decisions (as
`mirror-and-screens` requirement 16.3).

13.2 THE inputs SHALL be the stored sessions, the constants it needs (`ZONE_DURATION`,
`SESSION_DURATION`, `ZONE_ORDER`, `REQUIRE_SIDE_MATCH`, `REQUIRE_LEVEL_MATCH`, and the
parent-screen constants of requirements 2, 6 and 7), passed in so that tests can vary them,
and today's local date as a `YYYY-MM-DD` string read once by `main.ts`. The original
prompt named two inputs, `parentView(sessions, constants)`. The date is a third input
because the function cannot read the clock (Open question 10).

13.3 `parentView` SHALL have no DOM, no clock, no randomness, no storage access and no
network access. It MAY import from `src/logic/`. Nothing under `src/logic/` SHALL import it
(`structure.md`). It SHALL NOT change `src/logic/stats.ts`; it SHALL call
`computeVerifiedTime` and `zoneMostMissed`.

13.4 EVERY sentence SHALL be built from the approved table of requirement 11.3, filling in
only numbers, dates and zone names. THE zone names SHALL be written as in the approved nudge
(`upper-right`, `upper-left`, `lower-left`, `lower-right`; Open question 8).

13.5 THE same inputs SHALL always give the same result. The result SHALL NOT depend on the
order of the stored sessions, except where `zoneMostMissed` itself breaks a tie by
`ZONE_ORDER`.

13.6 `parentView` SHALL NOT change, add or remove a stored value, and SHALL NOT change a
game rule or number.

---

### 14. Tests

**Tag: needed for the video (the nudge tests: later).**

**As a developer, I want fast-check properties and guards that hold for all inputs, so that
the parent screen can never show a number or a sentence that is not true.**

All properties below use valid sessions built by the existing `sessionResultArb` of
`/tests/` (core design section 11), with arbitrary modes, verified flags and dates.

14.1 **Verified time ceiling:** for any sessions, "camera saw brushing" is at most 30 seconds
per verified zone result, at most 120 per camera-mode session, and at most "time played".
"Camera saw brushing" plus "guided, not checked" is at most "time played".

14.2 **Guided is never verified or missed:** adding any number of timer-only sessions, or
changing any zone result to unverified, never raises "camera saw brushing", never changes the
zone shown in requirement 5, and never makes a nudge appear. Those zone results appear only
in "guided, not checked by the camera".

14.3 **Nudge only when true:** whenever a nudge is returned, its zone and its number equal an
independent count of the stored sessions by the rule of Open question 2 (the test counts
without calling `parentView`), the number is at least the minimum of Open question 3, and the
sentence equals the approved sentence with only the zone name and the number replaced.

14.4 **Seven days:** `parentView` returns exactly seven day rows, consecutive, ending today;
each count equals the number of stored sessions with that date; sessions outside the seven
days appear in no row.

14.5 **Too little data:** with no sessions, `parentView` returns "No sessions yet." and no
duration other than zero, no zone and no nudge. With fewer data than the minimum of
requirement 6.2, it returns the "too little data" line and no number, zone or nudge for that
fact. It never returns a zone whose highest average of unseen seconds is 0 (requirement 5.2).

14.6 **Stats are the stats:** "camera saw brushing" equals `computeVerifiedTime`, and the zone
equals `zoneMostMissed`, whenever the data is sufficient and the highest average is above 0.

14.7 **Wording guard:** a test SHALL read every parent-facing string (the whole table of
requirement 11.1, and every sentence `parentView` returns over generated sessions) and fail if
any contains, as a word or word stem, case-insensitively: risk, danger, disease, decay,
cavity-free, prevent, cure, guarantee, diagnose, clinic, doctor, missed, skipped. It SHALL
also fail on a run of 7 or more digits, an `@`, `www` or `http`, so that no phone number,
address, e-mail or link appears. It SHALL also check that every sentence is in the approved
table, and that no sentence says a zone "was missed". (Word stems are matched so that
"prevents" or "risky" fail too.)

14.8 **Disclosure:** `parentView` always returns the five disclosure lines, in order, in every
data state, with no sixth line. A test SHALL fail if `REQUIRE_SIDE_MATCH` or
`REQUIRE_LEVEL_MATCH` is `true` while line 2 is the approved line of this spec
(requirement 8.4), and SHALL fail if the disclosure contains the numbers 15, 20, 36 or 9.

14.9 **Clear all data:** with a `Map`-backed fake backend holding sessions, after the clear
confirmation: `loadSessions()` returns no sessions, the backend holds no key, `parentView`
returns "No sessions yet.", and `computeMonsterBook` of the loaded sessions is empty. Before
the confirmation, nothing is removed. A throwing backend does not throw out of the clear and
leads to the line of requirement 9.5 if sessions remain.

14.10 **Keys guard:** a test SHALL fail if any file under `src/` calls `setItem` with a key
that is not in the list of stored keys of requirement 9.3, or if a key in that list is not
removed by the clear.

14.11 **Gate:** with a fake clock, holding for `GATE_HOLD_SECONDS` passes the gate; holding
for less does not; an early release resets the hold, and several short holds never add up;
the gate is closed again each time the screen opens; the gate stores nothing.

14.12 **Privacy and timers:** the existing privacy guard (core requirement 13.10) and tracking
guard keep passing and scan every new file. A test SHALL fail if any new file of this spec
calls `setInterval` or `setTimeout`, loads camera code, or touches `localStorage` outside the
storage module.

14.13 **Targets and text:** where the existing tests can check the DOM, a test SHALL check
that every button has a touch target of at least 48 px and an accessible name, that no
fact is in the DOM before the gate is passed, and that the screen holds no fog, flicker or
sound.

14.14 **Nothing broken:** every existing test passes unchanged.

---

### 15. Nothing else changes

**Tag: needed for the video.**

**As Dr. Yatin, I want this spec to change nothing about the rules or the stored data, so
that the dental rules and the game numbers stay as I set them.**

15.1 THIS spec SHALL NOT change any game rule, constant, number, stored value, storage
schema, or test of `core-brushing-loop`, `hand-tracking` or `mirror-and-screens`, and SHALL
NOT change `toView`, `SignalSource` or the signal.

15.2 THIS spec SHALL NOT change `dental-rules.md`, any steering file or any spoken line in
`src/audio/lines.ts`.

15.3 THE only existing code that the later design is expected to touch is the storage
module's list of keys (requirement 9.3) and `main.ts` (wiring only). Any other change SHALL
be listed in `design.md` and approved by Dr. Yatin before it is built.

---

## Lines for Dr. Yatin to approve

Every NEW parent-facing line of this spec is below, one per row, with where it is shown. None
is final until Dr. Yatin approves it. "Shown" means visible text; nothing on this screen is
spoken. `<...>` marks a part a template fills in. Zone names are written as in the approved
nudge. Row 1 already exists and is reused.

| # | Proposed text | Where it is shown | Status |
|---|---------------|-------------------|--------|
| 1 | The camera stays on this phone. Nothing is saved or sent. | Disclosure line 1 | Existing approved line (`display-text.ts`, 21 Nov 2026); see Open question 6 |
| 2 | Grown-ups | Heading of the parent screen | Text approved on 21 Nov 2026 as the name of the entry control; new use as a heading |
| 3 | Hold the button for 3 seconds. | Gate, instruction line | New |
| 4 | Hold | Gate, label of the button | New |
| 5 | Back | Back button | Existing approved line (`display-text.ts`) |
| 6 | Sessions in the last 7 days | Heading of the day rows | New |
| 7 | `<weekday> <day> <month>`: `<n>` | One day row (for example "Mon 16 Nov: 2") | New |
| 8 | Time played: `<m>` min `<s>` s | Facts | New |
| 9 | Camera saw brushing: `<m>` min `<s>` s | Facts | New |
| 10 | Guided, not checked by the camera: `<m>` min `<s>` s | Facts | New |
| 11 | Brushing was seen least during the `<zone>` turn. | Fact of requirement 5 | New. The honest form of "zone most often missed" |
| 12 | No sessions yet. | Facts, when nothing is stored, and after "Clear all data" | New (wording given in the prompt) |
| 13 | Not enough sessions with the camera yet. | Facts, when there is too little data | New |
| 14 | During the `<zone>` turn, brushing was not seen on `<n>` nights. Try brushing it first tonight. | The nudge | Approved by Dr. Yatin on 22 Nov 2026 (`dental-rules.md`). Only `<zone>` and `<n>` change |
| 15 | The camera sees a moving hand near the mouth. It cannot see the brush, the teeth, or which side is brushed. | Disclosure line 2 | New. Replaces the prompt's line 2 |
| 16 | The game gets easier on spots your child often misses. | Disclosure line 3 | Wording from core requirement 14.6; see Open question 5 |
| 17 | A monster that is nearly beaten when the time is up counts as beaten. | Disclosure line 4 | Wording from core requirement 14.6 |
| 18 | Every monster your child meets goes into the Monster Book, beaten or not. | Disclosure line 5 | New (wording given in the prompt) |
| 19 | Clear all data | Button; also the clearing button of the confirmation | New (the name is in `kid-safety-privacy.md`) |
| 20 | Clear all data from this phone? It cannot be undone. | Confirmation | New |
| 21 | Keep | Confirmation, the button that keeps the data | New |
| 22 | The data on this phone could not be cleared. | Shown if sessions can still be read after the clear (requirement 9.5) | New |
| 23 | upper-right, upper-left, lower-left, lower-right | Zone names inside rows 11 and 14 | As written in the approved nudge |

---

## Open questions

These are for Dr. Yatin. None is decided in this file. Where a requirement depends on one, it
says which.

1. **What does "total time in guided sessions" mean?** The prompt says "total time in guided
   sessions; of that, time the camera actually saw brushing". Requirement 4.1 works on this
   reading: every session is guided by the game, so "time played" is the sum of
   `durationSeconds` of all stored sessions. The alternative is the time of timer-only
   sessions alone. Also unsettled: (a) all stored sessions, or only the last 7 days; (b) the
   three numbers do not add up to "time played", because time in verified zones when no
   brushing was seen is in none of them. Should the screen show that remainder (for example
   "Camera did not see brushing"), or leave it out?
2. **How is "3 nights" counted?** Options for each part:
   - *Unit:* distinct calendar days, or distinct sessions.
   - *Which sessions:* any session, only night sessions (17:00 to 23:59), or morning and night
     sessions. The word "nights" suggests night sessions only. A session at "neither" times
     exists.
   - *What counts as "not seen":* no brushing seen at all in that zone's turn (0 brushed
     seconds); fewer than some number of brushed seconds; or more than some number of unseen
     seconds (`30 - secondsBrushed - secondsUntracked`, the quantity `stats.ts` and
     `miss-score.ts` use).
   - *Unseen time:* the prompt says unverified zones do not count. A zone with up to 10
     untracked seconds is still verified. Do those seconds count as "not seen"?
   - *Window:* last 7 days, last 7 camera-mode sessions (as kind proximity does), or all
     stored sessions.
3. **When does the nudge appear, and for which zone?** The minimum `n` (1, 2, 3, ...), and the
   choice when several zones qualify (the highest `n`, the first in zone order, or none when
   they tie). And does the nudge name the same zone as the fact of requirement 5, or may they
   differ?
4. **How much data is "too little"?** The values of the minimum constants of requirement 6.2:
   how many camera-mode sessions before the "camera saw brushing" time and the zone fact are
   shown, and how many verified results per zone. And with no sessions, should the seven day
   rows show seven zeros, or only "No sessions yet."?
5. **Disclosure line 3, "The game gets easier on spots your child often misses."** The line is
   true for camera sessions only (timer-only monsters never get easier). It also calls a zone
   a "spot" that the child "misses", which reads as if the camera saw the spot, which
   `dental-rules.md` says the parent screen must not do. In the code, a "miss" is the seconds
   of a zone's turn in which no brushing was seen at the mouth. Keep the line, reword it, or
   add "in camera sessions"? Not reworded here.
6. **Disclosure line 1, "Nothing is saved or sent."** On this same screen the sessions are
   shown and a "Clear all data" button exists, so "nothing is saved" is true of the camera
   picture and not of the sessions. Line 1 is the approved privacy line used on the title
   screen. Keep it as is on this screen, or add a line that says that session times are saved
   on this phone (the data `kid-safety-privacy.md` lists as stored)? Not reworded here.
7. **Disclosure line 2 (new).** The prompt asked for a line naming the brush, the teeth and
   the side. The camera does not check upper or lower either. Should the line say so ("or which
   side, or upper or lower, is brushed")? Row 15 uses the prompt's three items only.
8. **Zone name and plural.** The approved nudge writes "upper-right" with a hyphen. Is that
   the form for all zone names on the screen? And how should "1 nights" be written (for
   example "1 night")? The nudge says "nights" only for the number in the approved example.
9. **When the zone fact cannot be shown honestly.** `zoneMostMissed` returns the first zone in
   order (`upper-right`) when every verified zone was fully seen (average 0), and picks the
   first in order when two zones tie. Requirement 5.2 stops the first case. What should the
   screen show then (nothing, or a line such as "Brushing was seen in every turn"), and for a
   tie, one zone, all tied zones, or none? Changing `stats.ts` is out of scope here.
10. **`parentView` takes a third input, today's date.** The prompt names two inputs. A pure
    function cannot read the clock, and the seven day rows need today. Confirm the third input.
11. **Odd stored data.** The loader only checks the shape of a stored session, not its numbers.
    A session with `secondsBrushed` above 30, a negative number or a missing field can break
    the ceiling of requirement 4.4. Should `parentView` ignore such sessions, clamp the
    values, or treat all data as no sessions? The properties of requirement 14 are written for
    valid sessions only.
12. **The gate and timers.** The hold needs a clock check while the button is down, and
    `tech.md` says only `src/ui/game-loop.ts` owns a timer. May the gate use
    `requestAnimationFrame` and pointer-event timestamps (as `mirror-and-screens` 13.3 allows
    for effects), or must it be driven by `game-loop.ts`? Also, a "hold for 3 seconds" gate is
    hard to use with some assistive tools. Is a keyboard hold (requirement 2.7) enough, or do
    you want a second gate, such as a sum a 5-year-old cannot do (`kid-safety-privacy.md`)?
13. **Is the parent screen in the 4 Dec video?** `mirror-and-screens` tags its entry control
    "later". The tags in the table of this spec assume the screen is shown. If it is not, every
    "needed for the video" tag here becomes "later", except 8 and 9, which are privacy
    requirements.
