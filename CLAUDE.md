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
- **AI**: AI SDK 7 through **Vercel AI Gateway** (`createGateway` from `ai`). Default model `google/gemini-3.7-flash` (`server/utils/poem.ts`, picked by a blind test in Nov 2026), override with `NUXT_AI_GATEWAY_MODEL`
- **Payments**: Dodo Payments (€6.99 unlimited access)
- **Hosting**: Cloudflare Workers via Nitro `cloudflare_module`

### Poem generation
1. Form in `pages/index.vue` → `usePoemGenerator` POSTs to `/api/poem/generate`.
2. `server/api/poem/generate.post.ts`: rate limit (3/day/IP + 10 s debounce, skipped with the unlimited-access cookie), Zod validation, prompt from `server/utils/poem.ts`, `streamText` via AI Gateway.
3. Response is an AI SDK UI message stream (SSE), released word by word by `smoothStream`. The client parses it with `utils/poemStream.ts` (`text-delta` events; an `error` event throws so gateway failures show an error instead of an empty poem).
4. `utils/smoothReveal.ts` shows the text at a steady pace with `requestAnimationFrame`, whatever way the chunks arrive. Reduced motion and hidden tabs show it at once. The writing animation is visible until the first text arrives, while the model reasons.
5. The finished poem is saved to the on-device history (`usePoemHistory`, localStorage key `sintgpt-poem-history`, max 50) and shown in `PoemHistoryDrawer.vue`.

Notes:
- Cloudflare: Workers do not buffer the stream and waiting on the gateway is no CPU time. `cache-control: no-transform` stops zone compression. `enable_request_signal` (in `nuxt.config.ts`) lets a client disconnect abort the gateway request.
- Keep **temperature at 1** for Gemini 3.x. At 2 the model reasons for minutes and can stream garbled text.
- Client IP for rate limiting: `cf-connecting-ip` first (trusted on Cloudflare), then X-Forwarded-For.
- Rate-limit state is in memory, so on Workers it is per isolate, not global.
- HTTP errors raised on purpose (e.g. 429) are re-thrown as-is; the client shows the upgrade offer on 429.

### Payments
1. `PaymentModal` POSTs to `/api/payment/create-checkout` and redirects to Dodo's hosted checkout.
2. Dodo returns the buyer to `/?payment_id=...&status=...`. These parameters are only a hint.
3. `usePaymentTracking.claimPayment` POSTs the ID to `/api/payment/claim-access`. The server retrieves the payment from Dodo and checks status, product, refunds and disputes (`decidePaymentAccess`).
4. If granted, the server sets the signed, HTTP-only `sintgpt-access` cookie (`server/utils/paymentAccess.ts`). `hasUnlimitedAccess` verifies the signature on each request.

Notes:
- Buyers can restore access in `PaymentModal` with their payment ID, or through a `/?payment_id=pay_...` link. This uses the same server check. Anyone who has a valid ID can use it.
- The browser never decides access. Do not trust query parameters, localStorage or unsigned cookies for it.
- Refunds after the cookie is set do not revoke it (no database). A refunded payment cannot be claimed again.
- The free limit is soft: 1 poem in localStorage, 3/day/IP on the server.
- `/api/webhooks/dodo-payments` verifies signatures and only logs events.

### Poem links (no database)
`/gedicht?s=<opening>&l=<lang>&d=<digest>&sig=<signature>#<whole poem>`
- When a poem finishes, `generate.post.ts` adds a signed `data-share` chunk to the stream (`server/utils/poemShare.ts`). It is kept with the poem in the on-device history.
- Only the opening lines reach the server. The whole poem sits after the `#`, which browsers do not send (`utils/poemLink.ts`). The page shows it only if it matches the signed digest, so nobody can put other text on sintgpt.com through a link.
- `/gedicht/preview.png` draws the share image with resvg (WASM) from an SVG (`server/utils/shareImageSvg.ts`), and keeps it in Cloudflare's edge cache. It takes more CPU than the Workers Free plan allows. Fonts in `server/assets/share/` are SIL OFL.
- `NUXT_ACCESS_COOKIE_SECRET` also signs these links. Changing it breaks existing links.
- `/gedicht` is `noindex`. Do not add it to the sitemap.

### SEO
- The main address is `https://sintgpt.com`. `server/middleware/canonical-host.ts` redirects `www` to it. Each page sets its own canonical link.
- English is applied in the browser on the same URLs, so search engines see Dutch only. Do not add `hreflang` tags until English has its own URLs.

### Social proof
Only show numbers, reviews and ratings that come from real data. This includes the JSON-LD on the home page. Keep its offer in line with the real price and free limit.

### Open Graph images
- Specs in `scripts/og-images.ts`, rendered by `scripts/build-og-image.ts` (Puppeteer + sharp) to `public/og/<name>.jpg`.
- Pages call `useOgImage('<name>', alt)`, which sets absolute `og:image` URLs plus width/height/type/alt and Twitter tags. Re-run `npm run build:og` after changing a spec.

### Typography
Three families, declared in `nuxt.config.ts` (`fonts.families`), self-hosted by `@nuxt/fonts` and exposed as Tailwind tokens in `assets/css/main.css`:
- `font-display` (Texturina): headings and primary buttons. `h1`-`h6` get it from the base layer.
- `font-text` (Alegreya): poems and long reading text.
- `font-sans` (Alegreya Sans, the default): labels, inputs, buttons and other interface text.

In scoped CSS use `var(--font-display)` and friends. Do not set `font-family` with a `*` selector or outside a layer: that beats Tailwind utilities and every inherited font. Do not hard-code `fonts.gstatic.com` URLs.

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
| `NUXT_AI_GATEWAY_MODEL` | Optional model override, e.g. `openai/gpt-6.1-terra` |
| `NUXT_DODO_PAYMENTS_API_KEY` | Dodo Payments API key. The `dodo_live_` prefix selects live mode, anything else test mode |
| `NUXT_DODO_PRODUCT_ID` | Dodo product for unlimited access |
| `NUXT_DODO_PAYMENTS_WEBHOOK_SECRET` | Dodo webhook signing secret. Without it the webhook rejects every event |
| `NUXT_ACCESS_COOKIE_SECRET` | Signs the unlimited-access cookie and poem links (`openssl rand -hex 32`). Without it nobody gets unlimited access and poem links are off; changing it logs out all paying customers and breaks shared links |

## Tests

- `tests/unit/` - prompt/schema/cost and stream parser (fast, no network)
- `tests/e2e/app.test.ts` - builds the app, starts the server and a headless browser: pages, OG tags, rate limiting, the history drawer at phone size, and one **live** poem via AI Gateway (skipped without a key; costs a few cents)

## Analytics (Umami events)
`Generate poem`, `Poem generation failed`, `Open poem from history`, `Proceed to payment`, `Payment succeeded`, `Access restored`, `Copy share link`, `Open shared poem`, `Shared via WhatsApp/Email/Facebook`, `Copy to clipboard`.
