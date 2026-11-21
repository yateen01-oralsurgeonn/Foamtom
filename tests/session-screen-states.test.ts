import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function read(path: string): string {
  return readFileSync(path, 'utf8');
}

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...filesUnder(full));
    else if (/\.(ts|css)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const screen = read('src/ui/session-screen.ts');

describe('sessionScreenStates', () => {
  it('imports and uses monsterDrawState, monsterScale and smokeLook', () => {
    expect(screen).toMatch(/import\s*\{[^}]*\bmonsterDrawState\b[^}]*\}\s*from '\.\/monster-draw-state'/);
    expect(screen).toMatch(/import\s*\{[^}]*\bmonsterScale\b[^}]*\}\s*from '\.\/monster-draw-state'/);
    expect(screen).toMatch(/import\s*\{[^}]*\bsmokeLook\b[^}]*\}\s*from '\.\/monster-draw-state'/);
    expect(screen).toMatch(/monsterDrawState\(view, null\)/);
    expect(screen).toMatch(/monsterScale\(view\.healthFraction\)/);
    expect(screen).toMatch(/smokeLook\(view\.smokeFraction\)/);
  });

  it('smokeFraction appears in src/ui only in monster-draw-state.ts and once in session-screen.ts', () => {
    const files = [...filesUnder('src/ui'), ...filesUnder('src/audio')];
    for (const file of files) {
      const count = (read(file).match(/smokeFraction/g) ?? []).length;
      const name = file.replace(/\\/g, '/');
      if (name === 'src/ui/monster-draw-state.ts') continue;
      if (name === 'src/ui/session-screen.ts') {
        expect(count, name).toBe(1);
        continue;
      }
      expect(count, name).toBe(0);
    }
  });

  it('the smoke code has no text and no colour assignment', () => {
    const lines = screen.split('\n').filter((line) => /smoke/i.test(line) && !line.trim().startsWith('//'));
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) {
      expect(line, line).not.toMatch(/textContent|innerText|\.color\b|\.background|backgroundColor|style\.fill/);
    }
    // The three puff elements are created with no text.
    expect(screen).not.toMatch(/smoke__puff[^)]*,\s*['"`]/);
  });
});
