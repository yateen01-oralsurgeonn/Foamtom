import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// Whole-spec guards for mirror-and-screens (design tests 26 to 29, plus a storage / network / log guard).
// Source scans only. No source file is changed by this test.

const ROOT = process.cwd();

function read(path: string): string {
  return readFileSync(join(ROOT, path), 'utf8');
}

function listFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(join(ROOT, dir))) {
    const rel = `${dir}/${name}`;
    if (statSync(join(ROOT, rel)).isDirectory()) out.push(...listFiles(rel));
    else out.push(rel);
  }
  return out;
}

const ALL_SRC = listFiles('src').filter((f) => /\.(ts|css)$/.test(f));

/** Files this spec adds (the lists of tasks 1 to 30). */
const NEW_TS = [
  'src/audio/audio-kit.ts',
  'src/audio/sound-player.ts',
  'src/audio/sounds.ts',
  'src/ui/book-model.ts',
  'src/ui/book-speech.ts',
  'src/ui/display-text.ts',
  'src/ui/effects-host.ts',
  'src/ui/effects.ts',
  'src/ui/end-lines.ts',
  'src/ui/frame-art.ts',
  'src/ui/frame-guidance.ts',
  'src/ui/mirror-frame.ts',
  'src/ui/monster-art.ts',
  'src/ui/monster-book-screen.ts',
  'src/ui/monster-draw-state.ts',
  'src/ui/monster-looks.ts',
  'src/ui/session-presenter.ts',
  'src/ui/sound-cues.ts',
  'src/ui/tap-targets.ts',
  'src/ui/title-model.ts',
  'src/ui/title-panel.ts',
];
const NEW_CSS = ['src/ui/frame.css', 'src/ui/monster-art.css', 'src/ui/screens.css'];

/** The ten pure files of design section 3. */
const PURE_FILES = [
  'src/ui/frame-guidance.ts',
  'src/ui/effects.ts',
  'src/ui/monster-draw-state.ts',
  'src/ui/sound-cues.ts',
  'src/ui/monster-looks.ts',
  'src/ui/book-model.ts',
  'src/ui/title-model.ts',
  'src/ui/tap-targets.ts',
  'src/ui/display-text.ts',
  'src/audio/sounds.ts',
];

/**
 * Files under src/ that contained a timer call before this spec: src/main.ts (the scheduler
 * adapter: setInterval and setTimeout) and src/tracking/camera-source.ts (the frame pump:
 * requestAnimationFrame and requestVideoFrameCallback).
 */
const TIMER_ALLOW_LIST = ['src/main.ts', 'src/tracking/camera-source.ts'];

describe('mirror-and-screens whole-spec guards', () => {
  it('lists only files that exist', () => {
    for (const f of [...NEW_TS, ...NEW_CSS, ...PURE_FILES]) expect(existsSync(join(ROOT, f)), f).toBe(true);
  });

  it('noNewTimers: timer calls appear under src/ only in the allow-list', () => {
    const offenders = ALL_SRC.filter(
      (f) =>
        /\b(setInterval|setTimeout|requestAnimationFrame|requestVideoFrameCallback)\b/.test(read(f)) &&
        !TIMER_ALLOW_LIST.includes(f),
    );
    expect(offenders).toEqual([]);
  });

  it('noNewTimers: no file this spec adds uses a timer or frame callback', () => {
    const offenders = [...NEW_TS, ...NEW_CSS].filter((f) =>
      /\b(setInterval|setTimeout|requestAnimationFrame|requestVideoFrameCallback)\b/.test(read(f)),
    );
    expect(offenders).toEqual([]);
  });

  it('pureFilesAreClean: no DOM, clock, randomness, storage or tracking import', () => {
    const banned = /\b(document|window|Date|performance|setTimeout|localStorage)\b|Math\.random/;
    const trackingImport = /from\s+['"][^'"]*\/tracking\//;
    for (const f of PURE_FILES) {
      const text = read(f);
      expect(banned.test(text), `${f} uses a banned name`).toBe(false);
      expect(trackingImport.test(text), `${f} imports src/tracking`).toBe(false);
    }
  });

  it('pureFilesAreClean: nothing under src/logic/ imports from ui/ or audio/', () => {
    const logicFiles = ALL_SRC.filter((f) => f.startsWith('src/logic/'));
    expect(logicFiles.length).toBeGreaterThan(0);
    for (const f of logicFiles) {
      expect(/from\s+['"][^'"]*\/(ui|audio)\//.test(read(f)), `${f} imports ui or audio`).toBe(false);
      expect(/from\s+['"]\.\.\/(ui|audio)\b/.test(read(f)), `${f} imports ui or audio`).toBe(false);
    }
  });

  it('drawValueStaysInPreview: DrawValue and draw-value appear only in the allowed files', () => {
    const allowed = (f: string): boolean =>
      f.startsWith('src/tracking/') ||
      f === 'src/ui/camera-preview.ts' ||
      f === 'src/ui/monster-anchor.ts' ||
      f === 'src/main.ts';
    const offenders = ALL_SRC.filter((f) => !allowed(f) && /DrawValue|draw-value/.test(read(f)));
    expect(offenders).toEqual([]);
  });

  it('noExternalAssets: new TS files have no style element, style attribute, innerHTML, img or font-face', () => {
    const banned = /<style|style=|innerHTML|<img|@font-face/;
    const offenders = NEW_TS.filter((f) => banned.test(read(f)));
    expect(offenders).toEqual([]);
  });

  it('noExternalAssets: new CSS files have no font-face, url( or style element', () => {
    const banned = /@font-face|url\(|<style/;
    const offenders = NEW_CSS.filter((f) => banned.test(read(f)));
    expect(offenders).toEqual([]);
  });

  it('noExternalAssets: each audio file under public/assets/ is named in NOTICE.txt', () => {
    const audio = existsSync(join(ROOT, 'public/assets'))
      ? listFiles('public/assets').filter((f) => /\.(mp3|ogg|wav|m4a|aac|opus|webm|flac)$/i.test(f))
      : [];
    if (audio.length === 0) return;
    const notice = read('public/assets/NOTICE.txt');
    for (const f of audio) {
      const name = relative('public/assets', f).replace(/\\/g, '/');
      expect(notice.includes(name) || notice.includes(name.split('/').pop() as string), `${f} not in NOTICE.txt`).toBe(true);
    }
  });

  it('noNewStorageNetworkOrLog: new files do not store, send, log or capture', () => {
    const banned = [
      'fetch(',
      'XMLHttpRequest',
      'sendBeacon',
      'WebSocket',
      'document.cookie',
      'localStorage',
      'console.',
      'toDataURL',
      'getImageData',
      'saveSession',
    ];
    const offenders: string[] = [];
    for (const f of [...NEW_TS, ...NEW_CSS]) {
      const text = read(f);
      for (const word of banned) if (text.includes(word)) offenders.push(`${f}: ${word}`);
    }
    expect(offenders).toEqual([]);
  });
});
