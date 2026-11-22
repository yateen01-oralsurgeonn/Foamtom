import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TAP_TARGETS } from '../src/ui/tap-targets';

describe('tapTargets', () => {
  it('every entry is at least 48 x 48', () => {
    for (const t of Object.values(TAP_TARGETS)) {
      expect(t.minWidthPx).toBeGreaterThanOrEqual(48);
      expect(t.minHeightPx).toBeGreaterThanOrEqual(48);
    }
  });

  it('titleBook is smaller than start in width and in height', () => {
    expect(TAP_TARGETS.titleBook.minWidthPx).toBeLessThan(TAP_TARGETS.start.minWidthPx);
    expect(TAP_TARGETS.titleBook.minHeightPx).toBeLessThan(TAP_TARGETS.start.minHeightPx);
  });

  it('parent is smaller than titleBook in width and in height and is at least 48 x 48', () => {
    expect(TAP_TARGETS.parent.minWidthPx).toBeLessThan(TAP_TARGETS.titleBook.minWidthPx);
    expect(TAP_TARGETS.parent.minHeightPx).toBeLessThan(TAP_TARGETS.titleBook.minHeightPx);
    expect(TAP_TARGETS.parent.minWidthPx).toBeGreaterThanOrEqual(48);
    expect(TAP_TARGETS.parent.minHeightPx).toBeGreaterThanOrEqual(48);
  });

  it('start equals the min-width and min-height of .big-button in styles.css', () => {
    const css = readFileSync('src/ui/styles.css', 'utf8');
    const rule = /\.big-button\s*\{([^}]*)\}/.exec(css);
    expect(rule).not.toBeNull();
    const body = rule![1];
    const w = /min-width:\s*(\d+)px/.exec(body);
    const h = /min-height:\s*(\d+)px/.exec(body);
    expect(w).not.toBeNull();
    expect(h).not.toBeNull();
    expect(TAP_TARGETS.start.minWidthPx).toBe(Number(w![1]));
    expect(TAP_TARGETS.start.minHeightPx).toBe(Number(h![1]));
  });
});
