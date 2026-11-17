# Gift mail to last season's buyers

Plan of 17 Nov 2026 (see #30 in `ISSUES.md`). Status: part A and the script are
built and tested (17 Nov), not deployed; nothing sent.

## Decisions (owner, 17 Nov 2026)

- **Who:** everyone who bought SintGPT in the 2025 season (old Dodo business
  `bus_Gg5x…`, account patrick@sintgpt.com). Fewer than 50 people.
- **What they get:** Hele familie for free, **this season only** (until the end of
  pakjesavond, 5 Dec 2026). One unique gift URL per buyer.
- **Sharing:** one URL works in at most **3 browsers** (phone, laptop, tablet).
- **Sending:** Cloudflare Email Sending, from a local script.
- **Thank-you poem:** one poem for everyone, written by SintGPT on the live site,
  in the mail as text plus its `/g/<id>` link (the parchment page).
- **Legal risk accepted:** last year the checkout asked for the e-mail address
  "voor factuur" and offered no way to object to marketing mail, so the soft opt-in
  exception of art. 11.7 Telecommunicatiewet most likely does not apply. The owner
  chose to send anyway, with these limits: one mail only, it says why the reader
  gets it, a gift and no sales pitch, an opt-out in the mail and in the
  `List-Unsubscribe` header, no follow-up or reminder mails.

## Facts found

- Gift links today: `/?cadeau=<code>`, codes in the Worker secret `NUXT_GIFT_CODES`
  (`server/utils/giftAccess.ts`). They give Hele familie for 2 seasons (until
  pakjesavond 2027) and work in any number of browsers. A secret holds about 5 KB,
  so about 150 codes; fewer than 50 fit easily.
- Mail for sintgpt.com runs on Dynadot: MX `webhost.dynadot.com`, SPF includes
  Dynadot, DMARC `p=none`. DNS is on Cloudflare.
- Cloudflare Email Sending (checked 17 Nov 2026 in the docs):
  - Beta, **Workers Paid plan only** ($5 a month); 3,000 mails a month included,
    then $0.35 per 1,000. The account is on Workers Free now.
  - New accounts get a small daily quota that grows. At most 50 recipients per mail.
  - Meant for transactional mail: "Send only to recipients who expect the message".
    Marketing is not forbidden in the docs, but it is a grey area. The site runs
    on the same account, so keep this mail small and clean.
  - Onboarding the domain for sending adds its own records on a `cf-bounce`
    subdomain plus DKIM. The Dynadot MX and incoming mail stay as they are.
    (Email Routing for incoming mail would replace the Dynadot MX; not part of
    this plan.)
  - `List-Unsubscribe` with `<mailto:…>` or `<https://…>` is allowed.
    REST: `POST /accounts/{account_id}/email/sending/send` with a Bearer token.
  - `npx wrangler email sending list` gave `Unauthorized [code: 2036]` on 17 Nov:
    not enabled yet, or the login has no Email Sending permission.

## A. Season gift codes (built 17 Nov 2026)

- `NUXT_GIFT_CODES_SEASON` (Worker secret, comma-separated) and `giftSeasonEnd`
  in `nuxt.config.ts` (`2026-12-05`, override with `NUXT_GIFT_SEASON_END`).
  `claimGift` in `server/utils/giftAccess.ts`.
- A season code gives Hele familie until 23:00 UTC on that date. After it, or
  without the date, the claim is refused (`Gift claimed` `expired`, the page says
  the link does not work). Standing codes in `NUXT_GIFT_CODES` work as before.
- 3 browsers per code: `claim-gift.post.ts` counts in the `RATE_LIMITER` Durable
  Object (subject `gift`, `giftClaimRule`, one window until the end date). A
  browser that already holds the same gift is not counted again. The 4th gets
  `full`: "Deze cadeaulink is al in gebruik" (`Gift claimed` `full`).
- The page keeps the utm tags when it removes `cadeau` from the address, and
  says "tot en met pakjesavond" instead of "ook volgend jaar" for a season gift.
- Privacy text: section "Cadeau voor kopers van vorig jaar" (nl and en), and
  "De website krijgt alleen het betalings-ID…" in "Betalen".
- Tests: `tests/unit/paymentAccess.test.ts` (season codes), e2e "gift links".
- Still open: deploy with `/deploy`.

## B. Thank-you poem (owner, on the live site)

Write it in your own browser with access (the `sintgpt-intern` cookie keeps it out
of the analytics). Proposed form input:

- Aanhef en ondertekening: off (the mail starts with "Beste rijmfanaat,")
- Naam ontvanger: Onze dichters van vorig jaar
- Sinterklaascadeau: SintGPT gratis tot en met pakjesavond (Cadeau vermelden: ja)
- Leuke weetjes: Schreven vorig jaar hun sinterklaasgedichten met SintGPT. De
  Sint en de rijmpiet zijn ze dankbaar. Dit jaar mogen ze gratis rijmen tot en
  met pakjesavond.
- Geschreven door: Sinterklaas. Stijl: Grappig or Klassiek. Rijmschema: AABB.
  Aantal regels: about 12 to 16.

Then "Deel gedicht" → copy the `/g/<id>` link and give it to Claude. Claude reads
the poem from that page and fills in `THANK_YOU_POEM` in `scripts/giftMail.ts`.
The script refuses to send while it is empty.

## C. Recipient list and codes (owner, then script)

1. In the old Dodo business (`bus_Gg5x…`, live mode), export last season's
   payments as CSV to `.cache/gift-mail/dodo-export.csv` (`.cache/` is
   git-ignored). Do not paste addresses in the chat. The Dodo MCP is not used,
   because its output would put the addresses in the chat.
2. `npx tsx scripts/gift-mail.ts list`: keeps paid payments between 1 Sep 2025
   and 31 Jan 2026 (`--from`, `--to`) without a refund or dispute, one per
   address, in `.cache/gift-mail/recipients.json`. It prints counts only. If Dodo
   names its columns differently, it stops and prints the column names.
3. `npx tsx scripts/gift-mail.ts codes`: one code per recipient
   (`randomBytes(16)` hex) plus one test code, and `.cache/gift-mail/secret.txt`.
4. Owner: `! npx wrangler secret put NUXT_GIFT_CODES_SEASON --name sintgpt < .cache/gift-mail/secret.txt`

## D. Cloudflare Email Sending (owner setup)

1. Upgrade the account to Workers Paid ($5 a month). Side effect: more CPU per
   request, which the share image needs.
2. Dashboard → Compute & AI → Email Service → onboard `sintgpt.com` for sending.
   Check that the new DNS records are added and that the root MX still points to
   Dynadot.
3. Create an API token that may send with Email Service (the docs do not name the
   permission; pick it on the Create Token screen). Put it in `.env.mail` as
   `CLOUDFLARE_EMAIL_TOKEN=…` (git-ignored by `.env.*`). Never paste it in the chat.
4. Optional, later: a DMARC report address of our own instead of Dynadot's.

## E. Send (`scripts/gift-mail.ts`, owner starts it)

1. `preview <dir>`: writes `gift-mail.html` and `gift-mail.txt` with a sample
   code, to read and approve.
2. `test <your address>`: sends one mail with the test code. Check: inbox (not
   spam), the poem, the parchment link, the gift notice on the site, "afmelden".
3. `send`: one mail per recipient, one every 2 seconds. It writes `sentAt` and the
   outcome in `recipients.json` after each mail, so a second run skips who already
   got it. On 429 or 5xx it waits and tries again (3 times); on any other error it
   stops and prints the Cloudflare error code. It prints counts only.
4. Replies with "afmelden" arrive in the Dynadot mailbox. There are no more mails,
   so nothing else is needed.
5. After pakjesavond: delete `.cache/gift-mail/`, remove `NUXT_GIFT_CODES_SEASON`
   (`npx wrangler secret delete NUXT_GIFT_CODES_SEASON --name sintgpt`).

Mail details (`renderGiftMail` in `scripts/giftMail.ts`):

- From and Reply-To: `Patrick van SintGPT <patrick@sintgpt.com>` (replies arrive in
  the Dynadot mailbox).
- Header `List-Unsubscribe: <mailto:patrick@sintgpt.com?subject=afmelden>`.
- Plain text and HTML, no tracking pixel, no link shortener.
- Gift link: `https://sintgpt.com/?cadeau=<code>&utm_source=email&utm_medium=email&utm_campaign=kopers-2025`.
- Subject: "Een cadeautje van de Rijmpiet - Gratis gebruik van SintGPT" (owner,
  17 Nov). Opens with "Beste rijmfanaat,". Text: thanks,
  the poem with its parchment link, what Hele familie gives until 5 December, the
  button "Open mijn cadeau", "werkt in 3 browsers", "Je betaalt niets en er loopt
  niets door", and the one-time and "afmelden" line.
- Follow the Persuasion rules in `CLAUDE.md`: no fake urgency, no "populair", the
  date is real.

## Order and timing

1. Deploy A. B, C and D can run at the same time.
2. E needs all of them: A live, the poem filled in, the secret from C set, D
   done. Then E.1, E.2 and E.3.
3. Send by about 24 Nov 2026, so the gift is used before the peak on 4–5 Dec.
