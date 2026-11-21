import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const root = resolve(__dirname, '..');
const MARKER = 'FOAMTOM-TRACKING-DEBUG';
/** First load budget: 5 MB read as 5,000,000 bytes, the stricter reading (design 8.3). */
const FIRST_LOAD_LIMIT_BYTES = 5_000_000;

function listFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listFiles(full));
    else out.push(full);
  }
  return out;
}

interface ManifestEntry {
  file: string;
  src?: string;
  isEntry?: boolean;
  imports?: string[];
  dynamicImports?: string[];
}
type Manifest = Record<string, ManifestEntry>;

// One real production build, with a manifest, shared by every test in this file.
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
      '--manifest',
    ],
    { cwd: root, stdio: 'pipe' },
  );
}, 180_000);

afterAll(() => {
  if (outDir) rmSync(outDir, { recursive: true, force: true });
});

describe('distHasNoDebugPage', () => {
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

function readManifest(): Manifest {
  return JSON.parse(readFileSync(join(outDir, '.vite', 'manifest.json'), 'utf8')) as Manifest;
}

/** Every manifest key reached from `start` by following the chosen kind of import. */
function reach(manifest: Manifest, start: string[], kind: 'static' | 'any'): Set<string> {
  const seen = new Set<string>();
  const queue = [...start];
  while (queue.length > 0) {
    const key = queue.pop();
    if (key === undefined || seen.has(key)) continue;
    seen.add(key);
    const entry = manifest[key];
    if (!entry) continue;
    queue.push(...(entry.imports ?? []));
    if (kind === 'any') queue.push(...(entry.dynamicImports ?? []));
  }
  return seen;
}

function entryKeys(manifest: Manifest): string[] {
  return Object.keys(manifest).filter((key) => manifest[key]?.isEntry === true);
}

/** Camera code is recognised by its source name or by text that only MediaPipe or the camera code holds. */
function isCameraChunk(key: string, entry: ManifestEntry): boolean {
  const name = `${key} ${entry.src ?? ''}`;
  if (/camera-source|mediapipe-loader|tasks-vision/.test(name)) return true;
  if (!entry.file.endsWith('.js')) return false;
  const text = readFileSync(join(outDir, entry.file), 'utf8');
  return text.includes('forVisionTasks') || text.includes('facingMode');
}

describe('cameraCodeIsLazy', () => {
  it('the entry chunk static imports never reach the camera or MediaPipe code', () => {
    const manifest = readManifest();
    const entries = entryKeys(manifest);
    expect(entries.length).toBeGreaterThan(0);

    const staticKeys = reach(manifest, entries, 'static');
    const eager = [...staticKeys].filter((key) => {
      const entry = manifest[key];
      return entry !== undefined && isCameraChunk(key, entry);
    });
    expect(eager).toEqual([]);

    // The camera code is really in the build, so the check above is not empty.
    const everything = reach(manifest, entries, 'any');
    const lazy = [...everything].filter((key) => {
      const entry = manifest[key];
      return entry !== undefined && isCameraChunk(key, entry);
    });
    expect(lazy.length).toBeGreaterThan(0);
  });
});

describe('firstLoadUnder5MB', () => {
  it('the built site, without models/ and the lazy camera chunk, is under 5,000,000 bytes', () => {
    const manifest = readManifest();
    const entries = entryKeys(manifest);
    const staticKeys = reach(manifest, entries, 'static');
    const lazyFiles = new Set<string>();
    for (const key of reach(manifest, entries, 'any')) {
      const entry = manifest[key];
      if (entry && !staticKeys.has(key)) lazyFiles.add(entry.file.replace(/\\/g, '/'));
    }

    let total = 0;
    for (const file of listFiles(outDir)) {
      const rel = relative(outDir, file).replace(/\\/g, '/');
      if (rel.startsWith('models/') || rel.startsWith('.vite/') || lazyFiles.has(rel)) continue;
      total += statSync(file).size;
    }
    expect(total).toBeGreaterThan(0);
    expect(total).toBeLessThan(FIRST_LOAD_LIMIT_BYTES);
  });
});

describe('noMediapipeTelemetryInDist', () => {
  it('no built file contains the MediaPipe usage-logging address', () => {
    const files = listFiles(outDir);
    expect(files.length).toBeGreaterThan(0);
    const withEndpoint = files.filter((f) => readFileSync(f).includes('odml.pa.googleapis.com'));
    expect(withEndpoint).toEqual([]);
  });

  it('package.json pins @mediapipe/tasks-vision to exactly 1.2.3', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>;
    };
    expect(pkg.dependencies?.['@mediapipe/tasks-vision']).toBe('1.2.3');
  });
});