import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Design test 17 (parentScreenSourceGuards). Source scans only; no source file is changed.
// The file list is read from the folder by name pattern, so later tasks need not edit this file.

const ROOT = process.cwd();

function read(path: string): string {
  return readFileSync(join(ROOT, path), 'utf8');
}

function listFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(join(ROOT, dir))) {
    const rel = `${dir}/${name}`;
    if (statSync(join(ROOT, rel)).isDirectory()) out.push(...listFiles(rel));
    else out.push(rel);
  }
  return out;
}

/** Every file of this spec under src/ui: the calendar and gate files and every parent-* file. */
const SPEC_NAME = /^src\/ui\/(calendar-days|adult-gate|parent-[a-z-]+)\.(ts|css)$/;
const SPEC_FILES = listFiles('src/ui').filter((f) => SPEC_NAME.test(f));
const SPEC_TS = SPEC_FILES.filter((f) => f.endsWith('.ts'));

/** The two painters use the DOM; every other .ts file of the spec is pure. */
const PAINTERS = ['src/ui/parent-gate-view.ts', 'src/ui/parent-screen.ts'];
const PURE_TS = SPEC_TS.filter((f) => !PAINTERS.includes(f));

const BANNED_EVERYWHERE: readonly string[] = [
  'setInterval',
  'setTimeout',
  'requestAnimationFrame',
  'requestVideoFrameCallback',
  'import(',
  'getUserMedia',
  'fetch(',
  'localStorage',
  'setItem',
  'document.cookie',
  'console.',
  '<style',
  'style=',
  'innerHTML',
  '<img',
];
const BANNED_PURE = /\b(document|window|Date|performance)\b|Math\.random/;

/**
 * Code without comments and string contents. The pure-file check reads this, because the
 * parent files use the word "window" in prose for the seven-day window. Every other check
 * reads the raw text, comments included.
 */
function codeOnly(text: string): string {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
    .replace(/'[^'\n]*'|"[^"\n]*"|`[^`]*`/g, "''");
}

function pureNameProblem(text: string): boolean {
  return BANNED_PURE.test(codeOnly(text));
}
const BANNED_IMPORT = /(?:from|import)\s*\(?\s*['"][^'"]*(?:\/tracking\/|\/audio\/|\/lines)[^'"]*['"]/;

/** Problems in one spec file. `path` uses forward slashes, relative to the project root. */
function sourceProblems(path: string, text: string): string[] {
  const problems: string[] = [];
  for (const word of BANNED_EVERYWHERE) {
    if (text.includes(word)) problems.push(`${path}: contains "${word}"`);
  }
  if (/speaker/i.test(text)) problems.push(`${path}: contains "speaker"`);
  if (BANNED_IMPORT.test(text)) problems.push(`${path}: imports src/tracking, src/audio or lines.ts`);
  if (path.endsWith('.ts') && !PAINTERS.includes(path) && pureNameProblem(text)) {
    problems.push(`${path}: pure file uses document, window, Date, performance or Math.random`);
  }
  return problems;
}

/** Imports of a src/logic file that point at a file of this spec. */
function logicImportsOfThisSpec(text: string): string[] {
  const names = SPEC_TS.map((f) => f.replace(/^src\/ui\//, '').replace(/\.ts$/, ''));
  const found: string[] = [];
  for (const m of text.matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)) {
    const spec = m[1]!;
    const base = spec.split('/').pop() as string;
    if (/(^|\/)ui\//.test(spec) && names.includes(base)) found.push(spec);
  }
  return found;
}

/** Body of a method or function named `name`, by brace matching from its first `{`. Null if absent. */
function bodyOf(text: string, name: RegExp): string | null {
  const start = name.exec(text);
  if (!start) return null;
  const open = text.indexOf('{', start.index + start[0].length);
  if (open === -1) return null;
  let depth = 1;
  let i = open + 1;
  while (i < text.length && depth > 0) {
    if (text[i] === '{') depth += 1;
    else if (text[i] === '}') depth -= 1;
    i += 1;
  }
  return text.slice(open + 1, i - 1);
}

/** Text ids of the contents that must not exist before the gate passes (design 5.8). */
const CONTENT_MARKERS = ['days-heading', 'no-sessions', 'disclosure-1', 'clear-button', 'clear-confirm'];

describe('parentScreenSourceGuards', () => {
  it('reads the spec files from the folder, including the gate painter', () => {
    expect(SPEC_FILES).toContain('src/ui/parent-gate-view.ts');
    expect(SPEC_FILES).toContain('src/ui/adult-gate.ts');
    expect(SPEC_FILES).toContain('src/ui/calendar-days.ts');
    expect(SPEC_FILES).toContain('src/ui/parent-screen.css');
    expect(PURE_TS).toContain('src/ui/parent-view.ts');
    expect(PURE_TS).not.toContain('src/ui/parent-gate-view.ts');
  });

  it('no spec file has a timer, frame callback, dynamic import, camera, network, storage, log or markup injection', () => {
    const problems: string[] = [];
    for (const f of SPEC_FILES) problems.push(...sourceProblems(f, read(f)));
    expect(problems).toEqual([]);
  });

  it('no spec file imports from src/tracking, src/audio or lines.ts', () => {
    const offenders = SPEC_TS.filter((f) => BANNED_IMPORT.test(read(f)));
    expect(offenders).toEqual([]);
  });

  it('the pure files have no document, window, Date, performance or Math.random', () => {
    expect(PURE_TS.length).toBeGreaterThan(0);
    const offenders = PURE_TS.filter((f) => pureNameProblem(read(f)));
    expect(offenders).toEqual([]);
  });

  it('nothing under src/logic/ imports a file of this spec', () => {
    const logicFiles = listFiles('src/logic').filter((f) => f.endsWith('.ts'));
    expect(logicFiles.length).toBeGreaterThan(0);
    const offenders = logicFiles.filter((f) => logicImportsOfThisSpec(read(f)).length > 0);
    expect(offenders).toEqual([]);
  });

  describe('gate button (parent-gate-view.ts)', () => {
    const text = read('src/ui/parent-gate-view.ts');

    it('is one button of type button with the gate class', () => {
      expect(text).toMatch(/createElement\('button'\)/);
      expect(text).toMatch(/\.type = 'button'/);
      expect(text).toContain("className = 'gate-button'");
      expect((text.match(/createElement\('button'\)/g) ?? []).length).toBe(1);
    });

    it('has a PARENT_TAP_TARGETS.gate size and an aria-labelledby', () => {
      expect(text).toContain('PARENT_TAP_TARGETS.gate.minWidthPx');
      expect(text).toContain('PARENT_TAP_TARGETS.gate.minHeightPx');
      expect(text).toContain('aria-labelledby');
    });

    it('takes its words from the approved table: instruction (row 2) and label (row 3)', () => {
      expect(text).toContain("PARENT_TEXT['gate-instruction']");
      expect(text).toContain("PARENT_TEXT['gate-label']");
    });

    it('takes the clock, the scheduler, the visibility source and onPassed as inputs, and never reads event.timeStamp', () => {
      expect(text).toMatch(/readonly now: \(\) => number/);
      expect(text).toMatch(/readonly frames: FrameScheduler/);
      expect(text).toMatch(/readonly visibility: VisibilitySource/);
      expect(text).toMatch(/readonly onPassed: \(\) => void/);
      expect(text).not.toContain('timeStamp');
      expect(text).not.toMatch(/\bnew Date\b|\bDate\.now\b|performance\./);
    });

    it('handles the pointer: primary only, releases capture, ends on up, cancel and leave, cancels the menu', () => {
      expect(text).toContain('isPrimary');
      expect(text).toContain('releasePointerCapture');
      for (const name of ['pointerdown', 'pointerup', 'pointercancel', 'pointerleave', 'contextmenu']) {
        expect(text, name).toContain(`'${name}'`);
      }
    });

    it('handles the keyboard: Space and Enter, ignores auto-repeat, key up releases', () => {
      expect(text).toContain("'Enter'");
      expect(text).toContain("' '");
      expect(text).toContain('event.repeat');
      expect(text).toContain("'keydown'");
      expect(text).toContain("'keyup'");
    });

    it('cancels on blur and on a hidden tab, and removes the visibility subscription', () => {
      expect(text).toContain("'blur'");
      expect(text).toMatch(/visibility\.subscribe\(/);
      expect(text).toMatch(/unsubscribeVisibility\(\)/);
      expect(text).toContain('gateCancel');
    });

    it('calls gateAdvance before gateRelease on release', () => {
      const release = bodyOf(text, /function release\([^)]*\)[^{]*/);
      expect(release).not.toBeNull();
      const advance = release!.indexOf('gateAdvance(');
      const gateRel = release!.indexOf('gateRelease(');
      expect(advance).toBeGreaterThanOrEqual(0);
      expect(gateRel).toBeGreaterThan(advance);
    });

    it('asks the scheduler for each frame, writes data-step and --gate-fraction, cancels the request and calls onPassed on a pass', () => {
      expect(text).toMatch(/frames\.request\(/);
      expect(text).toContain("'data-step'");
      expect(text).toContain("'--gate-fraction'");
      expect(text).toMatch(/cancelFrame\(\)/);
      expect(text).toMatch(/onPassed\(\)/);
    });

    it('builds the ring, three dots and an icon, and shows no message on an early release', () => {
      expect(text).toContain('gate__ring');
      expect(text).toContain('gate__dot');
      expect(text).toContain('gate__icon');
      expect(text).toContain('GATE_HOLD_SECONDS');
      expect(text).not.toMatch(/role', 'status'|aria-live/);
    });
  });

  describe('parent-screen.ts (checked once it exists)', () => {
    const path = 'src/ui/parent-screen.ts';
    const exists = existsSync(join(ROOT, path));

    it.skipIf(!exists)('builds the contents only after the gate passes, not in open()', () => {
      const text = read(path);
      expect(text).toContain('onPassed');
      const open = bodyOf(text, /\bopen\s*(?:\(\)\s*(?::\s*void\s*)?|:\s*function\s*\(\)\s*)/);
      expect(open, 'open() not found').not.toBeNull();
      for (const marker of CONTENT_MARKERS) {
        expect(open!, `open() mentions ${marker}`).not.toContain(marker);
      }
      expect(open!).not.toMatch(/parentView\(\)/);
    });

    it.skipIf(!exists)('has Back at the bookBack size with an accessible name, and the gate-free open path', () => {
      const text = read(path);
      expect(text).toContain('TAP_TARGETS.bookBack');
      expect(text).toMatch(/aria-label/);
    });

    it.skipIf(!exists)('gives every clear control its size and an accessible name, and builds none before the gate', () => {
      const text = read(path);
      if (!text.includes('clear-button')) return;
      expect(text).toContain('PARENT_TAP_TARGETS.clear');
      expect(text).toContain('PARENT_TAP_TARGETS.confirmClear');
      expect(text).toContain('PARENT_TAP_TARGETS.keep');
      expect(text).toMatch(/aria-label/);
      const open = bodyOf(text, /\bopen\s*(?:\(\)\s*(?::\s*void\s*)?|:\s*function\s*\(\)\s*)/);
      if (open !== null) expect(open).not.toMatch(/PARENT_TAP_TARGETS\.(clear|confirmClear|keep)/);
    });
  });

  describe('the scanner itself', () => {
    it('flags each banned word in a spec file', () => {
      for (const word of BANNED_EVERYWHERE) {
        expect(sourceProblems('src/ui/parent-x.ts', `const a = ${word};`), word).not.toEqual([]);
      }
      expect(sourceProblems('src/ui/parent-x.ts', '// a Speaker')).not.toEqual([]);
    });

    it('flags imports from tracking, audio and lines.ts', () => {
      for (const from of ['../tracking/signal-source', '../audio/speaker', '../audio/lines', './lines']) {
        expect(sourceProblems('src/ui/parent-x.ts', `import { a } from '${from}';`), from).not.toEqual([]);
      }
      expect(sourceProblems('src/ui/parent-x.ts', "import { a } from '../logic/constants';")).toEqual([]);
    });

    it('flags document, window, Date, performance and Math.random only in pure files', () => {
      for (const name of ['document.title', 'window.x', 'new Date()', 'performance.now()', 'Math.random()']) {
        expect(sourceProblems('src/ui/parent-x.ts', name), name).not.toEqual([]);
        expect(sourceProblems('src/ui/parent-gate-view.ts', name), name).toEqual([]);
      }
      expect(sourceProblems('src/ui/parent-x.ts', 'const parseDate = 1;')).toEqual([]);
      expect(sourceProblems('src/ui/parent-x.ts', '// the seven-day window\nconst a = 1;')).toEqual([]);
    });

    it('finds a logic file that imports a file of this spec', () => {
      expect(logicImportsOfThisSpec("import { a } from '../ui/parent-view';")).toEqual(['../ui/parent-view']);
      expect(logicImportsOfThisSpec("import { a } from '../ui/game-loop';")).toEqual([]);
      expect(logicImportsOfThisSpec("import { a } from './types';")).toEqual([]);
    });

    it('finds the body of a function by brace matching', () => {
      expect(bodyOf('function a() { if (x) { y(); } z(); } function b() {}', /function a\(\)\s*/)).toBe(
        ' if (x) { y(); } z(); ',
      );
      expect(bodyOf('nothing here', /function a\(\)\s*/)).toBeNull();
    });
  });
});
