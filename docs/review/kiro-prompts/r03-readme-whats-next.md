Add one new section to `README.md`. Change ONLY `README.md`. Do not edit anything in `.kiro/`,
`src/`, `tests/`, `debug/`, `docs/` or any other file. Do not run the dev server.

Read first: `.kiro/steering/dental-rules.md` (including "Brushing technique (added 27 Nov 2026,
Dr. Yatin)"), `.kiro/steering/kid-safety-privacy.md`, `docs/review/TRACKING-TEST-RESULTS.md`
sections 10 and 11, and the current `README.md`.

Why: Dr. Yatin approved this wording on 27 Nov 2026 after his own camera tests. Side detection
(section 10) and circles-versus-scrubbing detection (section 11) both failed his pass rule, so the
game does not claim either. The README should say so plainly and point to the measured results.

Insert the section below directly BEFORE the line `## Third-party and pre-existing work`, exactly as
written, with one blank line before and after it:

```markdown
## What's next

Dr. Yatin's own camera tests showed two things the camera can't do yet: tell which side of the
mouth is being brushed, and tell small circles from scrubbing. Both need a point that follows the
brush rather than the palm, such as fingertip tracking or a brightly coloured brush handle. The
test page (`debug/tracking-debug.html`, development only) and the measured results
(`docs/review/TRACKING-TEST-RESULTS.md`, sections 10 and 11) are in this repo for that work.

Then: spoken "small circles" reminders with pictures, Marathi and Hindi voices, short trials with
families of young patients (with the parents' consent), and a printable brushing chart that pairs
with the Monster Book.
```

Change nothing else. If the line `## Third-party and pre-existing work` is not found exactly once,
or if the new section conflicts with a steering file, stop, say exactly what, and change nothing.
Then print the new section as it now appears in `README.md`.
