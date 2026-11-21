import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REQUIRE_LEVEL_MATCH, REQUIRE_SIDE_MATCH } from '../src/logic/constants';

// Reads the verdicts in the results file and the two constants. It never changes them.

const root = join(__dirname, '..');
const results = readFileSync(join(root, 'docs', 'review', 'TRACKING-TEST-RESULTS.md'), 'utf8');

function verdictText(label: 'Side check:' | 'Level check:', next: RegExp): string {
  const start = results.indexOf(`\n${label}`);
  if (start < 0) return '';
  const rest = results.slice(start + label.length + 1);
  const end = rest.search(next);
  return (end < 0 ? rest : rest.slice(0, end)).trim();
}

const side = verdictText('Side check:', /\nLevel check:/);
const level = verdictText('Level check:', /\n## /);

const INITIALS_AND_DATE = /Initials: [A-Za-z]+, \d{4}-\d{2}-\d{2}/;
const SAYS_FAIL = /fail/i; // matches "fail" and "Failed"

describe('tracking decision', () => {
  it('has a Side check verdict with initials and a date', () => {
    expect(side.length).toBeGreaterThan(0);
    expect(side).toMatch(INITIALS_AND_DATE);
  });

  it('has a Level check verdict with initials and a date', () => {
    expect(level.length).toBeGreaterThan(0);
    expect(level).toMatch(INITIALS_AND_DATE);
  });

  it('sets REQUIRE_SIDE_MATCH to false when the Side verdict says fail', () => {
    if (SAYS_FAIL.test(side)) expect(REQUIRE_SIDE_MATCH).toBe(false);
  });

  it('sets REQUIRE_LEVEL_MATCH to false when the Level verdict says fail', () => {
    if (SAYS_FAIL.test(level)) expect(REQUIRE_LEVEL_MATCH).toBe(false);
  });
});
