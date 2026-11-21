import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// The core policy (core requirement 12.8) plus the one keyword of hand-tracking 9.3.
const CORE_POLICY: Record<string, string[]> = {
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  'style-src': ["'self'"],
  'img-src': ["'self'"],
  'media-src': ["'self'"],
  'connect-src': ["'self'"],
};

function readPolicy(): Record<string, string[]> {
  const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
  const meta = /<meta\s[^>]*http-equiv="Content-Security-Policy"[^>]*>/i.exec(html);
  expect(meta).not.toBeNull();
  const content = /content="([^"]*)"/i.exec(meta![0]);
  expect(content).not.toBeNull();
  const policy: Record<string, string[]> = {};
  for (const part of content![1]!.split(';')) {
    const words = part.trim().split(/\s+/).filter((w) => w.length > 0);
    if (words.length === 0) continue;
    policy[words[0]!] = words.slice(1);
  }
  return policy;
}

describe('cspIsStillSameOrigin', () => {
  it('names no host, wildcard, data:, unsafe-inline or unsafe-eval', () => {
    const policy = readPolicy();
    for (const [directive, sources] of Object.entries(policy)) {
      for (const source of sources) {
        const allowed = source === "'self'" || (directive === 'script-src' && source === "'wasm-unsafe-eval'");
        expect(allowed, `${directive} ${source}`).toBe(true);
        expect(source).not.toContain('*');
        expect(source).not.toMatch(/^data:/);
        expect(source).not.toBe("'unsafe-inline'");
        expect(source).not.toBe("'unsafe-eval'");
        expect(source).not.toMatch(/^(https?:|wss?:|blob:)/);
      }
    }
  });

  it("differs from the core policy only by 'wasm-unsafe-eval' in script-src", () => {
    const policy = readPolicy();
    expect(Object.keys(policy).sort()).toEqual(Object.keys(CORE_POLICY).sort());
    for (const [directive, sources] of Object.entries(CORE_POLICY)) {
      const expected = directive === 'script-src' ? [...sources, "'wasm-unsafe-eval'"] : sources;
      expect(policy[directive]).toEqual(expected);
    }
  });
});
