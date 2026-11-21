# mirror-and-screens: hand checks, browser part (Claude in Playwright, 21 Nov 2026)

Chromium at 360 x 640, `npm run dev -- --port 5180` (5173 was SafeRefer). No camera in the test
browser, so the game fell back to timer-only. Boxes are NOT ticked: Dr. Yatin decides.

| Check | Result |
|---|---|
| 13.5 / 16.4 / 18.4 timer-only glow | PASS. Zone order UR, UL, LL, LR; one tick per second; 30 s per zone; end card at exactly 120 s. Lit corner + candle, monster, caption change together. Tab-switch part not tested. |
| 28.7 / 29.2 title at 360 x 640 | PASS. Big "Brush!" button, smaller Monster Book button, privacy line, start line. No horizontal scroll. |
| 24.5 end card (visual part) | PASS. Four monsters, "Well done! Two minutes of brushing!", then "Two minutes. Every corner.", Done + smaller Monster Book. Sound not checked. |
| Monster Book | PASS. 8 owned monsters with names, 4 rare silhouettes "Not met yet", Back. Nit: an empty caption pill shows under the grid when nothing is tapped. |
| 32.7 reduced motion (switched on mid-page) | PASS. Flicker, fog, smoke drift, leaving and Book effects all off; only plain fades remain. |
| 32.10 network | PASS with a FINDING. The game itself requests nothing outside localhost. MediaPipe tried twice to POST to `https://odml.pa.googleapis.com/v1/log` (Google telemetry); the CSP BLOCKED both, nothing was sent. Decide: leave (CSP proves the guard) or switch the logging off in the loader. Also seen: Kaspersky (his antivirus) injects a script and adds itself to the CSP on this laptop; not the app. |
| 32.11 wording | PASS for new lines seen. "Brush!" and "Done" labels date from core task 8 (19 Nov), not new in this spec. |
| Other | favicon.ico 404 (harmless). Brief scrollbars during the fog drift in one screenshot; none measured afterwards. |

Still his: 13.6 camera frame, 15.4/32.9 monster look, 21.4/32.6 sound, 32.2 full camera session,
32.3/32.5 phone, 32.8 screen reader.
