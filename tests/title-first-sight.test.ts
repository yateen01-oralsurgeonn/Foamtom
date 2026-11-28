import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Speaker } from '../src/audio/speaker';
import { DISPLAY_TEXT } from '../src/ui/display-text';
import { createTitlePanel } from '../src/ui/title-panel';
import { HOWTO_STEPS, titleControls } from '../src/ui/title-model';

// Requirement 17 (first sight), design tests 40 to 43. The project has no DOM library, so the
// panel is built against a very small stand-in for `document`.

class FakeNode {
  className = '';
  textContent = '';
  type = '';
  disabled = false;
  readonly children: FakeNode[] = [];
  readonly attrs: Record<string, string> = {};
  readonly style: Record<string, string> = {};
  readonly classList = {
    add: (...names: string[]): void => {
      this.className = `${this.className} ${names.join(' ')}`.trim();
    },
  };
  constructor(readonly tag: string) {}
  append(...nodes: FakeNode[]): void {
    this.children.push(...nodes);
  }
  appendChild(node: FakeNode): FakeNode {
    this.children.push(node);
    return node;
  }
  setAttribute(name: string, value: string): void {
    this.attrs[name] = value;
  }
  getAttribute(name: string): string | null {
    return this.attrs[name] ?? null;
  }
  addEventListener(): void {
    /* no events in these tests */
  }
}

/** Every node below `node`, in document order (the node itself first). */
function walk(node: FakeNode): FakeNode[] {
  return [node, ...node.children.flatMap(walk)];
}

const speaker = { unlock: () => undefined, say: () => undefined } as unknown as Speaker;
const STEP_TEXTS = ['Pick up your brush', 'Monsters hide on your teeth', 'Brush them away!'];

let saved: unknown;
beforeAll(() => {
  saved = (globalThis as { document?: unknown }).document;
  (globalThis as { document?: unknown }).document = {
    createElement: (tag: string) => new FakeNode(tag),
  };
});
afterAll(() => {
  (globalThis as { document?: unknown }).document = saved;
});

function build(withExtras: boolean): FakeNode {
  const handlers = withExtras
    ? { onStart: () => undefined, onOpenBook: () => undefined, onParentOpen: () => undefined }
    : { onStart: () => undefined };
  return createTitlePanel(handlers, speaker).element as unknown as FakeNode;
}

describe('titlePanelFirstSight', () => {
  it('puts the name, the subtitle, the strip and then the start button, in that order', () => {
    for (const extras of [false, true]) {
      const kids = build(extras).children;
      expect(kids[0]?.tag).toBe('h1');
      expect(kids[0]?.textContent).toBe('Foamtom: The Haunted Mirror');
      expect(kids[1]?.className).toBe('title-subtitle');
      expect(kids[1]?.textContent).toBe('The 2-minute toothbrushing game');
      expect(kids[2]?.tag).toBe('ol');
      expect(kids[2]?.className).toBe('howto');
      expect(kids[3]?.className).toBe('big-button');
      // the start button is the first control, so everything else still follows it
      expect(kids.filter((k) => k.className === 'big-button')).toHaveLength(1);
      expect(kids.indexOf(kids[3]!)).toBeGreaterThan(2);
    }
  });

  it('shows the three steps in order, with the DISPLAY_TEXT words', () => {
    const strip = build(false).children[2]!;
    expect(strip.children).toHaveLength(3);
    const texts = strip.children.map((li) => li.children.find((c) => c.className === 'howto__text')?.textContent);
    expect(texts).toEqual(STEP_TEXTS);
    expect(texts).toEqual(HOWTO_STEPS.map((s) => DISPLAY_TEXT[s.textId].text));
    for (const li of strip.children) expect(li.tag).toBe('li');
  });

  it('keeps one large start button and puts the subtitle and strip before every control', () => {
    const kids = build(true).children;
    const firstControl = kids.findIndex((k) => k.tag === 'button');
    expect(firstControl).toBe(3);
    expect(kids.slice(0, firstControl).map((k) => k.className)).toEqual(['title', 'title-subtitle', 'howto']);
    expect(kids.filter((k) => k.tag === 'button' && k.className === 'big-button')).toHaveLength(1);
  });

  it('is not spoken: the strip needs no speaker call', () => {
    let spoken = 0;
    const quiet = { unlock: () => undefined, say: () => (spoken += 1) } as unknown as Speaker;
    createTitlePanel({ onStart: () => undefined }, quiet);
    expect(spoken).toBe(0);
  });
});

describe('howtoIconsHidden', () => {
  it('every step icon is aria-hidden and no step text is', () => {
    const strip = build(false).children[2]!;
    for (const li of strip.children) {
      const icon = li.children[0]!;
      expect(icon.className).toBe('howto__icon');
      expect(icon.attrs['aria-hidden']).toBe('true');
      const text = li.children[1]!;
      expect(text.className).toBe('howto__text');
      expect(text.attrs['aria-hidden']).toBeUndefined();
      expect(icon.children.length).toBeGreaterThan(0);
    }
  });

  it('the strip is a list, and the drawn monster sits inside the aria-hidden icon', () => {
    const strip = build(false).children[2]!;
    expect(strip.attrs.role).toBe('list');
    const monsterIcon = strip.children[1]!.children[0]!;
    const classes = walk(monsterIcon).map((n) => n.className);
    expect(classes.some((c) => c.startsWith('monster '))).toBe(true);
    expect(classes).toContain('tooth');
    // the monster is not outside any aria-hidden icon
    const outside = walk(strip).filter(
      (n) => n.className.startsWith('monster ') && !strip.children.some((li) => li.children[0] && walk(li.children[0]).includes(n) && li.children[0].attrs['aria-hidden'] === 'true'),
    );
    expect(outside).toEqual([]);
  });

  it('draws the three icons: a brush, a tooth with a monster, smoke', () => {
    const strip = build(false).children[2]!;
    const roots = strip.children.map((li) => li.children[0]!.children[0]!.className);
    expect(roots).toEqual(['tb', 'tooth', 'puff']);
  });
});

describe('howtoStepsTable', () => {
  it('has three rows, in order, each pointing at a shown DISPLAY_TEXT row', () => {
    expect(HOWTO_STEPS.map((s) => s.id)).toEqual(['brush', 'monsters', 'away']);
    expect(HOWTO_STEPS.map((s) => s.icon)).toEqual(['toothbrush', 'tooth-monster', 'smoke']);
    for (const step of HOWTO_STEPS) expect(DISPLAY_TEXT[step.textId].kind).toBe('shown');
  });

  it('does not change the controls: start, book and (with a handler) parent', () => {
    expect(titleControls(false).map((c) => c.id)).toEqual(['start', 'book']);
    expect(titleControls(true).map((c) => c.id)).toEqual(['start', 'book', 'parent']);
  });
});

function ruleBody(css: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`, 'm').exec(css);
  expect(match, selector).not.toBeNull();
  return match![1]!;
}

function remSize(body: string): number {
  const m = /font-size:\s*([\d.]+)rem/.exec(body);
  expect(m, body).not.toBeNull();
  return Number(m![1]);
}

describe('howtoCss', () => {
  const screens = readFileSync('src/ui/screens.css', 'utf8');
  const icons = screens; // the drawing rules sit at the end of screens.css (no new <link>, see design 5.5.1)
  const styles = readFileSync('src/ui/styles.css', 'utf8');
  const code = readFileSync('src/ui/howto-icons.ts', 'utf8');

  it('has no url(, no @font-face and no @import in the new rules', () => {
    for (const css of [screens]) {
      expect(css).not.toContain('url(');
      expect(css).not.toContain('@font-face');
      expect(css).not.toContain('@import');
    }
  });

  it('the subtitle is clearly smaller than the name and still readable (at least 1 rem)', () => {
    const name = remSize(ruleBody(styles, '.title'));
    const sub = remSize(ruleBody(screens, '.title-subtitle'));
    expect(sub).toBeLessThan(name);
    expect(sub).toBeGreaterThanOrEqual(1);
  });

  it('the strip is one row of three columns that cannot push the page wider', () => {
    const body = ruleBody(screens, '.howto');
    expect(body).toMatch(/grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
    expect(body).toMatch(/width:\s*100%/);
    expect(ruleBody(screens, '.howto__text')).toMatch(/overflow-wrap:\s*anywhere/);
    expect(ruleBody(screens, '.howto__step')).toMatch(/min-width:\s*0/);
  });

  it('the start button keeps its size: the strip rules do not touch .big-button', () => {
    expect(ruleBody(styles, '.big-button')).toMatch(/min-height:\s*72px/);
    expect(ruleBody(styles, '.big-button')).toMatch(/min-width:\s*160px/);
    for (const rule of [ruleBody(screens, '.howto'), ruleBody(screens, '.howto__icon'), ruleBody(screens, '.title-subtitle')]) {
      expect(rule).not.toMatch(/big-button/);
    }
  });

  it('the icon drawing code uses no emoji, image, innerHTML or inline style', () => {
    expect(code).not.toMatch(/\p{Extended_Pictographic}/u);
    expect(code).not.toMatch(/<img|innerHTML|style=|\.style\b|fetch|Image\(/);
    const panel = readFileSync('src/ui/title-panel.ts', 'utf8');
    expect(panel).not.toMatch(/\u{1FAA5}/u); // the toothbrush emoji: an empty box on older Android phones
  });
});
