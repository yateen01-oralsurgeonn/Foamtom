# Tracking test results

This file is filled in by Dr. Yatin during the feasibility test of the hand-tracking spec. It is an empty template until then.

## How to fill this in

Words and the letters below only. No screenshots, no pictures, no landmark values. Every row you fill in needs its date.

Reading codes, one letter for each of the three tries:

- R: the signal read the right value.
- W: the signal read the wrong value.
- U: the signal read `unknown`.
- N: the signal was `null`.

U and N both count as not right. A surface passes when at least 2 of its 3 codes are R. Write three codes in each reading cell, for example RRW. Many N while brushing means try the mesh face model (`?face=mesh`).

## 1. Set-up

| Date | Device | Browser | Face model used (detector or mesh) | HAND_POINT | Note |
|---|---|---|---|---|---|
| | | | | | |

## 2. Hand-point comparison

| Date | Hand point | Surfaces passing the side check (out of 12) | Surfaces passing the level check (out of 12) | Note |
|---|---|---|---|---|
| | Palm | | | |
| | Wrist | | | |
| | Fingertips | | | |

## 3. Side check (24 rows)

Read the `side` field. Result is for the HAND_POINT in use: pass if at least 2 of its 3 codes are R.

| Date | Brush hand | Zone | Surface | Palm | Wrist | Fingertips | Result | Note |
|---|---|---|---|---|---|---|---|---|
| | Right | Upper right | Outer | | | | | |
| | Right | Upper right | Chewing | | | | | |
| | Right | Upper right | Inner | | | | | |
| | Right | Upper left | Outer | | | | | |
| | Right | Upper left | Chewing | | | | | |
| | Right | Upper left | Inner | | | | | |
| | Right | Lower left | Outer | | | | | |
| | Right | Lower left | Chewing | | | | | |
| | Right | Lower left | Inner | | | | | |
| | Right | Lower right | Outer | | | | | |
| | Right | Lower right | Chewing | | | | | |
| | Right | Lower right | Inner | | | | | |
| | Left | Upper right | Outer | | | | | |
| | Left | Upper right | Chewing | | | | | |
| | Left | Upper right | Inner | | | | | |
| | Left | Upper left | Outer | | | | | |
| | Left | Upper left | Chewing | | | | | |
| | Left | Upper left | Inner | | | | | |
| | Left | Lower left | Outer | | | | | |
| | Left | Lower left | Chewing | | | | | |
| | Left | Lower left | Inner | | | | | |
| | Left | Lower right | Outer | | | | | |
| | Left | Lower right | Chewing | | | | | |
| | Left | Lower right | Inner | | | | | |

## 4. Level check (24 rows)

Read the `level` field. Result is for the HAND_POINT in use: pass if at least 2 of its 3 codes are R.

| Date | Brush hand | Zone | Surface | Palm | Wrist | Fingertips | Result | Note |
|---|---|---|---|---|---|---|---|---|
| | Right | Upper right | Outer | | | | | |
| | Right | Upper right | Chewing | | | | | |
| | Right | Upper right | Inner | | | | | |
| | Right | Upper left | Outer | | | | | |
| | Right | Upper left | Chewing | | | | | |
| | Right | Upper left | Inner | | | | | |
| | Right | Lower left | Outer | | | | | |
| | Right | Lower left | Chewing | | | | | |
| | Right | Lower left | Inner | | | | | |
| | Right | Lower right | Outer | | | | | |
| | Right | Lower right | Chewing | | | | | |
| | Right | Lower right | Inner | | | | | |
| | Left | Upper right | Outer | | | | | |
| | Left | Upper right | Chewing | | | | | |
| | Left | Upper right | Inner | | | | | |
| | Left | Upper left | Outer | | | | | |
| | Left | Upper left | Chewing | | | | | |
| | Left | Upper left | Inner | | | | | |
| | Left | Lower left | Outer | | | | | |
| | Left | Lower left | Chewing | | | | | |
| | Left | Lower left | Inner | | | | | |
| | Left | Lower right | Outer | | | | | |
| | Left | Lower right | Chewing | | | | | |
| | Left | Lower right | Inner | | | | | |

## 5. Other checks

| Date | Check | Case | Pass or Fail | Note |
|---|---|---|---|---|
| | Mirror flip signal | Signal says `left` when the child's own left hand is raised | | |
| | Mirror flip hand | Hand appears on the left of the mirrored preview | | |
| | Hand resting on sink edge | The signal follows the hand at the mouth | | |
| | Hand touching cheek | The signal follows the hand at the mouth | | |
| | Both hands near the mouth | Pass is `side` reading `unknown` | | |
| | Second person behind the child | The signal does not change | | |
| | Lights dimmed until the face is lost | Pass is `null` | | |

## 6. Counts and decision

| Date | Count | Side check | Level check | Note |
|---|---|---|---|---|
| | Surfaces passing, out of 24 | | | |
| | Surfaces passing, right hand, out of 12 | | | |
| | Surfaces passing, left hand, out of 12 | | | |

Verdicts, in Dr. Yatin's own words, with initials and date:

Side check:

Level check:

## 7. Speed

| Date | Device model | Android version | Chrome version | Note |
|---|---|---|---|---|
| | | | | |

| Date | Line | Frames per second | Pass or Fail | Note |
|---|---|---|---|---|
| | (a) Picture and drawing (20 or more passes) | | | |
| | (b) Tracking rate (at least 5 in a normal second) | | | |

## 8. Asset sizes

| Date | File | Size in bytes | Note |
|---|---|---|---|
| | | | |
