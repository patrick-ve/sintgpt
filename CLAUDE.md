# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SintGPT is a Sinterklaas poem generator built with Nuxt 4. Users describe the recipient and the poem (style, rhyme scheme, length, language) and Gemini writes a personalised poem in Dutch or English, streamed to the page. Poems are kept on the device in a history drawer. Hosted on Cloudflare Workers.

## Key Commands

Package manager: **npm** (not yarn).

- `npm run dev` - Development server (with `--host`)
- `npm run build` - Production build (node-server preset; used by the tests)
- `npm run build:cloudflare` - Build for Cloudflare Workers (`cloudflare_module` preset)
- `npm run deploy` - Build for Cloudflare and deploy with Wrangler
- `npm run build:og` - Re-render the Open Graph images into `public/og/`
- `npm run typecheck` - `vue-tsc --noEmit`
- `npm test` - All tests (`test:unit`, `test:e2e`)

Local Worker preview: `npm run build:cloudflare && npx wrangler --cwd .output dev --env-file "$PWD/.env"`

## Architecture

### Stack
- **Framework**: Nuxt 4 (legacy root layout, no `app/` dir) with TypeScript
- **UI**: Nuxt UI 4 + Tailwind CSS 4, fonts self-hosted by `@nuxt/fonts`
- **AI**: AI SDK 7 through **Vercel AI Gateway** (`createGateway` from `ai`). Default model `google/gemini-3.1-pro-preview` (`server/utils/poem.ts`), override with `NUXT_AI_GATEWAY_MODEL`
- **Payments**: Dodo Payments (€1.99 unlimited access)
- **Hosting**: Cloudflare Workers via Nitro `cloudflare_module`

### Poem generation
1. Form in `pages/index.vue` → `usePoemGenerator` POSTs to `/api/poem/generate`.
2. `server/api/poem/generate.post.ts`: rate limit (3/day/IP + 10 s debounce, skipped with the unlimited-access cookie), Zod validation, prompt from `server/utils/poem.ts`, `streamText` via AI Gateway.
3. Response is an AI SDK UI message stream (SSE). The client parses it with `utils/poemStream.ts` (`text-delta` events; an `error` event throws so gateway failures show an error instead of an empty poem).
4. The finished poem is saved to the on-device history (`usePoemHistory`, localStorage key `sintgpt-poem-history`, max 50) and shown in `PoemHistoryDrawer.vue`.

Notes:
- Keep **temperature at 1** for Gemini 3.x. At 2 the model reasons for minutes and can stream garbled text.
- Client IP for rate limiting: `cf-connecting-ip` first (trusted on Cloudflare), then X-Forwarded-For.
- Rate-limit state is in memory, so on Workers it is per isolate, not global.
- HTTP errors raised on purpose (e.g. 429) are re-thrown as-is; the client shows the upgrade offer on 429.

### Open Graph images
- Specs in `scripts/og-images.ts`, rendered by `scripts/build-og-image.ts` (Puppeteer + sharp) to `public/og/<name>.jpg`.
- Pages call `useOgImage('<name>', alt)`, which sets absolute `og:image` URLs plus width/height/type/alt and Twitter tags. Re-run `npm run build:og` after changing a spec.

### Styling gotcha
`app.vue` sets an unlayered `* { font-family: 'Funnel Sans' }` and Ranchers for `h1`–`h6`. These beat Tailwind font utilities, so components define a scoped `.font-cinzel { font-family: 'Cinzel', serif }`. Do not hard-code `fonts.gstatic.com` URLs; `@nuxt/fonts` resolves and self-hosts the fonts.

### Coding conventions (from .cursorrules)
- Composition API with `<script setup>`, functional patterns, no classes
- Composables `use<Name>` in `composables/`, PascalCase component files
- TypeScript: prefer interfaces, avoid enums
- `useFetch` for SSR, `$fetch` in handlers; SEO via `useSeoMeta` / `useHead`

## Environment variables

Runtime config is read from `NUXT_*` env vars at runtime (not baked into the build). See `.env.example`. On Cloudflare, set them as Worker secrets (`npx wrangler secret put NAME --name sintgpt`).

| Variable | Purpose |
|---|---|
| `NUXT_AI_GATEWAY_API_KEY` | AI Gateway key (required) |
| `NUXT_AI_GATEWAY_MODEL` | Optional model override, e.g. `google/gemini-3.7-flash` |
| `NUXT_DODO_PAYMENTS_API_KEY` | Dodo Payments API key |
| `NUXT_DODO_PRODUCT_ID` | Dodo product for unlimited access |
| `NUXT_DODO_PAYMENTS_WEBHOOK_SECRET` | Dodo webhook signing secret |

## Tests

- `tests/unit/` - prompt/schema/cost and stream parser (fast, no network)
- `tests/e2e/app.test.ts` - builds the app, starts the server and a headless browser: pages, OG tags, rate limiting, the history drawer at phone size, and one **live** poem via AI Gateway (skipped without a key; costs a few cents)

## Analytics (Umami events)
`Generate poem`, `Poem generation failed`, `Open poem from history`, `Payment succeeded`, `Shared via WhatsApp/Email/Facebook`, `Copy to clipboard`.
