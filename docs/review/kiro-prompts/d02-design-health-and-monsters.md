This is a SPEC EDIT, not a build. Do not write app code.

Edit only this file: `.kiro/specs/core-brushing-loop/design.md`.
Do not create, edit or delete any other file.
Read first: every file in `.kiro/steering/`, then
`.kiro/specs/core-brushing-loop/requirements.md` (the source of truth), then the file you
are editing.
Change ONLY section 6 ("Health maths") and section 7 ("Morning / night classification").
Keep every other section exactly as it is, word for word.
If the requirements and an instruction below disagree, stop and say so. Do not guess.

THEME: the numbers after Dr. Yatin's decisions of 15 Nov 2026, the corrected rare rule,
and a fixed rule for choosing monsters.

SECTION 6 — HEALTH MATHS

1. Constants table: add four rows.
   | `UNTRACKED_DRAIN` | 2 | Health lost per second when the signal is `null` (req 7.7); `H_MAX / ZONE_DURATION` |
   | `UNTRACKED_LIMIT` | 10 | A camera-mode zone with more untracked seconds than this is unverified (req 9.3) |
   | `MISS_WINDOW` | 7 | Number of most recent camera-mode sessions used for miss scores (req 14.1) |
   | `REQUIRE_LEVEL_MATCH` | true | When false, level is ignored and only side is checked (req 5.7) |
2. The "Design choice" note under the constants: replace the sentence that says the
   values keep "property tests free of floating-point drift" with: "Starting health is
   rounded to a whole number and every change is −2 or −3, so health is always a whole
   number." Keep "Approved: defeat after 20 s of matching brushing." and add: "The 20 s
   leaves slack for seconds the tracker misses."
3. "Camera-mode per-second damage" table: change the 17-second row's outcome to
   "Fled (rescued: 9 ≤ 9)".
4. Replace the whole "Timer-only drain" subsection (heading, formula, table, paragraphs
   and its Design-choice note) with a subsection "Untracked drain (req 7.7, 8.5)":
   - When the signal is `null`, in either mode, the active monster loses
     `UNTRACKED_DRAIN = 2` per second. It is subtracted each tick, like camera damage.
   - Timer-only mode: every signal is `null` and every monster starts at 60, so health is
     `60 − 2 × elapsed` and reaches 0 exactly at 30 s.
   - Camera mode: a second the tracker cannot see costs the monster 2 instead of 3. Mixed
     example: 12 untracked seconds (−24) and 12 matched seconds (−36) defeat a normal
     monster.
   - A camera-mode zone with more than 10 untracked seconds is saved as unverified.
5. "Kind-proximity starting health", Step 1: replace the formula block with
   ```
   recent        = the MISS_WINDOW (7) most recent camera-mode sessions, by startedAt
   For each session s in recent, each zone z whose result is verified:
     miss(s, z) = max(0, 30 - secondsBrushed - secondsUntracked)
   n(z)          = number of verified results for z in recent
   missScore(z)  = n(z) > 0 ? Σ miss(s, z) / (30 × n(z)) : 0
   ```
   and the sentence after it with: "`missScore(z) ∈ [0, 1]`. Timer-only sessions,
   unverified zones and sessions older than the 7 most recent contribute nothing."
6. Step 2: the formula becomes
   `startingHealth(z) = clamp(round(60 × (1 − 0.4 × missScore(z))), 36, 60)`.
   Add: "Not applied in timer-only mode (starting health is always 60)." In the
   Design-choice note change "Dr. Yatin to confirm the curve shape." to "Linear curve
   confirmed by Dr. Yatin 2026-11-15."
7. "15% rescue rule": change "→ **defeated** ('flees into smoke')" to "→ **fled** ('flees
   into smoke'; counts as beaten)". Replace the paragraph beginning "In timer mode, health
   is always 0 at zone end" with "In timer-only mode health is 0 at zone end, so the
   monster is already defeated and the rescue never applies."
8. Add a new subsection at the end of section 6, "After a monster is beaten: smoke
   (req 7.8)":
   - When a monster is defeated before its zone ends, the zone keeps running and the
     screen shows smoke over the zone.
   - `smokeFraction = 1 − secondsSmokeCleared / max(1, ZONE_DURATION − defeatedAtElapsed)`,
     clamped to [0, 1]. It is worked out for drawing only.
   - The line "Keep brushing! Brush the smoke away!" is spoken and captioned once.
   - Nothing is won or lost: no outcome, stored value or message depends on the smoke.

SECTION 7 — MORNING / NIGHT

9. Under `classifyTimeOfDay`, add: "The date and time of day are fixed when the session
   starts. A session that crosses midnight keeps its start date."
10. Replace `isRareEligible(sessions, date)` and its code with:
    ```typescript
    // src/logic/monster-book.ts
    function isRareEligibleForNewSession(
      todaysSessions: readonly SessionResult[],   // stored sessions with today's date
      newTimeOfDay: TimeOfDay,                    // the session about to start
    ): boolean {
      const times = [...todaysSessions.map(s => s.timeOfDay), newTimeOfDay];
      return times.includes('morning') && times.includes('night');
    }
    ```
11. Replace the Design-choice note under it with: "Rare eligibility is decided when the
    session starts and counts the session that is starting. So tonight's session is
    rare-eligible when a morning session was saved earlier today. (Corrected 2026-11-15:
    the earlier version needed a night session to be stored already, which could not be
    true at the first night session.)"
12. Add a new subsection at the end of section 7, "Monster assignment (req 10.9, 10.10)":
    ```
    assignMonsters(pastSessions, rareEligible):
      owned    = union of monstersEarned over pastSessions
      commons  = the 8 common monsters in table order
      start    = (pastSessions.length × 4) mod 8
      rotated  = commons from position start, wrapping round
      ordered  = [commons not owned, in table order] followed by [rotated, owned only]
      if rareEligible:
        rare   = first rare in table order not owned, else first rare in table order
        return [ordered[0], ordered[1], ordered[2], rare]      // rare on the last zone
      return [ordered[0], ordered[1], ordered[2], ordered[3]]
    ```
    Add: "No randomness. The same past sessions always give the same four monsters."
    Add the twelve names from requirement 10.4 as the table order.

DO NOT TOUCH: sections 1, 2, 3, 4, 5, 8, 9, 10 and 11.

When finished, print a short list of what you changed, then stop.
