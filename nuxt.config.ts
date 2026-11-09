import { fileURLToPath } from 'node:url';

// `npm run build:cloudflare` sets this. The Node build for the tests has no
// Durable Objects, so it keeps Nitro's own entry.
const isCloudflareBuild = process.env.NITRO_PRESET?.startsWith('cloudflare') ?? false;

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',

  devtools: { enabled: true },

  // No source maps in the deploy: Wrangler does not upload them, and each one
  // leaves a sourceMappingURL comment. scripts/strip-comments.ts removes the
  // rest of the comments after the build.
  sourcemap: { server: false, client: false },

  // Template comments never reach the HTML, whatever NODE_ENV the build runs
  // with (the e2e build runs as `test`).
  vue: {
    compilerOptions: { comments: false },
  },

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
    // Nitro's Worker entry plus the Durable Object classes, which Cloudflare
    // needs as exports of the Worker.
    ...(isCloudflareBuild
      ? { entry: fileURLToPath(new URL('./server/cloudflare-entry.ts', import.meta.url)) }
      : {}),
    // The share image renderer is WebAssembly. Workers load it as a module.
    experimental: { wasm: true },
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
      wrangler: {
        name: 'sintgpt',
        observability: { enabled: true },
        // Wrangler bundles the Worker again. Without minify it adds a
        // `// path` comment for every module.
        minify: true,
        // Also stops Wrangler's own source map and its sourceMappingURL comment.
        upload_source_maps: false,
        // Lets the Worker notice a client disconnect and stop poem generation.
        compatibility_flags: ['enable_request_signal'],
        // Stores poems that people share with a short link.
        // Also holds the "payments unavailable" flag (server/utils/paymentsStatus.ts).
        kv_namespaces: [{ binding: 'POEM_LINKS', id: 'bc2a7dcb97274e6b82a18989e89fd04c' }],
        // The global poem limits: one counter per IP or buyer
        // (server/durable/RateLimitCounter.ts). The Free plan supports only
        // SQLite-backed Durable Objects.
        durable_objects: {
          bindings: [{ name: 'RATE_LIMITER', class_name: 'RateLimitCounter' }],
        },
        migrations: [{ tag: 'v1', new_sqlite_classes: ['RateLimitCounter'] }],
        // A cheap first check per Cloudflare location against fast repeats,
        // before the Durable Object is asked (server/utils/poemRateLimit.ts).
        // Nitro's Wrangler types predate `ratelimits`; Nitro writes it as given.
        ...({
          ratelimits: [
            { name: 'POEM_BURST', namespace_id: '1001', simple: { limit: 1, period: 10 } },
          ],
        } as Record<string, unknown>),
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