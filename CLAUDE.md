# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SintGPT is a Sinterklaas poem generator built with Nuxt 4. Users describe the recipient and the poem (style, rhyme scheme, length, language) and Gemini writes a personalised poem in Dutch or English, streamed to the page. Poems are kept on the device in a history drawer. Hosted on Cloudflare Workers.

## Key Commands

Package manager: **npm** (not yarn).

- `npm run dev` - Development server (with `--host`)
- `npm run build` - Production build (node-server preset; used by the tests)
- `npm run build:cloudflare` - Build for Cloudflare Workers (`cloudflare_module` preset), then remove every comment from `.output` (`scripts/strip-comments.ts`; fails if one is left)
- `npm run deploy` - Build for Cloudflare and deploy with Wrangler
- `npm run build:og` - Re-render the Open Graph images into `public/og/`
- `npm run build:pdf-paper` - Re-render the PDF background from the CSS of `PaperScroll.vue`. Run after changing that component
- `npx tsx scripts/build-sint-images.ts` - Crop `public/sint.png` to the avatar, favicons and share image. Run `build:og` after it
- `npx tsx --env-file=.env scripts/generate-example-poems.ts <out.json> [id ...]` - Write the example poems again with the live prompt (costs a few cents). Review them, then copy the ones you keep into `utils/examplePoems.ts`
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
2. `server/api/poem/generate.post.ts`: rate limit (free: 3/day per IP; buyers: 100/day per payment; both with a 10 s debounce), Zod validation, prompt from `server/utils/poem.ts`, `streamText` via AI Gateway.
3. Response is an AI SDK UI message stream (SSE), released word by word by `smoothStream`. The client parses it with `utils/poemStream.ts` (`text-delta` events; an `error` event throws so gateway failures show an error instead of an empty poem).
4. `utils/smoothReveal.ts` shows the text at a steady pace with `requestAnimationFrame`, whatever way the chunks arrive. Reduced motion and hidden tabs show it at once. The writing animation is visible until the first text arrives, while the model reasons.
5. The finished poem is saved to the on-device history (`usePoemHistory`, localStorage key `sintgpt-poem-history`, max 50) and shown in `PoemHistoryDrawer.vue`.
6. "Herschrijf dit gedicht" sends the same form again with `regenerate: true`. The server then uses `REGENERATE_POEM_MODEL` (`google/gemini-3.1-pro-preview`, about 3x the price per token). It counts as a poem: free visitors see the payment window. Poems opened from the history have no form data, so they have no rewrite button.

Notes:
- Cloudflare: Workers do not buffer the stream and waiting on the gateway is no CPU time. `cache-control: no-transform` stops zone compression. `enable_request_signal` (in `nuxt.config.ts`) lets a client disconnect abort the gateway request.
- Keep **temperature at 1** for Gemini 3.x. At 2 the model reasons for minutes and can stream garbled text.
- Client IP for rate limiting: `cf-connecting-ip` first (trusted on Cloudflare), then X-Forwarded-For.
- Rate limiting (`server/utils/poemRateLimit.ts`): on Cloudflare the `POEM_BURST` Rate Limiting binding refuses fast repeats (approximate, per location), then a Durable Object per IP or buyer (`server/durable/RateLimitCounter.ts`, binding `RATE_LIMITER`) keeps the strict, global count. The rule itself is `applyRateLimit` in `server/utils/rateLimit.ts`. If Cloudflare fails, and in the Node build, an in-memory limiter decides. A request counts before validation.
- Counter names are an HMAC of the IP (IPv6 per /64) or payment ID, never the raw value. Each object deletes its data with an alarm when the 24-hour window ends. The privacy page says this, so keep them in line.
- The Durable Object class must be exported from the Worker. `server/cloudflare-entry.ts` re-exports Nitro's `cloudflare-module` entry plus the class; `nuxt.config.ts` uses it only when `NITRO_PRESET` is a Cloudflare preset. A new or renamed class needs a new `migrations` tag (Free plan: `new_sqlite_classes` only).
- 429 responses carry `data.reason`: `limit` (the page shows the upgrade offer), `debounce` and `fair-use` (the buyer cap; the page shows a message).
- Visitor text is escaped by `asPromptData` before it goes between XML tags in the prompt, so it cannot close a tag or end the data block. Instructions refer to the tags and never repeat visitor text.
- HTTP errors raised on purpose (e.g. 429) are re-thrown as-is; the client shows the upgrade offer on 429.

### Payments
1. `PaymentModal` POSTs to `/api/payment/create-checkout` and redirects to Dodo's hosted checkout.
2. Dodo returns the buyer to `/?payment_id=...&status=...`. These parameters are only a hint.
3. `usePaymentTracking.claimPayment` POSTs the ID to `/api/payment/claim-access`. The server retrieves the payment from Dodo and checks status, product, refunds and disputes (`decidePaymentAccess`).
4. If granted, the server sets the signed, HTTP-only `sintgpt-access` cookie (`server/utils/paymentAccess.ts`). `hasUnlimitedAccess` verifies the signature on each request; `unlimitedAccessPaymentId` also returns the payment ID for the buyer cap.

When Dodo refuses a checkout with 401 or 403 (for example "Live payments not enabled"), `create-checkout` stores a flag in KV for 15 minutes (`server/utils/paymentsStatus.ts`, key `status:payments-unavailable` in `POEM_LINKS`) and returns 503 with `data.code = 'payments_unavailable'`, never Dodo's text. `GET /api/payment/status` reads the flag. While it is set, the page does not offer payment: the client lifts its 1-poem limit, so only the server's 3/day applies, and the payment window explains the problem.

Keeping the form during payment: just before the redirect, `PaymentModal` emits `checkout` and the home page saves the form in localStorage (`utils/formDraft.ts`, key `sintgpt-form-draft`, 2 hours). On the next load of `/` the draft is always removed; it fills the form only when the visitor comes back from Dodo (`payment_id` or `payment=cancelled`). After a successful payment, the notice offers "Schrijf het gedicht". The payment window never shows the recipient's name.

Notes:
- Buyers can restore access in `PaymentModal` with their payment ID, or through a `/?payment_id=pay_...` link. This uses the same server check. Anyone who has a valid ID can use it.
- The browser never decides access. Do not trust query parameters, localStorage or unsigned cookies for it.
- Refunds after the cookie is set do not revoke it (no database). A refunded payment cannot be claimed again.
- The free limit is soft: 1 poem in localStorage, 3/day/IP on the server.
- The payment window says that the buyer pays Dodo (merchant of record) and that the right of withdrawal ends at once, with links to `/voorwaarden` and `/privacy`.
- `/api/webhooks/dodo-payments` verifies signatures and only logs events.

### Poem links (no database)
`/gedicht?s=<opening>&l=<lang>&d=<digest>&sig=<signature>#<whole poem>`
- When a poem finishes, `generate.post.ts` adds a signed `data-share` chunk to the stream (`server/utils/poemShare.ts`). It is kept with the poem in the on-device history.
- Only the opening lines reach the server. The whole poem sits after the `#`, which browsers do not send (`utils/poemLink.ts`). The page shows it only if it matches the signed digest, so nobody can put other text on sintgpt.com through a link.
- `/gedicht/preview.png` draws the share image with resvg (WASM) from an SVG (`server/utils/shareImageSvg.ts`), and keeps it in Cloudflare's edge cache. It takes more CPU than the Workers Free plan allows. Fonts in `server/assets/share/` are SIL OFL.
- `NUXT_ACCESS_COOKIE_SECRET` also signs these links. Changing it breaks existing links.
- `/gedicht` is `noindex`. Do not add it to the sitemap.

### Short poem links (Workers KV)
`/g/<id>` is what people share. The long link above stays as the fallback, and old links keep working.
- When someone shares a poem, `POST /api/share/links` checks the signature and the digest, so only poems from SintGPT are stored (`server/utils/poemShortLink.ts`). Nothing is stored before that moment.
- The poem sits in the `POEM_LINKS` KV namespace (`nuxt.config.ts`) and removes itself after 90 days. The privacy text in the locales says this, so keep them in line.
- The ID comes from an HMAC over the signature: the same poem gets the same link, and IDs cannot be worked out. It is 10 characters.
- If KV fails or reaches its daily write limit, or in the node-server build the tests use, the browser shares the long link.
- `/g/<id>` is `noindex` and uses the same `/gedicht/preview.png` share image.

### Poem PDF
"Opslaan als PDF" builds the file in the browser (`utils/poemPdf.ts`, pdf-lib), so it uses no Worker CPU. It is loaded with a dynamic import, because pdf-lib is large.
- The background `public/pdf/paper.jpg` is the empty scroll, rendered from the CSS of `PaperScroll.vue`.
- The text is real text in Alegreya, with a Texturina drop cap (`public/pdf/`, SIL OFL). Long poems get a smaller size, then more pages. Keep the sizes and colours in line with `PaperScroll.vue`.

### Persuasion: what the page may say
- The paid product is described as poems for the whole family ("Gedichten voor het hele gezin"), €6,99 once, one year in that browser, at most 100 a day. "Bij 7 gedichten betaal je minder dan €1 per gedicht" is plain maths (6,99 / 7). Keep these in line with the price and the limits.
- Use warm, plain words in visible text: "schrijven", not "genereren"; no "upgrade", "onbeperkt toegang", "AI-gegenereerd" or "tool". Search meta (`seo.title`, `seo.description`) may keep search terms.
- Do not name the AI model in public text, except where the privacy statement must name the services that process data.
- The countdown in the hero (`utils/pakjesavond.ts`) counts Dutch calendar days to 5 December, from 60 days before. From 3 days before it adds that a poem takes 30 seconds. It is a real date: never add a countdown to a price or an offer.

### Example poems
`utils/examplePoems.ts` holds poems that SintGPT wrote with `scripts/generate-example-poems.ts`, each next to the input it came from. The people are made up, and the page says so. They show on the home page (`components/ExamplePoems.vue`, one per style) and on `/voorbeelden` (all).

### Lootjes trekken
`/lootjes` draws names in the browser (`utils/lootjes.ts`, Sattolo's shuffle: one circle, nobody draws themselves). One phone goes round; each person taps their name to see their lootje. The draw stays in localStorage (`sintgpt-lootjes`) until "Nieuwe trekking". Nothing goes to the server. The blog post `/blog/lootjes-trekken-tips` describes this behaviour, so change both together.

### Blog
New posts use `components/BlogPost.vue` (layout, SEO meta, OG image, canonical, Article JSON-LD). Add each post to `pages/blog/index.vue`, `public/sitemap.xml` and `scripts/og-images.ts`, then run `npm run build:og`. Give the link to the poem form `data-cta="blog:<slug>"`, so analytics sees which post brings writers.

### Privacy and terms
`/privacy` and `/voorwaarden` render `components/LegalPage.vue` from `legal.*` in the locales. They state the limits (3/day, 100/day for buyers), the 90-day storage of short links, the 24-hour counters and the €6.99 price. Change them when the code changes; an e2e test checks the numbers.
- There is no cookie banner. The site sets only the functional `sintgpt-access` cookie after payment, analytics uses no cookies (Workers Analytics Engine, written by the server) and the rest is localStorage for features the visitor uses. Do not add tracking cookies or third-party embeds without consent handling.

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

## No comments in the deploy
The deployed files hold no comments. Source files keep theirs.
- `sourcemap: false` and Wrangler's `upload_source_maps: false` leave out every `sourceMappingURL` comment. Wrangler `minify: true` drops the `// path` comment it adds per module.
- `vue.compilerOptions.comments: false` keeps template comments out of the HTML in every build, also the e2e one.
- `scripts/strip-comments.ts` removes what is left (such as the Tailwind license banner) and fails the build if anything remains. HTML keeps Vue's hydration markers `<!--[-->`, `<!--]-->`, `<!---->` and `<!--v-if-->`.

## Tests

- `tests/unit/` - prompt/schema/cost, prompt injection, rate limit, stream parser, comment stripping, countdown, lootjes, form draft, example poems (fast, no network)
- `tests/e2e/app.test.ts` - builds the app, starts the server and a headless browser: pages, OG tags, rate limiting, the history drawer at phone size, and one **live** poem via AI Gateway (skipped without a key; costs a few cents)

## Analytics (Workers Analytics Engine)
No third-party script. Events go to the dataset `sintgpt_events` (binding `ANALYTICS`), which Cloudflare keeps for 3 months.
- **Server events** (`trackServerEvent` in `server/utils/analytics.ts`):
  - `Generate poem` / `Regenerate poem` when the stream ends: style, rhyme scheme, language, lines, plan, model (`detail`), tokens, estimated cost, seconds to the first text and in total, and coarse form use (`formFacts`: fun facts empty/short/long, present none/named/secret, written by and audience yes/no).
  - `Poem aborted` (the visitor left; `detail` before/during text, seconds), `Poem generation failed`, `Rate limited` (reason).
  - `Proceed to payment`, `Payments unavailable` (cause), `Payment verified` (in `claim-access`; `detail` return/restore), `Payment webhook` (event type in `detail`, amount in `value`, no country).
- **Browser events** (`useAnalytics().track`, sent with `sendBeacon` to `POST /api/events`):
  - Funnel: `Page view` (first one: referring domain in `detail`, utm tags in source/medium/campaign), `Form started`, `Form refused`, `Poem ready` (`detail` new/rewrite, `value` = poems on this device), `Show payment modal` (`detail` submit/rewrite/limit), `Close payment modal` (button/backdrop/escape/continue free), `Payment returned` (cancelled/failed/pending), `Payment succeeded`, `Continue after payment`, `Access restored`, `Restore failed` (invalid/denied/pending).
  - Engagement: `Copy share link`, `Copy to clipboard`, `Save as PDF`, `Shared via WhatsApp/Email/Facebook`, `Open shared poem`, `Shared poem to form`, `Open history`, `Open poem from history`, `Delete poem`, `Clear history`, `Switch language`, `Show example` (style), `Draw lootjes` (people), `Play video`, `Contact`.
  - Sources: `Scroll to poem form` (hero/examples) and `Go to poem form` (any link with `data-cta="<where>"`, tracked by `plugins/analytics.client.ts`; blog posts use `blog:<slug>`).
  - Problems: `Poem stream failed` (network/stream), `PDF failed`, `Copy failed`.
- The endpoint accepts only the names in `utils/analyticsEvents.ts`, short `detail` values and a number. The `EVENTS_BURST` Rate Limiting binding allows 60 events a minute per IP (keyed hash). Add a new event to that list first.
- Columns are positional; the order is documented at the top of `server/utils/analytics.ts`. Never reorder them, only append. Never put names, poem text, payment IDs or IP addresses in an event. Paths drop the query and hash, and `/g/<id>` becomes `/g/:id`. The privacy page lists what is kept: change it with the columns.
- Without the binding (Node build, tests) nothing is written.
- Reports: `CLOUDFLARE_ACCOUNT_ID=... CLOUDFLARE_ANALYTICS_TOKEN=... npx tsx scripts/analytics-report.ts [days]`. The token needs **Account Analytics Read**. Weight counts with `_sample_interval`: `SUM(_sample_interval)`, not `COUNT()`.
