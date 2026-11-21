# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Open work, pending decisions and findings are tracked in `ISSUES.md`. Update it when an item changes.

## Project Overview

SintGPT is a Sinterklaas poem generator built with Nuxt 4. Users describe the recipient and the poem (style, rhyme scheme, length, language) and Gemini writes a personalised poem in Dutch or English, streamed to the page. Poems are kept on the device in a history drawer. Hosted on Cloudflare Workers.

## Key Commands

Package manager: **npm** (not yarn).

- `npm run dev` - Development server (with `--host`)
- `npm run build` - Production build (node-server preset; used by the tests)
- `npm run build:cloudflare` - Build for Cloudflare Workers (`cloudflare_module` preset), then remove every comment from `.output` (`scripts/strip-comments.ts`; fails if one is left), then add the hashed `_nuxt` files of earlier builds (`scripts/keep-old-assets.ts`, cache in `.cache/old-assets`, 14 days). Workers Assets serves only the newest deploy, so without them a page opened before a deploy cannot load its lazy chunks (pdf-lib: "PDF failed" on 13 Nov 2026)
- `npm run deploy` - Build for Cloudflare and deploy with Wrangler. Claude does not run it: the `/deploy` skill (`.claude/skills/deploy/SKILL.md`) tests, builds and runs `node scripts/predeploy-check.mjs` (no `.env` or `.env.analytics` value in `.output`, no live Dodo key in `.env`), then the user runs `! npx wrangler --cwd .output deploy`, then `bash scripts/smoke-test.sh` checks the live site (read-only)
- `npm run build:og` - Re-render the Open Graph images into `public/og/`
- `npm run build:pdf-paper` - Re-render the PDF background from the CSS of `PaperScroll.vue`. Run after changing that component
- `npx tsx scripts/build-sint-images.ts` - Crop `public/sint.png` to the avatar, favicons and share image, and `scripts/sint-styles/<style>.jpg` (one Sint photo per poem style, 1280x720, made from `sint.png` with GPT Image 2.5 Sunburst in ElevenLabs) to `public/sint-styles/`. Run `build:og` after it
- `npx tsx --env-file=.env scripts/generate-example-poems.ts <out.json> [id ...]` - Write the example poems again with the live prompt (costs a few cents). Review them, then copy the ones you keep into `utils/examplePoems.ts`
- `npx tsx scripts/build-stickers.ts [out-dir] [id ...]` - Render the guerrilla QR stickers (`scripts/stickers.ts`: the 9 Pikant and Roast designs chosen out of 30, plus 2 "ChatGPT vs Sint" designs chosen out of 5, on eleven layouts in `build-stickers.ts`, 90 mm at 300 dpi) to `marketing/stickers/`. Each QR links to the home page with `utm_campaign=ams-<id>`
- `npm run typecheck` - `vue-tsc --noEmit`
- `npm test` - All tests (`test:unit`, `test:e2e`)

Local Worker preview: `npm run build:cloudflare && npx wrangler --cwd .output dev --env-file "$PWD/.env"`

## Architecture

### Stack
- **Framework**: Nuxt 4 (legacy root layout, no `app/` dir) with TypeScript
- **UI**: Nuxt UI 4 + Tailwind CSS 4, fonts self-hosted by `@nuxt/fonts`
- **AI**: AI SDK 7 through **Vercel AI Gateway** (`createGateway` from `ai`). Default model `google/gemini-3.7-flash` (`server/utils/poem.ts`, picked by a blind test in Nov 2026), override with `NUXT_AI_GATEWAY_MODEL`
- **Payments**: Dodo Payments, three tiers (€3.99 / €6.99 / €12.99, see Pricing tiers)
- **Hosting**: Cloudflare Workers via Nitro `cloudflare_module`

### Poem generation
1. Form in `pages/index.vue` → `usePoemGenerator` POSTs to `/api/poem/generate`.
2. `server/api/poem/generate.post.ts`: rate limit (free: 1/day per IP, 3/day while payments do not work; buyers: 100/day per payment; both with a 10 s debounce), Zod validation, prompt from `server/utils/poem.ts`, `streamText` via AI Gateway.
3. Response is an AI SDK UI message stream (SSE), released word by word by `smoothStream`. The client parses it with `utils/poemStream.ts` (`text-delta` events; an `error` event throws so gateway failures show an error instead of an empty poem).
   - A dropped connection (a `TypeError` from fetch or the stream: a phone that locks or switches network) does not cost a poem. Each poem has an `attempt` ID (`crypto.randomUUID()`); `usePoemGenerator` asks again with the same ID and `retry: true` up to 2 times, after the page is visible and online again ("De verbinding viel even weg…"), and once more when the visitor asks for the same poem within 10 minutes. The rate limit lets up to `MAX_POEM_RETRIES` (3) retries of the last counted attempt through without counting and without the 10 s wait or `POEM_BURST` (`applyRateLimit` in `server/utils/rateLimit.ts`; the Durable Object keeps the attempt ID with the count). A page that fakes retries gets at most 4 poems for 1. Before this, a free visitor whose stream dropped had used the free poem (16 Nov 2026).
4. `utils/smoothReveal.ts` shows the text at a steady pace with `requestAnimationFrame`, whatever way the chunks arrive. Reduced motion and hidden tabs show it at once. The writing animation (`PoemWritingAnimation.vue`) is visible until the first text arrives, while the model reasons. It shows what the Sint does in steps ("De rijmpiet zoekt rijmwoorden…", texts in `poem.writing`, times in `utils/writingSteps.ts`: about 30 s for a new poem, about 70 s for a rewrite) and a bar that slows down near the end and never fills. Keep the step texts true to the prompt (syllables, a joke in the last line) and change the times when the measured wait changes.
5. The finished poem is saved to the on-device history (`usePoemHistory`, localStorage key `sintgpt-poem-history`, max 50) and shown in `PoemHistoryDrawer.vue`.
6. "Herschrijf dit gedicht" sends the same form again with `regenerate: true`. The server then uses `REGENERATE_POEM_MODEL` (`google/gemini-3.1-pro-preview`, about 3x the price per token). It counts as a poem: free visitors see the payment window. Drie does not include rewrites: the page opens the payment window and the server refuses it with 403 `data.reason = 'tier'` before it counts. When the window opens for a rewrite of the poem on screen, it also offers "Pas het gedicht zelf aan" (`freeEdit`): editing is free, so a visitor who wants a few words changed does not have to pay (`Close payment modal` `edit`). Poems opened from the history have no form data, so they have no rewrite button.
   - **Free rewrite** (`server/utils/freeRewrite.ts`): a free visitor may rewrite once, with a wish ("Herschrijf gratis met een wens"; without a wish the button opens the wish field). Safeguards: only with a wish, only of a poem with SintGPT's signature (the page sends `previousShare`, the server checks it against the digest of `previousPoem`), on `DEFAULT_POEM_MODEL` instead of the rewrite model, its own counter per IP (`FREE_REWRITE_LIMIT`, 1 per 24 hours, subject `rewrite`), and the kill switch `NUXT_FREE_REWRITE=off`. A request that does not qualify is an ordinary rewrite and counts as a poem. The page keeps `freeRewriteUsed` in `sinterklaas-payment`; a refused one gets 429 `data.reason = 'rewrite'`. Analytics: `Regenerate poem` with plan `free`, `Poem ready` `free rewrite`.
7. "Zeg wat er anders moet" (or a 👎) opens a wish for the rewrite: free text up to 200 characters plus chips (Korter, Grappiger, …). With a wish, the request also sends the poem on screen (`rewriteHint`, `previousPoem`, limits in `utils/poemLimits.ts`), and the prompt puts them in `<rewrite_wish>` and `<previous_poem>` tags. The wish may change content, tone and length (4–50 lines), never the task or the rules. The server ignores both fields without `regenerate`. The privacy text names the wish and the previous poem; keep them in line.
8. "Aanhef en ondertekening" (a switch in step 3, on by default, field `greeting`; the API defaults to off for older pages): the server puts `Lieve <name>,` (English: `Dear <name>,`) above the poem and `Van Sint & Piet` (`From Sinterklaas & Pete`) below it (`utils/poemFrame.ts`). They are not the model's: the stream transform `framePoemStream` sends the greeting with the first text of the poem and the signature when the step ends, so they are exact and outside the line count. The prompt then tells the model not to write a greeting or signature itself (without that rule it starts with "Lieve Marieke," too). The signed text is the framed poem, so the shared page, short links, PDF, copy and history show them without extra code. The share image and link preview leave the greeting out: the signed opening is the first 2 lines of the poem itself (`extractOpening` skips an `isGreetingLine`). Links signed on 15 Nov 2026 before that change drop it when shown (`shownOpening` in `verifyPoemShare`); `SHARE_IMAGE_VERSION` in the edge cache key makes their image draw again. A rewrite removes them from `previousPoem` (`unframePoem`) before the prompt. Only plain names get a greeting (`greetingName`: letters, spaces, `&`, `-`, `'` and initials, at most 40 characters, no domains), because the name goes verbatim into signed text and the share image; other names get only the signature. The page and `PaperScroll.vue` set the signature line apart (`isSignatureLine`). The sample poem shows its signature only while the switch is on.
9. Length: the slider offers 8 to 40 lines in steps of 4 (`POEM_LINES` in `utils/poemLimits.ts`). A limerick is always one verse of 5 lines (`LIMERICK_LINES`): the slider is off and the length chosen before comes back after it. The server makes every limerick 5 lines and other schemes at least 8 (`withPoemLength`, right after parsing in `generate.post.ts` and `preview.post.ts`), so older pages that send a limerick of 10 to 50 lines get 5.
10. Under each poem a 👍/👎 sends `Rate poem` (`detail` `up:<style>` / `down:<style>`). Nothing else is stored.

Notes:
- Cloudflare: Workers do not buffer the stream and waiting on the gateway is no CPU time. `cache-control: no-transform` stops zone compression. `enable_request_signal` (in `nuxt.config.ts`) lets a client disconnect abort the gateway request.
- Keep **temperature at 1** for Gemini 3.x. At 2 the model reasons for minutes and can stream garbled text.
- Leave Flash's **thinking level at its default** for poems (it equals `medium`). At `low` the model often does not reason: 3 times cheaper and faster, but clearly worse poems, some with a wrong line count. `high` doubles the wait and the cost.
- Rewrites (Gemini 3.1 Pro) use thinking level **`medium`** (`poemProviderOptions` in `server/utils/poem.ts`). Pro's default reasons about 9,000 tokens, with the first text after about 2 minutes and some poems over 5 minutes; `medium` was not measurably worse in a blind test (15 Nov 2026) and is 20 to 45% faster and 40% cheaper. `low` lost clearly. See the finding in `ISSUES.md`.
- The prompt (`buildPrompt`, rewritten 14 Nov 2026 after a blind test) asks for lines of about 10 syllables, rhyme without filler words, one joke per rhyme pair, a closing punchline, one voice (Sint, or the writer the visitor names) and no made-up traits. Without fun facts it tells the model to write about Sint, Piet and the present. Do not add a "work in steps" or "check before you answer" block: without reasoning the model then writes its drafts into the answer. Keep the "Tempo" line: it cuts the reasoning (and the wait) by a quarter at the same quality. The example couplets are about a rare subject (courgettes), because the model borrows words from an example about the same subject as the request.
- Client IP for rate limiting: `cf-connecting-ip` first (trusted on Cloudflare), then X-Forwarded-For.
- **API guard** (`server/middleware/api-guard.ts`, rules in `server/utils/apiGuard.ts`) runs on every `/api` request: `nosniff` and `cache-control: no-store` (handlers may set their own, such as the poem stream's `no-cache, no-transform`); writes from another site are refused with 403 (`Sec-Fetch-Site` must be `same-origin`; without it, the `Origin` host must match; requests with neither, such as curl, pass); bodies over 64 KB get 413. `/api/webhooks/` is left alone. Routes without a limit of their own get one per IP: `PAYMENT_BURST` (10/min: create-checkout, claim-access, claim-gift) and `LINKS_BURST` (60/min: share links and verify), 429 with `data.reason = 'burst'`. `/api/events` allows 30/min per IP (`EVENTS_BURST`) and `Client error` 3/min (`CLIENT_ERRORS_BURST`, dropped quietly). Error answers never carry the provider's message.
- Rate limiting (`server/utils/poemRateLimit.ts`): on Cloudflare the `POEM_BURST` Rate Limiting binding refuses fast repeats (approximate, per location), then a Durable Object per IP or buyer (`server/durable/RateLimitCounter.ts`, binding `RATE_LIMITER`) keeps the strict, global count. The rule itself is `applyRateLimit` in `server/utils/rateLimit.ts`. If Cloudflare fails, and in the Node build, an in-memory limiter decides. A request counts before validation.
- Counter names are an HMAC of the IP (IPv6 per /64) or payment ID, never the raw value. Each object deletes its data with an alarm when its window ends: after 24 hours, or for a Drie payment at the end of pakjesavond (one window of 3 poems, `creditsRule`). `POST /peek` on the object reads the count without counting (`poemsUsed`, for "poems left"). The privacy page says this, so keep them in line.
- The Durable Object class must be exported from the Worker. `server/cloudflare-entry.ts` re-exports Nitro's `cloudflare-module` entry plus the class; `nuxt.config.ts` uses it only when `NITRO_PRESET` is a Cloudflare preset. A new or renamed class needs a new `migrations` tag (Free plan: `new_sqlite_classes` only).
- 429 responses carry `data.reason`: `limit` (the page shows the payment offer), `credits` (the 3 Drie poems are used; the page offers the tiers above), `debounce` and `fair-use` (the buyer cap; the page shows a message).
- Visitor text is escaped by `asPromptData` before it goes between XML tags in the prompt, so it cannot close a tag or end the data block. Instructions refer to the tags and never repeat visitor text.
- HTTP errors raised on purpose (e.g. 429) are re-thrown as-is; the client shows the upgrade offer on 429.

### Payments
1. `PaymentModal` POSTs to `/api/payment/create-checkout` and redirects to Dodo's hosted checkout.
2. Dodo returns the buyer to `/?payment_id=...&status=...`. These parameters are only a hint.
3. `usePaymentTracking.claimPayment` POSTs the ID to `/api/payment/claim-access`. The server retrieves the payment from Dodo and checks status, product, refunds and disputes (`decidePaymentAccess`). The product decides the tier; the payment date (`created_at`) decides when access ends, so restoring an old payment never starts a new period (`expired`).
4. If granted, the server sets the signed, HTTP-only `sintgpt-access` cookie (`server/utils/paymentAccess.ts`, token `v2.<payment>.<tier>.<expiry>.<sig>`, max-age until the access ends, at most 400 days). `paidAccess` verifies it on each request and returns the payment ID, tier and end. `v1` tokens from before the tiers still work and mean Gezin. `GET /api/payment/check-access` tells the page the tier and, for Drie, the poems left.

### Pricing tiers
`utils/pricingTiers.ts` is the one source for the tiers; the payment window, server, JSON-LD, terms and tests follow it. Open Dodo and Cloudflare setup steps for the tiers (test key, live products, Worker secrets): `docs/dodo-payments-todo.md`. Decisions and test results: `docs/pricing-tiers.md`.

| Tier | Price | Poems | Valid | Extras |
|---|---|---|---|---|
| `drie` ("3 gedichten") | €3.99 | 3 in total | until the next pakjesavond (end of 5 Dec, NL time) | no rewrites |
| `gezin` ("Gezin", recommended) | €6.99 | max 100/day | 365 days | rewrites |
| `familie` ("Hele familie") | €12.99 | max 100/day | until the second pakjesavond | rewrites, 2 extra PDF designs, surprise ideas |

- Each tier is its own Dodo product: `NUXT_DODO_PRODUCT_ID` (Gezin, the product from before the tiers), `NUXT_DODO_PRODUCT_ID_DRIE`, `NUXT_DODO_PRODUCT_ID_FAMILIE`. A tier without a product is not on sale: `/api/payment/status` lists the tiers on sale and the window shows only those. The browser sends a tier name, never a product ID.
- The payment window selects Gezin (or the next tier above what the buyer has). Tiers at or below the buyer's tier show "Dit heb je al". There is no upgrade discount: a buyer pays the full price of the higher tier; the terms say so.
- Surprise ideas: `POST /api/poem/surprise` (Hele familie only, 403 `tier` otherwise) returns 3 ideas as structured output from `DEFAULT_POEM_MODEL` (`server/utils/surprise.ts`, same prompt-injection rules as the poem). It counts towards the 100/day cap. Others see the button with a lock; it opens the payment window with Hele familie selected.
- Gift links: `https://sintgpt.com/?cadeau=<code>` gives Hele familie without a payment (`server/utils/giftAccess.ts`, `POST /api/payment/claim-gift`). Season codes (`NUXT_GIFT_CODES_SEASON`, the gift mail to last season's buyers, `docs/buyer-gift-mail.md`, sent with `scripts/gift-mail.ts`) give Hele familie only until `giftSeasonEnd` (`NUXT_GIFT_SEASON_END`, 23:00 UTC that day) and work in at most 3 browsers each (counted in the `RATE_LIMITER` Durable Object, subject `gift`; the 4th gets `full`). Codes live in the Worker secret `NUXT_GIFT_CODES` (comma-separated, at least 16 characters, `openssl rand -hex 16`); never put a code in git or chat. The cookie holds `gift_<hash>`, not the code. Removing a code ends its access at once (`paidAccess` checks the list). The page removes the code from the address bar. Analytics: `Gift claimed` (granted/denied).
- The extra PDF designs are a soft lock: the PDF is built in the browser, so the page offers Hele familie instead of building a locked design.

When Dodo refuses a checkout with 401 or 403 (for example "Live payments not enabled"), `create-checkout` stores a flag in KV for 15 minutes (`server/utils/paymentsStatus.ts`, key `status:payments-unavailable` in `POEM_LINKS`) and returns 503 with `data.code = 'payments_unavailable'`, never Dodo's text. `GET /api/payment/status` reads the flag. While it is set, the page does not offer payment: the client lifts its 1-poem limit and the server allows 3/day per IP instead of 1 (`freeRateLimit` in `server/utils/rateLimit.ts`), and the payment window explains the problem.

**Write first, then pay** (`server/utils/poemPreview.ts`): a free visitor without poems left who sends the form gets the poem written anyway (`POST /api/poem/preview`, plain `generateText`, the poem model). The server keeps the whole poem 2 hours in `POEM_LINKS` (key `preview:<id>`, 128-bit ID) and returns only the greeting plus the first stanza (at most 4 lines, at most half the poem) and the lengths of the other lines; the page draws those as blurred bars and offers "Lees het hele gedicht" (payment window, trigger `preview`). The page keeps the ID and the start in localStorage (`sintgpt-poem-preview`, `usePoemPreview`). When the visitor has access (payment, gift or restore: a watch on `isPaid`), `POST /api/poem/unlock` returns the poem with a fresh signature; it counts as one of the buyer's poems once, and the same buyer may fetch it again for 15 minutes. Safeguards: 2 previews per IP per 24 hours (`POEM_PREVIEW_LIMIT`), only while payments work and only without access, `PAYMENT_BURST` on unlock, and the kill switch `NUXT_POEM_PREVIEW=off`. Without KV (the Node build) or on any error, the page opens the payment window as before. Analytics: `Poem preview` (cost fields), `Poem unlocked` (`new`/`expired`, `value` = minutes since the preview), `Poem ready` `preview`. The privacy text and the terms name the 2 hours; keep them in line.

Keeping the form during payment: just before the redirect, `PaymentModal` emits `checkout` and the home page saves the form in localStorage (`utils/formDraft.ts`, key `sintgpt-form-draft`, 2 hours), without the style: every visit starts with Grappig, and the style radios have `autocomplete="off"` so the browser does not bring back an old choice. On the next load of `/` the draft is always removed; it fills the form only when the visitor comes back from Dodo (`payment_id` or `payment=cancelled`). After a successful payment, the notice offers "Schrijf het gedicht". The payment window never shows the recipient's name.

Notes:
- Buyers can restore access in `PaymentModal` with their payment ID, or through a `/?payment_id=pay_...` link. This uses the same server check. Anyone who has a valid ID can use it.
- The browser never decides access. Do not trust query parameters, localStorage or unsigned cookies for it.
- Refunds after the cookie is set do not revoke it (no database). A refunded payment cannot be claimed again.
- The free limit: 1 poem in localStorage, and 1/day per IP on the server (`POEM_RATE_LIMIT`), so a private window or cleared site data gets no extra poem. A new IP does (another network, a VPN, a phone that reconnects); IPv6 counts per /64. A refused visitor sees "Het gratis gedicht is al gebruikt" with the payment offer.
- The payment window says that the buyer pays Dodo (merchant of record) and that the right of withdrawal ends at once, with links to `/voorwaarden` and `/privacy`.
- `/api/webhooks/dodo-payments` verifies signatures and only logs events.

### Poem links (no database)
`/gedicht?s=<opening>&l=<lang>&d=<digest>&sig=<signature>#<whole poem>`
- When a poem finishes, `generate.post.ts` adds a signed `data-share` chunk to the stream (`server/utils/poemShare.ts`). It is kept with the poem in the on-device history.
- Only the opening lines reach the server. The whole poem sits after the `#`, which browsers do not send (`utils/poemLink.ts`). The page shows it only if it matches the signed digest, so nobody can put other text on sintgpt.com through a link.
- `/gedicht/preview.png` draws the share image with resvg (WASM) from an SVG (`server/utils/shareImageSvg.ts`), and keeps it in Cloudflare's edge cache. It takes more CPU than the Workers Free plan allows. Fonts in `server/assets/share/` are SIL OFL.
- `NUXT_ACCESS_COOKIE_SECRET` also signs these links. Changing it breaks existing links.
- Editing ("Pas aan" on the poem card) changes the poem in place. The history entry keeps the poem SintGPT wrote (`original`, `originalShare`). `POST /api/share/edit` signs the edit only when the signed original matches its digest and the edit is small (`server/utils/poemEdit.ts`: at most 25% of the words, and at most 25% of the opening's characters, minimum 12, because the preview shows the opening). Every edit is compared with the original, so edits cannot add up. A larger edit gets `share: null`: the poem has no link but can still be copied, shared as text or saved as PDF. The privacy text says this; keep them in line.
- `/gedicht` is `noindex`. Do not add it to the sitemap.
- The page a reader sees (`components/SharedPoemView.vue`, for `/gedicht` and `/g/<id>`) speaks to the reader as the one the poem may be for ("Er is een gedicht voor je!"; link preview title "Er is een sinterklaasgedicht voor je"), then offers the form (`/#poem-form`) with the countdown, one button and "Klaar in 30 seconden. Je eerste gedicht is gratis." On phones a bar at the bottom offers the form while the reader is in the poem and the button is out of view. `Shared poem to form` carries `detail` `button` or `bar`.

### Short poem links (Workers KV)
`/g/<id>` is what people share. The long link above stays as the fallback, and old links keep working.
- When someone shares a poem, `POST /api/share/links` checks the signature and the digest, so only poems from SintGPT are stored (`server/utils/poemShortLink.ts`). Nothing is stored before that moment.
- The poem sits in the `POEM_LINKS` KV namespace (`nuxt.config.ts`) and removes itself after 90 days. The privacy text in the locales says this, so keep them in line.
- The ID comes from an HMAC over the signature: the same poem gets the same link, and IDs cannot be worked out. It is 10 characters.
- If KV fails or reaches its daily write limit, or in the node-server build the tests use, the browser shares the long link.
- Phones and tablets (`navigator.share` and `(pointer: coarse)`) get one "Deel gedicht" button with the system share sheet instead of WhatsApp/E-mail/Facebook (`shareNative` in `pages/index.vue`). The sheet opens only right after a tap, so the short link gets 1 s, then the long link goes. If the browser refuses after that wait, the button says "Tik nog eens om te delen" and the second tap uses the short link at once. Never make the short link before the visitor shares: the privacy text says nothing is stored before that.
- `/g/<id>` is `noindex` and uses the same `/gedicht/preview.png` share image.

### Poem PDF
"Opslaan als PDF" opens `PdfDesignDialog.vue`, where the visitor picks one of six designs (`utils/pdfDesigns.ts`: perkament, pakjesavond, cadeaupapier, schoolschrift, and goudfolie and stoomboot for Hele familie, `EXTRA_PDF_DESIGN_IDS`; the last choice stays in localStorage `sintgpt-pdf-design`). The browser then builds the file (`utils/poemPdf.ts`, pdf-lib), so it uses no Worker CPU. pdf-lib is loaded with a dynamic import, because it is large.
- The PDF never names the site: no attribution line, no author or creator in the metadata, no text on a background. Only the file name does: `sinterklaasgedicht-<name>-sintgpt.com.pdf`.
- Each design has a full-page JPEG background, a text font, an optional drop-cap font, colours, a writing area and font sizes. Long poems get a smaller size, then more pages.
- Backgrounds: `public/pdf/paper.jpg` is the empty scroll, rendered from the CSS of `PaperScroll.vue` (`npm run build:pdf-paper`). The other three are SVG in `scripts/build-pdf-designs.ts` (`npm run build:pdf-designs`). Keep their empty spaces in line with `area` in the design.
- Previews in the dialog (`public/pdf/previews/`) are page 1 of a real PDF of an example poem: `npm run build:pdf-previews` (needs `pdftoppm` from Poppler). Run it after changing a design. `npx tsx scripts/build-pdf-previews.ts <dir>` writes full-size PDFs and PNGs to review.
- Fonts in `public/pdf/` (SIL OFL): Alegreya and Texturina, like the site, and Caveat for the notebook. pdf-lib cannot subset Caveat or lay out its contextual alternates, so that design sets `plainFont` (embedded whole, no alternates).
- `Save as PDF` and `PDF failed` carry the design in `detail`.
- Phones and tablets that can share files (`navigator.canShare({ files })` and `(pointer: coarse)`) get "Deel PDF" as the main button and "Downloaden" next to it. The share sheet opens only right after a tap, so the window asks the page to build the chosen design when it opens and when the visitor picks another one (`preparePdf`, kept per design until the poem changes). If the PDF was not ready and the browser refuses the sheet after the wait, the button says "Tik nog eens om te delen". Event `Share PDF` (`detail` `<design>:done/cancelled/refused/failed`).
- Home page carousel (`components/PdfShowcase.vue`, between the form and "ChatGPT vs SintGPT"): the four designs without a tier, each with a different AABB example poem (`utils/pdfShowcase.ts`). It shows no extra designs of Hele familie and names no tier. Under the row, a link goes to `/voorbeelden`. The pictures in `public/pdf/showcase/` are page 1 of a real PDF: run `npm run build:pdf-showcase` after changing a design or one of those poems. The same script draws the sheets of `/voorbeelden` (see Example poems) and fails when a poem does not fit on one page. The row moves endlessly (stops on hover and focus) and is a row to scroll by hand with reduced motion.

### Persuasion: what the page may say
- Three tiers, Gezin in the middle (compromise effect), with "Aanbevolen" on it. Never write "meest gekozen" or "populair" without real data. Never show a struck-through "old" price.
- Gezin is described as poems for the whole family, €6,99 once, one year in that browser, at most 100 a day. "Bij 7 gedichten minder dan €1 per gedicht" is plain maths (6,99 / 7); "€1,33 per gedicht" for Drie is 3,99 / 3 rounded up; "Voor €3 meer schrijf je met Gezin zoveel gedichten als je wilt" is 6,99 − 3,99. Keep these in line with `utils/pricingTiers.ts`.
- Every tier is a real offer with real value; the extras of Hele familie (a second season, extra designs, surprise ideas) really exist.
- Use warm, plain words in visible text: "schrijven", not "genereren"; no "upgrade", "onbeperkt toegang", "AI-gegenereerd" or "tool". Search meta (`seo.title`, `seo.description`) may keep search terms.
- Do not name the AI model in public text, except where the privacy statement must name the services that process data.
- The countdown in the hero (`utils/pakjesavond.ts`) counts Dutch calendar days to 5 December, from 60 days before. From 3 days before it adds that a poem takes 30 seconds. It is a real date: never add a countdown to a price or an offer.

### Example poems
`utils/examplePoems.ts` holds poems that SintGPT wrote with `scripts/generate-example-poems.ts`, each next to the input it came from. The people are made up, and the page says so. They show on the home page (`components/ExamplePoems.vue`, one per style) and on `/voorbeelden` (all).

On `/voorbeelden` each example is a sheet (`components/ExampleSheet.vue`): the front is page 1 of its real PDF (`public/pdf/examples/<id>-560|1120.webp`, design per example in `utils/exampleSheets.ts`, only designs without a tier), the back is "Dit wist de Sint" (the form input, and a link to the form with that style). "Wat wist de Sint?" (or a click on the sheet) turns it over in 3D; with reduced motion the back fades in. The hidden face is `inert`. The sheet is A4 and grows only when the back needs more room (below about 360 px). The poem is also on the page as text in "Lees het gedicht als tekst" (`<details>`), for small screens, where the picture is too small to read, and for search engines. `Show example` gets `detail` `back:<id>` and `text:<id>`. Run `npm run build:pdf-showcase` after changing an example poem, a design or `utils/exampleSheets.ts`.

On the home page the section is "ChatGPT vs SintGPT": per style, ChatGPT's poem for the same request next to SintGPT's (side by side from 1024 px, a ChatGPT/SintGPT switch below that). ChatGPT's poems are in `utils/chatgptPoems.ts`, one per example the home page shows, with the request that was sent and the lines the page underlines (`faults`). They came from GPT-5.6 Luna, the default model of free ChatGPT in Nov 2026, through the API with only the request; the site owner chose one of five versions per style. Do not edit them, and do not put the model name in a string there (a unit test checks). The page does not say where they came from or that they were chosen; see #23 in `ISSUES.md`. When an example poem changes, ask ChatGPT again with the new input.

### Lootjes trekken
`/lootjes` draws names in the browser (`utils/lootjes.ts`, Sattolo's shuffle: one circle, nobody draws themselves, and with 3 or more names nobody draws each other). One phone goes round; each person taps their name to see their lootje. The draw stays in localStorage (`sintgpt-lootjes`) until "Nieuwe trekking". Nothing goes to the server. The page's own "Zo werkt het" and FAQ (`lootjes.steps`, `lootjes.faq`, also in its FAQPage JSON-LD) and the blog post `/blog/lootjes-trekken-tips` describe this behaviour, so change them together.

### Blog
`utils/blogPosts.ts` is the one list of posts: title (the h1), card text, dates, reading time and `related` (the "Lees ook" block). Every post uses `components/BlogPost.vue` (layout, "Lees ook", footer, SEO meta, OG image, canonical, Article + BreadcrumbList JSON-LD), which reads the title, dates and reading time from that list. A post with `modified` shows "bijgewerkt <date>". The blog index and the three tip links under the home page FAQ read the same list.
- The posts are written by `DEFAULT_POEM_MODEL` (Gemini 3.7 Flash, high thinking, then a proofreading pass by the same model): `npx tsx --env-file=.env scripts/write-blog-posts.ts <out-dir> [slug ...]` writes `pages/blog/<slug>.vue` from the brief in `scripts/blogBriefs.ts` and saves the answer as JSON (`--render` renders saved JSON again without a call). The brief holds the main search term, the angle, and `SITE_FACTS`, the only source for claims about SintGPT; keep `SITE_FACTS` in line with the product. Read every post before committing: facts, rhymes, links, tone. Keyword per page: `docs/seo-keywords.md`.
- New post: add a brief and run the script, then add the post to `utils/blogPosts.ts` (newest first, and as `related` of 2 or more others), `public/sitemap.xml`, `public/llms.txt` and `scripts/og-images.ts` (the script's `summary.json` has the title, card text, reading time and share-image text), then run `npm run build:og`. `tests/unit/blogPosts.test.ts` checks all of this.
- Give the link to the poem form `data-cta="blog:<slug>"`, so analytics sees which post brings writers, and descriptive link text ("Schrijf gratis een grappig sinterklaasgedicht →"), not "klik hier".
- Each post also has one link to the poem form in the upper 40% of its text, with `data-cta="blog:<slug>:tekst"` and its own anchor text (no exact anchor more than 3 times on the site). Posts about one style link to `/?stijl=<grappig|klassiek|ironisch|ouderwets|pikant|roast>#poem-form`: the home page chooses that style (unless a restored draft has one) and removes the parameter (`utils/stylePreset.ts`). `node scripts/internal-link-graph.mjs > seo/internal-link-graph.json` counts the links per page; reports and plans from the SEO skills (`.claude/skills/`, installed from `Illyism/seo-skills`, see `skills-lock.json`) are in `seo/`.

### Privacy and terms
`/privacy` and `/voorwaarden` render `components/LegalPage.vue` from `legal.*` in the locales. They state the limits (1/day, 3/day while payments do not work, 100/day for buyers), the 90-day storage of short links, the 24-hour counters and the €6.99 price. Change them when the code changes; an e2e test checks the numbers.
- There is no cookie banner. The site sets only the functional `sintgpt-access` cookie after payment (plus `sintgpt-intern` in the owner's own browsers, see Analytics), analytics uses no cookies (Workers Analytics Engine, written by the server) and the rest is localStorage for features the visitor uses. Do not add tracking cookies or third-party embeds without consent handling.

### Contact form
`/contact` (`pages/contact.vue`) has three quick answers (restore access, where poems are, the free limit) and a form: topic (help, question, complaint), e-mail address (required) and message (10–2,000 characters). `POST /api/contact` (`server/api/contact.post.ts`, rules in `server/utils/contact.ts`, constants shared with the page in `utils/contactForm.ts`) sends it to the alerts' Telegram chat as plain text, with the tier from the access cookie (or "gratis"), the site language and the page the visitor came from. Never the payment ID or the IP. Nothing is stored.
- Spam, in order: a hidden honeypot field `website` and a minimum of 3 seconds on the page (both get a fake `{ ok: true }`, event `Contact refused`), Cloudflare Turnstile (`appearance: 'interaction-only'`, action `contact`, checked on the server with `NUXT_TURNSTILE_SECRET_KEY`), then 5 messages a day per IP (`CONTACT_RATE_LIMIT`, the poem counter with its own key).
- Without `NUXT_PUBLIC_TURNSTILE_SITE_KEY`, `NUXT_TURNSTILE_SECRET_KEY`, `NUXT_TELEGRAM_BOT_TOKEN` or `NUXT_TELEGRAM_CHAT_ID` the route answers 503 `unavailable` and the page shows the e-mail address; so does a Telegram failure (`Contact failed`, an alert). `npm run dev` uses Cloudflare's test site key; set the test secret (`.env.example`) to send from dev.
- The footer button, `SiteLinks` and `llms.txt` link to `/contact`. The privacy text ("E-mail en contactformulier") names Telegram, Turnstile, what the message carries and the 5-a-day count; keep them in line.

### SEO
- `server/middleware/canonical-host.ts` (rules in `server/utils/canonicalHost.ts`) sends a 301 for `www` → `https://sintgpt.com`, for `http` → `https` (only when Cloudflare's `x-forwarded-proto` or `cf-visitor` says `http`, so a missing header cannot loop), and, for GET/HEAD, to page paths without a trailing slash and in lowercase. `/g/<id>` keeps its case: the IDs are case-sensitive. HTML on sintgpt.com gets HSTS (6 months). Static files are served by Workers Assets without the Worker, so Cloudflare's "Always Use HTTPS" is still the full fix for them.
- Pages without the big footer (`/lootjes`, `/voorbeelden`, privacy, terms) end with `components/SiteLinks.vue`, so every page links to the main sections. The 404 page (`error.vue`) has real links, not only buttons.
- `public/llms.txt` (llmstxt.org format) describes the site, prices and pages for language models. It states prices, the free limit and features, so change it with them (same rules as Persuasion: no model name, no claims without data).
- IndexNow (Bing, Yandex; Bing feeds DuckDuckGo, Ecosia and ChatGPT search): `npx tsx scripts/indexnow.ts [<url> ... | --since YYYY-MM-DD | --all] [--send]` sends changed pages after a deploy (step 6 of the deploy skill). The key file `public/<key>.txt` is public by design; the key is in the script.
- The main address is `https://sintgpt.com`. `server/middleware/canonical-host.ts` redirects `www` to it. Each page sets its own canonical link.
- English is applied in the browser on the same URLs, so search engines see Dutch only. Do not add `hreflang` tags until English has its own URLs.
- A visitor who never chose a language gets English when the browser lists no Dutch at all (`utils/browserLocale.ts`, applied in `useI18n` on mount and not saved). Crawlers and automated browsers (`navigator.webdriver`, which the e2e tests have) always get Dutch: Googlebot renders with an English browser. A saved choice (`localStorage` `locale`) always wins. The poem language in the form stays Dutch.

### Social proof
Only show numbers, reviews and ratings that come from real data. This includes the JSON-LD on the home page. Keep its offer in line with the real price and free limit.

### Open Graph images
- Specs in `scripts/og-images.ts`, rendered by `scripts/build-og-image.ts` (Puppeteer + sharp) to `public/og/<name>.jpg`.
- Pages call `useOgImage('<name>', alt)`, which sets absolute `og:image` URLs plus width/height/type/alt and Twitter tags. Re-run `npm run build:og` after changing a spec.

### Icons and static files
- Icons are in the client bundle (`icon.clientBundle` in `nuxt.config.ts`), so the browser never asks `api.iconify.design`. The scan finds the `i-heroicons-*` names in our code. Nuxt UI's own icons are Lucide (`@iconify-json/lucide`) and listed by hand: add one when a new Nuxt UI component needs it.
- `routeRules` in `nuxt.config.ts` give the unversioned files in `public/` (hero images, video, `og/`, `pdf/`, favicons) a 7-day cache; Nitro writes them to Cloudflare's `_headers`. Files under `/_nuxt/` and `/_fonts/` have a hash and are cached for a year.
- The hero photo has 400, 600 and 800 px versions (`scripts/build-sint-images.ts`). Once the visitor picks a style (or a `?stijl=` link or a restored draft does), the hero shows the Sint of that style (`utils/sintStyles.ts`, alt texts in `hero.photoAlts`): Ironisch, Ouderwets, Pikant and Roast have their own photo, Klassiek and Grappig keep the usual one (picked by the owner, 15 Nov 2026). A small round photo of the current style sits next to the style choice. All crops use the same frame, so the photo does not jump.

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
| `NUXT_DODO_PRODUCT_ID` | Dodo product for Gezin (€6.99). Payments are off without it |
| `NUXT_DODO_PRODUCT_ID_DRIE` | Dodo product for 3 gedichten (€3.99). Optional: without it the tier is not offered |
| `NUXT_DODO_PRODUCT_ID_FAMILIE` | Dodo product for Hele familie (€12.99). Optional: without it the tier is not offered |
| `NUXT_DODO_PAYMENTS_WEBHOOK_SECRET` | Dodo webhook signing secret. Without it the webhook rejects every event |
| `NUXT_ACCESS_COOKIE_SECRET` | Signs the unlimited-access cookie and poem links (`openssl rand -hex 32`). Without it nobody gets unlimited access and poem links are off; changing it logs out all paying customers and breaks shared links |
| `NUXT_GIFT_CODES` | Optional. Comma-separated codes for gift links (`/?cadeau=<code>`, Hele familie). Remove a code to end its access |
| `NUXT_GIFT_CODES_SEASON` | Optional. Comma-separated season gift codes: Hele familie until `NUXT_GIFT_SEASON_END` (default `2026-12-05`), at most 3 browsers per code |
| `NUXT_FREE_REWRITE` | Optional. `off` stops the free visitor's free rewrite without a deploy |
| `NUXT_POEM_PREVIEW` | Optional. `off` stops writing poems before payment (the page then opens the payment window) |
| `NUXT_CLOUDFLARE_ANALYTICS_TOKEN` | Optional. Cloudflare API token with only **Account Analytics Read**, for the alert check. Without it (or the two below) there are no alerts |
| `NUXT_TELEGRAM_BOT_TOKEN` | Optional. Telegram bot from @BotFather that sends the alerts |
| `NUXT_TELEGRAM_CHAT_ID` | Optional. The Telegram chat that gets the alerts and the contact form messages |
| `NUXT_TURNSTILE_SECRET_KEY` | Optional. Cloudflare Turnstile secret for the contact form. Without it (or the site key) the form is off and the page shows the e-mail address |
| `NUXT_PUBLIC_TURNSTILE_SITE_KEY` | Optional. The Turnstile site key the contact page renders the widget with (not secret) |

## Errors and alerts
- **Workers Logs** (`observability` in `nuxt.config.ts`; Free plan: 3 days). `server/plugins/logging.ts` makes consola write plain objects (`level`, `message`), so the logs are searchable fields instead of styled browser lines. Every 5xx or unhandled error that reaches Nitro is logged as `{ message: 'Server error', status, method, route, error }` and written as the `Server error` event (`detail` `<status> <route>`). 404 and 429 are answers, not errors: do not throw them with `fatal: true` on the server, because Nitro logs fatal errors as request errors (`fatal: import.meta.client` in `pages/g/[id].vue` and `pages/gedicht.vue`).
- **Browser errors**: `plugins/errors.client.ts` sends `Client error` (`detail` `<vue|app|chunk|window|promise>:<type: message>`, at most 5 per page, only our own scripts). `utils/errorDetail.ts` removes quoted text, because browsers quote input in some messages (JSON.parse), and shortens links.
- **Alerts to Telegram**: a Cron Trigger every 10 minutes (`triggers.crons` in `nuxt.config.ts`; Nitro does not write it) runs `server/plugins/alerts.ts`. It asks Analytics Engine (SQL API, `NUXT_CLOUDFLARE_ANALYTICS_TOKEN`) for error events (`ALERT_ERROR_EVENTS`) and payment webhooks and gift claims (`ALERT_MONEY_EVENTS`) in the last full 10 minutes that ended 5 minutes ago, and sends one message when there are any. The message holds event names, details, tiers and counts only: no personal data. The Workers Free plan has no Tail Workers, so the check reads the events instead of the Worker's trace.
- Test locally: `npx tsx scripts/alerts-check.ts [minutes-ago] [--send]` (prints the message of that window; `--send` sends it, or a test message, with `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` from the environment or `.env.analytics`). On a running `wrangler dev --test-scheduled`: `curl "http://localhost:8787/__scheduled?cron=*/10+*+*+*+*"`.
- A new error event: add it to `ALERT_ERROR_EVENTS` in `server/utils/alerts.ts`.

## No comments in the deploy
The deployed files hold no comments. Source files keep theirs.
- `sourcemap: false` and Wrangler's `upload_source_maps: false` leave out every `sourceMappingURL` comment. Wrangler `minify: true` drops the `// path` comment it adds per module.
- `vue.compilerOptions.comments: false` keeps template comments out of the HTML in every build, also the e2e one.
- `scripts/strip-comments.ts` removes what is left (such as the Tailwind license banner) and fails the build if anything remains. HTML keeps Vue's hydration markers `<!--[-->`, `<!--]-->`, `<!---->` and `<!--v-if-->`.

## Tests

- `tests/unit/` - prompt/schema/cost, prompt injection, rate limit, stream parser, comment stripping, countdown, lootjes, form draft, example poems (fast, no network)
- `tests/e2e/app.test.ts` - builds the app, starts the server and a headless browser (about 2.5 minutes; every test page blocks the home page video, whose open request otherwise kept `networkidle` waiting 15 s per page): pages, OG tags, rate limiting, the history drawer at phone size, and one **live** poem via AI Gateway (skipped without a key; costs a few cents)

## Analytics (Workers Analytics Engine)
No third-party script. Events go to the dataset `sintgpt_events` (binding `ANALYTICS`), which Cloudflare keeps for 3 months.
- **Server events** (`trackServerEvent` in `server/utils/analytics.ts`):
  - `Generate poem` / `Regenerate poem` when the stream ends: style, rhyme scheme, language, lines, plan, model (`detail`), tokens, estimated cost, seconds to the first text and in total, and coarse form use (`formFacts`: fun facts empty/short/long, present none/named/secret, written by, audience and greeting yes/no; greeting is `blob18`).
  - `Poem aborted` (the visitor left; `detail` before/during text, seconds), `Poem generation failed`, `Rate limited` (reason).
  - `Proceed to payment` (tier in `detail`), `Payments unavailable` (cause), `Payment verified` (in `claim-access`; `detail` return/restore), `Payment webhook` (event type in `detail`, amount in `value`, no country).
  - `Surprise ideas` (tokens, cost, seconds) and `Surprise ideas failed`.
  - Every event from a buyer carries the tier in `blob17`.
- **Browser events** (`useAnalytics().track`, sent with `sendBeacon` to `POST /api/events`):
  - Funnel: `Page view` (first one: referring domain in `detail`, utm tags in source/medium/campaign), `Form started`, `Form refused`, `No poems left` (a try to write a poem without poems left; `detail` `free`/`credits` + `:submit`/`:rewrite`, or `:server` when only the server knew), `Poem ready` (`detail` new/rewrite/rewrite hint, `value` = poems on this device), `Rate poem` (up/down with the style), `Edit poem` (saved/too different/no link/reverted), `Show payment modal` (`detail` submit/rewrite/limit/credits/surprise/design), `Close payment modal` (button/backdrop/escape/continue free/edit), `Payment returned` (cancelled/failed/pending), `Payment succeeded`, `Continue after payment`, `Access restored`, `Restore failed` (invalid/denied/pending).
  - Engagement: `New poem` (the "Nieuw gedicht" button under a poem empties the recipient fields of the form; style, rhyme scheme, length and language stay), `Show surprise ideas` (open/locked), `Copy share link`, `Copy to clipboard` (plain text plus HTML from `utils/poemHtml.ts`, so Word and Google Docs keep the title and stanzas), `Save as PDF`, `Share PDF` (phones), `Shared via WhatsApp/Email/Facebook` (desktop), `Shared via share sheet` (phones and tablets; done/cancelled/refused/failed, the browser does not say which app), `Open shared poem`, `Shared poem to form`, `Open history`, `Open poem from history`, `Delete poem`, `Clear history`, `Switch language`, `Show example` (style), `Draw lootjes` (people), `Play video`, `Contact`, `Open devtools` (see below).
  - Sources: `Scroll to poem form` (hero/examples) and `Go to poem form` (any link with `data-cta="<where>"`, tracked by `plugins/analytics.client.ts`; blog posts use `blog:<slug>`).
  - Contact form (server): `Contact sent` (topic in `detail`), `Contact refused` (`honeypot`, `too fast`, `captcha`), `Contact failed` (`turnstile`, `telegram`).
  - Problems: `Poem retry` (`detail` `network` with the retry number in `value`, or `manual`), `Poem stream failed` (network/stream, only when the page gives up; `value` = tries), `PDF failed`, `Copy failed`, `Client error` (script errors; see Errors and alerts). The server writes `Server error` for every 5xx.
- Devtools joke: `composables/useDisableDevTools.ts` (called in `app.vue`, off in dev) runs a Web Worker that hits a `debugger` statement every 0.25 s. When it pauses, DevTools are open: the page sends `Open devtools` and goes to Rick Astley on YouTube. Headless browsers (Playwright, Lighthouse) are not redirected; checked 10 Nov 2026. It protects nothing: view-source and curl still show the code.
- The endpoint accepts only the names in `utils/analyticsEvents.ts`, short `detail` values and a number. The `EVENTS_BURST` Rate Limiting binding allows 60 events a minute per IP (keyed hash). Add a new event to that list first.
- Columns are positional; the order is documented at the top of `server/utils/analytics.ts`. Never reorder them, only append. Never put names, poem text, payment IDs or IP addresses in an event. Paths drop the query and hash, and `/g/<id>` becomes `/g/:id`. The privacy page lists what is kept: change it with the columns.
- Without the binding (Node build, tests) nothing is written.
- Own visits: open any page with `?intern=1` to set the cookie `sintgpt-intern=1` (400 days) in that browser; `?intern=0` removes it (`utils/internalTraffic.ts`, set in `plugins/analytics.client.ts`, which then removes the parameter through the router). With the cookie, `useAnalytics().track` sends nothing and `trackServerEvent` writes nothing. Dodo webhooks carry no cookie and still count. The privacy page names this cookie; keep them in line. Use it on every device the owner tests with.
- Dashboard: `npm run analytics -- [today|yesterday|24h|7d|30d|all|<days>] [--no-open]` (`scripts/analytics-dashboard.ts`) writes `reports/analytics.html` (git-ignored) and opens it. One query fetches the counts per hour of the last 62 days (more for a longer period) and embeds them; the browser code in `scripts/dashboard/` (`app.js`, `app.css`) does the rest: period picker (keys T/Y/D/W/M/A), comparison with the period before (C), KPI tiles that switch the chart, breakdown tabs (Poems → Ratings shows the 👍/👎 per style and the rewrites with a wish), a country filter (click a country; webhooks have no country) and the state in the address hash. The argument only picks the period it opens with. Days are Dutch calendar days. Text report: `npx tsx scripts/analytics-report.ts [today|yesterday|<days>]` (`today` and `yesterday` are Dutch calendar days, `scripts/dutchDay.ts`, and add the same hours a week earlier and a timeline of notable events); the `/report-analytics` skill (`.claude/skills/report-analytics/SKILL.md`) runs it for today, opens the dashboard on the same day and writes the overview. Both share `scripts/analyticsSql.ts`; the account ID has a default (`CLOUDFLARE_ACCOUNT_ID` overrides it). The token (`CLOUDFLARE_ANALYTICS_TOKEN`) comes from the environment or from `.env.analytics` (git-ignored, apart from the app secrets in `.env`). It needs **Account Analytics Read**. Weight counts with `_sample_interval`: `SUM(_sample_interval)`, not `COUNT()`.
