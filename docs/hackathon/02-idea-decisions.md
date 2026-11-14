# Kiroween — idea decisions (settled with Dr. Yatin, one question at a time)

| # | Question | Decision | Date |
|---|---|---|---|
| 1 | Where is the child? | At home, at the bathroom sink, full 2-minute brush (phone/tablet by the mirror) | 2026-11-07 |
| 2 | How does the game know they brush? | Front camera, processed in the browser only, nothing leaves the phone; guided-timer fallback (4 zones x 30 s) if camera refused or light is poor. Zone = rough side/upper/lower, not single teeth | 2026-11-07 |
| 3 | What is on screen? | **The Haunted Mirror**: the child's own reflection in a cursed-mirror frame (candle flicker, fog, cracked glass); cute-spooky cavity monsters cling to the cheek over the zone still to brush; brushing there dissolves them into smoke. Cute-spooky, not scary. Mirror image never saved or sent | 2026-11-07 |
| 4 | Age? | 5-9, brushes alone, instructions by voice (little reading) | 2026-11-07 |
| 5 | Why come back? | Monster Book (collect trapped monsters; rare ones only with morning + night brushing; ~10-12 designs) + small parent screen (time brushed, zone most often missed). All on-device, no accounts | 2026-11-07 |
| 6 | Name? | **Foamtom: The Haunted Mirror** (web search 2026-11-07: no app or game by that name) | 2026-11-07 |

Category: Costume Contest.
Existing concepts to differ from: Brush Monster (AR + sensor toothbrush), Playbrush, Disney Magic Timer. Ours: no hardware, browser + camera only, zone-guided, haunted mirror.

## Spec answers (2026-11-14)
| # | Question | Decision |
|---|---|---|
| 7 | Zone order | Upper right -> upper left -> lower left -> lower right, 30 s each (confirmed) |
| 8 | Morning / night | Morning 04:00-11:59, night 17:00-23:59, else neither (still saved) |
| 9 | No-camera monster | Health drains with the timer, always defeated |
| 10 | No-camera stats | Flagged timer-only, not counted as verified brushing |
| 11 | Rare monsters | >=1 morning AND >=1 night session same day |
| 12 | Monster Book | 12 designs: 8 common, 4 rare |
| 13 | "Pass proximity" (Candy Crush, his reel) | PROPOSED as "kind proximity": weaker monster on often-missed zones; nearly-beaten monster flees at 30 s and counts; disclosed to parents; no purchases, no hidden odds, 120 s unchanged. Awaiting his yes |
