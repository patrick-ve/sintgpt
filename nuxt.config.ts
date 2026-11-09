// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',

  devtools: { enabled: true },

  modules: [
    '@nuxt/image',
    '@vueuse/nuxt',
    '@nuxt/ui',
  ],

  css: ['@/assets/css/main.css'],

  runtimeConfig: {
    // Override at runtime with NUXT_AI_GATEWAY_API_KEY, NUXT_AI_GATEWAY_MODEL,
    // NUXT_DODO_PAYMENTS_API_KEY, NUXT_DODO_PRODUCT_ID and
    // NUXT_DODO_PAYMENTS_WEBHOOK_SECRET and NUXT_ACCESS_COOKIE_SECRET.
    aiGatewayApiKey: '',
    aiGatewayModel: '',
    dodoPaymentsApiKey: '',
    dodoProductId: '',
    dodoPaymentsWebhookSecret: '',
    accessCookieSecret: '',
    public: {},
  },

  fonts: {
    families: [
      { name: 'Texturina', weights: [500, 700], global: true },
      { name: 'Alegreya', weights: [400, 500], styles: ['normal', 'italic'], global: true },
      { name: 'Alegreya Sans', weights: [400, 500, 700], global: true },
    ],
  },

  colorMode: {
    preference: 'light',
  },

  app: {
    head: {
      htmlAttrs: {
        lang: 'nl',
      },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#7f1d1d' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/favicon-192x192.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
    },
  },

  // Configure Nuxt UI module
  ui: {
    // Icons are handled by @nuxt/icon module
  },

  hooks: {
    // pdf-lib is about 490 KB. Only people who save a poem should download it.
    'build:manifest': (manifest) => {
      const pdfEntry = manifest['utils/poemPdf.ts'];
      if (pdfEntry) {
        pdfEntry.prefetch = false;
        pdfEntry.preload = false;
      }
    },
  },

  // Used by `npm run build:cloudflare` (NITRO_PRESET=cloudflare_module).
  // Ignored by the default node-server build that the tests run against.
  nitro: {
    // The share image renderer is WebAssembly. Workers load it as a module.
    experimental: { wasm: true },
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
      wrangler: {
        name: 'sintgpt',
        observability: { enabled: true },
        // Lets the Worker notice a client disconnect and stop poem generation.
        compatibility_flags: ['enable_request_signal'],
        // Stores poems that people share with a short link.
        kv_namespaces: [{ binding: 'POEM_LINKS', id: 'bc2a7dcb97274e6b82a18989e89fd04c' }],
        // The Worker serves the domain itself. www redirects to the apex in
        // server/middleware/canonical-host.ts.
        routes: [
          { pattern: 'sintgpt.com', custom_domain: true },
          { pattern: 'www.sintgpt.com', custom_domain: true },
        ],
      },
    },
  },

  vite: {
    build: {
      rolldownOptions: {
        output: {
          comments: false,
        },
      },
    },
  },
});