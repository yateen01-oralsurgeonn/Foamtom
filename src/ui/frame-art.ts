// Drawings for the mirror frame: the cracks and the candle pieces.
// Looks only. Colours, strokes and sizes live in frame.css.

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * One short, regular, star-shaped crack pattern, drawn in the top-left corner of a
 * 100 x 100 box. The four corners reuse it, turned by the stylesheet.
 */
const CRACK_PATHS: readonly string[] = [
  'M0 0 L22 22',
  'M0 0 L30 8',
  'M0 0 L8 30',
  'M22 22 L30 36',
  'M22 22 L36 30',
];

const CORNERS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const;

/** `svg.frame-cracks`: four small star-shaped crack groups, one per ring corner. */
export function buildCracks(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'frame-cracks');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('focusable', 'false');
  for (const corner of CORNERS) {
    const group = document.createElementNS(SVG_NS, 'g');
    group.setAttribute('class', `frame-cracks__corner frame-cracks__corner--${corner}`);
    for (const d of CRACK_PATHS) {
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('class', 'frame-cracks__line');
      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');
      group.appendChild(path);
    }
    svg.appendChild(group);
  }
  return svg;
}

export interface CandlePieces {
  readonly stick: HTMLElement;
  readonly flame: HTMLElement;
}

/** The candle stick and its flame. The painter decides whether the flame is shown. */
export function buildCandle(): CandlePieces {
  const stick = document.createElement('div');
  stick.className = 'frame-candle';
  const flame = document.createElement('div');
  flame.className = 'frame-flame';
  return { stick, flame };
}
