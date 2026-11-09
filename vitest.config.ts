import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // Load .env so the e2e server gets NUXT_AI_GATEWAY_API_KEY.
    env: {
      ...loadEnv('test', process.cwd(), ''),
      // Fixed test values, so the e2e tests can sign cookies and webhooks.
      NUXT_ACCESS_COOKIE_SECRET: 'e2e-access-secret',
      NUXT_DODO_PAYMENTS_WEBHOOK_SECRET: 'whsec_ZTJlLXdlYmhvb2stc2VjcmV0',
      NUXT_GIFT_CODES: 'e2e-gift-code-0123456789',
    },
    // The e2e suite builds the app and makes a live AI Gateway call.
    testTimeout: 180_000,
    hookTimeout: 600_000,
  },
});
