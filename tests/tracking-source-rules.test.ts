import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();

function listFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const files: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) files.push(...listFiles(full));
    else files.push(full);
  }
  return files;
}

function rel(file: string): string {
  return relative(ROOT, file).split('\\').join('/');
}

function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

// ---------- onlyOneLeftRightSwap (design test 19) ----------

const RAW_SIDE_ALLOWED_AS_ARGUMENT = ['src/tracking/classify-frame.ts', 'src/ui/monster-anchor.ts'];
const SWAP_HOME = 'src/tracking/side.ts';

/** Problems with raw left and right or with an inline swap, in one file (path relative to the root). */
function swapProblems(path: string, text: string): string[] {
  if (path === SWAP_HOME) return [];
  const problems: string[] = [];
  const withoutCalls = RAW_SIDE_ALLOWED_AS_ARGUMENT.includes(path)
    ? text.replace(/rawToChildSide\([^()]*\)/g, 'rawToChildSide()')
    : text;
  if (/['"]raw-(left|right)['"]/.test(withoutCalls)) {
    problems.push(`${path}: raw left or right used outside side.ts or a rawToChildSide argument`);
  }
  if (/\?\s*['"]left['"]\s*:\s*['"]right['"]/.test(text) || /\?\s*['"]right['"]\s*:\s*['"]left['"]/.test(text)) {
    problems.push(`${path}: inline left and right swap`);
  }
  return problems;
}

describe('onlyOneLeftRightSwap', () => {
  it("'raw-left' and 'raw-right' appear only in side.ts and as arguments in classify-frame.ts and monster-anchor.ts", () => {
    const problems: string[] = [];
    for (const dir of ['src', 'debug']) {
      for (const file of listFiles(join(ROOT, dir))) {
        if (!/\.(ts|html|css)$/.test(file)) continue;
        problems.push(...swapProblems(rel(file), readFileSync(file, 'utf8')));
      }
    }
    expect(problems).toEqual([]);
  });

  it('classify-frame.ts calls rawToChildSide', () => {
    const text = readFileSync(join(ROOT, 'src/tracking/classify-frame.ts'), 'utf8');
    expect(text).toMatch(/rawToChildSide\(/);
  });

  it('the scanner flags a stray raw side and an inline swap', () => {
    expect(swapProblems('src/ui/x.ts', "const a = 'raw-left';")).not.toEqual([]);
    expect(swapProblems('src/tracking/side.ts', "const a = 'raw-left';")).toEqual([]);
    expect(swapProblems('src/tracking/classify-frame.ts', "f(rawToChildSide(x ? 'raw-right' : 'raw-left'))")).toEqual([]);
    expect(swapProblems('src/tracking/classify-frame.ts', "const a = 'raw-right';")).not.toEqual([]);
    expect(swapProblems('src/ui/x.ts', "const a = rawToChildSide('raw-right');")).not.toEqual([]);
    expect(swapProblems('src/ui/x.ts', "const s = on ? 'left' : 'right';")).not.toEqual([]);
    expect(swapProblems('src/ui/x.ts', "const s = on ? 'right' : 'left';")).not.toEqual([]);
  });
});

// ---------- thresholdsInOneFile (design test 15) ----------

// The files that exist so far. Later parts add their own files to this list.
const FILES_WITHOUT_NUMBERS = ['src/tracking/classify-frame.ts', 'src/tracking/aggregate-second.ts'];

const THRESHOLD_EXPORTS = [
  'NEAR_MOUTH_FACE_WIDTHS',
  'SIDE_DEAD_ZONE',
  'LEVEL_DEAD_ZONE',
  'MIN_FRAMES_PER_SECOND',
  'MIN_FACE_FRACTION',
  'MOVING_MIN_TRAVEL',
  'MOVE_JITTER_STEP',
  'WINDOW_MS',
  'TRACK_MIN_INTERVAL_MS',
  'HAND_POINT',
  'FACE_MODEL',
  'PALM_LANDMARKS',
  'WRIST_LANDMARK',
  'FINGERTIP_LANDMARKS',
];

/** Numeric literals other than 0, 1 and 2, in code with comments and strings removed. */
function bareNumbers(text: string): string[] {
  const code = stripComments(text).replace(/'[^'\n]*'|"[^"\n]*"|`[^`]*`/g, '""');
  const found = code.match(/(?<![\w.$])\d+(\.\d+)?(e[+-]?\d+)?\b/gi) ?? [];
  return found.filter((n) => !['0', '1', '2'].includes(n));
}

describe('thresholdsInOneFile', () => {
  it('thresholds.ts exports every constant of design 5.5', () => {
    const text = readFileSync(join(ROOT, 'src/tracking/thresholds.ts'), 'utf8');
    for (const name of THRESHOLD_EXPORTS) {
      expect(text, name).toMatch(new RegExp(`export const ${name}\\b`));
    }
  });

  it('no numeric literal other than 0, 1 and 2 appears in the classifying files', () => {
    for (const path of FILES_WITHOUT_NUMBERS) {
      const text = readFileSync(join(ROOT, path), 'utf8');
      expect(bareNumbers(text), path).toEqual([]);
    }
  });

  it('the number scanner finds bare numbers and ignores comments, strings and 0, 1, 2', () => {
    expect(bareNumbers('const a = 0.5;')).toEqual(['0.5']);
    expect(bareNumbers('const a = b / 3;')).toEqual(['3']);
    expect(bareNumbers('const a = b * 2 + 1 - 0; // 0.7 here')).toEqual([]);
    expect(bareNumbers("const s = 'x9'; /* 4 */")).toEqual([]);
    expect(bareNumbers('const x2 = a.b1;')).toEqual([]);
  });
});

// ---------- fixturesAreHandWritten (design test 29) ----------

const FIXTURE_DIR = join(ROOT, 'tests/fixtures/tracking');
const MAX_FIXTURE_NUMBERS = 200;

/** Problems in one fixture file. `otherTests` is the text of the other test files. */
function fixtureProblems(file: string, text: string, otherTests: string): string[] {
  const problems: string[] = [];
  if (!file.endsWith('.ts')) problems.push(`${file}: not a .ts file`);
  if (text.split(/\r?\n/)[0].trim() !== '// hand-written') {
    problems.push(`${file}: first line is not "// hand-written"`);
  }
  for (const match of text.matchAll(/^export\s+(?:const|function|let|type|interface|class)\s+(\w+)/gm)) {
    if (!new RegExp(`\\b${match[1]}\\b`).test(otherTests)) {
      problems.push(`${file}: export "${match[1]}" is not used by any test`);
    }
  }
  if ((text.match(/-?\d+(\.\d+)?/g) ?? []).length > MAX_FIXTURE_NUMBERS) {
    problems.push(`${file}: more than ${MAX_FIXTURE_NUMBERS} numeric literals`);
  }
  if (/^\s*[[{]/.test(text.replace(/^\/\/.*$/gm, '').trim()) || /JSON\.parse|readFileSync|fetch\(/.test(text)) {
    problems.push(`${file}: looks like captured data`);
  }
  return problems;
}

describe('fixturesAreHandWritten', () => {
  const thisFile = 'tracking-source-rules.test.ts';
  const otherTests = listFiles(join(ROOT, 'tests'))
    .filter((f) => f.endsWith('.test.ts') && !f.endsWith(thisFile))
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n');

  it('every fixture file under tests/fixtures/tracking is hand-written plain numbers', () => {
    const files = listFiles(FIXTURE_DIR);
    expect(files.length).toBeGreaterThan(0);
    const problems: string[] = [];
    for (const file of files) {
      problems.push(...fixtureProblems(rel(file), readFileSync(file, 'utf8'), otherTests));
    }
    expect(problems).toEqual([]);
  });

  it('the checker flags a missing marker, a json file, unused exports and too many numbers', () => {
    expect(fixtureProblems('a.ts', 'export const a = 1;', 'a')).not.toEqual([]);
    expect(fixtureProblems('a.json', '// hand-written\n', '')).not.toEqual([]);
    expect(fixtureProblems('a.ts', '// hand-written\nexport const unusedName = 1;', 'other')).not.toEqual([]);
    expect(fixtureProblems('a.ts', '// hand-written\nexport const used = 1;', 'used')).toEqual([]);
    const many = `// hand-written\nexport const used = [${Array.from({ length: 201 }, (_, i) => i).join(',')}];`;
    expect(fixtureProblems('a.ts', many, 'used')).not.toEqual([]);
    expect(fixtureProblems('a.ts', '// hand-written\n[{"x":1}]', '')).not.toEqual([]);
  });
});
