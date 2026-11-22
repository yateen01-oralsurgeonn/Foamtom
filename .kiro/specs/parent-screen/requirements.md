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
   brush, the teeth, or which part of the mouth is brushed (requirement 8.1, line 3).
2. The original disclosure line 6 (the `REQUIRE_LEVEL_MATCH` condition) is dropped. It no
   longer applies.
3. The nudge is the sentence reworded by Dr. Yatin on 22 Nov 2026 in `dental-rules.md`, not
   the form "<Zone> was missed <n> nights" (requirement 7).
4. The entry control on the title screen belongs to `mirror-and-screens` (its tasks 36 to 38,
   not built yet). This spec builds the screen behind it and receives its open handler
   (requirement 1).
5. Dr. Yatin answered Questions 1 to 13 on 22 Nov 2026. His answers are in "Decisions
   (22 Nov 2026)" at the end of this file and are applied in the requirements.
6. Dr. Yatin also answered N1 to N5 and approved the lines table on 22 Nov 2026. Both are
   in "Decisions (22 Nov 2026)" and are applied in the requirements. Nothing is left open.

### In scope

1. **Adult gate** (requirement 2).
2. **Facts:** sessions per day for the last 7 days, three time lines, and the part of the
   mouth where brushing was seen least (requirements 3 to 5).
3. **Too little data** (requirement 6).
4. **One allowed nudge** (requirement 7).
5. **Plain disclosure**, always visible on the screen (requirement 8).
6. **Clear all data** (requirement 9).
7. **Wording limits**, **display-only text**, **comfort and access** (requirements 10 to 12).
8. **The pure function `parentView`** and its **tests** (requirements 13 and 14).

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
Dr. Yatin. Every new line of text is listed in "Lines for Dr. Yatin to approve". He approved
every line on 22 Nov 2026.

### Priority for the Kiroween video (due 4 Dec 2026)

Each requirement carries one tag: **needed for the video** or **later**. The parent screen is
in the 4 Dec video (Decision Q13), and so is the nudge.

| # | Requirement | Tag |
|---|-------------|-----|
| 1 | Entry handler and screen shape | needed for the video |
| 2 | Adult gate | needed for the video |
| 3 | Fact: sessions per day, last 7 days | needed for the video |
| 4 | Facts: time with the game, camera saw brushing, timer only | needed for the video |
| 5 | Fact: where brushing was seen least | needed for the video |
| 6 | Too little data | needed for the video |
| 7 | The nudge | needed for the video |
| 8 | Plain disclosure | needed for the video |
| 9 | Clear all data | needed for the video |
| 10 | Wording limits | needed for the video |
| 11 | Display-only text and approval | needed for the video |
| 12 | Comfort and access | needed for the video |
| 13 | `parentView` is pure | needed for the video |
| 14 | Tests | needed for the video |
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

2.6 THE hold SHALL be measured against an injected time source (the same style as core
requirement 15.2), so that tests can use a fake clock. WHILE the button is held THE gate MAY
check the hold with `requestAnimationFrame` and pointer-event timestamps, as
`mirror-and-screens` 13.3 allows for effects (Decision Q12). THE gate SHALL NOT call
`setInterval` or `setTimeout`.

2.7 THE gate SHALL work with the keyboard: holding Space or Enter on the focused button for
`GATE_HOLD_SECONDS` seconds SHALL pass it, with a visible focus mark. This keyboard hold is
the accessible path. THE SYSTEM SHALL NOT add a second gate (Decision Q12).

2.8 THE gate button SHALL have a touch target of at least 48 px and an accessible name made
from its label and the instruction line of the approval table.

2.9 THE gate SHALL be shown as text with an icon. It SHALL NOT be spoken, because a spoken
instruction would help a child to pass it (see requirement 11.1).

---

### 3. Fact: sessions per day, last 7 days

**Tag: needed for the video.**

**As a parent, I want to see how many times my child brushed on each of the last seven days,
so that I know whether brushing is happening.**

3.1 THE SYSTEM SHALL define **the window** as the seven calendar days from six days before
today up to and including today. Every time fact (requirement 4), the zone fact
(requirement 5) and the nudge (requirement 7) SHALL use only sessions whose `date` is in the
window.

3.2 THE SYSTEM SHALL show seven rows, one per calendar day of the window, oldest first. Each
row SHALL show the date and the number of stored sessions whose `date` equals that day.

3.3 EVERY stored session in the window SHALL count in these rows, whatever its mode (camera
or timer-only) and its time of day (morning, night or neither). A day with no sessions SHALL
show 0, not a blank. A session dated after today, or before the seventh day, SHALL NOT
appear in these rows.

3.4 IF there are no sessions at all (requirement 6.1) THE SYSTEM SHALL NOT show the seven
rows (no seven rows of zeros).

3.5 THE rows SHALL NOT show a streak, a total of days in a row, a comparison with other
days, a target, a colour that rates the day, or any word of praise or blame. Numbers only.

3.6 THE day arithmetic SHALL be done on the `YYYY-MM-DD` strings of the sessions and of
"today" (requirement 13.2). It SHALL NOT read the clock and SHALL NOT depend on the time zone
of the machine running the test.

---

### 4. Facts: time with the game, camera saw brushing, timer only

**Tag: needed for the video.**

**As a parent, I want to see how much time was spent with the game and how much of it the
camera actually saw brushing, so that I know how much to trust the numbers.**

4.1 THE SYSTEM SHALL show exactly three durations, each as whole minutes and seconds, all
over the sessions of the window (requirement 3.1):

- **Time with the game:** the sum of `durationSeconds` of all sessions in the window.
- **Of that, the camera saw brushing:** the result of `computeVerifiedTime` in
  `src/logic/stats.ts` over the sessions of the window, that is, the `secondsBrushed` of
  verified zones of camera-mode sessions.
- **Timer only, not checked by the camera:** the sum of `durationSeconds` of the timer-only
  sessions in the window.

THE SYSTEM SHALL NOT show a fourth line, a remainder or any claim about the gap between the
three durations (Decision Q1).

4.2 THE SYSTEM SHALL use `computeVerifiedTime` unchanged and SHALL NOT recompute verified
time a second way.

4.3 TIMER-ONLY sessions and unverified zones SHALL NOT be counted as "the camera saw
brushing", and SHALL NOT be counted as missed or as "brushing not seen" anywhere on the
screen. Timer-only sessions appear only in "Timer only, not checked by the camera".

4.4 THE "camera saw brushing" duration SHALL NOT exceed 30 seconds per verified zone result,
SHALL NOT exceed 120 seconds per camera-mode session, and SHALL NOT exceed "time with the
game". THE sum of "camera saw brushing" and "timer only" SHALL NOT exceed "time with the
game". (This follows `tech.md`: parent stats never report more brushing time than elapsed
time. It holds for valid stored sessions; requirement 13.7 removes the others.)

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

5.1 THE SYSTEM SHALL work out this fact from the camera-mode sessions of the window
(requirement 3.1) and from their verified zone results only. Timer-only sessions and
unverified zones SHALL NOT contribute (core requirement 13.4).

5.2 `parentView` SHALL filter the sessions to the window and SHALL compute the fact itself.
`src/logic/stats.ts` SHALL NOT be changed (Decision Q4). For each zone the measure is the
same as in `stats.ts`: the average over its verified results of the unseen seconds,
`max(0, ZONE_DURATION - secondsBrushed - secondsUntracked)`.

5.3 WHEN the window holds 3 or more camera-mode sessions AND at least one verified zone
result has unseen time, THE SYSTEM SHALL show the sentence "Brushing was seen least during
the upper-left turn." with the zone or zones that have the highest average of unseen
seconds. WHEN several zones tie for the highest average, THE SYSTEM SHALL name every tied
turn, in `ZONE_ORDER` order, in one sentence (Decision N5): for two turns "Brushing was seen
least during the upper-left and lower-left turns."; for three "Brushing was seen least during
the upper-right, upper-left and lower-left turns."; for four the same form with all four
names. THE SYSTEM SHALL write "and" before the last name and no comma before "and".

5.4 IF the window holds 3 or more camera-mode sessions AND every verified zone result had no
unseen time (the highest average is 0), THE SYSTEM SHALL show the line "Brushing was seen in
every turn." and SHALL NOT name a zone.

5.5 IF the window holds fewer than 3 camera-mode sessions THE SYSTEM SHALL show the line "Not
enough camera sessions yet." in place of this fact (requirement 6.2).

5.6 THE screen SHALL NOT say a zone "was missed", "skipped" or "not brushed", and SHALL NOT
claim that the camera saw which side or which teeth were brushed (`dental-rules.md`, "Parent
screen wording"). Zone names SHALL be written with a hyphen before "turn" ("upper-right
turn", "lower-left turn"; Decision Q8).

5.7 THE zone fact and the nudge (requirement 7) are computed separately and MAY name
different zones (Decision Q3).

5.8 IF the window holds 3 or more camera-mode sessions AND no verified zone result exists in
them, THE SYSTEM SHALL show the line "Not enough camera sessions yet." in place of this fact
(Decision N3). THE SYSTEM SHALL NOT show "Brushing was seen in every turn." or name a zone in
that case.

---

### 6. Too little data

**Tag: needed for the video.**

**As a parent, I want the screen to say plainly when it has too little to show, so that I am
not given a number that means nothing.**

6.1 IF there are no stored sessions that `parentView` accepts (requirement 13.7) THE SYSTEM
SHALL show only the line "No sessions yet." in place of the facts (the seven rows of
requirement 3, the durations of requirement 4, the zone fact of requirement 5) and the
nudge. THE disclosure (requirement 8) SHALL still be shown.

6.2 IF the window holds fewer than `ZONE_FACT_MIN_CAMERA_SESSIONS` camera-mode sessions THE
SYSTEM SHALL show the line "Not enough camera sessions yet." in place of the zone fact.
`ZONE_FACT_MIN_CAMERA_SESSIONS` SHALL be a named constant with the value 3 (Decision Q4).
Requirement 6.2 applies to the zone fact only. The three durations of requirement 4 are
shown whenever there is at least one accepted session. The nudge is not subject to this
minimum (requirement 7.5).

6.3 THE screen SHALL NOT show a zone that comes from fewer sessions than that minimum, and
SHALL NOT show 0 as if it were a finding of the zone fact.

6.4 THE "too little data" lines SHALL NOT blame, urge or advise (no "brush more", "try again"
or "keep going").

---

### 7. The nudge

**Tag: needed for the video.**

**As a parent, I want one short suggestion for tonight, in words Dr. Yatin has approved, so
that I know what to try.**

7.1 THE SYSTEM SHALL show at most one nudge, in exactly this form, approved by Dr. Yatin on
22 Nov 2026 (`dental-rules.md`):

> During the upper-right turn, brushing was not seen on 3 nights. Try brushing it first
> tonight.

Only the zone name and the number change. No other word of the sentence SHALL change, and the
screen SHALL NOT add any other advice, medical judgement, risk word, comparison or
encouragement to it.

7.2 A **night** for a zone SHALL be a calendar day that meets all of these conditions
(Decisions Q2, N2):

- the day is in the window (requirement 3.1: the last 7 calendar days including today);
- the day has at least one **qualifying night session** for that zone: a camera-mode session
  whose `timeOfDay` is night (started 17:00 to 23:59 local time) and whose result for that
  zone is verified;
- EVERY qualifying night session of that day has `secondsBrushed === 0` for that zone.

WHEN any qualifying night session of the day has `secondsBrushed` above 0 for that zone, THE
SYSTEM SHALL NOT count the day as a night for that zone. A night session whose result for
that zone is unverified SHALL neither count nor block. IF all night sessions of a day are
unverified for that zone, THE SYSTEM SHALL NOT count the day. Untracked seconds SHALL NOT
make a night count. Each calendar day SHALL count as at most one night for a zone, so that
two night sessions on one day give at most one night.

7.3 THE nudge SHALL appear WHEN at least one zone has `NUDGE_MIN_NIGHTS` or more nights.
`NUDGE_MIN_NIGHTS` SHALL be a named constant with the value 2. THE nudge SHALL name the zone
with the most nights; WHEN zones tie, it SHALL name the first of them in `ZONE_ORDER`. THE
number in the sentence SHALL be that zone's count of nights, and "nights" SHALL always be
plural, because the number is never below 2 (Decision Q8).

7.4 THE nudge SHALL use only camera-mode sessions and verified zone results. Timer-only
sessions and unverified zone results SHALL NOT be counted as nights and SHALL NOT make a
nudge appear.

7.5 THE nudge SHALL NOT appear when there are no sessions (requirement 6.1), and SHALL NOT
appear after "Clear all data". THE nudge has only its own rule (requirement 7.3): THE
`ZONE_FACT_MIN_CAMERA_SESSIONS` minimum SHALL NOT hold it back (Decision N1), so that it MAY
appear when the window holds fewer than 3 camera-mode sessions.

7.6 THE nudge zone and the zone fact of requirement 5 are computed separately and MAY differ
(requirement 5.7).

7.7 THE screen SHALL NOT say a zone "was missed", and SHALL NOT claim that the camera saw
which side was brushed (requirement 5.6).

7.8 THE nudge SHALL NOT carry a colour, icon, bell, badge or sound that makes it urgent, and
SHALL NOT be shown to the child.

---

### 8. Plain disclosure

**Tag: needed for the video.**

**As a parent, I want to know in plain words what the camera does and how the game adapts,
so that I can trust it.**

8.1 THE SYSTEM SHALL show the disclosure block on the unlocked screen at all times: not
collapsed, not behind a tap, and in every data state (no sessions, too little data, enough
data, after "Clear all data"). It SHALL contain exactly these six lines, in this order, and
no seventh line (Decisions Q5, Q6, Q7):

1. "The camera picture stays on this phone. It is never saved or sent."
2. "Brushing times and the Monster Book are saved on this phone only, until you press Clear
   all data."
3. "The camera sees a moving hand near the mouth. It cannot see the brush, the teeth, or
   which part of the mouth is being brushed."
4. "In camera sessions, monsters get weaker in turns where brushing was often not seen."
5. "A monster that is nearly beaten when the time is up counts as beaten."
6. "Every monster your child meets goes into the Monster Book, beaten or not."

The title screen keeps its own approved privacy line, unchanged ("The camera stays on this
phone. Nothing is saved or sent."). It is not part of this block.

8.2 THE disclosure SHALL NOT include the condition on `REQUIRE_LEVEL_MATCH` (the original line
6). It no longer applies.

8.3 THE text of each line SHALL be the text of requirement 8.1. THE SYSTEM SHALL NOT reword
any line itself. WHEN a line is found no longer true against the code it SHALL be listed
under "Open questions", not changed here.

8.4 LINE 3 is true only while `REQUIRE_SIDE_MATCH` and `REQUIRE_LEVEL_MATCH` are both
`false`. IF either constant passed to `parentView` is `true` THE test of requirement 14.8
SHALL fail, so that Dr. Yatin must approve new wording. `parentView` SHALL NOT silently show
a false line.

8.5 EVERY line of the disclosure was checked against the code on 22 Nov 2026:

| Line | Checked against | Result |
|------|-----------------|--------|
| 1 | `src/storage/storage.ts` stores only session results; no frame, landmark or image is stored (core 9.5, 9.6) | True |
| 2 | `src/storage/storage.ts`: one key, `foamtom:v1` (`STORAGE_KEY`), in `localStorage` (passed in by `main.ts`); `clearAll` removes that key; the Monster Book is worked out from the stored sessions (`computeMonsterBook`), so it holds nothing of its own | True |
| 3 | `src/logic/constants.ts`: `REQUIRE_SIDE_MATCH` and `REQUIRE_LEVEL_MATCH` are `false`; `isBrushing` in `src/logic/session.ts` tests only `handNearMouth` and `moving` | True |
| 4 | `src/logic/miss-score.ts`: `computeMissScores` counts, for verified zones of the most recent `MISS_WINDOW` camera-mode sessions, the seconds of a turn that were neither brushed nor untracked; `startingHealth` lowers a monster's starting health (to a floor of `KIND_FLOOR`) as that score rises. `session.ts` applies it in camera mode only | True. The seconds counted are exactly "brushing was not seen" (tracked, no brushing). The line does not state the window of sessions or any number |
| 5 | `src/logic/monsters.ts` `resolveMonster`: a pending monster at health 9 or less when its zone ends is `fled`, and a fled monster counts as beaten (core 14.3). In timer-only mode every monster is defeated at 20 s, so the rule never applies | True |
| 6 | `src/logic/session-result.ts`: `monstersEarned` is the four monsters of every session; `computeMonsterBook` takes the union (core 10.2, 10.3) | True |

No line needed to be listed as a new open question from this check.

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
or "not brushed". The only allowed forms are the nudge of requirement 7.1 and the sentences of
requirement 5 ("brushing was not seen" / "seen least" / "seen in every turn"), which describe
what the camera saw.

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
in the final table "Lines for Dr. Yatin to approve" with where it is shown. Every row of that
table is approved (22 Nov 2026). WHEN he changes a line,
the table and the code SHALL be updated to match.

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
stays the only module that owns a timer (`tech.md`); the gate's use of `requestAnimationFrame`
is allowed by requirement 2.6.

---

### 13. `parentView` is pure

**Tag: needed for the video.**

**As a developer, I want everything the screen shows to come from one pure function, so that
it can be property-tested without a browser.**

13.1 THE SYSTEM SHALL provide a pure function `parentView` that returns every number and
every sentence the parent screen shows after the gate: the seven day rows, the three
durations, the zone fact (its sentence, or "Brushing was seen in every turn.", or the "Not
enough camera sessions yet." line), the "No sessions yet." line, the nudge (or none) and the
six disclosure lines. THE screen SHALL only paint this result and SHALL NOT make its own
decisions (as `mirror-and-screens` requirement 16.3).

13.2 THE signature SHALL be `parentView(sessions, constants, today)` (Decision Q10). `today`
SHALL be a local calendar date as a `YYYY-MM-DD` string, read once by the caller (`main.ts`)
and passed in. `parentView` SHALL NEVER read the clock. `constants` carries `ZONE_DURATION`,
`SESSION_DURATION`, `ZONE_ORDER`, `REQUIRE_SIDE_MATCH`, `REQUIRE_LEVEL_MATCH`,
`ZONE_FACT_MIN_CAMERA_SESSIONS` and `NUDGE_MIN_NIGHTS`, passed in so that tests can vary them.

13.3 `parentView` SHALL have no DOM, no clock, no randomness, no storage access and no
network access. It MAY import from `src/logic/`. Nothing under `src/logic/` SHALL import it
(`structure.md`). It SHALL NOT change `src/logic/stats.ts`; it SHALL call
`computeVerifiedTime` for the time fact and SHALL compute the zone fact and the nights
itself (requirements 5.2 and 7.2).

13.4 EVERY sentence SHALL be built from the approved table of requirement 11.3, filling in
only numbers, dates and zone names. THE zone names SHALL be written `upper-right`,
`upper-left`, `lower-left`, `lower-right`, with a hyphen before "turn" in the sentences.

13.5 THE same inputs SHALL always give the same result. The result SHALL NOT depend on the
order of the stored sessions.

13.6 `parentView` SHALL NOT change, add or remove a stored value, and SHALL NOT change a
game rule or number.

13.7 `parentView` SHALL skip any stored session whose numbers are out of range: any second
count (`secondsBrushed`, `secondsUntracked`) below 0 or above 30 in a zone result, any
missing field, or a `durationSeconds` below 0 (Decision Q11). `parentView` SHALL also skip a
session whose zone seconds (`secondsBrushed` plus `secondsUntracked`, summed over all its
zone results) exceed its `durationSeconds` (Decision N4). A skipped session SHALL count
nowhere: not in the day rows, not in any duration, not in the zone fact, not in the nights,
and not toward "No sessions yet." (a store holding only skipped sessions shows that line).

---

### 14. Tests

**Tag: needed for the video.**

**As a developer, I want fast-check properties and guards that hold for all inputs, so that
the parent screen can never show a number or a sentence that is not true.**

Properties 14.1 to 14.8 use sessions built by the existing `sessionResultArb` of `/tests/`
(core design section 11), with arbitrary modes, verified flags, times of day and dates.
Property 14.15 adds sessions with odd numbers.

14.1 **Time ceiling:** for any sessions, "the camera saw brushing" is at most 30 seconds per
verified zone result, at most 120 per camera-mode session, and at most "time with the game".
"Camera saw brushing" plus "timer only" is at most "time with the game". All three equal
their definitions in requirement 4.1 over the sessions of the window.

14.2 **Timer-only and unverified never count as seen or unseen:** adding any number of
timer-only sessions, or changing any zone result to unverified, never raises "the camera saw
brushing", never changes the zone fact, and never makes a nudge appear.

14.3 **Nudge only when true:** whenever a nudge is returned, its zone and its number equal an
independent count of the stored sessions by the rule of requirement 7.2 (the test counts
without calling `parentView`), the number is at least `NUDGE_MIN_NIGHTS`, the zone is the one
with the most nights (ties to the first in `ZONE_ORDER`), and the sentence equals the
approved sentence with only the zone name and the number replaced. When no zone has
`NUDGE_MIN_NIGHTS` nights, none is returned. Two night sessions on one day never give two
nights. A day on which any verified night session has `secondsBrushed > 0` for the zone never
counts for it. An unverified night session neither counts nor blocks, and a day whose night
sessions are all unverified for the zone never counts. A session with untracked seconds but
`secondsBrushed > 0` never makes a night. The nudge appears or not whatever the number of
camera-mode sessions in the window (requirement 7.5).

14.4 **Seven days:** `parentView` returns exactly seven day rows, consecutive, ending today;
each count equals the number of stored sessions with that date; sessions outside the seven
days appear in no row and in no duration, zone fact or night.

14.5 **Too little data:** with no sessions, `parentView` returns only "No sessions yet." in
place of the facts (no day rows, no duration, no zone, no nudge). With fewer than
`ZONE_FACT_MIN_CAMERA_SESSIONS` camera-mode sessions in the window, it returns "Not enough
camera sessions yet." and no zone. With 3 or more camera-mode sessions but no verified zone
result, it returns the same line and no zone (requirement 5.8). It never names a zone whose
highest average of unseen seconds is 0 (requirement 5.4).

14.6 **Zone fact:** when the data is sufficient and one zone has the highest positive
average, that zone equals `zoneMostMissed` over the sessions of the window, and
"camera saw brushing" equals `computeVerifiedTime` over them. On a tie, every tied zone is
named, in `ZONE_ORDER` order, in the tie sentences of requirement 5.3 (rows 10 and 10b of the
approved table; "and" before the last name, no comma before "and"). The zone fact and the
nudge are computed separately and may differ.

14.7 **Wording guard:** a test SHALL read every parent-facing string (the whole table of
requirement 11.1, and every sentence `parentView` returns over generated sessions) and fail if
any contains, as a word or word stem, case-insensitively: risk, danger, disease, decay,
cavity-free, prevent, cure, guarantee, diagnose, clinic, doctor, missed, skipped. It SHALL
also fail on a run of 7 or more digits, an `@`, `www` or `http`, so that no phone number,
address, e-mail or link appears. It SHALL also check that every sentence is in the approved
table, and that no sentence says a zone "was missed". (Word stems are matched so that
"prevents" or "risky" fail too.)

14.8 **Disclosure:** `parentView` always returns the six disclosure lines of requirement 8.1,
in order, in every data state, with no seventh line. A test SHALL fail if
`REQUIRE_SIDE_MATCH` or `REQUIRE_LEVEL_MATCH` is `true` while line 3 is the line of this spec
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
a keyboard hold of Space or Enter passes in the same way; the gate is closed again each time
the screen opens; the gate stores nothing.

14.12 **Privacy and timers:** the existing privacy guard (core requirement 13.10) and tracking
guard keep passing and scan every new file. A test SHALL fail if any new file of this spec
calls `setInterval` or `setTimeout`, loads camera code, or touches `localStorage` outside the
storage module.

14.13 **Targets and text:** where the existing tests can check the DOM, a test SHALL check
that every button has a touch target of at least 48 px and an accessible name, that no
fact is in the DOM before the gate is passed, and that the screen holds no fog, flicker or
sound.

14.14 **Nothing broken:** every existing test passes unchanged.

14.15 **Odd stored data:** for any mix of valid sessions and sessions with out-of-range
numbers (a second count below 0 or above 30 in a zone result, a missing field, a negative
`durationSeconds`, or zone seconds that sum to more than `durationSeconds`), the result of
`parentView` equals its result for the valid sessions
alone. The ceilings of property 14.1 hold for the whole mix.

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
module's list of keys (requirement 9.3), `main.ts` (wiring only) and `index.html` (one line
only: `<link rel="stylesheet" href="/src/ui/parent-screen.css" />`). Any other change SHALL
be listed in `design.md` and approved by Dr. Yatin before it is built.

---

## Lines for Dr. Yatin to approve

Every NEW parent-facing line of this spec is below, one per row, with where it is shown.
Dr. Yatin approved every row on 22 Nov 2026, exactly as written, and no row is waiting. Rows
marked "decided 22 Nov" were set by him earlier that day. "Shown" means visible text; nothing
on this screen is spoken. `<...>` marks a
part a template fills in. The title screen keeps its own approved privacy line ("The camera
stays on this phone. Nothing is saved or sent."); it is not a row here.

| # | Proposed text | Where it is shown | Status |
|---|---------------|-------------------|--------|
| 1 | Grown-ups | Heading of the parent screen | approved 22 Nov |
| 2 | Hold the button for 3 seconds. | Gate, instruction line | approved 22 Nov |
| 3 | Hold | Gate, label of the button | approved 22 Nov |
| 4 | Back | Back button | Existing approved line (`display-text.ts`) |
| 5 | Sessions in the last 7 days | Heading of the day rows | approved 22 Nov |
| 6 | `<weekday> <day> <month>`: `<n>` | One day row (for example "Mon 16 Nov: 2") | approved 22 Nov |
| 7 | Time with the game: `<m>` min `<s>` s | Facts (requirement 4.1) | approved 22 Nov |
| 8 | Of that, the camera saw brushing: `<m>` min `<s>` s | Facts (requirement 4.1) | approved 22 Nov |
| 9 | Timer only, not checked by the camera: `<m>` min `<s>` s | Facts (requirement 4.1) | approved 22 Nov |
| 10 | Brushing was seen least during the `<zone>` turn. | Zone fact, one turn (requirement 5.3) | approved 22 Nov |
| 10b | Brushing was seen least during the upper-left and lower-left turns. For three turns: Brushing was seen least during the upper-right, upper-left and lower-left turns. | Zone fact, a tie of two or more turns (requirement 5.3). Names follow `ZONE_ORDER`, "and" before the last name, no comma before "and"; if all four tie, all four are named | approved 22 Nov |
| 11 | Brushing was seen in every turn. | Zone fact when every verified turn had no unseen time (requirement 5.4) | approved 22 Nov |
| 12 | Not enough camera sessions yet. | Zone fact, when the window has fewer than 3 camera-mode sessions, or 3 or more but no verified zone result (requirements 5.5, 5.8) | approved 22 Nov |
| 13 | No sessions yet. | Facts, when nothing is stored, and after "Clear all data" | approved 22 Nov |
| 14 | During the `<zone>` turn, brushing was not seen on `<n>` nights. Try brushing it first tonight. | The nudge | Approved by Dr. Yatin on 22 Nov 2026 (`dental-rules.md`); decided 22 Nov. Only `<zone>` and `<n>` change |
| 15 | The camera picture stays on this phone. It is never saved or sent. | Disclosure line 1 | decided 22 Nov |
| 16 | Brushing times and the Monster Book are saved on this phone only, until you press Clear all data. | Disclosure line 2 | decided 22 Nov |
| 17 | The camera sees a moving hand near the mouth. It cannot see the brush, the teeth, or which part of the mouth is being brushed. | Disclosure line 3 | decided 22 Nov |
| 18 | In camera sessions, monsters get weaker in turns where brushing was often not seen. | Disclosure line 4 | decided 22 Nov |
| 19 | A monster that is nearly beaten when the time is up counts as beaten. | Disclosure line 5 | decided 22 Nov |
| 20 | Every monster your child meets goes into the Monster Book, beaten or not. | Disclosure line 6 | decided 22 Nov |
| 21 | Clear all data | Button; also the clearing button of the confirmation | approved 22 Nov |
| 22 | Clear all data from this phone? It cannot be undone. | Confirmation | approved 22 Nov |
| 23 | Keep | Confirmation, the button that keeps the data | approved 22 Nov |
| 24 | The data on this phone could not be cleared. | Shown if sessions can still be read after the clear (requirement 9.5) | approved 22 Nov |
| 25 | upper-right, upper-left, lower-left, lower-right | Zone names inside rows 10, 10b and 14 (hyphen before "turn": Decision Q8) | approved 22 Nov |

---

## Decisions (22 Nov 2026)

Dr. Yatin's answers. Each is applied in the requirement named.

- **Q1.** All time facts cover the last 7 calendar days, like the day rows. Three lines only:
  time with the game, of that the camera saw brushing (`computeVerifiedTime`), and timer only,
  not checked by the camera. No leftover line. (Requirement 4)
- **Q2.** A "night" for the nudge: a night session (17:00 to 23:59) in camera mode, in the last
  7 calendar days, counted once per calendar day, where the zone's verified turn had
  `secondsBrushed === 0`. Untracked seconds and unverified results never count. (Requirement 7.2)
- **Q3.** The nudge appears when a zone has 2 or more nights. It names the zone with the most
  nights, a tie to the first in `ZONE_ORDER`. One nudge at most. The nudge zone and the zone
  fact are computed separately and may differ. (Requirements 5.7, 7.3, 7.6)
- **Q4.** The zone fact uses the last 7 days, camera sessions, verified zones. It is shown only
  with 3 or more camera-mode sessions in the window, otherwise "Not enough camera sessions
  yet." `stats.ts` is not changed; `parentView` filters and computes. With no sessions at all
  the screen shows only "No sessions yet." (Requirements 5, 6)
- **Q5.** Disclosure line 1 on this screen: "The camera picture stays on this phone. It is
  never saved or sent." The title screen keeps its own line. (Requirement 8.1)
- **Q6.** Disclosure line 2 says that brushing times and the Monster Book are saved on this
  phone only, until Clear all data. Checked against the storage code: true. (Requirements 8.1, 8.5)
- **Q7.** Disclosure line 3 says what the camera sees and cannot see; line 4 says that in
  camera sessions monsters get weaker in turns where brushing was often not seen; lines 5 and 6
  stay. Line 4 checked against the kind-proximity code: true. (Requirements 8.1, 8.5)
- **Q8.** Zone names are written with a hyphen before "turn". The nudge needs 2 or more nights,
  so "nights" is always plural. (Requirements 5.6, 7.3, 13.4)
- **Q9.** On a tie in the zone fact, every tied turn is named in `ZONE_ORDER` order. If every
  verified turn had no unseen time, the screen shows "Brushing was seen in every turn."
  (Requirements 5.3, 5.4)
- **Q10.** Confirmed: `parentView(sessions, constants, today)`, `today` a local calendar date
  passed in by the caller. `parentView` never reads the clock. (Requirement 13.2)
- **Q11.** `parentView` skips any stored session whose numbers are out of range (a second
  count below 0 or above 30 per zone, missing fields, `durationSeconds` below 0). Skipped
  sessions count nowhere. (Requirements 13.7, 14.15)
- **Q12.** The hold gate may use `requestAnimationFrame` and pointer-event timestamps. A
  keyboard hold (Space or Enter, 3 s) is the accessible path. No second gate. (Requirements
  2.6, 2.7)
- **Q13.** The parent screen is in the 4 Dec video. The "needed for the video" tags stay, and
  the nudge (requirement 7) is now also "needed for the video".

- **N1.** The nudge has only its own rule (2 or more nights for one zone). The 3-camera-session
  minimum applies to the zone fact only, not to the nudge. (Requirements 6.2, 7.5, 14.3)
- **N2.** A calendar day counts as a night for a zone only when every night session of that
  day had 0 seconds of brushing seen in that zone's verified turn. If any night session that
  day saw brushing in that turn, the day does not count. A night session whose turn is
  unverified neither counts nor blocks; if all of that day's night sessions are unverified
  for the zone, the day does not count. This refines Q2. (Requirements 7.2, 14.3)
- **N3.** If the window has 3 or more camera-mode sessions but no verified zone result, the
  zone fact shows row 12, "Not enough camera sessions yet." (Requirements 5.8, 14.5)
- **N4.** `parentView` also skips a session whose zone seconds (brushed plus untracked, summed
  over its zones) exceed its `durationSeconds`. Skipped sessions count nowhere. (Requirements
  13.7, 14.15)
- **N5.** Tie wording: "Brushing was seen least during the upper-left and lower-left
  turns." For three: "...during the upper-right, upper-left and lower-left turns." Names
  follow `ZONE_ORDER`; "and" before the last; no comma before "and". If all four tie with
  unseen time, the same rule names all four. (Requirements 5.3, 14.6; row 10b)
- **index.html link.** Dr. Yatin said YES: the parent screen may add one line to `index.html`,
  `<link rel="stylesheet" href="/src/ui/parent-screen.css" />`, and nothing else in that file.
  It is added to the allowed list of requirement 15.3.
- **Lines table.** Dr. Yatin approved rows 1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 21, 22, 23,
  24 and 25 on 22 Nov 2026, exactly as written, and the tie form as row 10b. Rows 14 to 20 were
  already decided and row 4 is an existing line. No row is waiting.

