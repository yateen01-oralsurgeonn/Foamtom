import { describe, expect, it } from 'vitest';
import { rawToChildSide } from '../src/tracking/side';

describe('rawToChildSideFixture', () => {
  it("'raw-right' is the child's left", () => {
    expect(rawToChildSide('raw-right')).toBe('left');
  });

  it("'raw-left' is the child's right", () => {
    expect(rawToChildSide('raw-left')).toBe('right');
  });
});
