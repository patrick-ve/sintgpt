# Issues

The tracker for SintGPT: open work, decisions that wait for an answer, and
findings worth keeping. Newest information first within each section.

- Update the **Status** when something changes; move closed items to **Closed**
  with the date and how they were closed.
- Detailed checklists live elsewhere and are linked: `docs/dodo-payments-todo.md`,
  `docs/pricing-tiers.md`.
- Never put API keys, webhook secrets or gift codes in this file.

Last updated: 27 November 2026. Live version: `9b63ad55-1d7f-4f2f-8277-74cdbd9301aa` (86a5720: contents list on every blog post, blog share images in the look of the book)
(commit `6061832`, on GitHub).

## Priorities

| ID | Priority | Title | Status |
|---|---|---|---|
| [#1](#1-dodo-refuses-live-payments) | High | Dodo refuses live payments | Waiting for Dodo |
| [#2](#2-the-site-describes-tiers-that-are-not-on-sale) | High | The site describes tiers that are not on sale | Decision needed |
| [#3](#3-dodo-setup-for-the-tiers) | High | Dodo setup for the tiers | Live products created; secrets open |
| [#4](#4-gift-link-for-a-test-user) | Medium | Gift link for a test user | In progress |
| [#5](#5-legal-checks) | Medium | Legal checks | Open |
| [#6](#6-roll-the-cloudflare-analytics-token) | Medium | Roll the Cloudflare analytics token | Unknown |
| [#7](#7-surprise-ideas-not-tested-with-a-real-ai-call) | Medium | Surprise ideas not tested with a real AI call | Open |
| [#8](#8-gift-link-has-no-limit-on-attempts) | Low | Gift link has no limit on attempts | Open |
| [#9](#9-upgrade-price-between-tiers) | Low | Upgrade price between tiers | Idea |
| [#10](#10-bot-traffic) | Low | Bot traffic | Finding, no action needed |
| [#11](#11-hydration-mismatch-warning) | Low | Hydration mismatch warning | Fixed; live 21 Nov |
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
| [#25](#25-seo-audit) | Medium | SEO audit (10 November 2026) | Live; owner steps open |
| [#27](#27-share-sheet-on-phones) | Medium | Share sheet on phones | Link live; PDF built; phone check open |
| [#28](#28-new-poem-prompt-wait-time-and-follow-ups) | Medium | New poem prompt: wait time and follow-ups | Live; owner checks open |
| [#29](#29-error-alerts-to-telegram-and-a-waf-rule) | High | Error alerts to Telegram and a WAF rule | Built, not deployed; owner setup open |
| [#30](#30-gift-mail-to-last-seasons-buyers) | High | Gift mail to last season's buyers | Sent 17 Nov (53 mails); clean-up after pakjesavond |
| [#31](#31-free-rewrite-with-a-wish) | High | Free rewrite with a wish | Live 21 Nov |
| [#32](#32-write-first-then-pay) | High | Write first, then pay | Live and on since 22 Nov (KV + Dodo test passed); measure the funnel |
| [#33](#33-sint-reads-the-poem-video) | Low | Sint reads the poem (video) | Researched; decision needed |
| [#34](#34-gezin-at-499-and-honest-persuasion) | High | Gezin at €4,99 and honest persuasion | Live 23 Nov (Dodo at €4,99, checkout checked); measure the funnel |
| [#35](#35-every-poem-on-gemini-31-pro) | High | Every poem on Gemini 3.1 Pro | Live 24 Nov (5244eedd); measure aborts and cost |
| [#36](#36-an-empty-answer-used-the-free-poem) | High | An empty answer used the free poem | Live 26 Nov (db1ad86b); watch `empty:` failures |
| [#37](#37-share-image-shows-the-sint-of-the-poem-style) | Low | Share image shows the Sint of the poem style | Live 25 Nov (dab5b377); check one real roast link |
| [#38](#38-hint-for-writers-who-forget-the-name) | Low | Hint for writers who forget the name | Live 26 Nov (db1ad86b); watch `no name` refusals |

## Open

### #1 Live payments through Dodo

- **Status:** solved on 11 November 2026 (about 09:55) by switching to the other Dodo
  business. A real purchase from start to finish (return, access, webhook) is still to do.
- **Now in use:** business `bus_0NrUOZUWrAz7AYEqANsEb` (account `patrick@careerdeck.ai`),
  live mode. Products made on 11 November: drie `pdt_0Nrhkxf4vJf5ynevsPHK3` (€3.99),
  gezin `pdt_0NrhkxiUQYJFJOJ7Y9GRb` (€6.99, "SintGPT – Gezin"), familie
  `pdt_0NrhkxlsT5qqHb4fn4ZHO` (€12.99); tax `saas`, tax included. Webhook
  `ep_3LxE0vOc7DgJjc07acocOsGh41K` to `/api/webhooks/dodo-payments`, all events. The Worker
  secrets (key, three product IDs, webhook secret) were set the same morning. A checkout
  through the site then opened Dodo's page with "SintGPT – 3 gedichten", €3.99 incl. €0.69 BTW,
  and the shop name "SintGPT".
- **Key:** the owner pasted the live key in the chat and allowed Claude to use it. Replace it
  with a new key (Developer → API Keys, scopes `checkout_sessions:write` and `payments:read`
  or `payments:write`) and set that with the `pbpaste | grep '^dodo_live_'` command.
- **Old business** `bus_Gg5xzOyhmXu3Tcx2bBzxQ` (account `patrick@sintgpt.com`): Dodo emailed
  at 09:06 that live payments were enabled, but every live request (from the site, and
  through the Dodo MCP without the Worker key) still gave `403 MERCHANT_NOT_LIVE`. Last
  season's payments (December 2025) are in this business, so their payment IDs can no
  longer be restored on the site. Access already in a browser cookie keeps working.
- **History:** live checkouts failed with `dodo 403` from 9 November. The site caught this
  with a 15-minute flag, "Betalen lukt nu even niet" and 3 free poems a day. Support email:
  `docs/dodo-support.md`.
- **Check:** that the Dodo checkout offers iDEAL (after the address step).

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

- **Live products (10 November):** 3 gedichten `pdt_0NreeKYxYPEDUUK8Mo8MK`, Hele familie
  `pdt_0NreeKbakzFxl4k6Nl9Zr`, Gezin stays `pdt_k1w5aNEH5uiPQMhDT9oIE`. Next: set the two
  product secrets, and check that the Worker's live key is from `bus_Gg5xzOyhmXu3Tcx2bBzxQ`.
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

- **Status:** done. The owner deleted `NUXT_GIFT_CODES` on 10 November 2026, so the
  test user's gift link no longer works. The same evening the owner set a new code for
  their own use only (to write poems while Dodo payments are off, #1). Delete it when
  it is no longer needed.
- **For a new gift link:** `openssl rand -hex 16`, then
  `printf %s <code> | npx wrangler secret put NUXT_GIFT_CODES --name sintgpt`, and
  delete the secret again after the test.
- **Notes:** an old code stays in the gift users' browser history, but it does nothing once removed. While a code
  is set, anyone with the link gets Hele familie, in any number of browsers, with the
  100-per-day cap. Gift users count as paid poems in analytics
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
- **Fix (18 November, not deployed):** the counter shows the server's value until
  the page is mounted (`shownFreePoems`, `mounted` in `pages/index.vue`). Check the
  console on the live home page after the deploy.

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
- ~~The countdown's 🎁 sits against the text without a space.~~ Fixed 16 November
  2026: the emoji has its own span with a margin (home and shared poem page).
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
- **16 November 2026, to measure after the deploy:** on 16 November 4 payment
  windows opened (2 `rewrite`) and 0 led to `Proceed to payment`. The window
  for a rewrite now offers "Pas het gedicht zelf aan": count `Close payment
  modal` `edit` against `Edit poem`. The writing animation now shows steps and a
  bar during the wait of about 28 s: compare `Poem aborted` `before` per poem
  with the weeks before. Both counts are small until the peak.

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
  - The home page now compares ChatGPT's poems with SintGPT's ("ChatGPT vs SintGPT",
    `utils/chatgptPoems.ts`). Comparative advertising must be objective and
    verifiable. Points to weigh:
    - The poems came from the API (GPT-5.6 Luna, the free ChatGPT default),
      not from the ChatGPT app, which adds its own instructions.
    - Each one is the worst of five runs, chosen by hand.
    - The page does not say where the poems come from. A short source note
      (model, date, "niet bewerkt") or the same poems from the ChatGPT app
      with screenshots kept would make the comparison checkable.
    - It names a competitor, which the Persuasion rule about naming AI
      also touches.
  - The legal checks in #5.

### #24 After the season

- **Status:** later.
- **Ideas:**
  - Christmas comes right after 5 December: a "kerstgedicht" or Christmas-card
    text uses the same engine.
  - Other occasions through the year: birthdays, retirements, weddings. Gezin
    buyers have 365 days of access.
  - A "remind me next year" list. Needs explicit consent and a privacy update.

### #25 SEO audit

- **Status:** live on 10 November 2026 (version `e0b74a0d`, commit `4ada558`). Checked live: http, www, `/BLOG` and `/blog/` give a 301; HSTS on HTML; 7-day cache on public files; 404 page, "Lees ook" and the lootjes FAQ are there. Lighthouse mobile after the deploy: `/blog` 96 (was 79), `/lootjes` 97, home 84–98 over three runs (noise from server response time through the company proxy), no iconify requests. Open for the owner: S1 (dashboard part), S13, S15 (author), S24 (Search Console verified as a Domain property on 10 November 2026; sitemap, indexing requests and Bing still to do), S25. Deferred: S9, S11.
- **Result:** nothing blocks Google from finding or indexing a page (no
  priority 1). Robots.txt, sitemap (14 URLs, no orphans), canonicals, titles,
  one H1 per page, no broken internal links, no near-duplicates (max 7 %
  overlap), raw HTML equal to the rendered page. Lighthouse SEO, accessibility
  and best practices 100 on all templates; performance 92–99, `/blog` 79.
- **How:** own crawler with the Googlebot smartphone user agent and no
  JavaScript (Nuxt renders on the server), checked against Chrome renders of 7
  templates. Lighthouse 12.8.2 mobile with `/api/events` blocked.
- **Checklist** (priority 1 = blocks Google; S = SEO item):

| ID | Prio | Hours | Item | Status |
|---|---|---|---|---|
| S1 | 2 | 0.25 | `http://` gives 200 without a redirect to https; no HSTS | Live: 301 to https when Cloudflare says http, HSTS 6 months on HTML. **Owner:** also turn on "Always Use HTTPS" (static files skip the Worker) |
| S2 | 2 | 3 | Blog posts get 1 internal link each (only from `/blog`); the home page links to none | Live: "Lees ook" (3 posts) under every post, 3 post links under the home FAQ; every post gets 2+ links (unit test) |
| S3 | 2 | 1 | `/voorbeelden` gets 1 internal link (home page); not in the footer | Live: in the footer of every page (`SiteLinks.vue`, blog footer) and under "Lees ook" |
| S4 | 2 | 2 | `/lootjes` is thin (87 words) for the search "lootjes trekken" | Live: "Zo werkt het", 6 questions, FAQPage + WebApplication JSON-LD, link to the blog post |
| S5 | 2 | 1 | Links to the home page use generic text ("Schrijf je eerste gedicht gratis →" 8×) | Live: each post CTA names the topic ("Schrijf gratis een grappig sinterklaasgedicht →"); footers say "Sinterklaasgedicht maken" |
| S6 | 3 | 1 | `/blog` LCP 3.9 s: 8 copies of one photo, no width/height, alt repeats the title | Live: the photo is gone from the cards; the title is the link |
| S7 | 3 | 1 | `/blog/`, `/BLOG`, `/Voorbeelden` give 200 (canonical is right) | Live: 301 to lowercase, no trailing slash (GET/HEAD; `/g/<id>` keeps its case) |
| S8 | 3 | 0.5 | 404 page has no links ("Terug naar Home" is a JavaScript button) | Live: real links, site colours, Dutch message |
| S9 | 3 | 2 | Render-blocking `entry.css` (41 KB), 23–31 KiB unused CSS | Deferred: inlining 41 KB of global CSS in every page costs caching; gain about 0.15–0.3 s |
| S10 | 3 | 0.5 | Hero image 795×1000 shown at about 300×375 on a phone (65 KiB waste) | Live: 600w version added for 2× phones |
| S11 | 3 | 2 | 22–41 KiB unused JavaScript per page | Deferred: the chunk is shared Nuxt UI code (select, dialog, slideover); splitting it is a larger change for about 40 KiB |
| S12 | 3 | 0.5 | Icons load at runtime from `api.iconify.design` (third party) | Live: icons in the client bundle; no request to iconify in a local check |
| S13 | 3 | 0.25 | Cloudflare injects its Web Analytics beacon; not on the privacy page | **Owner:** Cloudflare dashboard → Web Analytics → sintgpt.com: turn off automatic setup, or name it on the privacy page |
| S14 | 3 | 1 | No `BreadcrumbList`; no JSON-LD on `/blog` and `/voorbeelden` | Live: BreadcrumbList on posts and `/voorbeelden`, Blog on `/blog`, CollectionPage on `/voorbeelden` |
| S15 | 4 | 0.5 | Article JSON-LD: Organization as author, no `inLanguage`, headline ≠ H1 on 3 posts | Partly live: `inLanguage`, headline = H1 (all posts use BlogPost now). **Owner decision:** a person as author would publish a name |
| S16 | 4 | 0.25 | Home JSON-LD: no free `Offer`, empty `sameAs` | Live: free Offer (price 0), empty `sameAs` removed |
| S17 | 4 | 0.25 | `sinterklaas_message.mp4` and images have `max-age=0` | Live: 7-day cache through `routeRules` → `_headers` |
| S18 | 4 | 0.5 | 10 KiB legacy JavaScript | Comes only from the Cloudflare beacon; goes away with S13 |
| S19 | 5 | 0.25 | `/blog`: H1 "SintGPT Blog", title in English Title Case | Live: H1 "Tips voor je sinterklaasgedicht", title "Tips voor sinterklaasgedichten en surprises" |
| S20 | 5 | 0.25 | 3 meta descriptions over 155 characters | Live: 152, 153 and 148 characters |
| S21 | 5 | 0.25 | Title Case in Dutch titles; "…in 2026" post shows 17 november 2025 | Live: sentence case in titles and headings; the post shows "bijgewerkt 8 november 2026" |
| S22 | 5 | 0.1 | Home H1: no space between the two spans in the HTML | Live |
| S23 | 5 | 1 | `/voorbeelden`, `/lootjes`, legal pages share the home `og:image` | Live: own images for `/voorbeelden` and `/lootjes`; legal pages keep the home image on purpose |
| S24 | – | – | Search Console: Domain property verified 10 Nov 2026. To do: submit the sitemap, request indexing of /, /voorbeelden, /lootjes, /blog, check excluded pages after about a week. Bing Webmaster Tools: imported from Search Console on 17 Nov 2026; follow-up checks in `docs/gsc-indexing-requests.md`. See #12. IndexNow (16 Nov 2026): `scripts/indexnow.ts` and step 6 of the deploy skill send changed pages to Bing and Yandex after a deploy; first send of all 30 sitemap pages on 16 Nov 2026 after deploy `99c92883` (202 Accepted). Sitemap submitted by the owner by 17 Nov 2026. **URL inspection, 17 Nov 2026 (OpenSEO):** indexed are only `/`, `/voorbeelden`, `/blog` and `/lootjes`. `grappige-sinterklaasgedichten-tips` and `hoe-schrijf-je-het-perfecte-sinterklaasgedicht` show "Server error (5xx)" from their last crawl (12 and 14 Sep 2026; both return 200 now, cause unknown). `sinterklaas-tradities` is "Crawled - currently not indexed"; the other 20 posts and `/contact` are "Discovered - currently not indexed"; `sinterklaasgedicht-papa-mama` is unknown to Google. GSC 14 Aug–14 Nov: impressions on 4 pages only (home 291, 12 clicks, average position 18.3). Indexing is requested per post in URL inspection (about 10 a day), most-searched posts first: batch 1 (10 posts) done on 17 Nov 2026; batch 2: 1 of 10 on 18 Nov (the rest got "quota exceeded"; the quota seems to be a rolling 24 hours), the other 9 on 19 Nov, batch 3 on 20 Nov; links in `docs/gsc-indexing-requests.md` | Owner |
| S25 | – | – | PageSpeed Insights and field data from outside the company network (Cato proxy forces HTTP/1.1 locally) | Owner |

### #26 Keywords and blog content

- **Status:** keywords and the 10 November posts live on 11 November 2026 (Worker version `aec2119f`, commit `e1938b9`); style posts and the SEO pass live on 11 November 2026 (version `60b2909d`, commit `a1edc21`).
- **What changed:**
  - Keyword map per page: `docs/seo-keywords.md`.
  - Home: title tag "Sinterklaasgedicht maken met AI: gratis generator", a new meta
    description, "sinterklaasgedicht" in two headings, and two FAQ entries
    (who to write for, short poems) that also go into the FAQPage JSON-LD.
  - `/voorbeelden`: an h2 per example for its recipient ("Grappig sinterklaasgedicht
    voor opa", …), a list of jump links, and ItemList URLs to the anchors.
  - `/lootjes`: title tag "Lootjes trekken online: gratis en zonder e-mail", h1
    "Lootjes trekken voor Sinterklaas".
  - Blog: 7 new posts (begin and end, rhyme words, short poems, opa en oma, partner,
    children, English) and the 8 existing posts rewritten. Gemini 3.7 Flash wrote all
    15 with `scripts/write-blog-posts.ts` (briefs in `scripts/blogBriefs.ts`), with a
    proofreading pass by the same model. Claude read every post and fixed 7 small
    errors by hand (a nonsense word, an invented claim, a wrong rhyme rule, an
    absolute claim about Roast, three broken lines). URLs and publication dates are
    unchanged; the rewritten posts show "bijgewerkt 10 november 2026".
  - Style posts (in git on 11 November 2026, not yet deployed): an overview of the six
    styles (`sinterklaasgedicht-stijlen`) and one post each for Klassiek, Ironisch,
    Ouderwets and Pikant (Grappig and Roast already had one). Same script and model;
    example poems in AABB only. Claude fixed by hand: an invented claim ("meest
    gekozen"), three rhymes with the stress on another syllable, "binnen dertig
    seconden" (now "ongeveer"), and the missing links from the overview. At the owner's
    request the publication dates are spread over 5 October to 3 November 2026,
    between the existing posts, although the posts went online on a later date.
  - SEO pass on all 20 posts (11 November 2026): every post now has at least 2 links
    from the text of other posts (the overview had 0, `sinterklaas-tradities` 0, five
    others 1); title tags for the overview, Engels, partner and opa en oma; meta
    descriptions for werk (was 159 characters), schrijven, rijmschema, opa en oma and the
    overview. The overview's main term is now "soorten sinterklaasgedichten". Sitemap
    `lastmod` is 11 November for every blog page that changed.
- **12 November 2026, SEO skills pass** (`.claude/skills/` from `Illyism/seo-skills`): `seo-roast` found no blocker (`seo/roast-roadmap.md`); all 20 posts cleaned of filler and given a direct answer first (`unslop-seo`); one link to the poem form in the upper 40% of each post (`internal-linking`, `seo/internal-links-report.md`); style posts link to `/?stijl=<stijl>#poem-form`; `/voorbeelden` title starts with its main term; weak or non-AABB example poems rewritten. `blog-refresher` (`seo/blog-refresh-plan.md`, approved by the owner): "sinterklaasgedicht schrijven", "grappig sinterklaasgedicht" and "rijmwoorden sinterklaas" rewritten to 1,500–1,770 words (above the 1,400 cap, approved), each with a FAQ. Posts now say "bijgewerkt 12 november". The 1,400-word cap in `STYLE_RULES` still applies to new posts; re-rendering a post from saved JSON would undo these edits.
- **16 November 2026, seasonal posts:** `sinterklaasgedicht-last-minute`, `sinterklaasgedicht-papa-mama` and `sinterklaasgedicht-juf-meester` (same script and model, briefs in `scripts/blogBriefs.ts`). Fixed by hand: literal `<br>` text instead of stanzas, nonsense lines and a jij/hij switch in the example poems (all AABB now), a wrong claim that "chocoladeletter" is hard to rhyme, "binnen dertig seconden" (now "ongeveer 30"). Each gets 2 links from the text of older posts. "collega" stays with `sinterklaas-op-het-werk`. Re-rendering these slugs from saved JSON would undo the edits.
- **27 November 2026, Search Console check** (OpenSEO, 28 Oct–26 Nov: 174 clicks, 4,087 impressions; 1,044 impressions and 55 clicks on 25 Nov, average position 8.2). Volumes are DataForSEO monthly averages for NL.
  - `sinterklaasgedicht-beginnen-en-afsluiten` brings a quarter of the clicks (41, position 7.3), but its title named only the beginning while about 60 impressions came from "afsluiten/afsluiting/slotzin" queries. New title tag "Sinterklaasgedicht beginnen en afsluiten: 24 zinnen", new description, and the h2 "Hoe sluit je een sinterklaasgedicht af?". The h1 stays.
  - `rijmwoorden-sinterklaas` ranks 40–70 for "rijmwoorden sinterklaas" (6,600/mo). Added rhymes for veelgegeven cadeaus, familie en vrienden, 22 veelvoorkomende namen and more sinterklaaswoorden (Pieten, hooi, taai-taai, snoep, chocola, chocoladeletter, melk). Check the position from about 4 December.
  - Not indexed: `surprise-maken-ideeen` ("URL is unknown to Google"; "surprise ideeen" 9,900/mo) and `sinterklaas-tradities` (crawled 16 Aug, not indexed). The owner requests indexing.
  - For next season: "sinterklaasgedicht maken" (9,900/mo) has the home page at 44–51 and the schrijven post at 51–58. The AI and ChatGPT variants are near position 10. Christmas generator queries (positions 30–75) fit xmasgpt.com.
- **Next steps:** request indexing for the new posts in Search Console (S24). From late November, check Performance → Queries and adjust the briefs. Owner: check Cloudflare Security → Bots that search crawlers (OAI-SearchBot, PerplexityBot) are allowed.
- **Notes:** no keyword tool was used, so the map has no search volumes.

### #27 Share sheet on phones

- **Status (12 November):** link share live (version `84e5b44b`). Open:
  check on a real iPhone and Android phone (with the live button):
  does the sheet open after the short-link wait, and how often does `refused` show
  in analytics?
- **What:** phones and tablets (`navigator.share` and `(pointer: coarse)`) get one
  "Deel gedicht" button instead of WhatsApp/E-mail/Facebook. Desktop keeps the three
  buttons. The sheet gets the title and the link, not the whole poem.
- **Link:** the short link gets 1 s after the tap, then the long link goes. If the
  browser refuses after the wait (`NotAllowedError`), the button says "Tik nog eens om
  te delen"; the second tap uses the short link at once. The short link is never made
  before the visitor shares (privacy text).
- **Analytics:** `Shared via share sheet` with `done`/`cancelled`/`refused`/`failed`.
  The browser does not say which app, so `Shared via WhatsApp/Facebook` drop on phones.
- **PDF (12 November, not deployed):** "Deel PDF" in the PDF window on phones that can
  share files, with "Downloaden" next to it. The page builds the chosen design when the
  window opens and when the visitor picks another one, so the tap shares at once.
  Event `Share PDF` (`<design>:done/cancelled/refused/failed`). Check on a real phone.

### #29 Error alerts to Telegram and a WAF rule

Status (15 November 2026): code built and tested locally, not committed or
deployed. See "Errors and alerts" in `CLAUDE.md`.

Owner steps:
1. Telegram: create a bot with @BotFather, send it one message, read the chat
   ID from `https://api.telegram.org/bot<token>/getUpdates`.
2. Cloudflare: create an API token with only Account Analytics Read.
3. Set the three Worker secrets `NUXT_CLOUDFLARE_ANALYTICS_TOKEN`,
   `NUXT_TELEGRAM_BOT_TOKEN`, `NUXT_TELEGRAM_CHAT_ID`, then deploy.
4. Test: `npx tsx scripts/alerts-check.ts 0 --send`.
5. WAF custom rule (Free plan, Block) against scanners for `/.env`, `/.git`,
   WordPress and PHP paths. In the week to 15 Nov, about 99% of the HTML
   requests came from such bots (13,090 requests, about 90 real page views).

### #28 New poem prompt: wait time and follow-ups

- **Status:** live since 14 November 2026 (commit `73bb578`, `buildPrompt` in
  `server/utils/poem.ts`). One live poem checked after the deploy: 12 of 12
  lines, the name and the present in it, 22 s in total. Open: the points below.
- **What changed:** lines of about 10 syllables, rhyme without filler words, one
  joke per rhyme pair, a closing punchline, one voice, no made-up traits, a tip
  per style, example couplets, and a "Tempo" line. See the finding
  "Poem prompt and reasoning effort" below for the test.
- **Open:**
  1. **Wait time.** The model reasons longer: first text after about 27 s in a
     local test of 8 poems (one at a time), against about 14 s with the old
     prompt. The site says "Klaar binnen 30 seconden" and "Gemiddeld 20 tot 30
     seconden" (`locales/nl.ts`, `locales/en.ts`, `SITE_FACTS`, `llms.txt`).
     Watch `Generate poem` (seconds to first text) and `Poem aborted` on the
     dashboard after the deploy. If the average is above 30 s: change the
     texts, or shorten the prompt.
  2. **Cost.** About $0.011 to $0.014 per poem, was $0.008.
  3. **Rewrites.** "Herschrijf dit gedicht" uses the same prompt with
     `REGENERATE_POEM_MODEL`. The new prompt was tested with Gemini 3.7 Flash
     only (one rewrite with a wish and one hostile wish: both correct). Do one
     real rewrite after the deploy (also open in #18).
  4. **Example poems** (still open on 18 Nov: `utils/examplePoems.ts` last changed
     11 Nov, the prompt on 14 Nov). The poems in `utils/examplePoems.ts` and the PDF
     showcase come from the old prompt. The site now writes better poems than
     its examples. Write them again (`scripts/generate-example-poems.ts`) and
     review them.

### #30 Gift mail to last season's buyers

- **Status:** sent on 17 Nov 2026 through Cloudflare Email Sending: 53 mails
  queued, 1 address skipped (no mail server). Tests: Google delivers to the inbox;
  Microsoft (fd.nl, Hotmail) put every test in spam (SCL 5, also plain text), so
  the 14 Microsoft recipients most likely find it in spam. Watch `Gift claimed`
  (`granted:season`, `full`) and "afmelden" replies. After pakjesavond: delete
  `.cache/gift-mail/`, the secret `NUXT_GIFT_CODES_SEASON` and the token
  "SintGPT gift mail". Details: `docs/buyer-gift-mail.md`.
- **What:** one mail to the buyers of the 2025 season (fewer than 50, old Dodo
  business), each with a unique gift URL for Hele familie until pakjesavond
  5 Dec 2026, usable in at most 3 browsers. Sent with Cloudflare Email Sending.
- **Decisions:** owner, 17 Nov 2026. The owner accepted the legal risk: the 2025
  checkout asked for the address "voor factuur" with no marketing opt-out, so the
  soft opt-in exception (art. 11.7 Tw) most likely does not apply. Limits: one
  mail, gift only, opt-out, no follow-ups. One thank-you poem for everyone, written
  by SintGPT, in the mail with its `/g/<id>` link.
- **Needs:** season codes with a 3-browser limit (code and deploy), Workers Paid
  and Email Sending onboarding (owner), a Dodo CSV export (owner), the send script,
  a privacy text change.

### #31 Free rewrite with a wish

- **Status:** built 18 November 2026, not deployed. Details in `CLAUDE.md` (Poem generation, step 6).
- **Why:** in the 14 days to 18 November, 13 payment windows opened for a rewrite of a free poem; 4 of 35 windows led to Dodo.
- **Safeguards:** a wish is required; the poem must carry SintGPT's signature; the poem model, not the rewrite model (about $0.012); 1 per IP per 24 hours on its own counter; `NUXT_FREE_REWRITE=off` stops it without a deploy.
- **Measure after the deploy:** `Poem ready` `free rewrite` and `Regenerate poem` with plan `free` (cost), then `Show payment modal` `rewrite` against the weeks before. A free rewrite that leads to sharing (`Copy share link`, `Shared via …`) is the goal.
- **Watch:** households on one IP share the one free rewrite (same as #17).

### #32 Write first, then pay

- **Status:** built 18 November 2026, deployed 21 November (off), tested and switched on 22 November (`NUXT_POEM_PREVIEW=on`; the live route answers 400 to an empty request instead of 503). Details in `CLAUDE.md` (Payments).
- **What:** a free visitor without poems left gets the new poem written; the page shows the greeting and the first stanza, the rest as blurred bars, and "Lees het hele gedicht". After payment the page opens the whole poem.
- **Safeguards:** 2 previews per IP per 24 hours; only while payments work; KV for 2 hours, the browser gets only the start; unlocking needs access and counts as a poem; `NUXT_POEM_PREVIEW=off`.
- **Cost:** each preview is a poem. Since 22 Nov from Gemini 3.1 Pro (`PREVIEW_POEM_MODEL`, owner's choice): $0.06 to $0.08 and 55 to 65 s, measured on 2 poems; with Flash it was about $0.012 and 16 s. Worst case 2 per IP per day. Watch whether visitors leave during the longer wait: `Poem preview` against `No poems left` `free:submit`.
- **Server-only limit (fixed and live 22 Nov, f81e38f9):** a visitor whose page did not know the free poem was used (another device, a private window) got 429 `limit` on every try and never a preview (22 Nov 11:23: 8 refusals in 2 minutes). Now the page records it and writes the preview at once. First live previews from Pro on 22 Nov: 2, at 64 to 65 s and $0.08 each, 0 payments.
- **Measure:** `Poem preview` → `Show payment modal` `preview` → `Proceed to payment` → `Poem unlocked` `new`. Compare with `Show payment modal` `submit` → `Proceed to payment` before (18 → few).
- **Before the deploy:** test once on a preview deploy or `wrangler dev` with KV: preview, pay in Dodo test mode, return, poem opens.
- **Test 22 Nov 2026 (passed):** `wrangler dev` with local KV and the test key from `.env`, Playwright, `sinterklaas-payment` set to 1 poem used.
  - Preview: 200 in about 16 s; greeting, first stanza and 12 bars; `sintgpt-poem-preview` kept in localStorage.
  - Payment: "Lees het hele gedicht" → Gezin → Dodo test checkout → iDEAL (Stripe test page, authorize) → `claim-access` 200 → `unlock` 200 within 3.3 s. The whole poem (same start as the preview) shown with the success notice, saved in the history with a share link; the preview removed from localStorage.
  - Unlock without access 403, with a bad ID 400; a preview request from another site 403. The same buyer fetches again: 200.
  - Local test only: `wrangler dev` sets the Host header to the route's domain, so Dodo returned to `https://sintgpt.com/` instead of localhost (create-checkout builds `return_url` from the Host header). Opening the return URL on localhost by hand finished the test. Production is not affected.
- **Switch on:** `! printf on | npx wrangler secret put NUXT_POEM_PREVIEW --name sintgpt`. Off again: the same with `off`.

### #33 Sint reads the poem (video)

- **Status:** researched 18 November 2026 (ElevenLabs), decision needed.
- **Pipeline:** own Sint voice (Voice Design) → `eleven_v4` TTS in Dutch (about $0.05 per poem) → `creatify-aurora` (image + audio → talking video, the only lip-sync model in the public ElevenLabs API, `POST /v1/flows/video`) → webhook → copy the MP4 to R2 (the ElevenLabs link expires after about 1 hour).
- **Cost and wait:** about $3.20 (480p) to $6.35 (720p) for a 45 s poem; about 3–6 minutes. Too costly for the 100/day cap: at most 1–3 videos per Hele familie purchase, or a separate product.
- **Needs:** Pro plan or above for the Image & Video API (check what the account's grant includes); a front-facing Sint image with a visible mouth (`sint.png` is three-quarter, beard over the mouth); one 10 s test clip to read the real cost.
- **Risks:** the ElevenLabs use policy needs written approval for products aimed at under-18s (children watch); EU AI Act art. 50 labelling of synthetic video versus the "no AI-gegenereerd" text rule; the poem (with names) goes to ElevenLabs and Creatify (privacy text; opt out of training).

### #34 Gezin at €4,99 and honest persuasion

- **Decisions (owner):** on 22 Nov an introductory price (€6,99 for the first 100 until 30 Nov, then €8,99) with a real sales bar, plus urgency, reciprocity and commitment in the payment window. The owner first asked for a struck-through €8,99 and "62 of 150 sold"; both were not true, so real versions were built. On 23 Nov, before any of it was deployed, the owner chose a flat **€4,99 incl. btw** instead: 0 of 15 payment windows on 22–23 Nov led to a checkout. The introductory price, the cap, the bar and the €8,99 product were removed again.
- **Live 23 Nov, 22:40** (`c4423eeb`, Dodo product set to 499 cents just before; checkout showed €4.99 = €4.12 + €0.87 btw): `TIERS.gezin.priceCents` 499; `gezinPriceText` for `{gezinPrice}` (hero, payment description, examples, lootjes); `poemsBelowOneEuro` ("Bij 5 gedichten"); the nudge says "Voor €1 meer". Window: "Nog N dagen tot pakjesavond", "Je eerste gedicht kreeg je van de Sint", and after a preview "Je nieuwe gedicht is al geschreven en staat voor je klaar". FAQ, terms, `llms.txt`, JSON-LD, docs and the marketing drafts say €4,99.
- **Deploy order:** set the live Dodo product `pdt_0NrhkxiUQYJFJOJ7Y9GRb` to €4,99 right before the deploy (step 6 in `docs/dodo-payments-todo.md`). Between the two steps the page and the checkout differ by €2, in the buyer's favour. After the deploy, open a checkout and check €4,99.
- **Watch:** Drie (€3,99 for 3) is now only €1 cheaper than Gezin, so it works as a decoy; Hele familie (€12,99) is 2.6 times Gezin. Measure `Show payment modal` → `Proceed to payment` per tier, before and after.

### #35 Every poem on Gemini 3.1 Pro

- **Decision (owner, 24 Nov 2026):** "maximum quality": every poem (new, free rewrite, rewrite, preview) uses `POEM_MODEL` = `google/gemini-3.1-pro-preview` at thinking level `medium`. Before, new poems and free rewrites used Gemini 3.7 Flash. The owner was told first that the blind test of 15 Nov found no measurable difference (Pro 54%, Flash 46%, p=0.84; Pro better on rhythm, Flash on using the facts; Pro did not finish 2 of 14 in 5 minutes) and chose Pro anyway. `FLASH_MODEL` stays for surprise ideas and the blog-post script. No `NUXT_AI_GATEWAY_MODEL` secret is set on the Worker (checked 24 Nov).
- **Cost and wait:** a new poem goes from about 23 s and $0.012 to about 60 s (28 to 108 s measured on previews) and $0.06 to $0.08. The free poem and the free rewrite now cost as much as a preview: worst case per free visitor 1 poem + 1 free rewrite + 2 previews, about $0.30.
- **Texts:** every "30 seconden" claim now says "ongeveer een minuut": hero, SEO title and description, FAQ, the countdown hint, the shared-poem page, 21 blog posts, the blog index, `llms.txt`, the blog brief (`SITE_FACTS`), the home share image (`public/og/home.jpg`), the sticker specs and the marketing drafts. The writing animation of a new poem uses the preview timing (60 s); `form.submit.timePreview` and `poem.writing.previewHint` are gone (every poem is now as slow).
- **Not changed:** printed stickers say "Klaar in 30 seconden" (the specs are fixed; render again with `npx tsx scripts/build-stickers.ts` before printing more).
- **Watch after the deploy:** `Poem aborted` (`before text`) against `Generate poem`, the seconds to the first text, `Poem stream failed`, the cost per day, and the 👍/👎 per style. Before: 23.7 s to the first text, about $0.012 per poem, 3× 👎 on Grappig in 2 days.
- **Measured 24–25 Nov:** 14 new Pro poems with text; first text after 26 to 183 s, median about 60 s. Two poems on 24 Nov (15:36 and 18:13) took about 180 s at about 25 output tokens per second against 90–98 for the others: a wait in the gateway or at Google, not more reasoning (a guess; check the AI Gateway logs). None on 25 Nov.

### #36 An empty answer used the free poem

- **Found 25 Nov 2026 (13:47, BE):** `Generate poem` ended after 2.2 s with 0 output tokens ($0.0025, about 1,250 input tokens). The route saw no error, so it counted the free poem and the page showed nothing. The visitor sent the form 5 times in 6 s (`debounce`), then got `limit` (`free:server`), a preview, closed the payment window and left. Most likely Gemini's safety filter (finish reason `SAFETY`); the event did not hold the reason.
- **Fix (live 26 Nov 2026, `db1ad86b`, commit `fe473e3`):** an answer without text, or a gateway failure before the first word, gives the poem back: `releasePoemCount` → `POST /release` on the counter → `releaseAttempt` (only the last counted attempt, in its window, at most `MAX_POEM_RELEASES` = 2 per window, so an input that is always blocked cannot write for free all day; the 10 s wait stays). The page gets the error `empty-poem:released` (or `:counted`) and says "De Sint kreeg dit gedicht niet op papier. Het telt niet mee. …". Analytics: `Poem generation failed` `empty:<finish reason>` (with tokens and cost) instead of `Generate poem`; `Poem stream failed` `empty:released|counted` from the page. Checked with a mock model that ends with `content-filter`/`SAFETY`.
- **Not changed:** `Poem aborted` (the visitor leaves) still counts, also before the first text: with Pro that is about 60 s of waiting. One case on 25 Nov (06:40, during text). The preview already refuses an empty text (`Empty poem`), but its count of 2 a day stays.
- **Watch:** `Poem generation failed` with `empty:` and which finish reason; if it is `SAFETY` often, find which styles or inputs cause it.

### #37 Share image shows the Sint of the poem style

- **Request (owner, 25 Nov 2026):** the link preview of a shared poem showed the usual Sint for every style. It now shows the Sint of the poem's style, like the hero does: Ironisch, Ouderwets, Pikant and Roast have their own photo; Grappig and Klassiek keep the usual one.
- **How:** the share data gets `st=<style>.<tag>`, signed apart from the link (see "Poem links" in `CLAUDE.md`). Old links, and links from a page opened before the deploy, stay valid and keep the usual photo. Images already in the edge cache do not change.
- **Not possible:** poems written before the deploy have no style in their link, so they keep the usual photo, also when shared again from the history.
- **Live 25 Nov, 23:35** (`dab5b377`, commit `31a6cda`). Checked: unit tests (sign, verify, forged style, cache key, short link, edit, free rewrite), the e2e test of the image, the four images by eye, and the Worker build under `wrangler dev` with a test secret (five different images, a forged style gets the usual photo, a forged signature 404). On the live site: the smoke test, and a forged link gets 404.
- **Open check:** not checked live with a real poem, because a live check writes no poem. Write one Roast poem, share it, and look at the preview in WhatsApp (Sint with the pixel sunglasses).

### #38 Hint for writers who forget the name

- **Finding (26 Nov 2026):** 3 of the 7 writers that day pressed "Schrijf mijn gedicht" without a name (`Form refused` `no name`). All three fixed it and wrote a poem within 80 s, but the form is long: the error sits under the name field in step 1, far above the button. The placeholder "Sint Nicolaas" could also look like a name that is already filled in.
- **Fix (live 26 Nov 2026, `db1ad86b`, commit `7f6f8ce`; checked on the live site):** once the visitor has typed or picked anything in the form, a line above the button says "Je hebt bij stap 1 nog geen naam ingevuld." with a button "Vul de naam in" that scrolls to the field and focuses it (`showNameHint` in `pages/index.vue`; the submit button gets `aria-describedby`). It goes away when the name is filled in. The placeholder is now "Bijvoorbeeld: Marieke" ("For example: Emma"). The refusal on submit is unchanged. E2e test: "warns above the button while the name is empty".
- **Watch:** the share of `Form refused` `no name` per `Generate poem` after the deploy (26 Nov: 3 of 7).

### #39 Blog design "Het Grote Boek"

- 27 November 2026: the owner chose design A out of 4 (canvas with all 4, desktop and phone:
  https://claude.ai/artifact/LUEC3XzB4n3LTJkxnSGseU). Built: the index is a table of contents
  in 4 chapters (`BLOG_CHAPTERS`), the posts are a page of the book (drop cap, examples between
  gold rules, a contents list in the margin for posts with `toc`), shared `BlogHeader` and
  `BlogFooter`. The rhyme words post shows its lists as a "rijmregister" table.
- The header button "Schrijf een gedicht" sends `Go to poem form` with `blog:<slug>:kop`
  (index: `blog:index:kop`). Watch: do blog readers reach the form more often than before
  (compare `Go to poem form` `blog:*` per blog `Page view` with the days before 27 November).
- 27 November 2026: every post has the contents list (`toc`); all h2 headings got an id.
- 27 November 2026: the 24 Open Graph images of the blog have the look of the book (cream page,
  red title, chapter label). Home, Voorbeelden and Lootjes keep the red look.

## Findings

### Rewrite model and thinking level (15 November 2026)

- **Decision:** rewrites use `medium` (`poemProviderOptions`), from the blind
  test below.
- **First probe:** Gemini 3.1 Pro (`REGENERATE_POEM_MODEL`), the live prompt, funny,
  AABB, Dutch, 20 lines, 5 at a time, 240 to 300 s timeout. 10 poems at the
  default level (what rewrites use now), 5 at `medium`, 5 at `low`.
- **Default:** 4 of 10 timed out at 240 s. The other 6: first text after 117 s
  on average (66 to 203 s), 10,500 reasoning tokens, $0.13 per poem.
- **`medium`:** 5 of 5, first text after 62 s (44 to 83 s), 6,600 reasoning
  tokens, $0.085.
- **`low`:** 5 of 5, first text after 40 s (28 to 61 s), 3,900 reasoning
  tokens, $0.052. Unlike Flash, Pro still reasons at `low`.
- All finished poems had 20 lines in 5 stanzas, the name and the present, 9.6
  to 10.4 syllables per line. Quality was only read, not judged blind.
- **Blind test:** the 14 lab requests (all styles, 8 to 24 lines), one poem
  per level, 14 at a time, 300 s timeout. Timeouts: default 3 of 14, `medium`
  2, `low` 0. Means of the finished poems: default first text 123 s, 8,900
  reasoning tokens, $0.111; `medium` 98 s, 5,100, $0.066; `low` 78 s, 2,800,
  $0.038 (all slower than in the probe, because of the parallel load).
  Gemini 3.7 Flash judged each pair blind in both orders:
  - default against `medium`: 59% against 41% (p=0.52), within the noise.
  - default against `low`: 73% against 27% (p=0.05); humor 17 against 3.
  - `medium` against `low`: 58% against 42% (p=0.54).
- The poems that timed out at every level but `low` were the longest (24
  lines) and the one written as a child of 8. Watch `Poem aborted` with
  `Regenerate poem` after the deploy.
- **Flash (live default) against Pro `medium`**, same 14 requests, blind:
  Pro 54%, Flash 46% (p=0.84), so no measurable difference. Pro wins on
  rhythm (14 against 7) and language, Flash on using the facts (10 against
  5). Flash finished all 14 (two of them are the ones Pro could not finish
  in 5 minutes), at $0.013 per poem against $0.066. Decision: Flash stays
  the default; Pro `medium` stays for rewrites.
- **Lesson:** 7 to 21 parallel requests on the live gateway key made later
  requests wait minutes (Flash: 14 to 38 s for the first 7, up to 255 s
  after). Wait times from parallel lab runs are not reliable, and such runs
  can slow down real visitors. Run lab tests 2 or 3 at a time.

### Poem prompt and reasoning effort (14 November 2026)

- **Method:** 14 made-up requests that follow the real form use (mostly funny,
  Dutch, AABB, long fun facts), 2 or 3 poems per request per prompt. Gemini 3.7
  Flash wrote the poems and judged them in blind pairs, each pair in both
  orders. Plus checks without a model (line count, name, present, syllables per
  line) and 6 guard requests (prompt injection, sensitive facts, English, ABAB,
  limerick). The judge prefers the first poem (60 to 70%) and two runs of the
  same prompt scored 64% against 36%, so only large differences count.
- **Prompt:** the new prompt won 82% of 84 judgements against the old one (the
  final wording: 84% of 56). Lines went from 12.9 syllables (spread 0.95 within
  a poem) to 10.3 (spread 0.4). Line count, name and present: 100%.
- **Reasoning effort (`thinkingLevel`):** the default equals `medium` (52%
  against 48%). At `low` the model mostly does not reason: 3 times cheaper and
  faster, but it loses 2 of 3 comparisons with `medium` and is no better than
  the old prompt. `high` was not tested in full (2 poems: twice the wait and
  the cost). `thinkingBudget` does not work as a cap: the model then skips
  reasoning or ignores the cap. `minimal` gives no output.
- **Two traps:** a "work in steps" block in the prompt made the model write
  its drafts into the answer when it did not reason (2 of 40 poems at `low`).
  And the model borrows words from example couplets about the same subject as
  the request, so the example is about courgettes.
- **Not solved:** some filler words remain, and a poem without a present has
  the weakest ending.

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
