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


Result 26 Nov 2026: failed: the orange point lands beside the knuckles, not on the brush (8 screenshots, same-side hand).

## 10. Calibration experiment (26 Nov 2026)

Dr. Yatin's decision: the debug page learns how each child's hand looks for each zone, then says which zone a frame looks like. This is a hypothesis on the debug page only; the game does not change. Nothing is stored or sent: the learned numbers stay in memory until you press Reset or close the tab.

How to run it:

1. Open the debug page (`npm run dev`, then `/debug/tracking-debug.html`) and allow the camera.
2. Press **Calibrate**. For each zone in the game's order (upper right, upper left, lower left, lower right) the page shows "Get ready: brush ...", counts down, then shows "Brushing ..." for a few seconds. Brush that zone the way you normally do, with the hand you want to test. Cross-face is allowed.
3. To teach the page another hand, press **Calibrate** again and repeat with the other hand. Press **Reset** to start again.
4. Then test: brush each row below three times. The big text shows the calibrated zone and how many frames of the last second agree (for example "UPPER LEFT 6/7"), next to the palm side and level.
5. Write the three codes (R, W, U, N as above) for the calibrated zone and for the palm side. Result: Pass if at least 2 of 3 calibrated-zone codes are R. For the four cross-face rows (the first four) the experiment passes only if every one of them passes.

| Date | Calibration (hands used) | Brush hand | Zone | Surface | Calibrated zone (3 tries) | Palm side (3 tries) | Result | Note |
|---|---|---|---|---|---|---|---|---|
| 27 Nov 2026 | 1 round only (4 zones, 156 frames; done while the screenshot script ran; left hand never learned) | Right hand | Upper left | Outer | NNR | WUR | Not valid | try 1 taken while calibration was still running; try 2 hand away from mouth |
| 27 Nov 2026 | 1 round only (4 zones, 156 frames; done while the screenshot script ran; left hand never learned) | Right hand | Lower left | Outer | RWW | WWW | Fail | try 1: palm said right, calibration said LOWER LEFT (right). Tries 2-3 looked the same but read LOWER RIGHT and UPPER RIGHT 9/9 |
| 27 Nov 2026 | 1 round only (4 zones, 156 frames; done while the screenshot script ran; left hand never learned) | Left hand | Upper right | Outer | WWW | WWW | Not valid | left hand was never calibrated; all read UPPER LEFT |
| 27 Nov 2026 | 1 round only (4 zones, 156 frames; done while the screenshot script ran; left hand never learned) | Left hand | Lower right | Outer | WRN | WWU | Not valid | left hand was never calibrated; try 3 hand away from mouth |
| 27 Nov 2026 | 1 round only (4 zones, 156 frames; done while the screenshot script ran; left hand never learned) | Right hand | Upper right | Outer | NNW | UUW | Fail | tries 1-2 brush held away from the mouth; try 3 read LOWER RIGHT, palm left |
| 27 Nov 2026 | 1 round only (4 zones, 156 frames; done while the screenshot script ran; left hand never learned) | Right hand | Lower right | Chewing | RRR | RRR | Pass | LOWER RIGHT 9/9, 8/8, 9/9 |
| 27 Nov 2026 | 1 round only (4 zones, 156 frames; done while the screenshot script ran; left hand never learned) | Left hand | Lower left | Outer | WWW | RRR | Not valid | left hand never calibrated: all read LOWER RIGHT; palm side correct (left) every time |
| 27 Nov 2026 | 1 round only (4 zones, 156 frames; done while the screenshot script ran; left hand never learned) | Left hand | Upper left | Chewing | WWW | RRR | Not valid | left hand never calibrated: all read LOWER RIGHT; palm side correct (left) every time (palm level said lower) |

Run 2, 27 Nov 2026 14:51: no calibration was loaded (learned frames 0 in all 24 screenshots, page said "calibrate first"), so it gives the PALM baseline only. Palm side, cross-face rows 1-4: wrong 12 of 12 (right hand on the left teeth read right; left hand on the right teeth read left). Same-side rows 5-8: right 11 of 12 (one unknown). This confirms that the palm reports which hand, not which teeth.

**Run 3, 27 Nov 2026 15:58 (valid calibration, both hands).**

| Date | Calibration (hands used) | Brush hand | Zone | Surface | Calibrated zone (3 tries) | Palm side (3 tries) | Result | Note |
|---|---|---|---|---|---|---|---|---|
| 27 Nov 2026 | 2 rounds: right hand, then left (UR 81, UL 82, LL 81, LR 81) | Right hand | Upper left | Outer | RRR | UWW | Pass | UPPER LEFT 2/3, 9/9, 7/8 |
| 27 Nov 2026 | 2 rounds: right hand, then left (UR 81, UL 82, LL 81, LR 81) | Right hand | Lower left | Outer | RWR | WWW | Pass | LOWER LEFT, UPPER LEFT, LOWER LEFT |
| 27 Nov 2026 | 2 rounds: right hand, then left (UR 81, UL 82, LL 81, LR 81) | Left hand | Upper right | Outer | RRR | WWW | Pass | UPPER RIGHT 8/8, 6/6, 8/8 |
| 27 Nov 2026 | 2 rounds: right hand, then left (UR 81, UL 82, LL 81, LR 81) | Left hand | Lower right | Outer | WWW | WWW | Fail | all read UPPER RIGHT: side right, level wrong |
| 27 Nov 2026 | 2 rounds: right hand, then left (UR 81, UL 82, LL 81, LR 81) | Right hand | Upper right | Outer | WWW | RRR | Fail | all read UPPER LEFT: side wrong |
| 27 Nov 2026 | 2 rounds: right hand, then left (UR 81, UL 82, LL 81, LR 81) | Right hand | Lower right | Chewing | WWW | RRR | Fail | all read LOWER LEFT: side wrong |
| 27 Nov 2026 | 2 rounds: right hand, then left (UR 81, UL 82, LL 81, LR 81) | Left hand | Lower left | Outer | WRR | RRR | Pass | UPPER LEFT, LOWER LEFT, LOWER LEFT |
| 27 Nov 2026 | 2 rounds: right hand, then left (UR 81, UL 82, LL 81, LR 81) | Left hand | Upper left | Chewing | RRR | RRR | Pass | UPPER LEFT 8/8, 8/8, 9/9 |

Run 3 reading: cross-face rows 3 of 4 pass, so the experiment FAILS the pass rule (row 4). Side only (ignoring upper/lower): the LEFT hand was right on 12 of 12 tries; the RIGHT hand said "left" on 12 of 12 tries whatever was brushed, so its cross-face passes are not real discrimination. Palm side: cross-face 0 of 12 right, same-side 12 of 12.

**Run 4 (right-hand retry), 27 Nov 2026 16:10.** Dr. Yatin made the cross-face grip clearly different (elbow up, wrist near the chin middle) and calibrated the right hand twice.

| Date | Calibration (hands used) | Brush hand | Zone | Surface | Calibrated zone (3 tries) | Palm side (3 tries) | Result | Note |
|---|---|---|---|---|---|---|---|---|
| 27 Nov 2026 | Reset; right hand twice, left hand once (UR 117, UL 122, LL 122, LR 122) | Right hand | Upper left | Outer | WWW | WWW | Fail | all UPPER RIGHT 9/9 |
| 27 Nov 2026 | Reset; right hand twice, left hand once (UR 117, UL 122, LL 122, LR 122) | Right hand | Lower left | Outer | WWW | WWW | Fail | all UPPER RIGHT |
| 27 Nov 2026 | Reset; right hand twice, left hand once (UR 117, UL 122, LL 122, LR 122) | Right hand | Upper right | Outer | NNW | UUU | Fail | tries 1-2 no hand at the mouth; try 3 LOWER RIGHT 1/1 |
| 27 Nov 2026 | Reset; right hand twice, left hand once (UR 117, UL 122, LL 122, LR 122) | Right hand | Lower right | Chewing | RRR | RRR | Pass | LOWER RIGHT 9/9 x3 |

Run 4 reading: the right hand now said "right" on every answered try, whatever was brushed (run 3 said "left" every time). The right-hand answer flips with each calibration instead of following the brush. **Decision gate: calibration with the current hand-position features FAILS for the right hand.** The game stays as it is (REQUIRE_SIDE_MATCH false); side detection goes to "What's next".


## 11. Circles or scrubbing (27 Nov 2026)

Dr. Yatin's decision: the debug page tells small circles from back-and-forth scrubbing by the shape of the palm's path in the last second. This is a hypothesis on the debug page only; the game does not change and no child-facing or parent-facing text is added. Nothing is stored or sent.

How to run it:

1. Open the debug page (`npm run dev`, then `/debug/tracking-debug.html`) and allow the camera. To try a faster tracking rate add `?interval=50` (milliseconds, 33 to 100) to the address, and write it in the Interval column.
2. The line under the calibration result reads, for example, `CIRCLES  round 0.62  angle 12°  rev 0.10  pts 9  fps 8`. It starts with CIRCLES, SCRUB or UNCLEAR. `pts` is how many frames of the last second were used. `fps` is how many frames were sent to the tracker in the last second. A thin yellow trail on the picture shows the last second of the palm.
3. Brush each row below for 4 seconds, then take the screenshot while still brushing. Do three tries per row.
4. Write the three codes for the shape: R = read what was brushed, W = read the other one, U = unclear, N = null (no hand at the mouth). For the chewing-surface row write what it read (C = CIRCLES, S = SCRUB, U, N).
5. Pass rule: every circles row and every scrub row is R on at least 2 of 3 tries, and no scrub row reads CIRCLES more than once. The chewing-surface row is information only (it shows what the game must NOT nag about).

| Date | Interval (ms) | Brush hand | Zone | How brushed | Shape (3 tries) | fps | Result | Note |
|---|---|---|---|---|---|---|---|---|
| 27 Nov 2026 | 100 | Right hand | Upper right | Small circles | W W U | 9 | Fail | SCRUB, SCRUB, UNCLEAR; round 0.47-0.73 |
| 27 Nov 2026 | 100 | Right hand | Upper right | Side-to-side scrub | U U R | 8-9 | Fail | angle 59-81° (up-down), not side to side |
| 27 Nov 2026 | 100 | Left hand | Lower left | Small circles | U W U | 9 | Fail | round 0.33-0.70 |
| 27 Nov 2026 | 100 | Left hand | Lower left | Side-to-side scrub | R R W | 8-9 | Pass | try 3 read CIRCLES (round 0.42, rev 0.14); angle 89° on tries 1-2 |
| 27 Nov 2026 | 100 | Right hand | Front teeth | Small circles | U U U | 8-9 | Fail | only 2, 4, 5 points: palm barely moves for small circles |
| 27 Nov 2026 | 100 | Right hand | Front teeth | Side-to-side scrub | W U W | 9 | Fail | read CIRCLES twice (round 0.70, 0.52) |
| 27 Nov 2026 | 100 | Right hand | Upper left (cross-face) | Small circles | W W U | 8-9 | Fail | SCRUB, SCRUB, UNCLEAR; round 0.11-0.34 |
| 27 Nov 2026 | 100 | Right hand | Upper left (cross-face) | Side-to-side scrub | R R R | 9 | Pass | angle 20-24°, rev 0.50-0.71 |
| 27 Nov 2026 | 100 | Right hand | Lower right | Chewing surface, short back-and-forth (information only) | U S U | 9 | Info | round 0.22-0.38 |

Run 1 reading (27 Nov 2026, 17:05, interval 100 ms, about 9 fps, dry brush, no calibration): **FAILS the pass rule.** Small circles were never read as CIRCLES (0 of 12 circles tries); the only two CIRCLES readings came from scrub rows. Only the cross-face scrub row (and, just, the lower-left scrub row) passed. The palm point moves very little when the brush makes small circles (the wrist and fingers do the work), so at 9 frames a second the last second holds 2-9 points that look like noise, not a loop. Side-to-side scrubbing at the lower left also read as up-down (angle 89°), so the palm path does not follow the brush head. Next, if Dr. Yatin wants it: one retry at `?interval=50`; if that also fails, circles stay as teaching only (voice lines, pictures, demo video) and stroke detection goes to "What's next".

Run 2 (27 Nov 2026, 17:16, `?interval=50`, measured 15-18 fps, same rows, same codes):

| Date | Interval (ms) | Brush hand | Zone | How brushed | Shape (3 tries) | fps | Result | Note |
|---|---|---|---|---|---|---|---|---|
| 27 Nov 2026 | 50 | Right hand | Upper right | Small circles | U U U | 15-16 | Fail | try 1 hand not near mouth (3 points) |
| 27 Nov 2026 | 50 | Right hand | Upper right | Side-to-side scrub | U R U | 15-16 | Fail | |
| 27 Nov 2026 | 50 | Left hand | Lower left | Small circles | R U U | 16 | Fail | |
| 27 Nov 2026 | 50 | Left hand | Lower left | Side-to-side scrub | U U W | 16-18 | Fail | try 3 read CIRCLES |
| 27 Nov 2026 | 50 | Right hand | Front teeth | Small circles | U R U | 16 | Fail | 5-11 points only |
| 27 Nov 2026 | 50 | Right hand | Front teeth | Side-to-side scrub | U U R | 15-16 | Fail | 3-6 points only |
| 27 Nov 2026 | 50 | Right hand | Upper left (cross-face) | Small circles | R U R | 15-16 | Pass | |
| 27 Nov 2026 | 50 | Right hand | Upper left (cross-face) | Side-to-side scrub | U U U | 16 | Fail | round 0.50-0.53: scrub looked round |
| 27 Nov 2026 | 50 | Right hand | Lower right | Chewing surface, short back-and-forth (information only) | U S S | 15-16 | Info | |

Run 2 reading: doubling the frame rate (9 to 16 fps) did not rescue it. Circles read CIRCLES on 4 of 12 tries (run 1: 0 of 12), scrubbing read SCRUB on 3 of 12, one scrub try read CIRCLES, and only one row of eight passes. Roundness overlaps completely between circles (0.26-0.78) and scrubbing (0.12-0.83). **Decision gate: stroke-shape detection FAILS.** By the dental rule of 27 Nov the game does not check technique; it teaches small circles with the approved voice lines and pictures, the demo video shows small circles, and stroke detection goes to "What's next" with this table. `stroke-shape.ts` stays on the debug page only.
