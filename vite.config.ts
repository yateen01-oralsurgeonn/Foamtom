import { defineConfig } from 'vitest/config';
import { stripMediapipeLogging } from './scripts/strip-mediapipe-logging.mjs';

const MEDIAPIPE_BUNDLE = /[\\/]@mediapipe[\\/]tasks-vision[\\/]vision_bundle\.mjs$/;

// Switches off MediaPipe's own usage logging (requirement 9.6). The same function is used by
// `vite build` and by the dev server's dependency pre-bundling.
const stripLoggingPlugin = {
  name: 'strip-mediapipe-logging',
  enforce: 'pre' as const,
  transform(code: string, id: string) {
    if (!MEDIAPIPE_BUNDLE.test(id.split('?')[0] ?? id)) return null;
    return { code: stripMediapipeLogging(code), map: null };
  },
};

export default defineConfig({
  base: './',
  plugins: [stripLoggingPlugin],
  optimizeDeps: {
    rolldownOptions: {
      plugins: [stripLoggingPlugin],
    },
  },
  build: {
    // 0 = no asset becomes a data: URI (the Content-Security-Policy forbids them).
    assetsInlineLimit: 0,
    // Only the game is built. The debug page under debug/ is never part of the site.
    rollupOptions: {
      input: 'index.html',
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
