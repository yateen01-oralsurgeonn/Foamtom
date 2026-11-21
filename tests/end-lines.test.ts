import { describe, expect, it } from 'vitest';
import { CLIP_LINE_IDS } from '../src/audio/speaker';
import { getLine } from '../src/audio/lines';
import { END_LINE_IDS, speakEnd } from '../src/ui/end-lines';

describe('endLines', () => {
  it('speakEnd says end, then end-close, once each', () => {
    const said: string[] = [];
    speakEnd({ say: (id: string) => void said.push(id) });
    expect(said).toEqual(['end', 'end-close']);
  });

  it('END_LINE_IDS lists end then end-close', () => {
    expect([...END_LINE_IDS]).toEqual(['end', 'end-close']);
  });

  it('CLIP_LINE_IDS holds neither id, so both lines queue', () => {
    for (const id of END_LINE_IDS) expect(CLIP_LINE_IDS).not.toContain(id);
  });

  it('both ids exist in lines.ts', () => {
    for (const id of END_LINE_IDS) expect(getLine(id)).toBeDefined();
  });
});
