# Internal links report

Run: 2026-11-12 | Sources edited: 20 blog posts | In-text links added: 20 | Anchors to `/voorbeelden` rewritten: 6

Method: the `internal-linking` skill, adapted. Graph: `node scripts/internal-link-graph.mjs > seo/internal-link-graph.json`
(before: `seo/internal-link-graph.before.json`, from commit `028b380`). Components
(footer, `SiteLinks`, the "Lees ook" block) count as sitewide, not contextual.

| Target | Contextual pages before | After | Pages with a link in the upper 40% of the post | Anchors |
| --- | --- | --- | --- | --- |
| `/` (poem form) | 23 | 23 | 0 → 20 | 20 distinct in-text anchors, plus the closing link of each post |
| `/voorbeelden` | 16 | 16 | unchanged | "voorbeeldgedichten" 9× → 3×; the others are now distinct |
| `/lootjes` | 10 | 9 | 2 | the link in the rijmwoorden post was off-topic and is gone (refresh plan) |

Why the counts did not change: every post already linked to `/` from its closing
block at 90–98% of the text. The gap was position, not count: the new link sits
at 8–37% of each post, where readers who leave halfway still see it.

- In-text links carry `data-cta="blog:<slug>:tekst"`; the closing block keeps
  `data-cta="blog:<slug>"`. The dashboard shows them as separate rows under
  "Go to poem form", so the two places can be compared.
- Remaining orphans: none (`orphanMoneyPages: []`).
- Prefilled form (step 3 of the skill): the six style posts link to
  `/?stijl=<stijl>#poem-form`, which opens the form with that style chosen.
- Posts with only 1 contextual inbound link (ironisch, kort, ouderwets, pikant)
  get more links through "Lees ook"; they are not money pages.
