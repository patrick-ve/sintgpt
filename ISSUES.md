# Issues

The tracker for SintGPT: open work, decisions that wait for an answer, and
findings worth keeping. Newest information first within each section.

- Update the **Status** when something changes; move closed items to **Closed**
  with the date and how they were closed.
- Detailed checklists live elsewhere and are linked: `docs/dodo-payments-todo.md`,
  `docs/pricing-tiers.md`.
- Never put API keys, webhook secrets or gift codes in this file.

Last updated: 9 November 2026. Live version: `50d3116e-afd1-45cb-ada6-194a35e3c1bb`
(commit `b2d116b`, on GitHub).

## Priorities

| ID | Priority | Title | Status |
|---|---|---|---|
| [#1](#1-dodo-refuses-live-payments) | High | Dodo refuses live payments | Waiting for Dodo |
| [#2](#2-the-site-describes-tiers-that-are-not-on-sale) | High | The site describes tiers that are not on sale | Decision needed |
| [#3](#3-dodo-setup-for-the-tiers) | High | Dodo setup for the tiers | Open, checklist ready |
| [#4](#4-gift-link-for-a-test-user) | Medium | Gift link for a test user | In progress |
| [#5](#5-legal-checks) | Medium | Legal checks | Open |
| [#6](#6-roll-the-cloudflare-analytics-token) | Medium | Roll the Cloudflare analytics token | Unknown |
| [#7](#7-surprise-ideas-not-tested-with-a-real-ai-call) | Medium | Surprise ideas not tested with a real AI call | Open |
| [#8](#8-gift-link-has-no-limit-on-attempts) | Low | Gift link has no limit on attempts | Open |
| [#9](#9-upgrade-price-between-tiers) | Low | Upgrade price between tiers | Idea |
| [#10](#10-bot-traffic) | Low | Bot traffic | Finding, no action needed |
| [#11](#11-hydration-mismatch-warning) | Low | Hydration mismatch warning | Open |
| [#12](#12-search-console-sitemap) | Low | Search Console sitemap | Open |
| [#13](#13-umami-data) | Low | Umami data | Open |
| [#14](#14-blog-dates) | Low | Blog dates | Open |
| [#15](#15-small-ui-items) | Low | Small UI items | Open |
| [#16](#16-wrangler-update) | Low | Wrangler update | Open |

## Open

### #1 Dodo refuses live payments

- **Status:** waiting for Dodo.
- **What:** live checkouts fail with "403 Live payments not enabled for merchant".
  The site catches this: it stores a flag for 15 minutes, shows "Betalen lukt nu
  even niet" and allows 3 free poems a day.
- **Effect:** nobody can pay. This is the largest block in the funnel.
- **Next step:** get live payments approved by Dodo. Then do #3.

### #2 The site describes tiers that are not on sale

- **Status:** decision needed. Found after the deploy of 9 November.
- **What:** the hero ("of 3 gedichten voor €3,99"), the FAQ, the terms and the
  JSON-LD name all three tiers (€3,99 / €6,99 / €12,99). The server sells only
  Gezin (`/api/payment/status` → `"tiers":["gezin"]`), because the other two have
  no live product ID. The locked surprise button and PDF designs say "hoort bij
  Hele familie", but the payment window has no Hele familie card.
- **Options:**
  1. *(Recommended)* Let the hero, FAQ, JSON-LD and locked buttons show only tiers
     on sale. About 30 minutes plus tests and a deploy. Adding the product IDs
     later then needs no new deploy.
  2. Roll back (`! npx wrangler --cwd .output rollback`). This also removes the gift link.
  3. Leave it until the live products exist (#3). Payments do not work anyway (#1).
- **Note:** the terms may keep all three tiers; they describe what can be bought
  once it is on sale.

### #3 Dodo setup for the tiers

- **Status:** open. Full checklist: `docs/dodo-payments-todo.md`.
- **Done:** three **test** products in the new Dodo business:
  `pdt_0Nrb14NEqhqNsSbgUSdsb` (3 gedichten), `pdt_0Nrb14PbRnWj3m0MV1aCI` (Gezin),
  `pdt_0Nrb14S3FqQBjXtLisWNq` (Hele familie).
- **Open:**
  - The test key in `.env` belongs to the **old** business. Make a test key and
    webhook in the new business and set them in `.env`.
  - Buy each tier once in test mode.
  - Live products (after #1), live key, live webhook, Worker secrets.
  - Buyers from the old business cannot restore with their payment ID after the
    key moves to the new business. Check whether there are any.
- **Smoke test:** "tier on sale: drie" and "tier on sale: familie" fail until the
  product IDs are Worker secrets. That is expected.

### #4 Gift link for a test user

- **Status:** in progress. Code live since 9 November; `NUXT_GIFT_CODES` is set.
- **Next steps:**
  1. Open `https://sintgpt.com/?cadeau=<code>` in a private window. Expect
     "Je hebt Hele familie cadeau gekregen".
  2. Send the link to the test user in a private message.
  3. After the test (planned: about 24 hours), end the access:
     `! npx wrangler secret delete NUXT_GIFT_CODES --name sintgpt`.
- **Notes:** anyone with the link gets Hele familie, in any number of browsers,
  with the 100-per-day cap. Gift users count as paid poems in analytics
  (event `Gift claimed`, tier `familie`). How it works: `docs/pricing-tiers.md`.

### #5 Legal checks

- **Status:** open. Not legal advice; check with someone who knows Dutch consumer law.
- **Points:**
  - The privacy and terms texts as a whole (`legal.*` in the locales).
  - The withdrawal waiver: the payment window *states* that the right of
    withdrawal ends. Consider an explicit checkbox before payment.
  - The analytics event "Poem ready" reads the poem count from localStorage.
    Check that this fits the cookie/storage exception without consent.
  - The claim "Gedichten voor het hele gezin" (ACM).
  - Your name, address and KvK number in the privacy statement and terms.
  - The terms now say there is no upgrade discount (#9). Check that this is clear enough.

### #6 Roll the Cloudflare analytics token

- **Status:** unknown.
- **What:** a Cloudflare API token was once pasted in a chat. It must be rolled
  (My Profile → API Tokens) and the new one put in `.env.analytics` by you.
  The analytics scripts work, so some token is in place; it is not known whether
  it is the rolled one.
- **Next step:** check the token's creation date in Cloudflare; roll it if it is the old one.

### #7 Surprise ideas not tested with a real AI call

- **Status:** open.
- **What:** the e2e tests check access (403 for others, 400 for an empty form)
  but never call the model. The prompt, the structured output and the
  `thinkingLevel: 'low'` option through AI Gateway are not tested live.
- **Next step:** use the gift link (#4) to get Hele familie, write a poem and click
  "Bedenk een surprise". Check the three ideas, the wait time and the
  `Surprise ideas` event (tokens, cost).

### #8 Gift link has no limit on attempts

- **Status:** open, low risk.
- **What:** `POST /api/payment/claim-gift` has no per-IP limit. A code cannot be
  guessed (128 bits), but every wrong attempt writes a `Gift claimed: denied`
  event and uses a Worker request.
- **Fix (about 10 minutes):** use the `EVENTS_BURST` binding per IP, like
  `/api/events`, and stop writing an event for denied attempts.

### #9 Upgrade price between tiers

- **Status:** idea.
- **What:** a buyer who moves up (for example Gezin → Hele familie) pays the full
  price of the higher tier. The terms say so.
- **Option:** an upgrade product (for example €6,00 from Gezin to Hele familie)
  that the server only sells with a valid Gezin cookie.

### #10 Bot traffic

- **Status:** finding (9 November), no action needed.
- **Findings (Cloudflare request data, 14 days, page requests only):**
  - 1,656 page requests. 78% were scanners looking for `/.env`, `/.git/config`,
    `/info.php` and similar. All got 404, 403 or a redirect. Nothing leaked.
  - Of the 298 loads of real pages: 75 were our own checks, 58 openly bots,
    165 claimed a normal browser. 126 of those came from outside the
    Netherlands; since analytics started, none of them sent a page view.
  - Estimate: about 80% of page visits are bots; above 90% with the scanners.
- **Our analytics is almost bot-free:** page views are sent by the page script,
  which bots that run no JavaScript never execute.
- **Option:** Cloudflare Bot Fight Mode (free). It can block the curl smoke test;
  check that first.

### #11 Hydration mismatch warning

- **Status:** open, old.
- **What:** the browser console shows "Hydration completed but contains
  mismatches" on the home page. In dev mode Vue reports a "Hydration text
  mismatch". Probably text that differs between server and browser (for example
  the countdown or the language).
- **Next step:** find the node in dev mode and make the server and browser render the same text.

### #12 Search Console sitemap

- **Status:** open.
- **Next step:** resubmit `https://sintgpt.com/sitemap.xml` in Google Search Console.

### #13 Umami data

- **Status:** open.
- **What:** analytics moved from Umami to Workers Analytics Engine. The old Umami
  data still exists.
- **Next step:** export it if you want to keep it, then delete it.

### #14 Blog dates

- **Status:** open, optional.
- **What:** the dates of the three older blog posts were set back on purpose;
  they show dates that are not true. They also share the same date.
- **Option:** give them distinct (true) dates. Also optional: remove the
  "verzonnen" line on `/voorbeelden` (the page now says the people are made up).

### #15 Small UI items

- **Status:** open, optional.
- The countdown's 🎁 sits against the text without a space.
- The extra PDF designs (Goudfolie, Stoomboot) are a soft lock: the PDF is built
  in the browser, so a technical visitor can get them without paying. Accepted.
- Hele familie bought outside the season can last longer than 400 days; the
  cookie then expires first and the buyer restores with the payment ID. Accepted.

### #16 Wrangler update

- **Status:** open.
- **What:** Wrangler 4.158.0 is in use; 4.159.0 is available.

## Findings

### Visitors on 9 November 2026

- About 6 to 8 Dutch visitors besides the owner, each with 1 page load: 7 on the
  home page (4 phone, 3 computer), 1 on a shared poem link.
- Our analytics: 23 Dutch page views, 2 form starts, 1 poem, mostly own testing.
- Analytics Engine has collected since 9 November 2026, 17:09 UTC. It stores no
  IP addresses, so it cannot count unique people; Cloudflare's request data can
  (distinct IPs, not people).
- How the count was made: Cloudflare GraphQL `httpRequestsAdaptiveGroups`, HTML
  responses with status 200 on real paths, normal browser names, without the
  connections that ran the curl smoke tests.

### Pricing tiers (9 November 2026)

- Built, tested and live; see `docs/pricing-tiers.md` for decisions and test results.
- Only Gezin is on sale until the product IDs are set (#2, #3).

## Closed

| Date | Item | How |
|---|---|---|
| 9 Nov 2026 | Hero shorter than the screen on desktop | Commit `1b8584c`, live |
| 9 Nov 2026 | Pricing tiers | Commit `810ca80`, live (only Gezin on sale) |
| 9 Nov 2026 | Gift links | Commit `b2d116b`, live |
| 9 Nov 2026 | Dodo test products for the tiers | Created in the new business (#3) |
