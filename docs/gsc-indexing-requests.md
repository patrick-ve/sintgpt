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

## Batch 2: started 18 Nov 2026, rest on 19 Nov

On 18 Nov (about 11:00) only the first request worked; the other 9 got
"quota exceeded". The quota seems to be a rolling 24 hours, not a calendar day:
batch 1 was requested on the evening of 17 Nov. Try the rest on 19 Nov after
the time of batch 1 (evening), or later.

- [x] [sinterklaasgedicht-papa-mama](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=SH5ZcodFEUHWxjuCWV6CMA)
- [ ] [sinterklaasgedicht-juf-meester](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=OKNYJ8y6sREqnb5D34Xftg)
- [ ] [sinterklaasgedicht-partner](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=3oIBO9dTwrQh_0dLwW3RZg)
- [ ] [roast-sinterklaasgedicht-zonder-te-kwetsen](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=v4WWFDKJ-Yl5ejJt2MsMcw)
- [ ] [klassiek-sinterklaasgedicht](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=pwz6haRJWBm0tIYaw9pdZQ)
- [ ] [ironisch-sinterklaasgedicht](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=xY3gKcEY8kSxz7Hd138x9w)
- [ ] [pikant-sinterklaasgedicht](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=6BJWrfKsYKATASJ3-vcfKg)
- [ ] [ouderwets-sinterklaasgedicht](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=EEiGSQxrTPiGk7Mdzgn0iw)
- [ ] [rijm-en-ritme-sinterklaasgedicht](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=YZotqkrgYq5e5mPdOp8b-A)
- [ ] [sinterklaasgedicht-in-het-engels](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=IDwNVligbIiUneVs7MmpLA)

## Batch 3: 20 Nov 2026 (moved from 19 Nov, see batch 2)

- [ ] [lootjes-trekken-tips](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=M7Qq6isLx14OTRMaotW38w)
- [ ] [surprise-maken-ideeen](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=h6fM14NPwIJkyylPHjp3NQ)
- [ ] [sinterklaas-tradities](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=F6im3X2aFVh5Mx0N25mt_Q)

## Re-check on 21 Nov 2026 (OpenSEO `inspect_urls`)

All 30 sitemap URLs inspected. 15 are indexed: `/`, `/blog`, `/voorbeelden`,
`/lootjes`, all 10 posts of batch 1 and `sinterklaasgedicht-papa-mama` (each
crawled within hours of its request). The 9 open posts of batch 2 and the 3 of
batch 3 still have no crawl, so their requests did not go through.

Not indexed (fresh links; request in this order, about 10 a day):

1. [sinterklaasgedicht-juf-meester](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=sUK2XkKnRyxSP-EeyX03Dg): Discovered
2. [sinterklaasgedicht-partner](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=QwJu2LytJ6hC1KnoVtmEnQ): unknown to Google
3. [roast-sinterklaasgedicht-zonder-te-kwetsen](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=Cm9RUejUCjCOpUBkSUgbnw): Discovered
4. [klassiek-sinterklaasgedicht](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=yuJ8CUzBbiDm5ZhkF0aD0A): Discovered
5. [ironisch-sinterklaasgedicht](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=vDCm8g-s0yiNLveaGzzSNQ): unknown to Google
6. [pikant-sinterklaasgedicht](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=RaPCsuhmQ6GTaeCECqjngA): Discovered
7. [ouderwets-sinterklaasgedicht](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=7H7gJKtI9lZJIcJJ1lP6fQ): Discovered
8. [rijm-en-ritme-sinterklaasgedicht](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=GawxyMC2M5pVNc7yFcL-dA): Discovered
9. [sinterklaasgedicht-in-het-engels](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=aK80LhzblmBK46XjpAU_nQ): Discovered
10. [lootjes-trekken-tips](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=Ppbz93lRlZEkaE2CzWir4g): Discovered
11. [surprise-maken-ideeen](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=CGjHWkZf0wulsGhTFNzPZw): Discovered
12. [sinterklaas-tradities](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=X7_lzB9hC8DQzpk5SQO71Q): Crawled - currently not indexed (last crawl 16 Aug 2026)
13. [contact](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=qqaYrhmviGax_yFoFdwxhQ): Discovered
14. [voorwaarden](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=Zyq0vkaQBpOm6MUrACBPFg): Discovered
15. [privacy](https://search.google.com/u/1/search-console/inspect?resource_id=sc-domain:sintgpt.com&id=dMMiHQEnVLV8AIRCkeajcA): unknown to Google

## Check

A few days after each batch, inspect the posts again (OpenSEO `inspect_urls`,
free) and note which ones are indexed. A post that stays "Discovered - currently
not indexed" for more than a week needs more internal links or an outside link.

- [x] 21 Nov 2026: re-checked all 30 sitemap URLs (see above).
- [ ] About 2 days after the next batch: re-check the 15 URLs above.

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
