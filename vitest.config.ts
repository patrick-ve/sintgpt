import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // Load .env so the e2e server gets NUXT_AI_GATEWAY_API_KEY.
    env: loadEnv('test', process.cwd(), ''),
    // The e2e suite builds the app and makes a live AI Gateway call.
    testTimeout: 180_000,
    hookTimeout: 600_000,
  },
});
