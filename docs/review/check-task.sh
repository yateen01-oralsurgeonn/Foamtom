#!/usr/bin/env bash
# Foamtom: checks to run after every Kiro build run. Run from the repo root in Git Bash:
#   bash docs/review/check-task.sh
# It changes nothing. It prints PASS or FAIL for each check and exits 1 if any failed.
# This is a review tool, not part of the app.

fail=0
say() { printf '%-34s %s\n' "$1" "$2"; }

echo "== Files changed since the last commit =="
git status --short
echo

# 1. Tests
if [ -f package.json ]; then
  if npm run test:run --silent > /tmp/foamtom-test.log 2>&1; then say "tests" "PASS"
  else say "tests" "FAIL  (see /tmp/foamtom-test.log)"; fail=1; fi
  # 2. Build
  if npm run build --silent > /tmp/foamtom-build.log 2>&1; then say "build" "PASS"
  else say "build" "FAIL  (see /tmp/foamtom-build.log)"; fail=1; fi
else
  say "tests / build" "SKIPPED (no package.json yet)"
fi

# 3. Kiro must not edit the spec during a build run (ticking boxes in tasks.md is allowed)
spec_changes=$(git status --short -- .kiro | grep -v 'tasks.md$' | grep -v 'tasks.meta.json$' || true)  # tasks.meta.json = Kiro IDE run history (allowed 21 Nov 2026, Dr. Yatin)
if [ -z "$spec_changes" ]; then say "spec untouched" "PASS"
else say "spec untouched" "FAIL  -> STOP AND CALL DR. YATIN"; echo "$spec_changes"; fail=1; fi

# tasks.md may only gain ticks: every changed line must differ only by [ ] -> [x]
if ! git diff --quiet -- .kiro/specs 2>/dev/null; then
  bad=$(git diff -U0 -- '.kiro/specs/*/tasks.md' | grep -E '^[+-][^+-]' \
        | sed -E 's/\[[ xX]\]/[]/' | sed -E 's/^[+-]//' | sort | uniq -u || true)
  if [ -z "$bad" ]; then say "tasks.md: ticks only" "PASS"
  else say "tasks.md: ticks only" "FAIL  -> STOP AND CALL DR. YATIN"; echo "$bad"; fail=1; fi
fi

# 4. Nothing outside the allowed folders
outside=$(git status --short | awk '{print $NF}' \
  | grep -vE '^(src/|tests/|public/|\.kiro/|\.github/|index\.html|package(-lock)?\.json|tsconfig.*\.json|vite\.config\.[tj]s|vitest\.config\.[tj]s|README\.md|\.gitignore|docs/review/|scripts/|debug/|promo/)' || true)
if [ -z "$outside" ]; then say "files in allowed places" "PASS"
else say "files in allowed places" "FAIL"; echo "$outside"; fail=1; fi

# 5. Privacy: no network calls, no frame storage, no cookies, no outside URLs
if [ -d src ]; then
  hits=$(grep -rnE 'fetch\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource|toDataURL|toBlob|MediaRecorder|captureStream|document\.cookie|https?://' \
          src index.html 2>/dev/null | grep -v 'http://www.w3.org/2000/svg' || true)
  if [ -z "$hits" ]; then say "no network / frame storage" "PASS"
  else say "no network / frame storage" "FAIL"; echo "$hits"; fail=1; fi

  rnd=$(grep -rnE 'Math\.random|new Date|Date\.now' src/logic 2>/dev/null || true)
  if [ -z "$rnd" ]; then say "logic: no random, no clock" "PASS"
  else say "logic: no random, no clock" "FAIL"; echo "$rnd"; fail=1; fi

  imp=$(grep -rnE "from ['\"][./]*/?(\.\./)*(ui|tracking|storage|audio)/" src/logic 2>/dev/null || true)
  if [ -z "$imp" ]; then say "logic imports nothing outside" "PASS"
  else say "logic imports nothing outside" "FAIL"; echo "$imp"; fail=1; fi
fi

# 6. No new packages slipped in (shows the list so a person can look)
if [ -f package.json ]; then
  echo; echo "== Packages (expect only: vite, typescript, vitest, fast-check, and later @mediapipe/tasks-vision) =="
  node -e "const p=require('./package.json');console.log(Object.keys({...p.dependencies,...p.devDependencies}).join(', '))" 2>/dev/null
fi

echo
if [ "$fail" -eq 0 ]; then echo "ALL CHECKS PASSED: commit and push."; else echo "SOMETHING FAILED: do not commit. See the playbook, section 4."; fi
exit $fail
