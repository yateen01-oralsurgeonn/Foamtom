import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('smoke', () => {
  it('runs vitest and fast-check, and index.html carries a same-origin Content-Security-Policy', () => {
    fc.assert(fc.property(fc.integer(), fc.integer(), (a, b) => a + b === b + a));

    const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
    expect(html).toContain('http-equiv="Content-Security-Policy"');
    expect(html).toContain("default-src 'self'");
  });
});
