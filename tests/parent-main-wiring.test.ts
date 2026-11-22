import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Design test 18 (parentMainWiring). Source scans of main.ts and the screens that must not
// carry a parent handler. No source file is changed by this test.

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

function count(text: string, needle: string): number {
  return text.split(needle).length - 1;
}

/** The text of `function name(...) { ... }` up to its matching closing brace. */
function functionBody(source: string, name: string): string {
  const start = source.indexOf(`function ${name}(`);
  expect(start, `function ${name} exists`).toBeGreaterThanOrEqual(0);
  const open = source.indexOf('{', source.indexOf(')', start));
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(open, i + 1);
    }
  }
  throw new Error(`no end of function ${name}`);
}

describe('parentMainWiring', () => {
  const main = read('src/main.ts');
  const session = read('src/ui/session-screen.ts');

  it('session-screen.ts declares onOpenParent (task 38.2 is done)', () => {
    expect(session).toMatch(/onOpenParent\?:\s*\(\)\s*=>\s*void/);
  });

  it('main.ts calls createParentScreen once', () => {
    expect(count(main, 'createParentScreen(')).toBe(1);
  });

  it('main.ts passes exactly one onOpenParent, and it is openParent', () => {
    expect(count(main, 'onOpenParent')).toBe(1);
    expect(main).toMatch(/onOpenParent:\s*openParent\b/);
  });

  it('parent.open() is called only inside openParent', () => {
    expect(count(main, 'parent.open(')).toBe(1);
    const body = functionBody(main, 'openParent');
    expect(body).toContain('parent.open()');
    expect(body).toContain('screen.hide()');
  });

  it('Back calls parent.close() and screen.showStart()', () => {
    const start = main.indexOf('createParentScreen(');
    const block = main.slice(start, main.indexOf('function openParent', start));
    expect(block).toMatch(
      /onBack:\s*\(\)\s*=>\s*\{\s*parent\.close\(\);\s*screen\.showStart\(\);\s*\}/,
    );
  });

  it('builds the screen from the existing storage, localDate, the performance clock and visibility', () => {
    const start = main.indexOf('createParentScreen(');
    const block = main.slice(start, main.indexOf('function openParent', start));
    expect(block).toContain('storage,');
    expect(block).toContain('today: () => localDate(new Date())');
    expect(block).toContain('now: () => performance.now()');
    expect(block).toContain('visibility,');
  });

  it('the end card and the session presenter have no parent handler', () => {
    for (const file of ['src/ui/end-card.ts', 'src/ui/session-presenter.ts']) {
      const text = read(file);
      expect(text, file).not.toMatch(/onOpenParent|onParentOpen|parent-screen/);
    }
  });

  it('session-screen.ts hands the handler only to the title panel', () => {
    expect(count(session, 'onOpenParent')).toBe(2); // the declaration and the one pass-on
    expect(count(session, 'onParentOpen')).toBe(1);
    expect(session).toMatch(/onParentOpen:\s*handlers\.onOpenParent/);
  });

  it('main.ts passes no parent handler to the end card', () => {
    const start = main.indexOf('createEndCard(');
    const block = main.slice(start, main.indexOf('const book', start));
    expect(block).not.toMatch(/[Pp]arent/);
  });
});
