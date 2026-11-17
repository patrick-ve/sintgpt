# Search Console: indexing requests for the blog

On 17 Nov 2026, URL inspection (through OpenSEO) showed that Google had indexed
only `/`, `/voorbeelden`, `/blog` and `/lootjes`. None of the 24 blog posts were
in the index (see S24 in `ISSUES.md`). Google allows about 10 indexing requests a
day, so the posts are requested in three batches, most-searched first.

How: open a link (Google account `/u/1/`), wait for the check, click
**Request indexing**. If a link opens without that button, open the general
page and paste the blog URL into the bar at the top:
https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com

## Batch 1: done on 17 Nov 2026

- [x] [grappige-sinterklaasgedichten-tips](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=O_Vn8eT-kImf8X1sPd-DtA)
- [x] [rijmwoorden-sinterklaas](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=fVZs_tprsG1AfqMZ9U2cRw)
- [x] [hoe-schrijf-je-het-perfecte-sinterklaasgedicht](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=SGBcvnTVsab4sbAY4per9A)
- [x] [kort-sinterklaasgedicht](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=X4990HCnLbn4z3eLn3bENA)
- [x] [sinterklaasgedicht-last-minute](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=2bhCl2N8CG5UML7kZ_156A)
- [x] [sinterklaas-op-het-werk](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=rZRSWTwuPURDcd5lUGnw3A)
- [x] [sinterklaasgedicht-beginnen-en-afsluiten](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=cCGQAe7byL37I1VtH5pZ-Q)
- [x] [sinterklaasgedicht-stijlen](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=tAtZXvjkBD3QdxfkRU_nlw)
- [x] [sinterklaasgedicht-opa-oma](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=heqw8_iZq41sDUygJLkDyw)
- [x] [sinterklaasgedicht-voor-kinderen](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=I6GKOrPCglDzJWD91RmqOw)

## Batch 2: 18 Nov 2026

- [ ] [sinterklaasgedicht-papa-mama](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=SH5ZcodFEUHWxjuCWV6CMA)
- [ ] [sinterklaasgedicht-juf-meester](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=OKNYJ8y6sREqnb5D34Xftg)
- [ ] [sinterklaasgedicht-partner](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=3oIBO9dTwrQh_0dLwW3RZg)
- [ ] [roast-sinterklaasgedicht-zonder-te-kwetsen](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=v4WWFDKJ-Yl5ejJt2MsMcw)
- [ ] [klassiek-sinterklaasgedicht](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=pwz6haRJWBm0tIYaw9pdZQ)
- [ ] [ironisch-sinterklaasgedicht](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=xY3gKcEY8kSxz7Hd138x9w)
- [ ] [pikant-sinterklaasgedicht](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=6BJWrfKsYKATASJ3-vcfKg)
- [ ] [ouderwets-sinterklaasgedicht](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=EEiGSQxrTPiGk7Mdzgn0iw)
- [ ] [rijm-en-ritme-sinterklaasgedicht](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=YZotqkrgYq5e5mPdOp8b-A)
- [ ] [sinterklaasgedicht-in-het-engels](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=IDwNVligbIiUneVs7MmpLA)

## Batch 3: 19 Nov 2026

- [ ] [lootjes-trekken-tips](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=M7Qq6isLx14OTRMaotW38w)
- [ ] [surprise-maken-ideeen](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=h6fM14NPwIJkyylPHjp3NQ)
- [ ] [sinterklaas-tradities](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=F6im3X2aFVh5Mx0N25mt_Q)

## Check

A few days after each batch, inspect the posts again (OpenSEO `inspect_urls`,
free) and note which ones are indexed. A post that stays "Discovered - currently
not indexed" for more than a week needs more internal links or an outside link.

- [ ] Around 21 Nov 2026: re-check all 24 posts with `inspect_urls`.

## Search Console: Crawl stats

- [ ] Settings → Crawl stats → "Host status" and "By response". Look for server
  errors (5xx) and the days they happened. Two posts got a 5xx in September
  (cause unknown). If Googlebot still gets errors, requesting indexing does not
  help: check Cloudflare Security → Events for blocked or challenged Googlebot
  requests.

## Bing Webmaster Tools

Imported from Search Console on 17 Nov 2026 (https://www.bing.com/webmasters).
Bing feeds ChatGPT search, DuckDuckGo and Ecosia. Data starts to show after 1 to
2 days.

- [ ] **Sitemaps:** `https://sintgpt.com/sitemap.xml` is listed. "Pending" or
  "Processing" is normal on the first day; after that it says "Success" with 30
  URLs.
- [ ] **IndexNow:** the 30 URLs sent on 16 Nov 2026 (`scripts/indexnow.ts`) are
  listed. If the page is empty, check that the key file
  `https://sintgpt.com/f3a523d955a76579db721cd7f22b55db.txt` answers 200.
- [ ] **URL Inspection:** inspect `https://sintgpt.com/` and
  `https://sintgpt.com/blog/grappige-sinterklaasgedichten-tips`. For a page
  that is not indexed, click **Request indexing** (Bing allows many more
  requests a day than Google).
- [ ] **Settings → AI and Copilot** (if shown): leave the use of the content in
  Bing's AI answers on.
- [ ] Around 21 Nov 2026: look at **Search Performance**.

No manual URL submission is needed in Bing: IndexNow sends changed pages after
every deploy (step 6 of the deploy skill).
