Create Kiro agent hooks for this repo. Do not write app code and do not edit any spec or
steering file.

Create files only inside `.kiro/hooks/`, in Kiro's own hook file format (use the format
your current version expects; do not invent a format). Do not create, edit or delete any
other file.

Read first: every file in `.kiro/steering/`.

Create these three hooks:

1. **Run tests on logic change**
   When: a file under `src/logic/**` or `tests/**` is saved.
   Do: run `npm run test:run` and report any failing test by name. Do not change code.

2. **Privacy guard on source change**
   When: a file under `src/**` or `index.html` is saved.
   Do: run `npx vitest run tests/privacy-guard.test.ts`. If it fails, say which file and
   which banned item, and point to `.kiro/steering/kid-safety-privacy.md`. Do not change
   code.

3. **Wording check on child-facing text**
   When: `src/audio/lines.ts` or any file under `src/ui/**` is saved.
   Do: check any new or changed text shown or spoken to the child against the "Wording
   rules" in `.kiro/steering/dental-rules.md` and the "Content" rules in
   `.kiro/steering/kid-safety-privacy.md`. Report each problem with the file and the
   line. Do not change code.

When finished, list the files you created and show the contents of one of them, then
stop.
