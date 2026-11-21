import { readFileSync } from 'node:fs';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { startSession, tick } from '../src/logic/session';
import type { BrushingSignal, SessionMode, SessionState, StartInput } from '../src/logic/types';
import { toView } from '../src/logic/view';
import { frameGuidance, ZONE_REGION } from '../src/ui/frame-guidance';

// Helpers live in this file (no shared helper file).
const signalArb: fc.Arbitrary<BrushingSignal> = fc.record({
  handNearMouth: fc.boolean(),
  side: fc.constantFrom('left' as const, 'right' as const, 'unknown' as const),
  level: fc.constantFrom('upper' as const, 'lower' as const, 'unknown' as const),
  moving: fc.boolean(),
});
const maybeSignalArb = fc.option(signalArb, { nil: null });
const modeArb: fc.Arbitrary<SessionMode> = fc.constantFrom('camera' as const, 'timer-only' as const);

function input(mode: SessionMode): StartInput {
  return { mode, startedAt: 1_000, date: '2026-11-21', hour: 8, pastSessions: [] };
}

/** Runs a whole session and returns every state, the first one included. */
function run(mode: SessionMode, signals: (BrushingSignal | null)[]): SessionState[] {
  const states: SessionState[] = [startSession(input(mode))];
  for (const s of signals) states.push(tick(states[states.length - 1], s));
  return states;
}

describe('glowMatchesLineAndMonster', () => {
  it('lights the region of the zone the line and the monster belong to', () => {
    fc.assert(
      fc.property(modeArb, fc.array(maybeSignalArb, { minLength: 120, maxLength: 120 }), (mode, signals) => {
        const states = run(mode, signals);
        for (let i = 0; i < states.length; i += 1) {
          const state = states[i];
          if (state.phase === 'ended') continue;
          const view = toView(state);
          const guidance = frameGuidance(view);
          expect(guidance.activeRegion).toBe(ZONE_REGION[view.zoneId]);
          const lit = guidance.regions.filter((r) => r.level === 'active');
          expect(lit).toHaveLength(1);
          expect(lit[0].region).toBe(ZONE_REGION[view.zoneId]);
          if (view.captionLineId.startsWith('zone-')) {
            expect(view.captionLineId).toBe(`zone-${view.zoneId}`);
          }
          // The monster on screen belongs to the same zone as the lit region.
          expect(view.monsterId).toBe(state.monsters[state.activeZoneIndex].def.id);
          expect(state.zones[state.activeZoneIndex].id).toBe(view.zoneId);
          // The region does not change between a defeat and the zone end.
          if (i > 0 && states[i - 1].phase !== 'ended' && states[i - 1].activeZoneIndex === state.activeZoneIndex) {
            expect(guidance.activeRegion).toBe(frameGuidance(toView(states[i - 1])).activeRegion);
          }
        }
      }),
    );
  });

  it('gives the same regions in both modes for the same zone', () => {
    fc.assert(
      fc.property(fc.array(maybeSignalArb, { minLength: 120, maxLength: 120 }), (signals) => {
        const cameraStates = run('camera', signals);
        const timerStates = run('timer-only', signals);
        const regionOfZone = (states: SessionState[]): Map<string, string | null> => {
          const map = new Map<string, string | null>();
          for (const s of states) {
            if (s.phase === 'ended') continue;
            const view = toView(s);
            map.set(view.zoneId, frameGuidance(view).activeRegion);
          }
          return map;
        };
        const a = regionOfZone(cameraStates);
        const b = regionOfZone(timerStates);
        for (const [zone, region] of a) {
          if (b.has(zone)) expect(b.get(zone)).toBe(region);
          expect(region).toBe(ZONE_REGION[zone as keyof typeof ZONE_REGION]);
        }
      }),
    );
  });
});

describe('decorativeFrame (session screen)', () => {
  const source = readFileSync('src/ui/session-screen.ts', 'utf8');

  it('puts the preview into the frame glass and never the frame into the preview', () => {
    expect(source).toMatch(/frame\.glass\.append\(\s*preview\.element\s*\)/);
    expect(source).not.toMatch(/preview\.element\.(append|appendChild|prepend)\(\s*frame/);
    expect(source).not.toMatch(/currentPreview\.element\.(append|appendChild|prepend)\(\s*frame/);
    expect(source).not.toMatch(/preview--mirrored/);
  });

  it('uses frameGuidance for a view and for null', () => {
    expect(source).toContain('frameGuidance(view)');
    expect(source).toContain('frameGuidance(null)');
  });

  it('paints the frame before the caption and the monster', () => {
    const paintBody = source.slice(source.indexOf('paint(view: View)'));
    const frameAt = paintBody.indexOf('frame.paint(frameGuidance(view))');
    const captionAt = paintBody.indexOf('sessionCaption.textContent');
    const monsterAt = paintBody.indexOf('showMonster(view.monsterId)');
    expect(frameAt).toBeGreaterThan(-1);
    expect(frameAt).toBeLessThan(captionAt);
    expect(captionAt).toBeLessThan(monsterAt);
  });

  it('has no mirror flip, raw side string or left/right ternary', () => {
    expect(source).not.toContain('scaleX');
    expect(source).not.toContain('raw-left');
    expect(source).not.toContain('raw-right');
    expect(source).not.toContain('rawToChildSide');
    expect(source).not.toMatch(/\?\s*'left'\s*:\s*'right'/);
    expect(source).not.toMatch(/\?\s*'right'\s*:\s*'left'/);
  });
});
