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
| 2026-11-21 | Laptop webcam | Edge | detector | palm | Debug page, preview mirrored by CSS. CSP check in Chrome: no CSP errors (workers, blob:, unsafe-eval, media-src) with only wasm-unsafe-eval added; MediaPipe graphs started; one 404 (favicon) |

## 2. Hand-point comparison

| Date | Hand point | Surfaces passing the side check (out of 12) | Surfaces passing the level check (out of 12) | Note |
|---|---|---|---|---|
| 2026-11-21 | Palm | 0 of 1 tested | 1 of 2 tested | Test stopped by Dr. Yatin's decisions of 21 Nov; side and level are no longer checked |
| 2026-11-21 | Wrist | not tested | not tested | Stopped by decision; the camera sees the hand, not the brush head, so wrist would fail the same way |
| 2026-11-21 | Fingertips | not tested | not tested | As above |

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
| 2026-11-21 | Right | Lower left | Outer | | | | Fail | Reached across the face; palm stayed right of the mouth, read `right` on both of 2 tries. Side rows no longer required (decision 21 Nov) |
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
| 2026-11-21 | Left | Lower left | Outer | | | | | Read `left` on 1 try |
| | Left | Lower left | Chewing | | | | | |
| | Left | Lower left | Inner | | | | | |
| | Left | Lower right | Outer | | | | | |
| | Left | Lower right | Chewing | | | | | |
| | Left | Lower right | Inner | | | | | |

## 4. Level check (24 rows)

Read the `level` field. Result is for the HAND_POINT in use: pass if at least 2 of its 3 codes are R.

| Date | Brush hand | Zone | Surface | Palm | Wrist | Fingertips | Result | Note |
|---|---|---|---|---|---|---|---|---|
| 2026-11-21 | Right | Upper right | Outer | RRR | | | Pass | After NEAR_MOUTH_FACE_WIDTHS 0.7 -> 1.1; handNearMouth true on all 3; moving false in screenshots (hand still); moving read true while brushing, watched live |
| 2026-11-21 | Right | Upper right | Chewing | WUW | | | Fail | Read `lower`, `unknown`, `lower`: the brush lies flat at mouth height and the palm hangs below the mouth |
| | Right | Upper right | Inner | | | | | |
| | Right | Upper left | Outer | | | | | |
| | Right | Upper left | Chewing | | | | | |
| | Right | Upper left | Inner | | | | | |
| 2026-11-21 | Right | Lower left | Outer | | | | | Read `lower` on 2 tries; 3 needed |
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
| 2026-11-21 | Left | Lower left | Outer | | | | | Read `lower` on 1 try; 3 needed |
| | Left | Lower left | Chewing | | | | | |
| | Left | Lower left | Inner | | | | | |
| | Left | Lower right | Outer | | | | | |
| | Left | Lower right | Chewing | | | | | |
| | Left | Lower right | Inner | | | | | |

## 5. Other checks

| Date | Check | Case | Pass or Fail | Note |
|---|---|---|---|---|
| 2026-11-21 | Mirror flip signal | Signal says `left` when the child's own left hand is raised | Pass | Left hand at left lower teeth read `left` |
| 2026-11-21 | Mirror flip hand | Hand appears on the left of the mirrored preview | Pass | |
| 2026-11-21 | Hand resting on sink edge | The signal follows the hand at the mouth | Pass | Other hand resting on the table |
| 2026-11-21 | Hand touching cheek | The signal follows the hand at the mouth | Pass | No change in the reading |
| 2026-11-21 | Both hands near the mouth | Pass is `side` reading `unknown` | Pass | Side and level both `unknown` |
| 2026-11-21 | Second person behind the child | The signal does not change | Pass | Brusher close, second person behind: handNearMouth true. First try had the second person in FRONT (closer, larger face), so the largest-face rule followed them: expected, but a younger sibling leaning in closer is a real risk |
| 2026-11-21 | Lights dimmed until the face is lost | Pass is `null` | Pass | Room darkened in daytime; screen said `null` for palm, wrist and fingertips |
| 2026-11-21 | Phone: mirror and monster placement | Mirror image; upper right on the right cheek, lower left low on the left cheek; follows a tilted head | Pass | Motorola Edge 50 Neo, live site (10.2) |
| 2026-11-21 | Phone: face lost | Monster returns to the plain position, nothing shown or said | Pass | Covering the face with a hand did not lose the face (detector still saw it); covering the camera did (10.3) |
| 2026-11-21 | Phone: tab switch under a minute | Preview returns, no new prompt, same mode | Pass | 10.4 |
| 2026-11-21 | Phone: camera light | Off at session end and when the tab is hidden | Pass | Green camera dot (10.5) |
| 2026-11-21 | Phone: camera refused | Plain screen, no preview, no repeat prompt | Pass | Blocked in Chrome site settings (10.6) |
| 2026-11-21 | Landscape and desktop | Preview usable; touch targets at least 48 px; no screenshot, record or share button | Pass | Phone landscape by Dr. Yatin; sizes and buttons measured in Chrome (Brush 186 by 75 px, big-button minimum 160 by 72 px) (10.7) |
| 2026-11-21 | Network during a camera session | Only same-origin requests; nothing sent while brushing | Pass | 0 requests in 15 s of brushing on the live site (10.8) |

## 6. Counts and decision

| Date | Count | Side check | Level check | Note |
|---|---|---|---|---|
| 2026-11-21 | Surfaces passing, out of 24 | 0 of 1 tested | 1 of 2 tested | Stopped by decision |
| 2026-11-21 | Surfaces passing, right hand, out of 12 | 0 of 1 tested | 1 of 2 tested | Right hand, lower left fails side; upper right outer passes level, chewing fails |
| 2026-11-21 | Surfaces passing, left hand, out of 12 | not tested to 3 tries | not tested to 3 tries | One try each read correctly |

Verdicts, in Dr. Yatin's own words, with initials and date:

Side check:
Fail. "I have taken the two screenshots with the right hand, but the side should be shown on the left. It is showing on the right." Decision 21 Nov 2026, chosen in chat: option 1, the camera checks that the child is brushing, not which side (side is not checked; the game still tells the child which zone). Initials: YGS, 2026-11-21.

Level check:
Failed for the chewing surface of the upper right teeth (WUW; the palm hangs below the mouth). Decision 21 Nov 2026, chosen in chat: option 1, stop the test and set `REQUIRE_LEVEL_MATCH` to `false`; the camera checks brushing at the mouth and moving, the game guides the zone. Initials: YGS, 2026-11-21.

## 7. Speed

| Date | Device model | Android version | Chrome version | Note |
|---|---|---|---|---|
| 2026-11-21 | Motorola Edge 50 Neo | not read yet | not read yet | Live site in Chrome, portrait and landscape. Judged by eye (his choice): mirror smooth; monster starts shrinking with a small noticeable lag, more than a second or two. Frames per second NOT measured; 10.1 stays open |
| 2026-11-24 | Motorola Edge 50 Neo | not read yet | not read yet | Live site, full camera session with all effects on. Judged by eye by Dr. Yatin: smooth, no lag (the earlier small lag on the monster is gone). Frames per second not read as a number |

| Date | Line | Frames per second | Pass or Fail | Note |
|---|---|---|---|---|
| | (a) Picture and drawing (20 or more passes) | | | |
| | (b) Tracking rate (at least 5 in a normal second) | | | |

## 8. Asset sizes

| Date | File | Size in bytes | Note |
|---|---|---|---|
| 2026-11-20 | blaze_face_short_range.tflite | 229746 | From MEDIAPIPE-DOC-CHECK.md |
| 2026-11-20 | face_landmarker.task | 3758596 | From MEDIAPIPE-DOC-CHECK.md |
| 2026-11-20 | hand_landmarker.task | 7819105 | From MEDIAPIPE-DOC-CHECK.md |
| 2026-11-20 | wasm/vision_wasm_internal.js | 336624 | From MEDIAPIPE-DOC-CHECK.md |
| 2026-11-20 | wasm/vision_wasm_internal.wasm | 14665716 | From MEDIAPIPE-DOC-CHECK.md |
| 2026-11-20 | total | 26809787 | From MEDIAPIPE-DOC-CHECK.md |
| 2026-11-21 | NOTICE.txt | 1069 | Final build, npm run measure-assets |
| 2026-11-21 | total of public/models | 26810856 | Final build, npm run measure-assets |
| 2026-11-21 | first load (dist without models and lazy camera chunks) | 23121 | 6 files; camera code and models load only after tapping start |


## 9. Brush-head experiment (26 Nov 2026)

Dr. Yatin's idea: in a fist grip the toothbrush comes out of the thumb side of the hand, so the debug page also estimates the brush head (a fourth hand point, `brush-head`, drawn in orange). This is a hypothesis; the game still uses the palm. Brush three times per row. Write the three codes (R, W, U, N as above) for the side the debug page shows. For the level rows, write the codes for `level`. Result: Pass if at least 2 of 3 codes are R.

Side check (3 tries each):

| Date | Brush hand | Zone | Surface | Palm side | Brush-head side | Brush-head level | Result | Note |
|---|---|---|---|---|---|---|---|---|
| | Right hand | Lower left | Outer | | | | | |
| | Right hand | Upper left | Outer | | | | | |
| | Left hand | Lower right | Outer | | | | | |
| | Left hand | Upper right | Outer | | | | | |
| | Right hand | Lower right | Outer (same-side control) | | | | | |
| | Left hand | Lower left | Outer (same-side control) | | | | | |

Level check (3 tries each):

| Date | Brush hand | Zone | Surface | Palm side | Brush-head side | Brush-head level | Result | Note |
|---|---|---|---|---|---|---|---|---|
| | Right hand | Upper right | Chewing | | | | | |
| | Right hand | Lower right | Chewing | | | | | |
