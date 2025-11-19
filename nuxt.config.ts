// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',

  devtools: { enabled: true },

  modules: [
    '@nuxt/image',
    '@vueuse/nuxt',
    '@nuxt/ui',
  ],

  css: ['@/assets/css/main.css'],

  runtimeConfig: {
    googleGenerativeAiApiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    enrichLayerApiKey: process.env.ENRICH_LAYER_API_KEY,
    dodoPaymentsApiKey: process.env.DODO_PAYMENTS_API_KEY,
    dodoProductId: process.env.DODO_PRODUCT_ID,
    dodoPaymentsWebhookSecret: process.env.DODO_PAYMENTS_WEBHOOK_SECRET,
    public: {},
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
        { name: 'robots', content: 'index, follow' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/favicon-192x192.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
        { rel: 'canonical', href: 'https://sintgpt.com' },
        { rel: 'alternate', hreflang: 'nl', href: 'https://sintgpt.com' },
        { rel: 'alternate', hreflang: 'nl-NL', href: 'https://sintgpt.com' },
        { rel: 'alternate', hreflang: 'nl-BE', href: 'https://sintgpt.com' },
        { rel: 'alternate', hreflang: 'en', href: 'https://sintgpt.com' },
        { rel: 'alternate', hreflang: 'x-default', href: 'https://sintgpt.com' },
      ],
    },
  },

  // Configure Nuxt UI module
  ui: {
    // Icons are handled by @nuxt/icon module
  },

  vite: {
    esbuild: {
      legalComments: 'none',
    },
    build: {
      terserOptions: {
        format: {
          comments: false,
        },
      },
    },
  },
});