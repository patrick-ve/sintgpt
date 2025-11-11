// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',

  devtools: { enabled: true },

  modules: [
    '@nuxt/image',
    '@vueuse/nuxt',
    '@nuxt/ui',
    '@nuxtjs/leaflet',
  ],

  css: ['@/assets/css/main.css'],

  runtimeConfig: {
    openaiApiKey: process.env.OPENAI_API_KEY,
    public: {},
  },

  colorMode: {
    preference: 'light',
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