---
inclusion: always
---

# Kid safety and privacy: non-negotiable

These rules override any other requirement. If a feature cannot meet them, drop the feature.

## Camera
- Camera frames are processed **in the browser only**. No frame, image, video, landmark
  or derived measurement is ever sent over the network, saved to storage, or logged.
- No screenshots, recordings or "share your mirror" features.
- The camera stream stops as soon as a brushing session ends or the tab is hidden.
- If camera permission is refused, or the light is too poor to track, the game switches to
  **guided-timer mode** and still works fully. Never nag the child for camera access.
- ML model files are served from this site (same origin), not fetched from a third-party
  CDN at run time, so that opening the game makes no third-party requests.

## Data
- No accounts, no names, no ages, no email, no photos.
- The only stored data: brushing sessions (date, time of day, seconds per zone, monsters
  earned). Stored in `localStorage` on the device. Nothing leaves the device.
- No analytics, trackers, cookies, ads or third-party scripts.
- A "Clear all data" button on the parent screen.

## Parent screen
- Behind a simple adult gate (e.g. "hold for 3 seconds" or a sum a 5-year-old can't do).
- Plain wording a parent can trust: "The camera stays on this phone. Nothing is saved or sent."

## Content
- Cute-spooky only: no blood, no gore, no realistic teeth damage, no jump scares.
- No sudden loud sounds. Volume ramps gently.
- No text-only instructions: always voice + picture.
- No dark patterns: no streak-loss guilt, no timers that pressure, no purchases.

## Accessibility
- Works one-handed on a phone propped by a mirror, portrait orientation.
- Large touch targets (at least 48 px).
- Colour is never the only signal.
- Captions available for every voice line.
