# Issues

The tracker for SintGPT: open work, decisions that wait for an answer, and
findings worth keeping. Newest information first within each section.

- Update the **Status** when something changes; move closed items to **Closed**
  with the date and how they were closed.
- Detailed checklists live elsewhere and are linked: `docs/dodo-payments-todo.md`,
  `docs/pricing-tiers.md`.
- Never put API keys, webhook secrets or gift codes in this file.

Last updated: 10 November 2026. Live version: `f7e6c57b-7b7e-4658-89e0-15bf3e609584`
(commit `3f6a2ad`, on GitHub).

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
| [#17](#17-free-poems-from-a-new-ip-address) | Low | Free poems from a new IP address | Accepted risk |
| [#18](#18-rewrite-with-a-wish-and-poem-rating) | Medium | Rewrite with a wish, and poem rating | Live, one check open |
| [#19](#19-ready-for-the-peak-on-4-5-december) | High | Ready for the peak on 4–5 December | Open |
| [#20](#20-getting-visitors) | High | Getting visitors | Parked |
| [#21](#21-edit-a-poem-before-sharing) | Medium | Edit a poem before sharing | Live, one check open |
| [#22](#22-offer-for-work-groups) | Low | Offer for work groups | Idea, needs a decision |
| [#23](#23-brand-and-legal-risks) | Low | Brand and legal risks | Later |
| [#24](#24-after-the-season) | Low | After the season | Later |

## Open

### #1 Dodo refuses live payments

- **Status:** waiting for Dodo. You are working on the account verification (10 November).
- **What:** live checkouts fail with "403 Live payments not enabled for merchant".
  The site catches this: it stores a flag for 15 minutes, shows "Betalen lukt nu
  even niet" and allows 3 free poems a day per connection (otherwise 1).
- **Effect:** nobody can pay. This is the largest block in the funnel.
- **Next step:** get live payments approved by Dodo. Then do #3.
- **Plan B (suggested 10 November):** if Dodo has not approved by about 15 November,
  consider Mollie or Stripe Payment Links (1–2 days of work). Then you are the
  seller: you handle BTW yourself and need a KvK number. Dodo, as merchant of
  record, handles that for you.
- **Check:** that the Dodo checkout offers iDEAL. Most Dutch buyers expect it.

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
- **Cause (found 10 November):** the counter under the form. The server renders
  "1 gratis gedicht over"; the browser reads the count from localStorage and
  renders "0 gratis gedichten over" for a visitor who used the free poem.
- **Fix:** render the counter only after mount (`<ClientOnly>` or an `onMounted`
  flag), so the server and the first browser render agree.

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

### #17 Free poems from a new IP address

- **Status:** accepted risk, after the fix of 9 November (see Closed).
- **What:** the server allows 1 free poem per IP address per 24 hours (IPv6 per
  /64). A visitor with a new IP address gets a new free poem: another network,
  a VPN, or a phone that reconnects to the mobile network.
- **Side effect:** people who share one connection (a household on one wifi,
  an office, some mobile networks) share the 1 free poem. The second person sees
  "Het gratis gedicht is al gebruikt" and the payment offer.
- **Options if analytics shows abuse** (many `Generate poem` events with plan
  `free`, few `Rate limited`):
  1. Cloudflare Turnstile on free poems. Stops scripts that rotate IP addresses,
     not people. It is a third-party script: update the privacy page.
  2. Count IPv6 per /56 instead of /64. Stricter, but can join neighbours on
     some mobile networks.

### #18 Rewrite with a wish, and poem rating

- **Status:** live since 10 November (commit `3f6a2ad`). Open: one real rewrite
  with a wish (costs a few cents).
- **What:**
  - "Zeg wat er anders moet" under "Herschrijf dit gedicht" opens a text field
    (200 characters) and chips: Korter, Grappiger, Liever, Meer over het cadeau,
    Beter rijm. With a wish, the rewrite sends the poem on screen too, so the
    model changes it instead of writing a new one.
  - 👍/👎 under each poem: event `Rate poem` (`up:<style>` / `down:<style>`).
    A 👎 opens the wish field when a rewrite is possible.
  - Dashboard: Poems → Ratings.
  - Privacy text: names the wish, the previous poem and the rating.
- **Tests:** 5 new unit tests (prompt, tag escaping, limits); manual check at
  390 px with a mocked poem stream. Not tested with a real AI call: check one
  rewrite with a wish after the deploy (costs a few cents).
- **Note:** a free visitor who taps 👎 and rewrites sees the payment window,
  because a rewrite counts as a poem.

### #19 Ready for the peak on 4–5 December

- **Status:** open.
- **Points:**
  - Check the Cloudflare plan. On the Free plan, Workers KV allows 1,000 writes a
    day (short links fall back to long links) and Workers 100,000 requests a day.
    Workers Paid ($5 a month) lifts these.
  - Set a spending limit in AI Gateway. A fallback model exists already
    (`FALLBACK_POEM_MODEL`, OpenAI).
  - An alert when `Poem generation failed` or Worker errors go up (a Cloudflare
    notification, or a daily check of the dashboard).
  - No large refactors from about 25 November. `pages/index.vue` (2,200 lines)
    and `PaymentModal.vue` (1,200 lines) can be split after the season.

### #20 Getting visitors

- **Status:** parked (10 November).
- **Context:** 29 page views and 2 poems in 2 days (9–10 November), mostly own
  testing. The product is ready; few people know it.
- **Ideas:**
  - Shared poems are free adverts: a clear "Maak zelf een gedicht" button above
    the fold on `/g/<id>`. Measure `Open shared poem` → `Form started`.
  - Word of mouth: friends, family, colleagues, parent groups on Facebook.
  - Search ads on "sinterklaasgedicht maken" / "sinterklaasgedicht generator"
    from late November; organic SEO is too slow for this season.
  - Search Console (#12): see which terms bring impressions; write posts for them.
  - AI assistants: one visit came from chatgpt.com. Keep `llms.txt` current.

### #21 Edit a poem before sharing

- **Status:** live since 10 November (commit `3f6a2ad`). Open: edit a real poem
  (with its live signature) and check that the short link shows the edit.
- **Choice (10 November):** design A, edit in place ("Pas aan" on the poem card,
  same font, Klaar / Annuleren / Terug naar origineel). Small edits are signed
  again by the server.
- **How:** `POST /api/share/edit` signs an edit when the original matches its
  signature and the edit changes at most 25% of the words and of the opening
  (`server/utils/poemEdit.ts`). A larger edit keeps no link; the page says so.
  The history keeps the original. Event `Edit poem`.
- **Tests:** 11 unit tests (distance, limits, forged originals); manual check at
  390 px with a signed mock poem: small edit keeps the link, large edit loses it,
  revert brings it back.
- **Risk accepted:** within 25% of a long poem, someone can add a few lines of
  their own text to a signed link. The opening (preview and share image) is held
  to the same limit.

### #22 Offer for work groups

- **Status:** idea. Needs a decision on price and product.
- **What:** offices draw lootjes and write many poems (blog post
  `sinterklaas-op-het-werk`). A group offer could fit. The lootjes page already
  links to the poem form (`data-cta="lootjes"`).

### #23 Brand and legal risks

- **Status:** later.
- **Points:**
  - The name "SintGPT": OpenAI's brand guidelines ask others not to use "GPT" in
    product names. Not urgent for this season; think about it before investing
    more in the brand.
  - The H1 names ChatGPT ("Wil het rijmen met ChatGPT maar niet lukken?"), while
    the Persuasion rules in `CLAUDE.md` say visible text does not name AI. Decide
    which one holds.
  - The legal checks in #5.

### #24 After the season

- **Status:** later.
- **Ideas:**
  - Christmas comes right after 5 December: a "kerstgedicht" or Christmas-card
    text uses the same engine.
  - Other occasions through the year: birthdays, retirements, weddings. Gezin
    buyers have 365 days of access.
  - A "remind me next year" list. Needs explicit consent and a privacy update.

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
| 9 Nov 2026 | Free poems in a private window | The server now allows 1 free poem per IP per 24 hours, like the page (3 while payments do not work). Commit `451e146`, live. Remaining risk: #17 |
| 9 Nov 2026 | llms.txt | Commit `0646247`, live at `/llms.txt` |
