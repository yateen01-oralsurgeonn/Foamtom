import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const root = resolve(__dirname, '..');
const MARKER = 'FOAMTOM-TRACKING-DEBUG';

function listFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listFiles(full));
    else out.push(full);
  }
  return out;
}

describe('distHasNoDebugPage', () => {
  let outDir = '';

  beforeAll(() => {
    outDir = mkdtempSync(join(tmpdir(), 'foamtom-dist-'));
    execFileSync(
      process.execPath,
      [
        join(root, 'node_modules', 'vite', 'bin', 'vite.js'),
        'build',
        '--outDir',
        outDir,
        '--emptyOutDir',
      ],
      { cwd: root, stdio: 'pipe' },
    );
  }, 180_000);

  afterAll(() => {
    if (outDir) rmSync(outDir, { recursive: true, force: true });
  });

  it('has no built file holding the marker or named after the debug page', () => {
    const files = listFiles(outDir);
    expect(files.length).toBeGreaterThan(0);
    const badNames = files.filter((f) => /tracking-debug|debug-draw/.test(f.slice(outDir.length)));
    expect(badNames).toEqual([]);
    const withMarker = files.filter((f) => readFileSync(f).includes(MARKER));
    expect(withMarker).toEqual([]);
  });

  it('is not mentioned by index.html or any file under src/', () => {
    const sources = [join(root, 'index.html'), ...listFiles(join(root, 'src'))];
    const mentions = sources.filter((f) => readFileSync(f, 'utf8').includes('tracking-debug'));
    expect(mentions).toEqual([]);
  });
});
