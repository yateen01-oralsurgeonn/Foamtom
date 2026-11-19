# Foamtom: The Haunted Mirror

A free browser game for children aged 5 to 9. Cute-spooky cavity monsters hide over four
parts of the mouth. The child brushes for two minutes, one part at a time, and each
monster dissolves into smoke when its part has been brushed. The game speaks every
instruction aloud and shows it as a caption.

Brush for two minutes. Don't forget the back teeth. Brush morning and night.

This version plays in guided-timer mode: a two-minute timer walks through four parts of the
mouth, 30 seconds each. Camera tracking is planned for a later version.

## Privacy

The camera stays on this phone. Nothing is saved or sent.

The game has no accounts, no ads, no analytics and no cookies, and it loads nothing from
other websites.

## Run it

You need Node.js 22 or newer.

```
npm install
npm run dev        # play locally
npm run test:run   # run the tests
npm run build      # build the static site into dist/
```

The `dist/` folder is a static site and works from any sub-path, including GitHub Pages.
Pushing to `main` runs the tests, builds the site and publishes it with the workflow in
`.github/workflows/pages.yml`. In the repository settings, set Pages > Source to
"GitHub Actions".

## Licence

MIT. See `LICENSE`.
