import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

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

// ---------- trackingPrivacyGuard (design test 23) ----------

const FORBIDDEN_IN_TRACKING = [
  'console.',
  'toDataURL',
  'toBlob',
  'MediaRecorder',
  'captureStream',
  'setInterval',
  'setTimeout',
];

/** Problems in one file under src/tracking/ or debug/. */
function trackingProblems(path: string, text: string): string[] {
  return FORBIDDEN_IN_TRACKING.filter((word) => text.includes(word)).map((word) => `${path}: contains "${word}"`);
}

/** Problems in one file under src/logic/ or src/storage/: it must not mention the drawing value. */
function drawValueProblems(path: string, text: string): string[] {
  const problems: string[] = [];
  if (/\bDrawValue\b/.test(text)) problems.push(`${path}: uses DrawValue`);
  if (text.includes('draw-value')) problems.push(`${path}: imports draw-value`);
  return problems;
}

describe('trackingPrivacyGuard', () => {
  it('no file under src/tracking/ or debug/ uses console, image export, recording or a timer', () => {
    const problems: string[] = [];
    for (const dir of ['src/tracking', 'debug']) {
      for (const file of listFiles(join(ROOT, dir))) {
        problems.push(...trackingProblems(rel(file), readFileSync(file, 'utf8')));
      }
    }
    expect(problems).toEqual([]);
  });

  it('the debug page files exist and are scanned', () => {
    const files = listFiles(join(ROOT, 'debug')).map(rel);
    expect(files).toEqual(
      expect.arrayContaining(['debug/tracking-debug.html', 'debug/tracking-debug.ts', 'debug/debug-draw.ts']),
    );
  });

  it('DrawValue and draw-value are not imported from src/logic/ or src/storage/', () => {
    const problems: string[] = [];
    for (const dir of ['src/logic', 'src/storage']) {
      for (const file of listFiles(join(ROOT, dir))) {
        problems.push(...drawValueProblems(rel(file), readFileSync(file, 'utf8')));
      }
    }
    expect(problems).toEqual([]);
  });

  it('the scanners flag every forbidden word and the drawing value', () => {
    for (const word of FORBIDDEN_IN_TRACKING) {
      expect(trackingProblems('debug/x.ts', `const a = ${word};`)).not.toEqual([]);
    }
    expect(trackingProblems('debug/x.ts', 'const a = 1;')).toEqual([]);
    expect(drawValueProblems('src/logic/x.ts', "import type { DrawValue } from '../tracking/draw-value';")).toHaveLength(2);
    expect(drawValueProblems('src/storage/x.ts', "import { a } from '../tracking/draw-value';")).not.toEqual([]);
    expect(drawValueProblems('src/logic/x.ts', "import { a } from './types';")).toEqual([]);
  });
});

// ---------- debugUsesSharedFunctions (design test 32) ----------

const SHARED_IMPORTS: Record<string, string> = {
  classifyFrame: 'src/tracking/classify-frame.ts',
  aggregateSecond: 'src/tracking/aggregate-second.ts',
  framesInLastSecond: 'src/tracking/frame-window.ts',
};
const THRESHOLDS_FILE = 'src/tracking/thresholds.ts';

interface ImportEntry {
  readonly names: string[];
  readonly target: string; // path relative to the project root, with .ts added when the file exists
}

/** Named imports of one file under debug/, resolved to paths relative to the project root. */
function importsOf(file: string, text: string): ImportEntry[] {
  const entries: ImportEntry[] = [];
  for (const match of text.matchAll(/import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+'([^']+)'/g)) {
    const names = match[1]
      .split(',')
      .map((n) => n.trim().replace(/^type\s+/, ''))
      .filter((n) => n.length > 0);
    const base = resolve(join(ROOT, file, '..'), match[2]);
    const target = existsSync(`${base}.ts`) ? `${base}.ts` : base;
    entries.push({ names, target: rel(target) });
  }
  return entries;
}

function exportedNames(text: string): string[] {
  return [...text.matchAll(/^export\s+(?:const|function|let|type|interface|class)\s+(\w+)/gm)].map((m) => m[1]);
}

/** Names that debug code defines itself although they belong to src/tracking/. */
function ownDefinitions(text: string, names: readonly string[]): string[] {
  return names.filter((name) => new RegExp(`\\b(?:const|let|var|function|class)\\s+${name}\\b`).test(text));
}

describe('debugUsesSharedFunctions', () => {
  const debugFile = 'debug/tracking-debug.ts';
  const text = readFileSync(join(ROOT, debugFile), 'utf8');
  const imports = importsOf(debugFile, text);
  const thresholdNames = exportedNames(readFileSync(join(ROOT, THRESHOLDS_FILE), 'utf8'));

  it('imports classifyFrame, aggregateSecond and framesInLastSecond from src/tracking/', () => {
    for (const [name, path] of Object.entries(SHARED_IMPORTS)) {
      expect(
        imports.some((entry) => entry.names.includes(name) && entry.target === path),
        name,
      ).toBe(true);
    }
  });

  it('imports constants from thresholds.ts', () => {
    const fromThresholds = imports.filter((entry) => entry.target === THRESHOLDS_FILE);
    expect(fromThresholds.length).toBeGreaterThan(0);
    expect(fromThresholds.flatMap((entry) => entry.names).length).toBeGreaterThan(0);
  });

  it('every file it imports from src/tracking/ exists', () => {
    for (const entry of imports) {
      if (entry.target.startsWith('src/tracking/')) expect(existsSync(join(ROOT, entry.target)), entry.target).toBe(true);
    }
  });

  it('defines none of the shared functions or thresholds itself, in any file under debug/', () => {
    const shared = [...Object.keys(SHARED_IMPORTS), 'selectHandPoint', 'pickLargestFace', 'rawToChildSide', ...thresholdNames];
    const problems: string[] = [];
    for (const file of listFiles(join(ROOT, 'debug'))) {
      if (!file.endsWith('.ts')) continue;
      for (const name of ownDefinitions(readFileSync(file, 'utf8'), shared)) problems.push(`${rel(file)}: defines ${name}`);
    }
    expect(problems).toEqual([]);
  });

  it('thresholds.ts exports names that the definition check looks for', () => {
    expect(thresholdNames).toEqual(expect.arrayContaining(['NEAR_MOUTH_FACE_WIDTHS', 'HAND_POINT', 'FACE_MODEL']));
  });

  it('the definition check flags a copied threshold or function', () => {
    expect(ownDefinitions('const NEAR_MOUTH_FACE_WIDTHS = 0.5;', thresholdNames)).toEqual(['NEAR_MOUTH_FACE_WIDTHS']);
    expect(ownDefinitions('function classifyFrame() {}', ['classifyFrame'])).toEqual(['classifyFrame']);
    expect(ownDefinitions("import { classifyFrame } from 'x';", ['classifyFrame'])).toEqual([]);
  });
});
