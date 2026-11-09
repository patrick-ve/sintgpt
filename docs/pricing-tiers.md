# Pricing tiers: decisions, tests and status

Built on 9 November 2026, commit `810ca80` on `master`. Not pushed, not deployed.
Open Dodo and Cloudflare steps: `docs/dodo-payments-todo.md`.

## The tiers

| | 3 gedichten | Gezin (recommended) | Hele familie |
|---|---|---|---|
| Price (incl. VAT, once) | €3,99 | €6,99 | €12,99 |
| Poems | 3 in total | as many as you like, max 100/day | as many as you like, max 100/day |
| Valid | until the next pakjesavond | 365 days from payment | until the second pakjesavond |
| Rewrites ("Gedichten herschrijven met AI") | no | yes | yes |
| Extra | – | – | 2 extra PDF designs, surprise ideas |

Source of truth: `utils/pricingTiers.ts`.

## Why it looks like this

- **Compromise effect:** three options, the middle one highlighted with "Aanbevolen" and selected by default.
- **Decoy:** 3 gedichten costs €1,33 per poem; Gezin is under €1 per poem from 7 poems. The window says "Voor €3 meer schrijf je met Gezin zoveel gedichten als je wilt" when 3 gedichten is selected.
- **Anchor:** €12,99 makes €6,99 look modest. Hele familie has real extras, so it is a real offer.
- **Honest claims only:** no "meest gekozen" or "populair" without data, no struck-through old price, no countdown on a price. All numbers on the page are plain maths from the prices.

## Decisions to remember

- **No upgrade discount.** A buyer who moves up pays the full price of the higher tier. The terms say so. An upgrade price can come later.
- **PDF designs for 3 gedichten:** all 4 standard designs, not 1. The free poem already gets all 4, so a buyer would otherwise get less than a free visitor.
- **Extra PDF designs are a soft lock.** The PDF is built in the browser, so a technical visitor can get them without paying. The page offers Hele familie instead.
- **Access runs from the payment date** (`created_at` at Dodo), not from the claim. Restoring an old payment never starts a new period; it returns `expired`.
- **Old cookies** (`v1`, from before the tiers) keep working and mean Gezin.
- **A tier without a Dodo product is not offered.** Until the new product IDs are Worker secrets, the live site offers Gezin only.
- **Cookies last at most 400 days** (the browser limit). Hele familie bought in January can last longer; the buyer then restores with the payment ID.

## Tests (9 November 2026)

- Typecheck: clean.
- Unit tests: 225 passed. New: tier validity and pakjesavond dates, token v2 and v1, cookie lifetime, prices and per-poem maths, the Drie counter in the Durable Object, surprise prompt escaping.
- E2E: 111 tests. The full run had 110 passed and 1 failed: an older test looked for the old button text "Schrijf verder voor". After the fix, the poem area, tier and payment groups (15 tests) passed.
- New e2e tests: three tiers with Gezin selected and the chosen tier sent to checkout; locked surprise and PDF design open the window with Hele familie; a 3 gedichten buyer sees "Dit heb je al" and cannot rewrite; the server counts 3 poems and refuses Drie rewrites before counting; v1 cookie reads as Gezin; surprise ideas only for Hele familie.
- **Not tested:** a real Dodo checkout per tier. The e2e run used the old test key, and the tests mock checkout. See step 2 in `docs/dodo-payments-todo.md`.

## Checked in a browser (dev server)

- Desktop 1280 × 860: three cards side by side, no scrollbar in the window.
- 1366 × 768: the window scrolls; the pay button stays reachable.
- Phone 390 × 844: cards stack; the pay button sticks to the bottom of the window.
- Fixed during the check: the hover style beat the selected style (the selected card lost its red border under the mouse), a 4 px scroll from a corner ribbon, and the gift emoji that made the pay button wrap on phones.

## After launch

- Watch "Tiers chosen" in `npm run analytics`.
- Only add "meest gekozen" when the data shows it.

## Gift links

`https://sintgpt.com/?cadeau=<code>` gives Hele familie without a payment, for
example for family who test the site. Code: `server/utils/giftAccess.ts` and
`POST /api/payment/claim-gift`.

To give someone access:

1. Make a code: `openssl rand -hex 16`.
2. Store it: `! npx wrangler secret put NUXT_GIFT_CODES --name sintgpt`. For more
   people, separate the codes with commas. Each `secret put` replaces the whole list.
3. Send the link `https://sintgpt.com/?cadeau=<code>` privately (not in a group chat).
4. To end the access, put the list back without that code. Access ends at once.

Notes:

- The access lasts as long as Hele familie (until the second pakjesavond), with the same 100-per-day cap.
- Anyone with the link can use it, in as many browsers as they like. Treat it like a password.
- The page removes the code from the address bar. Cloudflare's request logs (kept at most 7 days) can still contain it.
- Analytics counts `Gift claimed` (granted/denied), with tier `familie`. Poems from gift users count as paid poems.
