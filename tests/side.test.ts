import { describe, expect, it } from 'vitest';
import { classifyFrame } from '../src/tracking/classify-frame';
import { rawToChildSide } from '../src/tracking/side';
import { handRawLeftCheek, handRawRightCheek } from './fixtures/tracking/frames';

describe('rawToChildSideFixture', () => {
  it("'raw-right' is the child's left", () => {
    expect(rawToChildSide('raw-right')).toBe('left');
  });

  it("'raw-left' is the child's right", () => {
    expect(rawToChildSide('raw-left')).toBe('right');
  });

  it('classifyFrame reads a hand on the raw right as left', () => {
    const result = classifyFrame(handRawRightCheek);
    expect(result.handNearMouth).toBe(true);
    expect(result.side).toBe('left');
  });

  it('classifyFrame reads a hand on the raw left as right', () => {
    const result = classifyFrame(handRawLeftCheek);
    expect(result.handNearMouth).toBe(true);
    expect(result.side).toBe('right');
  });
});
