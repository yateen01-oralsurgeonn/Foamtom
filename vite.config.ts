import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  build: {
    // 0 = no asset becomes a data: URI (the Content-Security-Policy forbids them).
    assetsInlineLimit: 0,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
