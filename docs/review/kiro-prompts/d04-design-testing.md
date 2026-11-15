This is a SPEC EDIT, not a build. Do not write app code.

Edit only this file: `.kiro/specs/core-brushing-loop/design.md`.
Do not create, edit or delete any other file.
Read first: every file in `.kiro/steering/`, then
`.kiro/specs/core-brushing-loop/requirements.md` (the source of truth), then the whole of
the file you are editing.
Change ONLY section 11 ("Testing strategy"). Keep sections 1 to 10 exactly as they are,
word for word.
If the requirements and an instruction below disagree, stop and say so. Do not guess.

THEME: tests that would fail if the code were wrong. No test may assert a value that the
code sets as a constant.

1. Replace the test table with this one (same columns as today):

| # | Test name | Req | Input | Assertion |
|---|---|---|---|---|
| 1 | `isBrushingTruthTable` | 5.4–5.7 | Every signal (2 × 3 × 3 × 2 = 36) × every zone (4), plus `null` | True only when hand near, moving, side matches and level matches. With `REQUIRE_LEVEL_MATCH` false, level is ignored. `null` is never brushing. |
| 2 | `healthChangesOnlyByTheRule` | 13.1 | 120 signals-or-null, either mode, any past sessions | Each tick: active monster changes by −3 (match), −2 (`null`), or 0, never below 0; no other monster changes; health is a whole number; never increases. |
| 3 | `sessionIsExactly120Ticks` | 13.2, 13.7 | 120 signals-or-null, either mode, any past sessions | Running after each of ticks 1–119 with `activeZoneIndex == floor(ticksDone / 30)`; ended after tick 120; tick 121 returns an equal state; `durationSeconds == 120`. Ticks sent while paused change nothing. |
| 4 | `timerOnlyDefeatsEveryMonsterAt30` | 7.7, 8.5 | Timer-only session, any past sessions | Every monster starts at 60 and is defeated on exactly the 30th tick of its zone; result has 30 brushed, 0 untracked, unverified for every zone. |
| 5 | `rescueAtOrBelow9` | 13.8 | Monster with any whole health 1–60 at zone end | ≤ 9 → `fled`; > 9 → `trapped`. |
| 6 | `resultInvariants` | 9.1–9.3, 10.1, 10.2 | 120 signals-or-null, camera mode | Per zone: brushed + untracked ≤ 30; verified exactly when untracked ≤ 10; `monstersEarned` holds all four ids. |
| 7 | `smokeChangesNothingThatCounts` | 7.8 | Two signal sequences that differ only after a monster is defeated in its zone | Same outcome and same `monstersEarned`; `smokeFraction` stays within [0, 1]. |
| 8 | `monsterTableAndAssignment` | 10.4, 10.9, 10.10 | Any past sessions, rareEligible true/false | 12 monsters = 8 common + 4 rare; four different monsters; no rare unless eligible; when eligible exactly one rare, on the last zone; same input gives the same answer. |
| 9 | `rareNeedsMorningAndNightCountingNewSession` | 13.3 | Any stored sessions for a day + any new time of day | Eligible exactly when stored + new include a morning and a night. |
| 10 | `missScoreSources` | 13.9 | Any mix of sessions | Only verified zones of the 7 most recent camera sessions matter; adding timer-only sessions, unverified zones or older sessions changes nothing; every score in [0, 1]. |
| 11 | `startingHealthBounds` | 13.6 | Any past sessions | Whole number, 36 ≤ health ≤ 60. |
| 12 | `statsCeiling` | 13.4 | Any sessions | Verified time ≤ 30 per zone and ≤ 120 per session; timer-only sessions and unverified zones add 0. |
| 13 | `storageRoundTrip` | 13.5, 9.5, 9.6 | Any sessions, `Map`-backed fake backend | Load after save deep-equals the input; the stored JSON has only the allowed keys; a throwing backend does not throw out of save or load. |
| 14 | `timeOfDayAllHours` | 10.5 | Hours 0–23 | Matches the stated ranges. |
| 15 | `gameLoopExactTicks` | 13.12, 2.6, 2.7, 15.4 | Fake clock; late and bunched callbacks; hidden spans | 120 visible seconds → exactly 120 ticks; hidden time → none; > 60 s hidden → dropped, nothing saved; wake lock asked once and released. |
| 16 | `privacyGuard` | 13.10 | Files under `/src/` | As written in requirement 13.10. |
| 17 | `wordingGuard` | 13.11, 4.3, 6.2 | `src/audio/lines.ts` | As written in requirement 13.11. |
| 18 | `viewMatchesState` | 11.3–11.5 | Any state reached by ticking | `toView` countdown equals `zoneTimeRemaining`; `zoneId` is the active zone; `healthFraction` in [0, 1]. |
| 19 | `rampGainIsGentle` | 4.4 | Times 0–5000 ms | Starts at 0; never rises faster than the set step; never exceeds the set level. |

2. Replace the "Consequence of `DAMAGE_PER_SECOND = 3`" note with: "Test 3 counts ticks;
   it never reads a constant back. Test 4 pins the timer-only drain: 60 − 2 × 30 = 0."

3. "Test helpers":
   - Mock `localStorage`: say it is a `Map`-backed object passed to `createStorage`.
   - Add "Fake clock and scheduler for `game-loop`: time moves only when the test moves
     it."
   - Signal arbitrary: keep, and make the per-session array
     `fc.array(fc.option(signalArb, { nil: null }), { minLength: 120, maxLength: 120 })`.
   - Replace the session-record arbitrary with a `sessionResultArb` that builds valid
     sessions: exactly four zone results, one per zone in zone order; `secondsBrushed` and
     `secondsUntracked` whole numbers with a sum ≤ 30; for timer-only sessions 30, 0 and
     `verified: false`; for camera sessions `verified` equal to
     `secondsUntracked <= 10`; `monsterOutcome` from `'defeated' | 'fled' | 'trapped'`;
     `monstersEarned` equal to the four `monsterId`s, drawn from the monster table.

DO NOT TOUCH: sections 1 to 10.

When finished, print a short list of what you changed, then stop.
