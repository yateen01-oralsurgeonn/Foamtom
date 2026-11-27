import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { countPasses, surfacePasses, type ReadingCode } from '../src/tracking/test-results';

const codeArb = fc.constantFrom<ReadingCode>('R', 'W', 'U', 'N');

// ---------- surfacePasses (design test 30) ----------

describe('surfacePasses', () => {
  it('is true exactly when at least two of any three codes are R', () => {
    fc.assert(
      fc.property(fc.tuple(codeArb, codeArb, codeArb), (codes) => {
        const rights = codes.filter((c) => c === 'R').length;
        expect(surfacePasses(codes)).toBe(rights >= 2);
      }),
    );
  });

  it('counts U and N as not right', () => {
    expect(surfacePasses(['R', 'U', 'N'])).toBe(false);
    expect(surfacePasses(['R', 'R', 'N'])).toBe(true);
    expect(surfacePasses(['U', 'U', 'U'])).toBe(false);
  });

  it('countPasses counts the passing rows', () => {
    expect(countPasses([])).toBe(0);
    expect(
      countPasses([
        ['R', 'R', 'W'],
        ['R', 'W', 'W'],
        ['R', 'R', 'R'],
      ]),
    ).toBe(2);
  });
});

// ---------- resultsFileIsWordsOnly (design test 31) ----------

const RESULTS_FILE = join(process.cwd(), 'docs/review/TRACKING-TEST-RESULTS.md');
const READING_HEADERS = ['Palm', 'Wrist', 'Fingertips'];
// Columns that only name the row. A row with text in these columns alone is still empty.
const LABEL_HEADERS = [
  'Brush hand',
  'Zone',
  'Surface',
  'How brushed',
  'Hand point',
  'Check',
  'Case',
  'Count',
  'Line',
];

function cells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());
}

/** Problems with the layout of the results file text. */
function resultsProblems(text: string): string[] {
  const problems: string[] = [];
  if (/!\[[^\]]*\]\(|<img\b/i.test(text)) problems.push('image syntax');
  if (/data:/i.test(text)) problems.push('data: found');
  if (/(?<![\d.])\d+\.\d{3,}(?![\d.])/.test(text)) problems.push('number with three or more decimals');

  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    if (!lines[i].trim().startsWith('|') || !lines[i + 1] || !/^\s*\|(\s*:?-+:?\s*\|)+\s*$/.test(lines[i + 1])) continue;
    const header = cells(lines[i]);
    if (!header.includes('Date')) problems.push(`table without a Date column: ${header.join(' | ')}`);
    if (!header.includes('Note')) problems.push(`table without a Note column: ${header.join(' | ')}`);
    for (let j = i + 2; j < lines.length && lines[j].trim().startsWith('|'); j += 1) {
      const row = cells(lines[j]);
      const filled = row.some((value, k) => value !== '' && !LABEL_HEADERS.includes(header[k]));
      if (!filled) continue;
      if (row[header.indexOf('Date')] === '') problems.push(`row without a date: ${lines[j].trim()}`);
      header.forEach((name, k) => {
        if (READING_HEADERS.includes(name) && row[k] !== '' && !/^[RWUN]{3}$/.test(row[k])) {
          problems.push(`reading cell is not three of R, W, U, N: "${row[k]}"`);
        }
      });
    }
  }
  return problems;
}

const HEADER = '| Date | Brush hand | Palm | Note |\n|---|---|---|---|\n';

describe('resultsFileIsWordsOnly', () => {
  it('the results file exists and passes (never skipped)', () => {
    const text = readFileSync(RESULTS_FILE, 'utf8');
    expect(resultsProblems(text)).toEqual([]);
  });

  it('the template has the eight parts and the two verdict lines', () => {
    const text = readFileSync(RESULTS_FILE, 'utf8');
    for (const heading of [
      '## 1. Set-up',
      '## 2. Hand-point comparison',
      '## 3. Side check',
      '## 4. Level check',
      '## 5. Other checks',
      '## 6. Counts and decision',
      '## 7. Speed',
      '## 8. Asset sizes',
    ]) {
      expect(text).toContain(heading);
    }
    expect(text).toMatch(/^Side check:\s*$/m);
    expect(text).toMatch(/^Level check:\s*$/m);
    expect(text.match(/\| (Right|Left) \|/g)?.length).toBe(48);
  });

  it('accepts an empty table and a filled row with a date and valid codes', () => {
    expect(resultsProblems(`${HEADER}| | Right | | |\n`)).toEqual([]);
    expect(resultsProblems(`${HEADER}| 20 Nov 2026 | Right | RRW | ok |\n`)).toEqual([]);
    expect(resultsProblems('Chrome 130.0.6723.58 on Android 14')).toEqual([]);
  });

  it('flags images, data:, long decimals, a missing date and bad codes', () => {
    expect(resultsProblems('![x](a.png)')).not.toEqual([]);
    expect(resultsProblems('<img src="a">')).not.toEqual([]);
    expect(resultsProblems('data:image/png')).not.toEqual([]);
    expect(resultsProblems('x = 0.123')).not.toEqual([]);
    expect(resultsProblems(`${HEADER}| | Right | RRW | |\n`)).not.toEqual([]);
    expect(resultsProblems(`${HEADER}| 20 Nov 2026 | Right | RXW | |\n`)).not.toEqual([]);
    expect(resultsProblems('| Palm | Note |\n|---|---|\n| | |\n')).not.toEqual([]);
  });
});
