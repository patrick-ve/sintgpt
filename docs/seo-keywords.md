# SEO: keyword map

Which search terms each page is for, so two pages do not compete for the same
term. Written on 10 November 2026 from experience with Dutch Sinterklaas
searches, without a keyword tool: there are no search volumes here. Check
Search Console (Performance → Queries) from late November and adjust.

Rules that apply everywhere:
- One main term per page: in the title tag, the h1 or lead, the first h2 and the
  meta description. Related terms appear naturally, never as a list.
- Title tags at most about 60 characters, ending in ` | SintGPT`. Meta
  descriptions 120–155 characters and say what the reader gets.
- Visible text follows the persuasion rules in `CLAUDE.md` ("schrijven", not
  "genereren"; no "tool"; no model names). Only the search meta of the home page
  may use "AI" and "generator", because people search for those words.
- Internal links use descriptive anchor text (the main term of the target page).

## Pages

| Page | Main term | Related terms |
|---|---|---|
| `/` | sinterklaasgedicht maken | sinterklaasgedicht generator, sinterklaasgedicht AI, gratis sinterklaasgedicht, sinterklaasgedicht ChatGPT |
| `/voorbeelden` | sinterklaasgedicht voorbeelden | grappig sinterklaasgedicht voorbeeld; sinterklaasgedicht voor opa, kind, collega, tante, buurman, vriend; sinterklaasgedicht Engels (one h2 per example) |
| `/lootjes` | lootjes trekken online | lootjes trekken Sinterklaas, lootjes trekken zonder e-mail, gratis lootjes trekken |
| `/blog` | tips sinterklaasgedicht | – |

## Blog posts

All posts are written by the default poem model with `scripts/write-blog-posts.ts`
from the briefs in `scripts/blogBriefs.ts`; the brief names the main term.

| Post | Main term |
|---|---|
| `hoe-schrijf-je-het-perfecte-sinterklaasgedicht` | sinterklaasgedicht schrijven |
| `sinterklaasgedicht-beginnen-en-afsluiten` | begin sinterklaasgedicht (openingszin, slotzin) |
| `rijmwoorden-sinterklaas` | rijmwoorden sinterklaas (wat rijmt op Sint, Piet, cadeau) |
| `rijm-en-ritme-sinterklaasgedicht` | rijmschema sinterklaasgedicht |
| `kort-sinterklaasgedicht` | kort sinterklaasgedicht |
| `grappige-sinterklaasgedichten-tips` | grappig sinterklaasgedicht |
| `roast-sinterklaasgedicht-zonder-te-kwetsen` | roast sinterklaasgedicht |
| `sinterklaasgedicht-opa-oma` | sinterklaasgedicht opa en oma |
| `sinterklaasgedicht-partner` | sinterklaasgedicht voor je partner (vriend, vriendin) |
| `sinterklaasgedicht-voor-kinderen` | sinterklaasgedicht voor kinderen |
| `sinterklaas-op-het-werk` | sinterklaasgedicht collega |
| `sinterklaasgedicht-in-het-engels` | sinterklaasgedicht in het Engels |
| `lootjes-trekken-tips` | lootjes trekken (tips and rules; the tool itself is `/lootjes`) |
| `surprise-maken-ideeen` | surprise maken |
| `sinterklaas-tradities` | sinterklaas tradities |

## Ideas for later

- Other recipients: sinterklaasgedicht voor je moeder, vader, juf of meester,
  schoonmoeder, beste vriendin.
- Seasonal: "sinterklaasgedicht last minute" (from 1 December).
- English pages with their own URLs (then `hreflang`, see `CLAUDE.md`).
