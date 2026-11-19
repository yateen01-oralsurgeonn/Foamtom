import { describe, expect, it } from 'vitest';
import { LINES, getLine } from '../src/audio/lines';
import { startSession, tick } from '../src/logic/session';
import { toView } from '../src/logic/view';
import type { BrushingSignal, SessionMode, SessionState } from '../src/logic/types';

const BANNED = [
  'prevent',
  'cure',
  'cavity-free',
  'guarantee',
  'diagnose',
  'clinic',
  'doctor',
  'almost',
  'lost',
  'lose',
  'failed',
  'missed',
];
const FORBIDDEN_TOPICS = ['camera', 'light'];

const UPPER_RIGHT: BrushingSignal = { handNearMouth: true, side: 'right', level: 'upper', moving: true };

function play(mode: SessionMode, signalFor: (i: number) => BrushingSignal | null): string[] {
  let state: SessionState = startSession({
    mode,
    startedAt: 1_000,
    date: '2026-11-19',
    hour: 8,
    pastSessions: [],
  });
  const ids = [toView(state).captionLineId as string];
  for (let i = 0; i < 120; i++) {
    state = tick(state, signalFor(i));
    ids.push(toView(state).captionLineId);
  }
  return ids;
}

describe('wordingGuard', () => {
  it('every line has a non-empty text and caption and a unique id', () => {
    const ids = new Set<string>();
    for (const line of LINES) {
      expect(line.id.length, line.id).toBeGreaterThan(0);
      expect(line.text.trim().length, line.id).toBeGreaterThan(0);
      expect(line.caption.trim().length, line.id).toBeGreaterThan(0);
      expect(ids.has(line.id), `duplicate id ${line.id}`).toBe(false);
      ids.add(line.id);
    }
  });

  it('no line contains a banned word', () => {
    for (const line of LINES) {
      for (const field of [line.text, line.caption]) {
        const lower = field.toLowerCase();
        for (const word of BANNED) {
          expect(lower.includes(word), `"${field}" contains "${word}"`).toBe(false);
        }
      }
    }
  });

  it('no line mentions the camera or the light', () => {
    for (const line of LINES) {
      for (const field of [line.text, line.caption]) {
        const lower = field.toLowerCase();
        for (const word of FORBIDDEN_TOPICS) {
          expect(lower.includes(word), `"${field}" contains "${word}"`).toBe(false);
        }
      }
    }
  });

  it('has lines for the start button, four zones, smoke and end', () => {
    for (const id of [
      'start',
      'zone-upper-right',
      'zone-upper-left',
      'zone-lower-left',
      'zone-lower-right',
      'smoke',
      'end',
    ]) {
      expect(getLine(id), id).toBeDefined();
    }
  });

  it('the smoke line is exactly "Keep brushing! Brush the smoke away!"', () => {
    expect(getLine('smoke')?.text).toBe('Keep brushing! Brush the smoke away!');
    expect(getLine('smoke')?.caption).toBe('Keep brushing! Brush the smoke away!');
  });

  it('every captionLineId that toView produces has a line', () => {
    const produced = new Set<string>();
    // Timer-only: zones, smoke (monster defeated at 30 s only, so no smoke) and end.
    for (const id of play('timer-only', () => null)) produced.add(id);
    // Camera, brushing the first zone: monster defeated at 20 s, so smoke shows.
    for (const id of play('camera', (i) => (i < 30 ? UPPER_RIGHT : null))) produced.add(id);
    for (const id of [
      'zone-upper-right',
      'zone-upper-left',
      'zone-lower-left',
      'zone-lower-right',
      'smoke',
      'end',
    ]) {
      expect(produced.has(id), `toView never produced ${id}`).toBe(true);
    }
    for (const id of produced) {
      expect(getLine(id), `no line for captionLineId ${id}`).toBeDefined();
    }
  });
});
