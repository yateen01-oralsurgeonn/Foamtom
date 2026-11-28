import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Requirement 17.8 and 17.9 (design tests 44 and 45): what a browser tab and a link preview read.

const html = readFileSync('index.html', 'utf8');

/** The `content` of the `<meta>` whose `name` or `property` is `key`; undefined when absent. */
function metaContent(key: string): string | undefined {
  for (const tag of html.match(/<meta\b[^>]*>/gs) ?? []) {
    const named = new RegExp(`\\b(?:name|property)="${key.replace(/[:.]/g, '\\$&')}"`).test(tag);
    if (named) return /\bcontent="([^"]*)"/.exec(tag)?.[1];
  }
  return undefined;
}

describe('indexHeadTags: tab', () => {
  it('has the tab title', () => {
    expect(/<title>([^<]*)<\/title>/.exec(html)?.[1]).toBe('Foamtom: the 2-minute toothbrushing game');
  });

  it('links the toothbrush favicon once, from the same origin', () => {
    const links = html.match(/<link\b[^>]*rel="icon"[^>]*>/g) ?? [];
    expect(links).toHaveLength(1);
    expect(links[0]).toMatch(/type="image\/svg\+xml"/);
    expect(links[0]).toMatch(/href="\/favicon\.svg"/);
    expect(links[0]).not.toMatch(/https?:|data:/);
  });
});

describe('faviconFile', () => {
  const svg = existsSync('public/favicon.svg') ? readFileSync('public/favicon.svg', 'utf8') : '';

  it('exists and is a small plain SVG with a viewBox', () => {
    expect(svg).toMatch(/^<svg\b/);
    expect(svg).toMatch(/viewBox="0 0 32 32"/);
    expect(svg.length).toBeLessThan(2000);
  });

  it('has no script, text, image, font, external reference or data URI', () => {
    expect(svg).not.toMatch(/<script|<text|<image|<foreignObject|<style|font|data:|href=|url\(/i);
    const urls = [...svg.matchAll(/https?:\/\/[^\s"']+/g)].map((m) => m[0]);
    expect(urls).toEqual(['http://www.w3.org/2000/svg']);
  });

  it('has no emoji', () => {
    expect(svg).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});

describe('indexHeadTags: link preview', () => {
  const DESCRIPTION =
    'A free 2-minute toothbrushing game for children aged 5 to 9. Monsters hide on the teeth; brushing makes them go away. The camera picture stays on the phone.';
  const BASE = 'https://yateen01-oralsurgeonn.github.io/Foamtom/';

  it('has the description, exactly', () => {
    expect(metaContent('description')).toBe(DESCRIPTION);
  });

  it('has every og: tag and twitter:card, exactly', () => {
    expect(metaContent('og:title')).toBe('Foamtom: the 2-minute toothbrushing game');
    expect(metaContent('og:description')).toBe(DESCRIPTION);
    expect(metaContent('og:description')).toBe(metaContent('description'));
    expect(metaContent('og:type')).toBe('website');
    expect(metaContent('og:url')).toBe(BASE);
    expect(metaContent('og:image')).toBe(`${BASE}share-card.png`);
    expect(metaContent('og:image:width')).toBe('1200');
    expect(metaContent('og:image:height')).toBe('630');
    expect(metaContent('og:image:alt')).toBe(
      'Foamtom: a cartoon monster on a tooth in a haunted mirror, and a toothbrush',
    );
    expect(metaContent('twitter:card')).toBe('summary_large_image');
  });

  it('gives the image as an absolute https address (WhatsApp ignores relative ones)', () => {
    expect(metaContent('og:image')).toMatch(/^https:\/\//);
  });

  it('has each tag once', () => {
    for (const key of ['description', 'og:title', 'og:description', 'og:type', 'og:url', 'og:image', 'og:image:width', 'og:image:height', 'og:image:alt', 'twitter:card']) {
      const count = (html.match(/<meta\b[^>]*>/gs) ?? []).filter((t) => t.includes(`"${key}"`)).length;
      expect(count, key).toBe(1);
    }
  });

  it('makes no health claim and names no clinic, person or phone number', () => {
    const text = [DESCRIPTION, metaContent('og:image:alt') ?? ''].join(' ').toLowerCase();
    expect(text).not.toMatch(/(^|[^a-z])(prevent|cure|clinic|doctor|dentist|registr|guarantee)/);
    expect(text).not.toMatch(/yatin|shinde|\d{7,}/);
  });

  it('leaves the Content-Security-Policy as it was', () => {
    const csp = /http-equiv="Content-Security-Policy"\s+content="([^"]*)"/.exec(html)?.[1];
    expect(csp).toBe(
      "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; img-src 'self'; media-src 'self'; connect-src 'self'",
    );
  });
});

describe('indexHeadTags: page stays safe', () => {
  it('has no inline style, style attribute, inline script or data: URI', () => {
    expect(html).not.toMatch(/<style/i);
    expect(html).not.toMatch(/\sstyle\s*=/i);
    expect(html).not.toContain('data:');
    for (const s of html.match(/<script\b[^>]*>/gi) ?? []) expect(s).toMatch(/\ssrc=/);
  });
});
