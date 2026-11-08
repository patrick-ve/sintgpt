# SintGPT

AI Sinterklaas poem generator: describe the recipient, pick a style and rhyme scheme, and get a personalised poem in Dutch or English. Built with Nuxt 4, Nuxt UI 4 and AI SDK 7 (Gemini via Vercel AI Gateway), hosted on Cloudflare Workers.

## Getting started

```bash
npm install
cp .env.example .env   # fill in NUXT_AI_GATEWAY_API_KEY
npm run dev
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run typecheck` | Type check with `vue-tsc` |
| `npm test` | Unit and end-to-end tests (one live AI call if a key is set) |
| `npm run build:og` | Re-render the Open Graph images in `public/og/` |
| `npm run build:cloudflare` | Build for Cloudflare Workers |
| `npm run deploy` | Build and deploy to Cloudflare |

See [CLAUDE.md](CLAUDE.md) for architecture notes and environment variables.
