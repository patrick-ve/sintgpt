# Dodo Payments: live payments refused

Status on 10 November 2026: live checkouts on sintgpt.com fail with **403 "Live payments
not enabled for merchant"**. Nobody can pay. Tracked as #1 in `ISSUES.md`; setup steps in
`docs/dodo-payments-todo.md`.

Never put an API key, webhook secret or gift code in this file.

## Accounts and businesses

| Dodo login | Business | Mode seen | Notes |
|---|---|---|---|
| `patrick@sintgpt.com` | `bus_Gg5xzOyhmXu3Tcx2bBzxQ` | live | The real business. Live payments of €1,99 in December 2025. Holds the live products. |
| `patrick@careerdeck.ai` | probably `bus_0NrUOZUWrAz7AYEqANsEb` (not verified) | test | Created by mistake, no transactions. Has the three test products of 9 November. Do not use. |

Live products in `bus_Gg5xzOyhmXu3Tcx2bBzxQ` (all one-time, EUR, VAT included, tax `saas`):

| Tier | Product ID | Price |
|---|---|---|
| 3 gedichten | `pdt_0NreeKYxYPEDUUK8Mo8MK` | €3,99 |
| Gezin | `pdt_k1w5aNEH5uiPQMhDT9oIE` | €6,99 |
| Hele familie | `pdt_0NreeKbakzFxl4k6Nl9Zr` | €12,99 |

## What we tried

Times are Amsterdam time (UTC+1).

| When | What | Result |
|---|---|---|
| 9 Nov | Dodo MCP login (test mode) created the three test products | Worked, in `bus_0NrU…` (the careerdeck account, probably) |
| 9 Nov, 20:56 | A visitor opened the payment window; the site asked Dodo for a checkout | `dodo 403`, "Live payments not enabled for merchant". The site turned off payment for 15 minutes and allowed 3 free poems a day |
| 10 Nov | Dodo MCP login cleared and done again | Now live mode in `bus_Gg5xzOyhmXu3Tcx2bBzxQ` (patrick@sintgpt.com) |
| 10 Nov | Created the live products for 3 gedichten and Hele familie with the MCP | Worked (IDs above) |
| 10 Nov | Tried to create a live checkout session per product with the MCP | Not possible: the MCP login has no `checkout_sessions:write` permission. Nothing created |
| 10 Nov, 16:57 | Asked the live site for a Gezin checkout (`POST /api/payment/create-checkout`) | 503, cause `dodo 403`. Payment off for 15 minutes again |
| 10 Nov | Set the Worker secrets `NUXT_DODO_PRODUCT_ID_DRIE` and `NUXT_DODO_PRODUCT_ID_FAMILIE` | Worked: `/api/payment/status` lists all three tiers; smoke test passes |
| 10 Nov | Dodo dashboard, verification page | "We're reviewing your details. This usually takes up to 72 hours." But Product Information, Personal Information and Bank Verification all show **Approved** |
| Before 10 Nov | Owner contacted Dodo support from patrick@sintgpt.com | No answer yet (per the owner) |
| 10 Nov | Urgent support email drafted (below) | To send from patrick@sintgpt.com |

## Not known

- Which business the Worker's live API key (`NUXT_DODO_PAYMENTS_API_KEY`) belongs to.
  `wrangler secret list` shows names only. Cloudflare dashboard → Workers → sintgpt → Logs →
  "Dodo refused the checkout" shows Dodo's full message.
- Whether the webhook secret on the Worker belongs to the same business.
- Why live payments stopped: the business had live payments in December 2025.

## When Dodo answers

1. If Dodo enables live payments: wait until the 15-minute block is over (or 15 minutes
   after the last failure), then test one checkout through the site and one real payment
   with a refund (`docs/dodo-payments-todo.md`, step 6).
2. If the key turns out to be from the other business: create a live key and webhook in
   `bus_Gg5xzOyhmXu3Tcx2bBzxQ` and set them with `wrangler secret put` (step 4 of the
   checklist).
3. Plan B (#1): if live payments are not on by about 15 November, consider Mollie or
   Stripe Payment Links.

## The support email (10 November 2026)

Send from **patrick@sintgpt.com** to **support@dodopayments.com** (Dodo FAQ Q147). Dodo
accepts some requests only from the account owner's address, so use the owner address.

No answer? Dodo's FAQ (Q148) says: escalate to **compliance@dodopayments.com** or
support@dodopayments.com with the subject `Urgent: No Response – patrick@sintgpt.com`.
Other channels: the support chat in the dashboard and Discord. Status page:
https://status.dodopayments.com. Source: https://docs.dodopayments.com/miscellaneous/faq

> **Subject:** Urgent: live payments disabled for bus_Gg5xzOyhmXu3Tcx2bBzxQ – what is blocking my account?
>
> Hi Dodo Payments team,
>
> My live checkouts are being refused and I cannot tell from the dashboard what is blocking them. My product is seasonal: SintGPT writes Sinterklaas poems, and nearly all sales happen before 5 December. Every day without payments costs me revenue: my analytics show visitors opening the payment window and then being unable to pay. I would be very grateful for a quick answer.
>
> **Account details**
> - Account email: patrick@sintgpt.com
> - Business ID: bus_Gg5xzOyhmXu3Tcx2bBzxQ
> - Website: https://sintgpt.com
> - Live products: pdt_k1w5aNEH5uiPQMhDT9oIE (€6.99), pdt_0NreeKYxYPEDUUK8Mo8MK (€3.99), pdt_0NreeKbakzFxl4k6Nl9Zr (€12.99)
> - I already tried to reach you earlier from this address. I also have a second Dodo account, patrick@careerdeck.ai, which I created by mistake and which has no transactions. Please handle everything under patrick@sintgpt.com.
>
> **What happens**
> Creating a live checkout session fails with 403 "Live payments not enabled for merchant". Recent attempts:
> - 9 November 2026, 19:56 UTC
> - 10 November 2026, 15:57 UTC
>
> The same business processed live payments successfully in December 2025, so this used to work.
>
> **Why I'm confused**
> The verification page says "We're reviewing your details. This usually takes up to 72 hours", but all three steps below it show Approved: Product Information, Personal Information and Bank Verification. So I cannot tell:
> 1. What is still under review, if all three steps are approved?
> 2. Is the review the reason live payments are disabled, or is something else blocking them?
> 3. Is there anything I need to submit or change? If so, what exactly?
> 4. When can I expect live payments to be enabled again?
> 5. Can live payments be turned on while the review finishes, given that the account had live payments before?
>
> I am happy to send any document or information you need right away.
>
> Thank you for your help.
>
> Kind regards,
> Patrick van Everdingen
> SintGPT – https://sintgpt.com
