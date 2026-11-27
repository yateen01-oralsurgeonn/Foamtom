---
inclusion: always
---

# Dental rules (author: Dr. Yatin Shinde, BDS)

These are the dentist's rules for the game. Do not change them without his explicit say.
Where a rule is marked **[TO CONFIRM]**, ask before building on it.

## Session
- A full brush is **2 minutes**.
- Split into **4 zones x 30 seconds**: upper left, upper right, lower left, lower right.
  Front teeth are brushed as part of the zones on either side.
- Zones are **rough areas of the mouth** (side + upper/lower), not single teeth.
  The game must never claim it can see individual teeth.
- Zone order: upper right, upper left, lower left, lower right.

## What "brushing a zone" means to the game
- The brush hand is near the mouth and moving. The game tells the child which zone to
  brush; the camera does not check the side, because a child brushing across the face
  holds the hand on the other side (tested 21 Nov 2026).
- The camera does not check upper vs lower either: for the chewing surface of the upper
  teeth the hand hangs below the mouth (tested 21 Nov 2026). Dr. Yatin set
  `REQUIRE_LEVEL_MATCH` to `false`.
- If tracking is uncertain, the game gives the benefit of the doubt to time
  (the zone timer still runs) rather than punishing the child.
- The game guides the zone order; the camera confirms real brushing at the mouth.

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

## Wording rules (Indian dental advertising code, DCI)
- No claims that the game prevents cavities, cures anything, or replaces a dental visit.
- No clinic name, phone number, address or registration number anywhere in the app.
- Allowed: "Brush for two minutes", "Don't forget the back teeth", "Brush morning and night".
- Monsters represent "cavity monsters" as a playful idea only, not a diagnosis.

## Parent screen wording
- Show facts only: minutes brushed, sessions per day, zone most often missed.
- No medical judgement ("Your child is at risk" is forbidden).
- Allowed nudge (reworded 22 Nov 2026 by Dr. Yatin, because the camera checks only a
  moving hand near the mouth, not which side): "During the upper-right turn, brushing was
  not seen on 3 nights. Try brushing it first tonight." The zone name and the number
  change; nothing else in the sentence does. The parent screen never says a zone "was
  missed" as if the camera saw that side.
