This is a SPEC EDIT, not a build. Do not write app code. Edit only
`.kiro/specs/mirror-and-screens/design.md`.

Yes: fix the two remaining places that say only `smokeLook` reads `smokeFraction` (the sentence
near line 512 in section 5.4 and the requirement 6.6 row in section 9) so they agree with design
test 5 as you just rewrote it: only `smokeLook` and `monsterDrawState` read `smokeFraction`, and
`monsterDrawState` reads it only to tell `defeated` from `gone`. Change nothing else.

When finished, print the two changed passages, then stop.
