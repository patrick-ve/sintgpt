# Issues

The tracker for SintGPT: open work, decisions that wait for an answer, and
findings worth keeping. Newest information first within each section.

- Update the **Status** when something changes; move closed items to **Closed**
  with the date and how they were closed.
- Detailed checklists live elsewhere and are linked: `docs/dodo-payments-todo.md`,
  `docs/pricing-tiers.md`.
- Never put API keys, webhook secrets or gift codes in this file.

Last updated: 10 November 2026. Live version: `03b783e6-9347-4d6f-929f-7690ce73ad1e`
(commit `d0db20d`, on GitHub).

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
| [#25](#25-seo-audit) | Medium | SEO audit (10 November 2026) | Live; owner steps open |
| [#27](#27-share-sheet-on-phones) | Medium | Share sheet on phones | Link live; PDF built; phone check open |

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
| S24 | – | – | Search Console: Domain property verified 10 Nov 2026. To do: submit the sitemap, request indexing of /, /voorbeelden, /lootjes, /blog, check excluded pages after about a week, import into Bing Webmaster Tools. See #12 | Owner |
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
- **Next steps:** request indexing for the new posts in Search Console (S24). From late November, check Performance → Queries and adjust the briefs.
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
