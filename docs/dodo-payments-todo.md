# Dodo Payments: to do for the pricing tiers

Status on 10 November 2026. The code for the three tiers (`utils/pricingTiers.ts`)
is done. These steps in Dodo and Cloudflare are still open. Do them in order.

Never paste an API key or webhook secret in a chat, a commit or this file.

## Live business and products (10 November 2026)

The live business is **`bus_Gg5xzOyhmXu3Tcx2bBzxQ`** (the owner confirmed it). It is the
business from last season: it had live payments of €1,99 in December 2025.

| Tier | Env variable | Live product ID | Price | Tax |
|---|---|---|---|---|
| 3 gedichten | `NUXT_DODO_PRODUCT_ID_DRIE` | `pdt_0NreeKYxYPEDUUK8Mo8MK` | €3,99 | saas |
| Gezin | `NUXT_DODO_PRODUCT_ID` | `pdt_k1w5aNEH5uiPQMhDT9oIE` ("Onbeperkt gedichten maken met SintGPT", from 2025) | €6,99 | saas |
| Hele familie | `NUXT_DODO_PRODUCT_ID_FAMILIE` | `pdt_0NreeKbakzFxl4k6Nl9Zr` | €12,99 | saas |

All one-time, EUR, VAT included. The two new ones have metadata `tier` = `drie` / `familie`,
no description and no image. Gezin keeps its 2025 name and image; its name says
"Onbeperkt", which the site no longer says (max 100 a day). Rename it in the dashboard
if you want ("SintGPT – Gezin").

Validation on 10 November 2026, 16:57: the live site's checkout for Gezin gave 503,
cause `dodo 403` (Dodo refused the Worker's key; on 9 November the text was "Live payments
not enabled for merchant"). The Dodo MCP login cannot create checkout sessions (no
`checkout_sessions:write` scope), so it could not test the products directly.

Not known: which business the Worker's live key belongs to (`wrangler secret list` shows
names only). The Cloudflare dashboard → Workers → sintgpt → Logs shows the full Dodo
message on "Dodo refused the checkout".

## Background (9 November 2026, test mode)

- The three tiers each have their own Dodo product. A tier without a product ID
  is not offered on the site, so the site keeps working while products are missing.
- The new products are in the Dodo business that the Dodo MCP login uses.
- The test key in `.env` belongs to **another** business (the one with the old
  test product `pdt_tVAJjyrP5Lb3lbcHHCAQI`). That key cannot sell the new products.

## Test mode products (created)

| Tier | Env variable | Test product ID | Price |
|---|---|---|---|
| 3 gedichten | `NUXT_DODO_PRODUCT_ID_DRIE` | `pdt_0Nrb14NEqhqNsSbgUSdsb` | €3,99 |
| Gezin | `NUXT_DODO_PRODUCT_ID` | `pdt_0Nrb14PbRnWj3m0MV1aCI` | €6,99 |
| Hele familie | `NUXT_DODO_PRODUCT_ID_FAMILIE` | `pdt_0Nrb14S3FqQBjXtLisWNq` | €12,99 |

All three: one-time price, EUR, VAT included, tax category `digital_products`,
metadata `tier` = `drie` / `gezin` / `familie`.

## 1. Test mode: local setup

- [ ] In the Dodo dashboard of the new business, in **test mode**: Developer → API Keys → create a key.
- [ ] Developer → Webhooks → add the endpoint `https://sintgpt.com/api/webhooks/dodo-payments`
      (or a tunnel URL for local tests) and copy the signing secret.
- [ ] Open `.env` in your editor and set:
      ```
      NUXT_DODO_PAYMENTS_API_KEY=<new test key>
      NUXT_DODO_PRODUCT_ID=pdt_0Nrb14PbRnWj3m0MV1aCI
      NUXT_DODO_PRODUCT_ID_DRIE=pdt_0Nrb14NEqhqNsSbgUSdsb
      NUXT_DODO_PRODUCT_ID_FAMILIE=pdt_0Nrb14S3FqQBjXtLisWNq
      NUXT_DODO_PAYMENTS_WEBHOOK_SECRET=<new test webhook secret>
      ```
- [ ] Check: `curl -s localhost:3000/api/payment/status` lists `drie`, `gezin` and `familie`.

## 2. Test mode: try every tier

With `npm run dev` (or the local Worker preview), buy each tier with a Dodo test card:

- [ ] 3 gedichten: the page says "Je kunt nog 3 gedichten schrijven". After 3 poems the
      payment window opens with Gezin selected. "Herschrijf dit gedicht" opens the window too.
- [ ] Gezin: as many poems as you like; rewrites work.
- [ ] Hele familie: "Bedenk een surprise" gives 3 ideas; the PDF designs Goudfolie and
      Stoomboot download.
- [ ] Restore access with the payment ID in another browser, for each tier.
- [ ] Refund a test payment in Dodo; check that the ID can no longer restore access.
- [ ] Check that the webhook arrives (`Payment webhook` in the analytics dashboard).
- [ ] Run `npm run test:e2e` with the new `.env` (it reads `.env`).

## 3. Live mode: products

- [x] Live products for 3 gedichten and Hele familie created (10 November 2026, IDs above).
- [ ] Wait for Dodo to enable live payments for `bus_Gg5xzOyhmXu3Tcx2bBzxQ`
      (10 November: still `dodo 403`).
- [ ] Make sure the Worker's live key and webhook secret come from this business. If not
      sure: create a live API key and a live webhook for
      `https://sintgpt.com/api/webhooks/dodo-payments` in this business, and set both secrets (step 4).

## 4. Cloudflare: Worker secrets

Run these yourself; each asks for the value. Never put live values in `.env`.

- [ ] `! npx wrangler secret put NUXT_DODO_PAYMENTS_API_KEY --name sintgpt` (new live key)
- [ ] `! printf %s pdt_k1w5aNEH5uiPQMhDT9oIE | npx wrangler secret put NUXT_DODO_PRODUCT_ID --name sintgpt` (live Gezin)
- [ ] `! printf %s pdt_0NreeKYxYPEDUUK8Mo8MK | npx wrangler secret put NUXT_DODO_PRODUCT_ID_DRIE --name sintgpt`
- [ ] `! printf %s pdt_0NreeKbakzFxl4k6Nl9Zr | npx wrangler secret put NUXT_DODO_PRODUCT_ID_FAMILIE --name sintgpt`
- [ ] `! npx wrangler secret put NUXT_DODO_PAYMENTS_WEBHOOK_SECRET --name sintgpt` (new live secret)
- [ ] `bash scripts/smoke-test.sh`: the lines "tier on sale" pass for all three tiers.

## 5. Earlier buyers

- [ ] Before you switch the live key to the new business: are there live payments in the
      **old** business? Restoring access checks the payment with the current key, so a
      payment ID from the old business is then "not found". Cookies already set keep
      working until they expire. If there are such buyers, decide how to help them
      (for example by email).
- [ ] Archive the old test product `pdt_tVAJjyrP5Lb3lbcHHCAQI` when nothing uses it.

## 6. After launch

- [ ] Test the full live flow once with a real payment, including the webhook and a refund.
- [ ] Watch "Tiers chosen" in `npm run analytics` to see which tier people buy.
- [ ] Only show "meest gekozen" on a tier when the data shows it.
- [ ] Optional: an upgrade price for buyers who move up a tier (now they pay the full price;
      the terms say so).
