Make one sentence in `README.md` exact. Change ONLY `README.md`. Do not edit any other file.
Do not run the dev server.

Read first: `.kiro/steering/dental-rules.md`, `src/tracking/thresholds.ts` (`REQUIRE_SIDE_MATCH`,
`REQUIRE_LEVEL_MATCH`) and the current `README.md`.

Why: Dr. Yatin's review on 27 Nov 2026. The camera does not check which part of the mouth is
brushed (both checks are false), so "when its part has been brushed" says more than the game does.
The ghoul fades while the child keeps brushing during that part's turn.

In the first paragraph of `README.md`, replace exactly
"monster dissolves into smoke when its part has been brushed."
with exactly
"monster dissolves into smoke as the child keeps brushing during its turn."

The old text may wrap across two lines in the file (it starts with "each" at the end of the line
before). Keep the line wrapping tidy. Change nothing else. If the old text is not found exactly once,
stop, say so, and change nothing. Then print the first paragraph as it now reads.
