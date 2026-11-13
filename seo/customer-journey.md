# Customer journey: SintGPT (13 November 2026)

Method: the `customer-journey` skill (5 awareness stages), for a Dutch consumer
product, not B2B SaaS. Prompts are what people type into Google or a chatbot,
in Dutch, as they would type them. Research was light: US-only web search (no
google.nl results, no search volumes), Dutch news coverage of AI and Sinterklaas
poems (NOS, Omroep Brabant, Radar, Hart van Nederland), and our own analytics
(9–12 Nov: 115 page views, 8 poems; too little to rank stages by numbers).

Who: parents, partners, colleagues and students who must bring a poem to
pakjesavond or a lootjes evening at work or school. The season runs from the
intocht (mid November) to 5 December, with a peak in the last days.

Page names below refer to the current site. "Gap" means no page answers it yet.

## 1. Unaware

**Mindset:** Sinterklaas is coming; they think about the evening, the lootjes
and the cadeau, not about the poem yet.

**Prompts:**
- "lootjes trekken sinterklaas online"
- "hoe trekken we lootjes als we niet bij elkaar zijn"
- "surprise ideeën sinterklaas makkelijk"
- "wanneer is pakjesavond 2026"
- "sinterklaas tradities uitleggen aan mijn buitenlandse partner"

**Content strategy:**
- `/lootjes` is the entry for this stage: free, no account, no e-mail. It is
  the page other sites can link to (tip for `honest-link-outreach`).
- `/blog/lootjes-trekken-tips`, `/blog/surprise-maken-ideeen` and
  `/blog/sinterklaas-tradities` already cover this. Each now links to the form
  in its first 40%.
- After a draw on `/lootjes`, the page could say once that the next task is the
  poem, with a link to the form. Check what it says today first.

## 2. Problem-aware

**Mindset:** "I drew my brother-in-law and I have to write a poem. I am not a
poet and I have little time." Stress grows towards 5 December.

**Prompts:**
- "hoe schrijf je een sinterklaasgedicht"
- "sinterklaasgedicht schrijven tips"
- "wat rijmt op sinterklaas"
- "hoe begin je een sinterklaasgedicht"
- "help ik moet een sinterklaasgedicht schrijven en ik kan niet rijmen"

**Content strategy:**
- Covered by `hoe-schrijf-je-het-perfecte-sinterklaasgedicht`,
  `rijmwoorden-sinterklaas`, `sinterklaasgedicht-beginnen-en-afsluiten` and
  `rijm-en-ritme-sinterklaasgedicht` (refreshed and cleaned on 12 Nov).
- Gap: **"sinterklaasgedicht last minute"** (from about 1 December; already in
  `docs/seo-keywords.md` as an idea). A short post: what to do with 1 hour left,
  with the link to the form near the top.
- Gap: recipients people search for and we have no post for:
  **moeder, vader, juf of meester, schoonmoeder, beste vriendin** (ideas list in
  `docs/seo-keywords.md`). Each one a post with AABB examples.

## 3. Solution-aware

**Mindset:** they know tools exist: ChatGPT, a rhyming dictionary, an app, a
website with poems to copy. They compare effort, quality and price.

**Prompts:**
- "sinterklaasgedicht generator"
- "sinterklaasgedicht maken met AI"
- "sinterklaasgedicht chatgpt prompt"
- "gratis sinterklaasgedicht maken"
- "rijmwoordenboek sinterklaas"
- "app voor sinterklaasgedicht"

**Content strategy:**
- The home page carries "sinterklaasgedicht maken", "generator" and "AI" in its
  search meta (allowed by the Persuasion rules).
- `marketing/distribution/sinterklaas-2026/linkedin-article.md` ("4 manieren
  vergeleken") targets this stage on another domain.
- Decision for the owner: people search "sinterklaasgedicht chatgpt prompt".
  `STYLE_RULES` forbid the word ChatGPT in blog posts. A post "Een goede opdracht
  voor een sinterklaasgedicht" could answer the need without naming ChatGPT, or
  the rule could get an exception for this one post.
- AI answers: the lootjes and poem facts in `public/llms.txt` are what chatbots
  quote. Keep it in line with the site.

## 4. Product-aware

**Mindset:** they found SintGPT (search, a shared poem, a sticker, a news item)
and wonder: is it good, is it really free, what does it cost, is it safe?

**Prompts:**
- "sintgpt ervaringen"
- "sintgpt gratis"
- "is sintgpt betrouwbaar"
- "sintgpt prijs"
- "sintgpt roast voorbeeld"

**Content strategy:**
- `/voorbeelden` shows a poem per style next to its input. The six style posts
  now link to the form with that style chosen (`/?stijl=<stijl>#poem-form`).
- The FAQ on the home page and `/voorwaarden` answer price and free use.
- Shared poems (`/g/<id>`) are the strongest proof: a real poem from a friend.
  The analytics show 25 opens and 0 `Shared poem to form` (9–12 Nov). The call to
  action on `/g/<id>` is the first thing to improve for this stage.
- No reviews or ratings until there are real ones (Social proof rule).

## 5. Most aware

**Mindset:** they used SintGPT before (last year, or one free poem this year)
and come back for the next poem, a rewrite, or more people.

**Prompts:**
- "sintgpt"
- "sintgpt.com gedicht herschrijven"
- "sintgpt mijn gedichten terug"
- "sintgpt betaling herstellen"

**Content strategy:**
- "Mijn gedichten" keeps poems on the device; restoring access with a payment ID
  is in the payment window. Both should be easy to find from the home page.
- Hele familie includes next year's pakjesavond. The site keeps no accounts and
  no mailing list, so the reminder must be on the site: the countdown in the
  hero and the "bijgewerkt" posts. (Dodo has buyers' e-mail addresses, but
  mailing them needs consent and a privacy-text change.)
- Search Console → Performance → Queries with "sintgpt" shows how many people
  search the brand. Check from late November.

## What to do first

1. Request indexing for the refreshed posts (S24 in `ISSUES.md`).
2. Improve the call to action on shared poems (`/g/<id>`): stage 4, real traffic, 0 conversions.
3. Write "sinterklaasgedicht last minute" before 1 December, and 2 recipient posts (moeder, juf of meester).
4. Decide on the "opdracht voor een sinterklaasgedicht" post (stage 3).
5. Send the press release (`marketing/distribution/sinterklaas-2026/`).
