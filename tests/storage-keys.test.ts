import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createStorage, STORAGE_KEY, STORED_KEYS } from '../src/storage/storage';
import { fakeBackend } from './fixtures/parent-sessions';

// Design test 14 (storedKeysGuard). Requirements 9.3, 14.10.

const SRC_DIR = join(process.cwd(), 'src');

function listFiles(dir: string): string[] {
  const files: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) files.push(...listFiles(full));
    else files.push(full);
  }
  return files;
}

function rel(path: string): string {
  return relative(process.cwd(), path).replace(/\\/g, '/');
}

const FILES = listFiles(SRC_DIR).filter((f) => /\.(ts|css)$/.test(f));

/** Resolves a `.setItem(` first argument to a string: a literal, or a `const NAME = '...'` in the same file. */
function resolveKey(arg: string, text: string): string | null {
  const literal = /^(['"`])([^'"`]*)\1$/.exec(arg);
  if (literal) return literal[2];
  if (/^[A-Za-z_$][\w$]*$/.test(arg)) {
    const decl = new RegExp(`const\\s+${arg.replace(/\$/g, '\\$')}\\b[^=]*=\\s*(['"\`])([^'"\`]*)\\1`).exec(text);
    if (decl) return decl[2];
  }
  return null;
}

describe('storedKeysGuard', () => {
  it('STORED_KEYS holds STORAGE_KEY', () => {
    expect(STORED_KEYS).toContain(STORAGE_KEY);
  });

  it('every .setItem( call under src/ writes a key in STORED_KEYS', () => {
    const calls: string[] = [];
    for (const file of FILES) {
      const text = readFileSync(file, 'utf8');
      const re = /\.setItem\(\s*([^,)]+?)\s*[,)]/g;
      let match: RegExpExecArray | null;
      while ((match = re.exec(text)) !== null) {
        const key = resolveKey(match[1], text);
        expect(key, `${rel(file)}: setItem key "${match[1]}" is not a literal or a constant`).not.toBeNull();
        expect(STORED_KEYS, `${rel(file)}: key "${key}" is not in STORED_KEYS`).toContain(key);
        calls.push(rel(file));
      }
    }
    expect(calls).toContain('src/storage/storage.ts');
  });

  it('no file under src/ outside storage.ts and main.ts mentions localStorage', () => {
    for (const file of FILES) {
      const path = rel(file);
      if (path === 'src/storage/storage.ts' || path === 'src/main.ts') continue;
      expect(readFileSync(file, 'utf8'), path).not.toContain('localStorage');
    }
  });

  it('with every stored key pre-filled, clearAll() leaves the backend empty', () => {
    const fake = fakeBackend();
    for (const key of STORED_KEYS) fake.data.set(key, 'x');
    createStorage(fake.backend).clearAll();
    expect(fake.data.size).toBe(0);
  });
});
