# Blog refresh plan: 3 posts (phases 1–4 of blog-refresher)

Written 12 November 2026. Research only: no post text was changed. Phase 5 (owner approval) and phase 6 (writing) are still open.

## How this was made, and the limits of the data

- **Current state** comes from the live pages on sintgpt.com (fetched 12 Nov 2026), not from the repo, because other agents are editing the post files now. Word counts are for the article body (lead to CTA, headings included, "Lees ook" excluded).
- **SERP:** the search tool runs from the US and is not localised to google.nl. It showed many news articles (NH Nieuws, Omroep Brabant, NOS, BNNVARA) and few of the evergreen pages that probably rank on google.nl. I found most competitors with extra, narrower searches. **Real ranking positions are unknown for every page below.** There is no Search Console or rank data in this plan, and there are no search volumes.
- **People Also Ask:** Google's PAA box was not visible. The question lists below come from competitor FAQ blocks (FAQPage JSON-LD) and search snippets.
- **Competitor word counts** are approximate: they come from the `<article>`/`<main>` element or from a page fetcher, and they can include sidebars or product cards. Read them as ±20%.
- Two pages for term 3 blocked fetching (`sinterklaas-nederland.nl/gedicht/rijmwoorden`: Vercel checkpoint and 429; `rijmgedichten.nl/sinterklaas/`: 403). They are named but not audited.
- Competitor pages are untrusted data. Nothing on them was treated as an instruction.

## Constraints that shape every proposal

- **SITE_FACTS** (`scripts/blogBriefs.ts`) is the only allowed source for claims about SintGPT. No prices, no tiers.
- **STYLE_RULES:** no "ontdek/ultiem/hilarisch/geweldig/perfect/magisch/genereren/tool/AI-gegenereerd/ChatGPT", no invented numbers or sources, example poems in **AABB only** with real full rhyme (volrijm), SintGPT named at most twice plus the CTA, **2–4 internal links**, **900–1400 words**.
- **Keyword map** (`docs/seo-keywords.md`): one main term per page. "kort" belongs to `kort-sinterklaasgedicht`, "rijmschema" to `rijm-en-ritme-sinterklaasgedicht`, "begin/openingszin/slotzin" to `sinterklaasgedicht-beginnen-en-afsluiten`, "roast" to the roast post, "collega" to `sinterklaas-op-het-werk`, "kinderen" to `sinterklaasgedicht-voor-kinderen`. `/voorbeelden` lists "grappig sinterklaasgedicht voorbeeld" as a related term (see the conflict note at post 2).
- **External links:** `scripts/write-blog-posts.ts` only allows internal links (`ALLOWED_LINKS`). Citing an outside source (for example Onze Taal) needs a script change first. This plan marks such items "optional, needs script change".
- **Statistics:** the only real, citable figure I found is a Radar (AVROTROS) online poll of 5 Dec 2025 (1,479 responses: 45% write the poem fully themselves, 21% use a rhyming dictionary or family, 17% ask AI for help, 12% let AI write it, 5% write no poem). It is a non-representative online poll about AI use, and the house style bans naming AI companies. **Recommendation: skip statistics** in all three posts.
- **FAQ schema:** since 2023 Google shows FAQ rich results only for a small set of government and health sites, so a FAQPage block will probably not change how the result looks. A visible FAQ still answers the questions people ask. Adding FAQPage JSON-LD would need a change in `components/BlogPost.vue`; treat it as optional.
- **Word count:** two of the three proposals go above the 1,400-word cap in STYLE_RULES. The owner must allow that per post, or the outline must be cut.

---

# Post 1: Sinterklaasgedicht schrijven

## 1. Existing post analysis

| Item | Value |
|---|---|
| URL | `/blog/hoe-schrijf-je-het-perfecte-sinterklaasgedicht` |
| Main term | sinterklaasgedicht schrijven |
| Title tag | "Sinterklaasgedicht schrijven: tips en stappen \| SintGPT" (55 chars) |
| H1 | "Sinterklaasgedicht schrijven: handig stappenplan en tips" |
| Meta description | "Sinterklaasgedicht schrijven in stappen: tips voor rijm, ritme en het cadeau, met een compleet voorbeeldgedicht om meteen te beginnen." |
| Dates | 17 Nov 2025, "bijgewerkt 10 november 2026" (visible) |
| Word count | ~1,010 |
| Structure | 7 H2, 3 H3 (one is the CTA), 5 bullet lists, 1 example poem (12 lines AABB), no table, no FAQ |
| Internal links | 5 in body + CTA: `/blog/rijm-en-ritme-sinterklaasgedicht`, `/blog/sinterklaasgedicht-stijlen`, `/blog/rijmwoorden-sinterklaas`, `/blog/sinterklaasgedicht-beginnen-en-afsluiten`, `/voorbeelden`, `/` (CTA). That is one more than the 2–4 rule allows. |
| External links | none |
| Schema | Article, BreadcrumbList |

H2s now:
1. Sinterklaasgedicht schrijven: begin bij de voorbereiding (H3: Maak een kort lijstje met feiten)
2. Kies het juiste rijmschema en de toon
3. Het cadeau verwerken: direct noemen of geheim houden (H3: Zoek handige rijmwoorden)
4. Let op het ritme en de opbouw van je regels
5. Voorbeeld van een persoonlijk sinterklaasgedicht
6. Veelgemaakte valkuilen bij het dichten
7. Het gedicht afronden en voordragen (H3: Snel een sinterklaasgedicht laten schrijven? = CTA)

**Strengths**
- Logical order from preparation to reading aloud. Main term in title, H1, lead and first H2.
- Concrete prompts for collecting facts (hobby, big event, blunder, why this gift).
- Clear "direct noemen vs. geheim houden" choice for the gift.
- Pitfalls and reading-aloud tips are practical (print large, strophes of four).
- Correct, checked AABB example poem with concrete details.

**Weaknesses**
- The H1 promises a "stappenplan", but there is no numbered list of steps. A snippet-ready answer near the top is missing.
- No explicit **opbouw** (opening → what the Sint saw → teasing middle → gift → closing line). Competitors show this arc.
- The example poem breaks the post's own rule "rijmende regels ongeveer even lang": line 5 ("Als hij weer thuiskomt trekt hij snel zijn schortje aan") is much longer than line 6, and line 3 stumbles when read aloud.
- No help for "ik loop vast" beyond one link to the rhyme list.
- No FAQ. Questions like "moet het rijmen?", "hoe lang?", "hoe onderteken je?" go unanswered.
- The rijmschema H2 explains four schemes in detail. That term belongs to `rijm-en-ritme-sinterklaasgedicht`; a short version plus a link is enough.

**Quick wins**
1. Add a numbered 7-step list under the lead (featured-snippet format).
2. Smooth lines 3 and 5 of the Bram poem (or write a new example), keeping AABB and volrijm.
3. Cut the rijmschema list to two sentences and a link; spend the words on opbouw.
4. Drop one internal link to meet the 2–4 rule (for example the `/blog/sinterklaasgedicht-stijlen` link, which is also in "Lees ook" of related posts).

## 2. Competitors (term: "sinterklaasgedicht schrijven")

Positions unknown for all.

| # | URL | Words (approx.) | H2s | Unique elements | Last modified |
|---|---|---|---|---|---|
| 1 | schrijfvis.nl/sinterklaasgedicht-schrijven/ | ~1,500–1,900 | 7 numbered steps as H2: "Begin met een provocerende zin", "Bedenk eerst rijmwoorden…", "Laat rijmwoorden je inspireren…", "Kies een richting", "Denk vooruit…", "Geef jezelf de ruimte om van onderwerp te veranderen", "Eindig met de beste grap of je cadeau"; "Kijk de live-demonstratie op YouTube" | Contrarian "rhyme first" method built live on one poem; YouTube demo; author page; comments | 1 Dec 2021 |
| 2 | giftpal.app/nl/sinterklaasgedicht | ~1,900 editorial (plus product cards) | Maak je gedicht; Waar moet een sinterklaasgedicht over gaan?; Hoe bouw je het gedicht op?; Hoe rijm je zonder gewrongen zinnen?; Hoe ziet dat er in de praktijk uit?; Grappige sinterklaasgedichten om mee te beginnen; Mag je een AI je gedicht laten schrijven?; Wat vul je in…; Welk rijmschema gebruikt de generator?; Veelgestelde vragen | Generator form; 4-part structure (arrival, what Sint saw, one teasing line, gift); worked example; 3 fill-in templates; 10-question FAQ (FAQPage); affiliate products | 12 Oct 2026 |
| 3 | familieapp.eu/blog/sinterklaasgedicht-maken/ | ~1,700 | Samenvatting in het kort; Wat is een sinterklaasgedicht?; Hoe schrijf je … in tien minuten?; Wat is de opbouw…?; Welk rijmschema…? (H3 Gedichtenbouwer: 8 regels); … met kinderen, per leeftijd; Plagen: wat werkt en wat niet?; Een gedicht voor iemand die je niet goed kent; Hoe lang…?; Wat doe je als het rijmen niet lukt?; Conclusie; Veelgestelde vragen | Summary box; **table** "step / time / what you do" (10 minutes); 8-line builder; 8-question FAQ (FAQPage) | 26 Sep 2026 |
| 4 | rijmwoordenboek.vandale.nl/blog/rijmen-voor-sinterklaas-tips-en-trucs | ~1,200 | Belangrijkste punten; Inhoudsopgave; Voorbereiding; Rijmen en Structuur; Hoe rijm je op Sinterklaas?; Populaire Sinterklaas rijmwoorden; Tips en Hulpmiddelen; Rijmen op Sinterklaas namen; Gebruik het rijmwoordenboek slim | Key-takeaways box; table of contents; "16 tot 20 regels"; generators vs. writing yourself; links into its rhyme dictionary | 1 Dec 2025 |
| 5 | bnnvara.nl/artikelen/hoe-schrijf-je-een-goed-sinterklaasgedicht | ~1,100 | none (interview Q&A) | Poet Ingmar Heytze "interviews" Sinterklaas; length ≤ ~20 lines, ~10 syllables per line, rhythm over rhyme, "kermisrijm" warning | 1 Dec 2019 |

Also seen, not in the top 5 audit: schrijvenonline.org (5 tips with examples, ~800 words), rijmwoordenboek.nl/tips (Mick's 5-step plan, ABCB tip), onzetaal.nl "Het geheim van sinterklaasrijm" (Nov 2021, authoritative), gld.nl, cadeaukaart.nl.

**Questions people ask** (from competitor FAQs): Moet een sinterklaasgedicht rijmen? · Hoe lang moet een sinterklaasgedicht zijn? · Hoe begin ik een sinterklaasgedicht? · Hoe hint ik naar het cadeau zonder het te verraden? · Wat doe ik als ik niets grappigs kan bedenken? · Wanneer begin ik het best aan de gedichten? · Hoe onderteken je een sinterklaasgedicht? · Wat schrijf je voor iemand die je nauwelijks kent? · Hoe plaag je zonder te kwetsen?

## 3. Gap analysis

| Element | Our post | C1 Schrijfvis | C2 GiftPal | C3 FamilieApp | C4 Van Dale | C5 BNNVARA | Priority |
|---|---|---|---|---|---|---|---|
| Word count | ~1,010 | ~1,700 | ~1,900 | ~1,700 | ~1,200 | ~1,100 | – |
| Snippet format (numbered steps near top) | no (H2 prose) | yes (7 steps) | partial (4 parts) | yes (table) | yes (H3 steps) | no | **High** |
| Opbouw / arc of the poem | partial | yes | yes | yes | partial | no | **High** |
| Collect facts first | yes | no (rhyme first) | yes | yes | yes | partial | have |
| Gift: name it or hint | yes | yes (end) | yes | yes (FAQ) | yes | no | have |
| Length guidance | yes | no | yes | yes | yes (16–20) | yes (≤20) | have |
| Rhythm / equal lines | yes | partial | yes | partial | partial | yes | have |
| "Stuck? turn the line, other end word" | link only | yes | yes | yes | yes | no | **High** |
| Full example poem | yes (12 lines) | yes (built live) | yes | yes (8 lines) | no | no | have, fix rhythm |
| Clichés / kermisrijm | yes | no | yes | partial | no | yes | have |
| Reading aloud | yes | no | partial | no | partial | yes | have |
| Time-boxed / quick method | no | yes ("supersnel") | partial | yes (10 min table) | no | no | Medium |
| Must it rhyme? | no | no | FAQ | FAQ | no | partial (rhythm > rhyme) | Medium |
| Teasing limits | partial (pitfall) | no | FAQ | yes | partial (humor) | no | Medium |
| Someone you hardly know | no | no | FAQ | yes | no | no | Medium (link out) |
| Signing (Sint en Piet) | no | no | FAQ | no | no | partial | Low |
| Writing with kids per age | no | no | no | yes | no | no | Low (other post) |
| Video | no | yes | no | no | no | no | Low (skip) |
| FAQ section | no | no | yes (10) | yes (8) | no | no | Medium |
| Statistics / data | no | no | no | no | no | no | skip |
| Schema | Article, Breadcrumb | Article | Article, FAQPage, Product | BlogPosting, FAQPage | BlogPosting, Speakable | NewsArticle | Low |

**Missing topics by priority**
- **High (4+):** numbered step list near the top; the opbouw of a poem (opening, middle, gift, closing line); "loop je vast" tactics in the post itself.
- **Medium (2–3):** a quick method for little time; FAQ (rijmen verplicht?, hoe lang?, cadeau verraden?, niets grappigs?); teasing limits; a line on someone you hardly know (link to `sinterklaas-op-het-werk`).
- **Low (1):** signing the poem ("Sint en Piet"); per-age advice for kids (link to `sinterklaasgedicht-voor-kinderen`); video demo (skip).
- **Emerging (nobody does it well):**
  - A worked example **from weetje to couplet**: one fact → a plain sentence → a rhyme pair → the polished couplet. Schrijfvis builds a poem live, but on a "rhyme first" method; nobody shows the "content first" path step by step.
  - A **before/after** of a weak line (stoplap) made concrete.
  - A short **checklist** to read before printing (rhythm, gift hidden, names right, one warm line).

**Competitor angles:** Schrijfvis = contrarian method by a writing coach; GiftPal = generator + gift shop; FamilieApp = speed (10 minutes) and family logistics; Van Dale = rhyme dictionary authority; BNNVARA = a poet's voice.
**Our opportunity:** the clearest content-first method, with a worked example that rhymes and scans correctly (several competitor examples do not), and short links to the deeper posts (begin, rijmwoorden, rijm en ritme).

## 4. Refresh strategy

**Immediate**
- Add the numbered step list under the lead.
- Fix or replace the example poem (AABB, volrijm, even line lengths).
- Add an "opbouw" section and a "loop je vast" section.

**Structure**
- Shorten the rijmschema part; link to `rijm-en-ritme-sinterklaasgedicht` with anchor "rijmschema voor je sinterklaasgedicht".
- Add a 5-question FAQ from the list above (answers 2–3 sentences; answers on begin/lengte link to their own posts).

**Optimization**
- Target **1,400–1,600 words** (needs owner OK above the 1,400 cap; otherwise cut the FAQ to 3 questions).
- Internal links (max 4 + CTA): `/blog/sinterklaasgedicht-beginnen-en-afsluiten`, `/blog/rijmwoorden-sinterklaas`, `/blog/rijm-en-ritme-sinterklaasgedicht`, `/voorbeelden`.
- Optional, needs script change: one external citation to Onze Taal ("Het geheim van sinterklaasrijm") for the "zin omdraaien" tip.
- Keep the URL (the slug contains "perfecte"; it never changes).

**Proposed H2 outline**

| # | H2 | Status | What changes |
|---|---|---|---|
| – | Lead + numbered list "In 7 stappen" | **New** | Snippet answer: 1 weetjes verzamelen, 2 toon kiezen, 3 cadeau: noemen of hinten, 4 opbouw schetsen, 5 per weetje een rijmpaar, 6 ritme gelijk trekken, 7 hardop lezen en printen |
| 1 | Sinterklaasgedicht schrijven: begin bij de voorbereiding | Keep | Keep the question list and "drie tot vijf feiten" |
| 2 | Kies de toon (en houd het rijmschema simpel) | Modified | Tone first; rhyme scheme cut to 2 sentences + link |
| 3 | De opbouw van een sinterklaasgedicht | **New** | Opening (Sint's voice) → what the Sint saw this year → teasing middle → gift hint → warm closing line; one line on the slotzin links to the begin/afsluiten post |
| 4 | Het cadeau verwerken: direct noemen of geheim houden | Keep | Add one AABB hint couplet |
| 5 | Van weetje tot couplet: zo schrijf je een rijmpaar | **New** | Worked example: fact → plain sentence → end word → rhyme pair; plus one before/after stoplap line |
| 6 | Let op het ritme en de lengte | Modified | Merge rhythm + length; keep the 8–12 / 12–20 lines guidance |
| 7 | Voorbeeld van een persoonlijk sinterklaasgedicht | Modified | Fixed Bram poem or a new one, AABB, even lines |
| 8 | Loop je vast? Zo kom je verder | **New** | Turn the line around, pick another end word, synonym, drop the weetje; link to rijmwoorden |
| 9 | Veelgemaakte valkuilen bij het dichten | Keep | Keep; add "het cadeau te vroeg verraden" |
| 10 | Het gedicht afronden en voordragen | Keep | Add the pre-print checklist and signing ("Sint en Piet") |
| 11 | Veelgestelde vragen over een sinterklaasgedicht schrijven | **New** | 4–5 questions from the list above |
| – | CTA block | Keep | Unchanged |

**3 title options** (title tag incl. " | SintGPT")
1. "Sinterklaasgedicht schrijven in 7 stappen | SintGPT" (51) – snippet-focused; only if the list really has 7 steps.
2. "Sinterklaasgedicht schrijven: stappen en voorbeeld | SintGPT" (60) – close to the current one, adds the example.
3. "Sinterklaasgedicht schrijven: van weetje tot slot | SintGPT" (59) – differentiated, matches the new worked example.

**Approval question:** Do you agree to add the step list, the opbouw section, the worked "van weetje tot couplet" example and a 5-question FAQ, at about 1,400–1,600 words (above the 1,400 cap)? Or should we stay at 1,400 and drop the FAQ?

---

# Post 2: Grappig sinterklaasgedicht

## 1. Existing post analysis

| Item | Value |
|---|---|
| URL | `/blog/grappige-sinterklaasgedichten-tips` |
| Main term | grappig sinterklaasgedicht |
| Title tag | "Grappig sinterklaasgedicht: tips en voorbeelden \| SintGPT" (57 chars) |
| H1 | "Hoe schrijf je een grappig sinterklaasgedicht?" |
| Meta description | "Leer hoe je een grappig sinterklaasgedicht schrijft. Met technieken voor humor, rijm, de limerick en een compleet voorbeeldgedicht voor pakjesavond." |
| Dates | 17 Nov 2025, "bijgewerkt 10 november 2026" |
| Word count | ~1,290 |
| Structure | 7 H2, 9 H3 (6 numbered techniques), 4 bullet lists, 1 full poem (16 lines AABB), 3 short fragments, no table, no FAQ |
| Internal links | `/blog/roast-sinterklaasgedicht-zonder-te-kwetsen`, `/blog/sinterklaasgedicht-stijlen`, `/blog/rijm-en-ritme-sinterklaasgedicht`, `/voorbeelden`, `/` (CTA) – 4 + CTA |
| Schema | Article, BreadcrumbList |

H2s now: Hoe werkt humor in een grappig sinterklaasgedicht? · Zes technieken voor een grappig gedicht (H3 1–6: woordspelingen, liefdevolle overdrijving, herkenbare blunders, zelfspot en plagen, de limerick, onverwachte wending) · Voorbeeld van een grappig sinterklaasgedicht · Rijm en ritme als motor voor de lach · Valkuilen bij humor op pakjesavond · Stappenplan voor je eigen grappige sinterklaasgedicht · (CTA H3)

**Strengths**
- The six named techniques are the deepest "how" on the SERP; most competitors only list poems.
- The Thomas poem rhymes cleanly, has a story arc and a warm close.
- Clear limits on taste (no jokes about looks, weight, illness, money) and the audience in the room.

**Weaknesses**
- **House-rule breach:** the limerick example is AABBA. The owner's rule says example poems use AABB only.
- The "woordspelingen" examples are prose and weak: "met jouw groene vingers zaai je vooral overal twijfel" is not a real double meaning. No rhymed pun example.
- The "onverwachte wending" example says it points to the gift, but the couplet does not mention or hint at a gift.
- Only one full poem and three fragments. The SERP for this term (in this search) leans to **collections of funny poems** and per-type examples; the post serves the "how" intent only.
- No "kinderen vs. volwassenen" guidance (the audience changes what is funny).
- No FAQ, no ready-to-use funny couplets per recipient type.
- No technique for **timing when reading aloud** (pause before the punch line), although the post says timing matters.

**Quick wins**
1. Replace the limerick example: describe the limerick in two sentences without an example, or show its "punch in the last line" idea in an AABB couplet.
2. Rewrite the three pun examples as rhymed AABB couplets with a real double meaning.
3. Fix the "wending" couplet so its last line turns to the gift.
4. Add a block of 6–8 funny AABB couplets per recipient type (see conflict note).

**Keyword conflict note:** the brief for this post lists "grappig sinterklaasgedicht voorbeeld" as secondary, and `docs/seo-keywords.md` lists the same phrase as a related term of `/voorbeelden`. Proposal: this post shows **coupletten** (4 lines, per type of person) and links to `/voorbeelden` for complete poems. Do not frame the block as "korte gedichten" (that is `kort-sinterklaasgedicht`).

## 2. Competitors (term: "grappig sinterklaasgedicht")

Positions unknown for all.

| # | URL | Words (approx.) | H2s | Unique elements | Last modified |
|---|---|---|---|---|---|
| 1 | gedachten-gedichten.nl/sinterklaas/grappig/ | ~1,450 | One H2 per poem (~15): "Als het paard van Sint moet rusten", "Sint gedichtje voor een zwangere", "… voor een sporter", "Mislukt sinterklaas gedichtje", "De slechte dichter", "Piet uit zijn dichtelement", "De fietsende Sint", …; "Staat het er niet tussen?" | Pure collection; reader submissions; several "deliberately bad poet" jokes; CollectionPage/ItemList schema | not shown |
| 2 | gedichtgpt.nl/grappig-sinterklaasgedicht-maken/ | ~1,900 | Maak je grappige sinterklaasgedicht; Voorbeelden…; 12 grappige sinterklaasgedichten om over te nemen; Hoe maak je een grappig sinterklaasgedicht zonder gemeen te worden?; Grappig voor kinderen versus grappig voor volwassenen; Zo maak je een beter resultaat; Veelgestelde vragen | Generator (direct competitor); 12 examples (many do not rhyme); kids vs. adults; 9-question FAQ (FAQPage, HowTo) | not shown |
| 3 | minipret.nl/ouders/grappige-sinterklaasgedichten-voor-kinderen | ~1,400 | Wat kinderen écht grappig vinden; 5 voorbeelden voor kleuters (4–6); 5 voor de middenbouw (7–9); 5 voor oudere kinderen (10–12); Wat je beter niet doet | 15 poems by age; humor theory for kids (overdrijving, herhaling, verrassing) | 12 Nov 2026 (modified) |
| 4 | sinterklaasfan.nl/grappige-sinterklaasgedichten.html | ~1,000 | Voorbeelden (H3: koffieverslaafde collega, eeuwige online shopper, sporter met smoesjes, telefoonverslaafde tiener); Tips om humor in je rijm te verwerken; Wat kun je beter wel en niet doen?; Laatste schrijftips van de Sint | Per-type examples; do/don't lists | not shown |
| 5 | yoursurprise.nl/blog/kerst/sinterklaas-gedicht | ~1,200 | 10x een kort Sinterklaas gedicht…; Grappig Sinterklaas gedicht…; Grappige Sinterklaas zinnen voor je gedichten; Tips… | List of "grappige zinnen" (couplets per habit; several do not rhyme); shop blog | 21 Oct 2024 |

Also seen: cadeaukaart.nl/blog/sinterklaas-gedichten/ (grappig, kort, 6 and 10 lines), radbag.nl (2022, one-liners), sinterklaas.nl/gedichtenhulp/voorbeelden/ (large collection).

**Questions people ask** (gedichtgpt FAQ and snippets): Hoe maak ik een grappig sinterklaasgedicht zonder gemeen te worden? · Wat is een goed onderwerp voor een grappig sinterklaasgedicht? · Mag een grappig sinterklaasgedicht ook kort zijn? · Wat zijn grappige zinnen in een sinterklaasgedicht? · Wat zijn grappige rijmen over Sinterklaas? · Zijn er grappige sinterklaasgedichten voor volwassenen? · Hoe maak ik een grappig sinterklaasgedicht voor kinderen?

## 3. Gap analysis

| Element | Our post | C1 Gedachten-gedichten | C2 GedichtGPT | C3 Minipret | C4 Sinterklaasfan | C5 YourSurprise | Priority |
|---|---|---|---|---|---|---|---|
| Word count | ~1,290 | ~1,450 | ~1,900 | ~1,400 | ~1,000 | ~1,200 | – |
| Dominant format | how-to | collection | generator + examples | collection by age | examples + tips | examples + lines | – |
| Number of example poems/couplets | 1 full + 3 fragments | ~15 | 12 | 15 | 4 | ~10 + lines | **High** |
| Per-recipient-type examples (te laat, koffie, telefoon, sport) | no | partial | yes | partial (kids) | yes | yes | **High** |
| Humor techniques explained | yes (6) | no | partial | yes (3) | partial | no | have (differentiator) |
| What to avoid | yes | no | yes | yes | yes | partial | have |
| Kids vs. adults | no | no | yes | yes | partial (tiener) | no | Medium |
| Ready "grappige zinnen" / one-liners | no | no | FAQ | no | no | yes | Medium |
| Repetition as technique | no | no | no | yes | no | no | Low |
| "Bad poet" self-mockery (Sint can't rhyme) | no | yes (3 poems) | no | no | no | no | Low |
| Reading-aloud timing (pause before punch) | partial | no | no | no | partial | no | Emerging |
| Rhymes and rhythm correct in examples | yes | mixed | often no | mixed | mixed | often no | have (differentiator) |
| FAQ section | no | no | yes (9) | no | no | no | Low |
| Generator on page | CTA | no | yes | no | no | no | Low |
| Reader submissions | no | yes | no | no | no | no | skip |
| Statistics | no | no | no | no | no | no | skip |
| Schema | Article, Breadcrumb | CollectionPage | FAQPage, HowTo | Article | none | BlogPosting | Low |

**Missing topics by priority**
- **High (4+):** more examples; per-recipient-type couplets (de laatkomer, de koffiedrinker, de telefoonverslaafde, de sporter met smoesjes, de klusser, de thuiswerker – made-up people, AABB).
- **Medium (2–3):** grappig voor kinderen vs. volwassenen (short, link to `sinterklaasgedicht-voor-kinderen`); a handful of funny one-line ideas or opening lines (careful: openingszin belongs to the begin post; keep them as "grappige regels", not openings).
- **Low (1):** repetition as a technique; the "Sint kan niet rijmen" joke; FAQ.
- **Emerging:**
  - **Before/after**: a flat line rewritten into a funny one (overdrijving or wending), so the reader sees the technique work.
  - **Timing when reading aloud**: where to pause, which word to stress, why the punch belongs on the rhyme word.
  - Correct rhyme and rhythm in every example – a real quality gap in competitor examples.

**Competitor angles:** collections (1, 3), a generator with a FAQ (2), per-type examples (4), a shop blog with quick lines (5).
**Our opportunity:** the only page that teaches *why* a line is funny and then shows it in clean, rhyming couplets. Adding a per-type couplet block serves the "examples" intent without turning the post into a collection.

## 4. Refresh strategy

**Immediate**
- Remove the AABBA limerick example (house rule); fix the pun and "wending" examples.
- Add the per-type couplet block high in the post (after the techniques, or right after the lead with a jump link).

**Structure**
- Add "grappig voor kinderen en voor volwassenen" as one short H2.
- Add an H3 under rijm en ritme: "Timing: zo valt de grap op het rijmwoord".
- Add a 4-question FAQ (zonder gemeen te worden, goed onderwerp, voor volwassenen, voor kinderen).

**Optimization**
- Target **1,500–1,700 words** (most new words are couplets; needs owner OK above the cap).
- Internal links (max 4 + CTA): `/blog/roast-sinterklaasgedicht-zonder-te-kwetsen`, `/blog/sinterklaasgedicht-voor-kinderen`, `/blog/rijm-en-ritme-sinterklaasgedicht`, `/voorbeelden`. Drop the `/blog/sinterklaasgedicht-stijlen` link from the body (it stays reachable via "Lees ook" of other posts).
- Optional: mention the style Grappig once as SITE_FACTS describes it ("speels en luchtig"), inside the existing max of two mentions.

**Proposed H2 outline**

| # | H2 | Status | What changes |
|---|---|---|---|
| 1 | Hoe werkt humor in een grappig sinterklaasgedicht? | Keep | Tighten; keep herkenning + publiek |
| 2 | Zes technieken voor een grappig gedicht | Modified | Pun examples rewritten as rhymed AABB couplets with a real double meaning; limerick H3 replaced by **"Herhaling"** (or limerick described without an AABBA example); "wending" couplet ends on the gift; each technique gets one before/after line |
| 3 | Grappige coupletten per type ontvanger | **New** | 6–8 AABB couplets (4 lines) for made-up types: laatkomer, koffiedrinker, telefoon, sporter met smoesjes, klusser, thuiswerker, chaoot, langslaper |
| 4 | Voorbeeld van een grappig sinterklaasgedicht | Keep | Thomas poem stays |
| 5 | Grappig voor kinderen en voor volwassenen | **New** | Kids: overdrijving, herhaling, verrassing, never mock the child; adults: the year's blunder, self-mockery; link to the kids post |
| 6 | Rijm en ritme als motor voor de lach | Modified | Add H3 "Timing: zo valt de grap op het rijmwoord" (pause, stress the rhyme word); keep "lees hardop" |
| 7 | Valkuilen bij humor op pakjesavond | Keep | Add "de grap uitleggen" and "één grap te veel over hetzelfde" stays |
| 8 | Stappenplan voor je eigen grappige sinterklaasgedicht | Keep | Unchanged |
| 9 | Veelgestelde vragen over een grappig sinterklaasgedicht | **New** | 4 questions from the list above |
| – | CTA block | Keep | Unchanged |

**3 title options**
1. "Grappig sinterklaasgedicht: 6 trucs en voorbeelden | SintGPT" (60) – number + examples.
2. "Hoe schrijf je een grappig sinterklaasgedicht? | SintGPT" (56) – matches the H1 and the question form.
3. "Grappig sinterklaasgedicht: coupletten per type | SintGPT" (57) – differentiated, matches the new block.

**Approval question:** Do you agree to remove the limerick example, add 6–8 funny AABB couplets per recipient type, a kids-vs-adults section, a timing tip and a 4-question FAQ, at about 1,500–1,700 words? And is it fine that this post shows couplets while `/voorbeelden` keeps the complete poems?

---

# Post 3: Rijmwoorden sinterklaas

## 1. Existing post analysis

| Item | Value |
|---|---|
| URL | `/blog/rijmwoorden-sinterklaas` |
| Main term | rijmwoorden sinterklaas |
| Title tag | "Rijmwoorden sinterklaas: complete lijst en tips \| SintGPT" (57 chars) |
| H1 | "Rijmwoorden voor Sinterklaas: handige rijmwoordenlijst en tips" |
| Meta description | "Zoek je rijmwoorden voor Sinterklaas? Bekijk de complete lijst per woord, leer hoe zuiver rijm werkt en voorkom stoplappen in je gedicht." |
| Dates | 10 Nov 2026 (no "bijgewerkt") |
| Word count | ~1,190 |
| Structure | 7 H2, 6 H3, ~22 head words with rhyme lists, 4 example couplets (AABB), no table, no FAQ |
| Internal links | `/voorbeelden`, `/lootjes`, `/` (CTA). **No link to any other blog post in the body.** |
| Schema | Article, BreadcrumbList |

H2s now: Rijmwoorden voor Sinterklaas, Sint en Piet (H3 Wat rijmt op Sinterklaas en Sint? / Wat rijmt op Piet en zijn attributen?) · Rijmwoorden voor cadeau, pakjes en lekkernijen (H3 Wat rijmt op cadeau? / Rijmen op snoepgoed en presentjes) · Rijmwoorden voor sfeer, winter en het gedicht · Hoe rijm en ritme werken in een sinterklaasgedicht · Wat doe je als een woord niet wil rijmen? (H3 Datums en maanden aan het begin) · Stoplappen vermijden met een vaste dichtmethode · Inspiratie voor verschillende dichtstijlen · (CTA H3)

**Strengths**
- Every listed rhyme is a checked full rhyme by sound. Several competitor dictionaries match on spelling (maakjepuzzel.nl says so on the page) or mix in half-rhyme; one search snippet showed a list with an obvious error. This is the post's main asset.
- Clear explanation of sound vs. spelling, staand and slepend rijm.
- Good "what if a word does not rhyme" section (turn the line, synonym, dates at the start).
- The content-first method against stoplappen.

**Weaknesses**
- The title says "complete lijst", but it covers ~22 words. Common words people end lines on are missing: **jaar, lief, stout/braaf, blij, laat, hint, lootje, speculaas, pepernoten (plural)**, and the name of the recipient.
- Lists miss true full rhymes that competitors list: paard/baard → **kaart, taart, staart, vaart, maart** (final d sounds as t); Spanje → **franje**; Sint → **verzint, hint, kleinkind**.
- No section on **rhyming on a name** (Van Dale and maakjepuzzel cover it; a FAQ question).
- No internal links to `rijm-en-ritme-sinterklaasgedicht`, `sinterklaasgedicht-beginnen-en-afsluiten` or `hoe-schrijf-je-het-perfecte-sinterklaasgedicht`. The `/lootjes` link is off-topic here.
- The last H2 ("Inspiratie voor verschillende dichtstijlen") is a soft lead-in to the CTA, with little value for someone looking for rhymes.
- Lists are long bullet lines; there is no jump list or quick-reference table to scan.
- "Hoe rijm en ritme werken" overlaps the rijmschema post; keep it short and link.

**Quick wins**
1. Add the missing full rhymes to existing lists (paard, Spanje, Sint), after a manual check.
2. Replace the `/lootjes` link with links to the rijm-en-ritme and begin/afsluiten posts.
3. Add a jump list of all head words under the lead.
4. Change "complete lijst" in the title (it over-promises).

## 2. Competitors (term: "rijmwoorden sinterklaas")

Positions unknown for all. Big rhyme dictionaries also compete for this term: **Van Dale Rijmwoordenboek** (rijmwoordenboek.vandale.nl, says it has over a million rhymes, sorted by stress and syllables), **Mick's Rijmwoordenboek** (rijmwoordenboek.nl, since 1999), **rijmwoorden.nl**, and rhymebook.com/nl (claims 188 rhymes for "Sinterklaas"). A blog post cannot beat a search box on volume; it can beat it on checked quality and guidance.

| # | URL | Words (approx.) | H2s | Unique elements | Last modified |
|---|---|---|---|---|---|
| 1 | watrijmtop.nl/sinterklaas/ | ~1,600 | Wat rijmt er op Sinterklaas?; Rijmwoorden per thema (H3 Sint, Piet en de stoomboot / Cadeaus en de surprise / Snoep en lekkers / Het gedicht zelf); Hoe schrijf je een sinterklaasgedicht?; Veelgemaakte fouten; Voorbeelden (4 poems); Rijmschema's; Veelgestelde vragen | Each word links to a full rhyme page (incl. half-rhyme and assonance, e.g. "alle 212 rijmwoorden"); rhyme checker and rhyme-scheme detector; mistakes list ("tel klemtonen, niet lettergrepen", "cadeau verraden"); 4-question FAQ (FAQPage) | not shown |
| 2 | maakjepuzzel.nl/rijmwoordenboek/sinterklaas/ | ~1,700 | Zoek een rijmwoord voor je gedicht; Zo rijm je een sinterklaasgedicht; Wat is een sinterklaasrijm?; Sinterklaas, Piet en het paard; Pakjesavond: schoen, zak en gedicht; Pepernoten, chocola en ander lekkers; Over degene voor wie het gedicht is; Woorden waar weinig op rijmt; Van makkelijk naar lastig: Sint-woorden in cijfers; Voor wie is dit?; Veelgestelde vragen | Live search box (OpenTaal word list, spelling-based, it says so); words about the recipient (jaar, lief, stout, braaf); hard words with workarounds (surprise → expertise, Spanje → oranje/franje); **table** of rhyme counts per word; audience section (lootje, ouders, groep 6–8, collega's); 6-question FAQ (FAQPage, HowTo) | 11 Nov 2026 |
| 3 | rijmwoordenboek.vandale.nl/blog/rijmen-voor-sinterklaas-tips-en-trucs | ~1,200 | (see post 1) incl. Hoe rijm je op Sinterklaas?; Populaire Sinterklaas rijmwoorden; Rijmen op Sinterklaas namen | Brand authority; links into the dictionary; rhyme on names | 1 Dec 2025 |
| 4 | rijmwoordenboek.nl/tips (Mick's) | ~800 (tips page; the site itself is a dictionary) | Stappenplan; Toelichting (Onderwerpen, Korte versjes, Slotcouplet, Samenvoegen, Verfijnen); Overige tips | 5-step plan; "ABCB is good enough" tip; synonym advice; the dictionary is often recommended in news articles | not shown |
| 5 | pinkelotje.nl/rijmwoorden.php (De Rijmpiet) | ~300 per word page | Op zoek naar rijmwoorden? | Small Sinterklaas dictionary (e.g. 4 rhymes for "schoen"); synonym/brand trick ("fiets" → a bike brand) | not shown |

Not audited (blocked): sinterklaas-nederland.nl/gedicht/rijmwoorden, rijmgedichten.nl/sinterklaas/ ("Rijmmachine"). Also authoritative: onzetaal.nl "Het geheim van sinterklaasrijm" (Nov 2021: end on words with many rhymes such as "gehoord/vernomen"; mind the stress in compounds like "stripboek").

**Questions people ask** (competitor FAQs): Wat rijmt er op Sinterklaas? · Wat rijmt op Piet? · Wat rijmt op cadeau? · Wat rijmt op pakjes? · Hoe rijm je op een naam? · Moet een sinterklaasgedicht altijd rijmen? · Hoe lang moet een sinterklaasgedicht zijn? (belongs to post 1)

## 3. Gap analysis

| Element | Our post | C1 Watrijmtop | C2 Maakjepuzzel | C3 Van Dale blog | C4 Mick's | C5 Rijmpiet | Priority |
|---|---|---|---|---|---|---|---|
| Word count | ~1,190 | ~1,600 | ~1,700 | ~1,200 | ~800 | ~300 | – |
| Search box / full dictionary | no | yes | yes | yes (site) | yes (site) | yes | High, but out of scope (see note) |
| Head words with lists | ~22 | ~20 + links | ~25 | few | – | per query | have |
| Words about the recipient (jaar, lief, stout, braaf, blij, laat) | partial (koud/oud) | partial | yes | no | no | no | Medium |
| Hard words + workaround | yes | partial | yes | no | partial | yes (synonym) | have |
| Rhyming on a name | no | no | yes (FAQ) | yes | no | no | Medium |
| Sound not spelling | yes | yes | partial (warns its own list is spelling-based) | yes | no | no | have (differentiator) |
| Stress in compounds (pepernoot, stripboek) | no | partial ("tel klemtonen") | no | yes (stress sorting) | no | no | Medium |
| Example couplets/poems | 4 couplets | 4 poems | no | no | no | 1 couplet | have |
| Common mistakes list | partial | yes | partial | no | yes | no | Medium |
| Rhyme schemes | partial | yes | partial (gepaard rijm) | yes (AABB) | yes (ABCB) | no | link only (other post) |
| Quick-reference table / jump list | no | no | yes (count table) | TOC | no | no | Low |
| Audience section (lootje, klas) | no | no | yes | no | no | no | Low |
| FAQ section | no | yes (4) | yes (6) | no | no | no | Medium |
| Internal links to related posts | none | yes | yes | yes | yes | no | **High** (own fix) |
| Statistics | no | counts per word (own data) | counts per word (own data) | "1 million rhymes" | no | no | skip |
| Schema | Article, Breadcrumb | FAQPage | FAQPage, HowTo, WebApplication | BlogPosting, Speakable | none | none | Low |

**Note on the search box:** 4 of 5 competitors are, or link to, a rhyme dictionary. Building one is a product decision, not a blog refresh. The post should not try to be a dictionary; it should be the checked list plus guidance.

**Missing topics by priority**
- **High:** internal links to the related posts (own weakness, not a competitor count).
- **Medium (2–3):** words about the recipient (jaar, lief, stout, braaf, blij, laat); rhyming on a name; stress in compound words; a short FAQ; a mistakes list.
- **Low (1):** quick-reference table or jump list; audience section; synonym/brand trick (already partly covered by "kies een synoniem").
- **Emerging:**
  - **Rhymes by sound that spelling hides** as a mini-section: paard/kaart, laat/raad, stout/koud, broodje/lootje. Spelling-based tools miss these; it shows why the list is checked.
  - **Ready AABB couplets for the hard words** (cadeau, surprise, pakjesavond, december) that put the hard word inside the line and end on an easy word.
  - **Rhymes for the gift's hint**: Sint/hint/verzint – the rhyme of the main character with the act of hinting is useful and nobody points it out.

**Competitor angles:** dictionaries with counts (1, 2), brand authority (3, 4), a small friendly dictionary (5).
**Our opportunity:** "checked full rhymes only, by sound" plus practical couplets, in one page that a reader can scan in a minute.

## 4. Refresh strategy

**Immediate**
- Extend lists with checked full rhymes; add a new "woorden over de ontvanger" group.
- Replace the `/lootjes` link with `/blog/rijm-en-ritme-sinterklaasgedicht` and `/blog/sinterklaasgedicht-beginnen-en-afsluiten`.
- Add a jump list under the lead.

**Candidate additions** (proposals only: a person must check each pair by sound before use, as `RHYMES` in `scripts/blogBriefs.ts` requires; then add the approved ones to `RHYMES`):
- paard/baard: kaart, taart, staart, vaart, maart, zwaard
- Spanje: franje
- Sint: verzint, hint, kleinkind
- jaar: maar, naar, haar, waar, daar, elkaar, klaar, paar, raar, zwaar
- lief: brief, dief, actief, positief, creatief
- stout (merge with koud): fout, oud, koud, goud, hout, zout, houdt
- blij: hij, jij, mij, wij, zij, vrij, bij, voorbij, rij
- laat: gaat, staat, praat, straat, maat, raad, daad, kwaad
- pepernoten: boten, poten, sloten, genoten, gesloten, vergroten
- speculaas: same group as Sinterklaas
- lootje: bootje, pootje, broodje (check)
- surprise: expertise is about the only one – keep the advice "not at the end of a line"
- Check with the owner: the compound-stress question (PEpernoot, SCHOORsteen, STOOMboot carry main stress on the first part). Onze Taal advises against rhyming on an unstressed part ("stripboek"). Decide whether the post adds a one-line caution or leaves these in the list as they are.

**Structure**
- New H2 "Rijmen op een naam" with the method (find the last stressed vowel, say the name aloud) and 2–3 made-up names with checked rhymes.
- New 4-question FAQ (Sinterklaas, Piet, cadeau, naam). Answers repeat the short list and link to the section.
- Replace "Inspiratie voor verschillende dichtstijlen" with a short "Veelgemaakte rijmfouten" section; keep one line on styles inside it or drop it.

**Optimization**
- Target **1,500–1,800 words** (lists are compact; needs owner OK above the cap).
- Title: drop "complete".
- Internal links (max 4 + CTA): `/blog/rijm-en-ritme-sinterklaasgedicht`, `/blog/sinterklaasgedicht-beginnen-en-afsluiten`, `/blog/hoe-schrijf-je-het-perfecte-sinterklaasgedicht`, `/voorbeelden`.
- Optional, needs script change: cite Onze Taal on stress in compounds.
- Add "bijgewerkt" date when refreshed.

**Proposed H2 outline**

| # | H2 | Status | What changes |
|---|---|---|---|
| – | Lead + jump list of head words | Modified | Jump links to each group |
| 1 | Rijmwoorden voor Sinterklaas, Sint en Piet | Modified | Add verzint, hint, kleinkind (Sint); kaart, taart, staart, vaart, maart (paard/baard); franje (Spanje) |
| 2 | Rijmwoorden voor cadeau, pakjes en lekkernijen | Modified | Add pepernoten, speculaas, lootje |
| 3 | Rijmwoorden over de ontvanger: jaar, lief, stout en blij | **New** | jaar, lief, stout/braaf, blij, laat; one AABB couplet |
| 4 | Rijmwoorden voor sfeer, winter en het gedicht | Keep | Move koud into group 3 or keep with a cross-reference |
| 5 | Rijmen op een naam | **New** | Method + 2–3 made-up names with checked rhymes + one couplet |
| 6 | Rijm op klank: wat de spelling verbergt | Modified (was "Hoe rijm en ritme werken") | Keep sound vs. spelling and staand/slepend; add d/t pairs (paard/kaart, laat/raad); rhythm part cut to one line + link to the rijmschema post |
| 7 | Wat doe je als een woord niet wil rijmen? | Modified | Add ready AABB couplets for cadeau, surprise, pakjesavond, december with the hard word inside the line |
| 8 | Stoplappen vermijden met een vaste dichtmethode | Keep | Unchanged |
| 9 | Veelgemaakte rijmfouten | **New** (replaces "Inspiratie voor verschillende dichtstijlen") | Spelling rhyme, half-rhyme, rhyme on an unstressed part, the same sound four times, twisted word order |
| 10 | Veelgestelde vragen over rijmwoorden voor Sinterklaas | **New** | Wat rijmt op Sinterklaas / Piet / cadeau? Hoe rijm je op een naam? |
| – | CTA block | Keep | Unchanged |

**3 title options**
1. "Rijmwoorden Sinterklaas: lijst met zuiver rijm | SintGPT" (56) – keeps the differentiator (checked rhyme) in the title.
2. "Wat rijmt op Sinterklaas? Rijmwoorden per woord | SintGPT" (57) – question form that matches the FAQ queries.
3. "Rijmwoorden Sinterklaas: lijst per woord + tips | SintGPT" (57) – close to the current title without "complete".

**Approval question:** Do you agree to extend the lists (after a manual rhyme check), add "woorden over de ontvanger", "rijmen op een naam", a mistakes section and a 4-question FAQ, and to swap the `/lootjes` link for two blog links, at about 1,500–1,800 words? And how should the post treat compounds with the stress on the first part (pepernoot, schoorsteen, stoomboot)?

---

## Sources consulted (12 Nov 2026)

Live posts: sintgpt.com/blog/hoe-schrijf-je-het-perfecte-sinterklaasgedicht, /blog/grappige-sinterklaasgedichten-tips, /blog/rijmwoorden-sinterklaas.

Competitors: schrijfvis.nl/sinterklaasgedicht-schrijven/ · giftpal.app/nl/sinterklaasgedicht · familieapp.eu/blog/sinterklaasgedicht-maken/ · rijmwoordenboek.vandale.nl/blog/rijmen-voor-sinterklaas-tips-en-trucs · bnnvara.nl/artikelen/hoe-schrijf-je-een-goed-sinterklaasgedicht · schrijvenonline.org/tips/5-tips-en-tricks-voor-het-schrijven-van-episch-sinterklaasgedicht · gedachten-gedichten.nl/sinterklaas/grappig/ · gedichtgpt.nl/grappig-sinterklaasgedicht-maken/ · minipret.nl/ouders/grappige-sinterklaasgedichten-voor-kinderen · sinterklaasfan.nl/grappige-sinterklaasgedichten.html · yoursurprise.nl/blog/kerst/sinterklaas-gedicht · cadeaukaart.nl/blog/sinterklaas-gedichten/ · radbag.nl/blog/sinterklaas-gedichten-maar-dan-grappig · watrijmtop.nl/sinterklaas/ · maakjepuzzel.nl/rijmwoordenboek/sinterklaas/ · rijmwoordenboek.nl/tips · pinkelotje.nl/rijmwoorden.php?w=schoen · onzetaal.nl/nieuws-en-dossiers/weblog/het-geheim-van-sinterklaasrijm · radar.avrotros.nl/artikel/meeste-mensen-schrijven-sinterklaasgedicht-zelf-maar-beetje-hulp-kan-geen-kwaad-62189
