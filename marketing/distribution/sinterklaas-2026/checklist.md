# Distribution checklist: Sinterklaas 2026

Made with the `parasite-and-pr` skill on 13 November 2026. Nothing here is
published or sent. The owner reviews and publishes every file.

## Before anything goes out

- [ ] Fill in `[PLAATS]` in `press-release.md` (the dateline city).
- [ ] Approve or rewrite the quote marked `[APPROVE QUOTE]`, then delete the marker.
- [ ] `devto-post.md`: decide `[CHOICE]` (name the model or not; the site does not), then delete the marker.
- [ ] `linkedin-article.md`: keep the disclosure line at the top (the article ranks SintGPT itself), delete `[KEEP THIS DISCLOSURE]`.
- [ ] Re-check the prices and facts against the live site on the day you publish (`utils/pricingTiers.ts`, `/voorwaarden`).
- [ ] Contact: `patrick@sintgpt.com` (owner's choice, 13 Nov 2026). A press release is copied to many news sites and cannot be retracted; this address is already public on the site.

## Publish order

1. **Press release (Dutch), first, from about 17 November.** Dutch media write about Sinterklaas poems from late November to 5 December. Send it as a tip, not to a mass list:
   - Outlets that covered AI and Sinterklaas poems before (from a search on 12 Nov 2026):
     - NOS: https://nos.nl/l/2547057 ("ChatGPT voor sintgedicht? Daar wordt steeds vaker voor gezwicht")
     - Omroep Brabant: https://www.omroepbrabant.nl/nieuws/4380779/chatgpt-of-rijmwoordenboek-zo-krijg-je-de-beste-sinterklaasgedichten ("ChatGPT of rijmwoordenboek")
     - NH Nieuws: https://www.nhnieuws.nl/nieuws/328524
     - Hart van Nederland: https://www.hartvannederland.nl/tech/ai/artikelen/steeds-meer-nederlanders-rijmen-sinterklaasgedicht-met-ai
     - Radar (AVROTROS): https://radar.avrotros.nl/artikel/meeste-mensen-schrijven-sinterklaasgedicht-zelf-maar-beetje-hulp-kan-geen-kwaad-62189
     - ID.nl, Androidplanet, MAX Vandaag (tips and app round-ups)
   - Use each outlet's own tip form or the editor of the earlier article. One personal email per outlet beats a list.
   - A paid Dutch wire (for example ANP Persberichtendienst) spreads the release further. Check the price and the required fields first: if a form requires a phone number or street address, use a business line or a virtual address, never a private one.
2. **LinkedIn article (Dutch), the same week.** Publish on a SintGPT company page or the owner's profile. No `canonical_url`: the goal is a second result next to sintgpt.com for "sinterklaasgedicht maken". Medium is a second host for the same text.
3. **Dev.to article (English), any time.** `published: false` creates a draft on paste; read it on dev.to, then publish. Hashnode can carry the same text with `canonical_url` set to the dev.to URL.

## Rules kept in these drafts

- Every fact comes from the site (`scripts/blogBriefs.ts` SITE_FACTS, `utils/pricingTiers.ts`, the lootjes and privacy pages). No numbers about visitors or sales: there is not enough real data yet.
- No claims about competitors that were not checked on 12–13 Nov 2026: Mick's Rijmwoordenboek and the Van Dale rhyming dictionary are free websites; ChatGPT has a free version. No competitor prices, no quality claims about other products.
- No "ChatGPT cannot rhyme" angle: the ChatGPT poems on the home page were chosen by the owner (ISSUES #23), so they are not evidence.

## Verify after 48–72 hours

- [ ] Search Google for each published URL (`site:linkedin.com sintgpt`, the dev.to URL) to see that it is indexed.
- [ ] Analytics dashboard: page views with referrers linkedin.com, dev.to and news sites; `utm_source` if you add one to the links (for example `?utm_source=linkedin&utm_campaign=pr-2026`).
- [ ] Ask ChatGPT and Perplexity "hoe maak ik snel een sinterklaasgedicht" and note whether they name SintGPT.
