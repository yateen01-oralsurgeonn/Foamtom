This is a SPEC EDIT, not a build. Do not write app code.

Edit only these two files: `.kiro/specs/core-brushing-loop/requirements.md` and
`.kiro/specs/core-brushing-loop/design.md`.
Do not create, edit or delete any other file.
Keep every part of both files that is not listed below exactly as it is, word for word.
Keep the EARS style and the existing requirement numbers. Do not renumber anything.
If an instruction below conflicts with a steering file or with another requirement,
stop and say so. Do not guess.

THEME: tidy wording left over from the earlier edits. No rule changes. A `null` signal
(requirement 5.2) is the only way the spec says "the tracker cannot see"; the words
"absent" and "placeholder" are old.

`requirements.md`

1. Introduction, first paragraph: change "a minimal placeholder screen" to "a plain
   session screen, a runnable app".
2. Introduction, second paragraph: change "per-second brushing signal (or, in
   guided-timer mode, its absence)" to "per-second brushing signal, or `null` when the
   tracker cannot see the child (in guided-timer mode every signal is `null`)".
3. Requirement 1.2: change "or its absence as input" to "or `null` as input".
4. Requirement 1.3: change "with the tracking signal absent" to "with every signal
   treated as `null` (requirement 5.2)".
5. Requirement 6.1: change "IF the tracking signal is absent or any field is `unknown`"
   to "IF the signal is `null` or any field is `unknown`".
6. Requirement 6.2: change "uncertain or absent" to "uncertain or the signal is `null`".
7. Property 13.4: replace the second sentence ("Timer-only sessions and unverified zones
   SHALL have their seconds-per-zone marked as unverified and SHALL NOT be counted as
   verified brushing ...") with: "Timer-only sessions and unverified zones SHALL NOT be
   counted as verified brushing in parent stats or in 'zone most often missed'." Keep
   the bracketed sentence after it unchanged.

`design.md`

8. Section 2, mermaid diagram: delete the line `SESSION --> STATS` (`session.ts` does
   not use `stats.ts`; stats are read by the parent screen in a later spec). Change
   nothing else in the diagram.
9. Section 2, the paragraph after "Data flow": change "The dashed boundary around 'Pure
   Game Logic'" to "The 'Pure Game Logic' box".
10. Section 11, first paragraph: replace it with: "Tests live in `/tests/` and use
    Vitest. Tests on pure logic are fast-check property tests, except tests 1 and 14,
    which check every possible input instead of sampling. Tests 15 to 17 use fakes or
    read source files. No browser or camera is needed."

When finished, print each changed line before and after, then stop.
