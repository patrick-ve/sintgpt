# SEO Roast Roadmap: sintgpt.com (2026-11-12)

Verdict: nothing blocks a crawler; Google simply has not been asked to look yet, and the blog sends readers to the poem form only at the very bottom.

Method: the `seo-roast` skill (`.claude/skills/seo-roast/SKILL.md`), adapted to a
Nuxt site with one money page. Money pages: `/` (the poem form; conversion = first
poem, then a tier), `/voorbeelden`, `/lootjes`. No Ahrefs, DataForSEO or Search
Console data was available, so point 4 (authority) is not verified.

## Checks

| # | Check | Result | Evidence |
|---|---|---|---|
| 1a | robots.txt | PASS | `User-agent: *`, `Allow: /`, `Disallow: /api/`, sitemap line; no Cloudflare managed block prepended |
| 1b | Locale sprawl | PASS | One locale for crawlers (Dutch); English is applied in the browser on the same URLs, no hreflang (on purpose, see `CLAUDE.md`) |
| 1c | SafeSearch | PASS | No user images; Pikant and Roast are text only |
| 1d | Soft 404s | PASS | `/no-such-page-xyz`, `/blog/bestaat-niet`, `/g/AAAAAAAAAA`, `/gedicht` without a signature: 404 |
| 2 | Programmatic traps | PASS | `/g/<id>` and `/gedicht` are `noindex` and not in the sitemap; prices equal in `utils/pricingTiers.ts`, JSON-LD, `/voorwaarden` and `llms.txt` (€3,99 / €6,99 / €12,99) |
| 3a | Above the fold | PASS | 390×844 and 1366×768: h1, "Begin met rijmen" button and the free-poem line with prices are visible; the form starts below the fold, the button scrolls to it |
| 3b | Demo wall | PASS | First poem free, no account, about 30 seconds |
| 4 | Authority | NOT VERIFIED | No backlink data. Built-in loop: shared poems (`/g/<id>`) link to `/` with the brand name. The PDF names no site (owner's choice, kept) |
| 5 | AI crawlers and prices | PASS (by user agent) | GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot, Bingbot, Google-Extended, Googlebot: 200 on `/`, `/voorwaarden`, `/llms.txt`, all three prices in the HTML without scripts. A spoofed user agent cannot show Cloudflare's verified-bot blocking: see row 4 below |
| 6 | Money-page indexation and links | FAIL (partly) | In sitemap, canonical OK, linked from nav. Indexation unknown (Search Console not used yet). Contextual inbound links: `/` 23, `/voorbeelden` 16, `/lootjes` 10, but in 18 of 20 posts the first link to a money page sits below 40% of the text, and the anchor "voorbeeldgedichten" was used 9 times |

## Roadmap

| # | Tier | Issue | Revenue impact | Fix | Owner | Status |
|---|---|---|---|---|---|---|
| 1 | REVENUE | Pages not submitted to Google | Season peaks in 3 weeks; unindexed pages earn nothing | Search Console: submit `sitemap.xml`, request indexing (day 1: `/`, `/voorbeelden`, `/lootjes`, `/blog`, 6 posts; day 2: the rest) | owner | next |
| 2 | REVENUE | Blog links to the poem form only at the bottom | Readers who leave halfway never see the form | One in-text link per post in the upper 40%, varied anchors, `data-cta="blog:<slug>:tekst"` | agent | this change |
| 3 | REVENUE | `/voorbeelden` title did not start with its main term and was 65 characters; three descriptions over 155 | Truncated titles, weaker match for "sinterklaasgedicht voorbeelden" | New title and shorter descriptions in `locales/nl.ts` | agent | this change |
| 4 | REVENUE | Cloudflare may block AI crawlers by IP (AI Crawl Control / "Block AI bots"), which a user-agent test cannot see | ChatGPT search, Perplexity and Claude would not see the site | Cloudflare dashboard → sintgpt.com → Security → Bots / AI Crawl Control: allow search crawlers (OAI-SearchBot, PerplexityBot, Claude-SearchBot); blocking training crawlers is a separate choice | owner | check |
| 5 | REVENUE | Style posts cannot hand the reader to a form with that style chosen | A reader of the Roast post lands on a form set to Grappig | `/?stijl=roast#poem-form` chooses the style (no data stored, parameter removed); the six style posts link there | agent | this change |
| 6 | COMPOUNDING | Bing and AI search | Bing feeds DuckDuckGo, Ecosia and ChatGPT search; one visit already came from chatgpt.com | Import into Bing Webmaster Tools; IndexNow ping after each deploy | owner + agent | offered |
| 7 | COMPOUNDING | No backlink data | Unknown gap to competitors | After indexing: Search Console → Links. Real links: local press and parenting blogs about the free lootjes page | owner | later |

## Fluff (ignore until rows above ship)
- Home h1 does not contain "maken" (the title and the first h2 carry the term).
- `public/llms.txt` is static; it matches the prices today. Keep it in line by hand (rule in `CLAUDE.md`).
- Hydration mismatch warning (ISSUES #11).
