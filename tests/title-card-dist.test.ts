import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const root = resolve(__dirname, '..');
const MARKER = 'FOAMTOM-PROMO-TITLE-CARD';

function listFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listFiles(full));
    else out.push(full);
  }
  return out;
}

let outDir = '';

beforeAll(() => {
  outDir = mkdtempSync(join(tmpdir(), 'foamtom-promo-dist-'));
  execFileSync(
    process.execPath,
    [join(root, 'node_modules', 'vite', 'bin', 'vite.js'), 'build', '--outDir', outDir, '--emptyOutDir'],
    { cwd: root, stdio: 'pipe' },
  );
}, 180_000);

afterAll(() => {
  if (outDir) rmSync(outDir, { recursive: true, force: true });
});

describe('distHasNoPromoPage', () => {
  it('has no built file named after the page or holding its marker', () => {
    const files = listFiles(outDir);
    expect(files.length).toBeGreaterThan(0);
    const badNames = files.filter((f) => /promo|title-card/.test(f.slice(outDir.length)));
    expect(badNames).toEqual([]);
    const withMarker = files.filter((f) => readFileSync(f).includes(MARKER));
    expect(withMarker).toEqual([]);
  });
});

describe('buildInputUnchanged', () => {
  const MENTION = /promo\/title-card|title-card\.html/;

  it('keeps the single input index.html and no mention of promo in vite.config.ts', () => {
    const config = readFileSync(join(root, 'vite.config.ts'), 'utf8');
    expect(config).toContain("input: 'index.html'");
    expect(config).not.toContain('promo');
  });

  it('index.html, vite.config.ts and every file under src/ do not mention the page', () => {
    const files = [
      join(root, 'index.html'),
      join(root, 'vite.config.ts'),
      ...listFiles(join(root, 'src')),
    ];
    const offenders = files.filter((f) => MENTION.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });
});
