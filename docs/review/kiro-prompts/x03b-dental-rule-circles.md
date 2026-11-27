Add the section below to `.kiro/steering/dental-rules.md`, directly after the section
`## What "brushing a zone" means to the game` and before `## Wording rules (Indian dental
advertising code, DCI)`, exactly as written. It is Dr. Yatin's clinical rule, approved by him on
27 Nov 2026 (Fones technique for all ages 5-9; short back-and-forth allowed on chewing surfaces;
the three lines below approved). Change nothing else. Do not change any code, test, spec or other
steering file. Then print the new section.

```markdown
## Brushing technique (added 27 Nov 2026, Dr. Yatin)
- Children aged 5-9 are taught **small, gentle circles** on the outer surfaces of the teeth
  (Fones technique). This is the only technique the game teaches, shows or praises.
- **Chewing surfaces** are brushed with short back-and-forth strokes. That is correct and the
  game must never treat it as a mistake.
- **Long back-and-forth scrubbing along the gum line** is the habit to change. The game coaches
  it gently; it never punishes it.
- The camera sees only the hand, not the brush or the tooth surface. So the game may say
  "small circles" as a reminder, but it never tells the child or the parent that they brushed
  wrong, that scrubbing damages gums, or that the camera saw the technique, unless a debug-page
  test has proven the check (TRACKING-TEST-RESULTS section 11) and Dr. Yatin has approved it.
- Brushing time still counts when the stroke looks like scrubbing (benefit of the doubt).
  Circles can earn extra foam or make a ghoul turn to smoke faster; scrubbing never removes
  progress already earned.
- Every picture, animation and demo video shows small circles on the outer surfaces.
  No footage of a child or adult scrubbing is shown as the right way.

## Allowed child-facing lines about technique (each needs voice + picture)
- "Small circles, like drawing little moons!"
- "Gentle circles. Soft and slow."
- (chewing turn) "Now scrub the chewing tops, short and quick."
```

Rules: change only `.kiro/steering/dental-rules.md`. No network calls. If the new section
conflicts with anything already in a steering file or the spec, STOP, say exactly what, and change
nothing.
