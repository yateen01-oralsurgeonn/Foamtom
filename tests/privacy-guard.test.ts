import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// Requirement 13.10 (design test 16, privacyGuard).

const SRC_DIR = join(process.cwd(), 'src');

const FORBIDDEN_EVERYWHERE = [
  'fetch(',
  'XMLHttpRequest',
  'sendBeacon',
  'WebSocket',
  'EventSource',
  'toDataURL',
  'toBlob',
  'MediaRecorder',
  'captureStream',
  'document.cookie',
];

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const FORBIDDEN_LOGIC_IMPORT = /(^|\/)(ui|tracking|storage|audio)(\/|$)/;

function listFiles(dir: string): string[] {
  const files: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) files.push(...listFiles(full));
    else files.push(full);
  }
  return files;
}

/** Returns a list of problems found in one file. `path` uses forward slashes, relative to the project root. */
function scanFile(path: string, text: string): string[] {
  const problems: string[] = [];
  const inLogic = path.startsWith('src/logic/');

  for (const word of FORBIDDEN_EVERYWHERE) {
    if (text.includes(word)) problems.push(`${path}: contains "${word}"`);
  }

  if (inLogic && text.includes('Math.random')) {
    problems.push(`${path}: contains "Math.random" inside src/logic/`);
  }

  for (const match of text.matchAll(/https?:\/\/[^\s'"`)]*/g)) {
    if (!match[0].startsWith(SVG_NAMESPACE)) {
      problems.push(`${path}: contains URL "${match[0]}"`);
    }
  }

  if (inLogic) {
    for (const match of text.matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)) {
      if (FORBIDDEN_LOGIC_IMPORT.test(match[1])) {
        problems.push(`${path}: src/logic imports from "${match[1]}"`);
      }
    }
  }

  return problems;
}

describe('privacyGuard', () => {
  it('finds no privacy or network problem in any file under src/', () => {
    const problems: string[] = [];
    for (const file of listFiles(SRC_DIR)) {
      const path = relative(process.cwd(), file).split('\\').join('/');
      problems.push(...scanFile(path, readFileSync(file, 'utf8')));
    }
    expect(problems).toEqual([]);
  });

  it('scanner flags every forbidden word', () => {
    for (const word of FORBIDDEN_EVERYWHERE) {
      expect(scanFile('src/ui/x.ts', `const a = ${word};`)).not.toEqual([]);
    }
  });

  it('scanner flags http:// and https:// strings but allows the SVG namespace', () => {
    expect(scanFile('src/ui/x.ts', "const u = 'http://example.com';")).not.toEqual([]);
    expect(scanFile('src/ui/x.ts', "const u = 'https://example.com';")).not.toEqual([]);
    expect(scanFile('src/ui/x.ts', `const ns = '${SVG_NAMESPACE}';`)).toEqual([]);
  });

  it('scanner flags Math.random only inside src/logic/', () => {
    expect(scanFile('src/logic/x.ts', 'const r = Math.random();')).not.toEqual([]);
    expect(scanFile('src/ui/x.ts', 'const r = Math.random();')).toEqual([]);
  });

  it('scanner flags src/logic imports from ui, tracking, storage and audio', () => {
    for (const folder of ['ui', 'tracking', 'storage', 'audio']) {
      expect(scanFile('src/logic/x.ts', `import { a } from '../${folder}/a';`)).not.toEqual([]);
    }
    expect(scanFile('src/logic/x.ts', "import { a } from './types';")).toEqual([]);
    expect(scanFile('src/ui/x.ts', "import { a } from '../logic/a';")).toEqual([]);
  });
});
