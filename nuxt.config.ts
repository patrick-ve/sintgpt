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
    googleApiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    enrichLayerApiKey: process.env.ENRICH_LAYER_API_KEY,
    public: {},
  },

  colorMode: {
    preference: 'light',
  },

  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },

  // Configure Nuxt UI module
  ui: {
    global: true,
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