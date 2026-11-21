import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/ui/end-card.ts', 'utf8');

/** Every quoted string and template literal in the source. */
function stringLiterals(text: string): string[] {
  const found: string[] = [];
  const re = /'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) found.push(m[1] ?? m[2] ?? m[3] ?? '');
  return found;
}

describe('endCardNoUrging', () => {
  it('creates exactly two buttons', () => {
    const made = source.match(/createElement\(\s*['"]button['"]\s*\)/g) ?? [];
    expect(made).toHaveLength(2);
  });

  it('has no string literal with an urging or scoring word', () => {
    const banned = /again|next|tomorrow|come back|streak|score|timer/i;
    for (const literal of stringLiterals(source)) {
      expect(banned.test(literal), `literal: ${literal}`).toBe(false);
    }
  });

  it('has no button that starts a session', () => {
    expect(source).not.toMatch(/onStart/);
  });

  it('uses speakEnd and unhide', () => {
    expect(source).toMatch(/speakEnd\(/);
    expect(source).toMatch(/unhide\(/);
  });

  it('has no timer or animation-frame call', () => {
    expect(source).not.toMatch(/setTimeout|setInterval|requestAnimationFrame/);
  });
});
