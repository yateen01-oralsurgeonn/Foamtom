// The haunted-mirror frame. It paints what frameGuidance() says and decides nothing.
// The frame is never inside the mirrored stage and has no transform.
import { REGION_ORDER } from './frame-guidance';
import type { FrameGuidance, FrameRegion } from './frame-guidance';
import { buildCandle, buildCracks } from './frame-art';

export interface MirrorFrame {
  /** The outer element: `div.mirror-frame`. */
  readonly element: HTMLElement;
  /** The play-area slot: `div.mirror-frame__glass`. */
  readonly glass: HTMLElement;
  paint(guidance: FrameGuidance): void;
}

interface RegionParts {
  readonly root: HTMLElement;
  readonly flame: HTMLElement;
}

const LEVEL_CLASSES = ['frame-region--active', 'frame-region--dim', 'frame-region--off'] as const;

export function createMirrorFrame(): MirrorFrame {
  const element = document.createElement('div');
  element.className = 'mirror-frame';

  // Decoration only: a screen reader skips it (the caption carries the meaning).
  const deco = document.createElement('div');
  deco.className = 'mirror-frame__deco';
  deco.setAttribute('aria-hidden', 'true');

  const fog = document.createElement('div');
  fog.className = 'frame-fog';
  deco.appendChild(fog);

  const parts = new Map<FrameRegion, RegionParts>();
  for (const region of REGION_ORDER) {
    const root = document.createElement('div');
    root.className = `frame-region frame-region--${region} frame-region--off`;
    const glow = document.createElement('div');
    glow.className = 'frame-glow';
    const { stick, flame } = buildCandle();
    flame.hidden = true;
    root.append(glow, stick, flame);
    deco.appendChild(root);
    parts.set(region, { root, flame });
  }

  deco.appendChild(buildCracks());

  const glass = document.createElement('div');
  glass.className = 'mirror-frame__glass';

  element.append(deco, glass);

  function paint(guidance: FrameGuidance): void {
    for (const state of guidance.regions) {
      const part = parts.get(state.region);
      if (!part) continue;
      for (const c of LEVEL_CLASSES) part.root.classList.remove(c);
      part.root.classList.add(`frame-region--${state.level}`);
      part.root.classList.toggle('frame-region--flicker', guidance.flickering && state.level !== 'off');
      part.root.style.setProperty('--glow-opacity', String(state.look.glowOpacity));
      part.root.style.setProperty('--glow-size', `${state.look.glowSizePx}px`);
      part.root.style.setProperty('--flicker-amplitude', String(state.look.flickerAmplitude));
      part.flame.hidden = !state.look.flame;
    }
  }

  return { element, glass, paint };
}
