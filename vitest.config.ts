import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Default `vitest run` covers unit tests under src/; e2e runs via the test:e2e script.
    include: ['src/**/*.test.ts'],
  },
});
