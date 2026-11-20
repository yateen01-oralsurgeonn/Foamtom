import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
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
