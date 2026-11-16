---
name: report-analytics
description: Report today's SintGPT analytics (Workers Analytics Engine) as a short overview with insights. Use when the user asks how today went, for today's analytics, numbers, visitors, poems or sales, or runs /report-analytics. Pass `yesterday` for the day before.
---

# Report today's analytics

Read-only. It queries Analytics Engine and writes nothing.

## 1. Run the report

```sh
npx tsx scripts/analytics-report.ts today
```

Use `yesterday` instead of `today` when the user asks for yesterday.

- `today` is the Dutch calendar day from 00:00 to now. The first line of the output says the date and the hours.
- The token comes from `.env.analytics`. Never open, print or cat `.env` or `.env.analytics`. When the script says the token is missing, tell the user to set `CLOUDFLARE_ANALYTICS_TOKEN` there.
- Counts are already weighted with `_sample_interval`.

## 2. Add context

```sh
git log --since=midnight --format='%h %ci %s'
```

A commit is not a deploy, but it tells when a change could have gone live. Link a change in the numbers to a deploy or fix only when the times fit, and say that it is a guess.

## 3. Read the output

- **Timeline** is in UTC. Write Dutch times: +1 hour in winter, +2 in summer.
- **Same hours a week earlier** compares the same weekday and hours. With no data, leave the comparison out.
- One visitor often makes several events. Group events close in time from one country into one story (for example: no poems left, payment window, closed, rewrite try, left).
- `/g/:id` page views and `Open shared poem` are readers of shared poems, not writers.
- `No poems left` with `free:server` means only the server knew the limit: a new device or a private window on the same IP.
- `Poem stream failed` is the page giving up after its retries. `Poem retry` is a retry that may have worked.
- `Rate limited` `limit` right after a `Poem stream failed` from the same country means a visitor lost the free poem to the stream failure.
- The site owner's own visits have the `sintgpt-intern` cookie and write no events. Their tests are not in the numbers.
- Event names and columns: the Analytics section of `CLAUDE.md` and the top of `server/utils/analytics.ts`.

## 4. Write the overview

Write in ASD-STE100 Simplified Technical English (short sentences, simple words, lists), as the global instructions say. Keep event names and project terms exactly as they are.

Start with one line that says how the day went. Then use these headings and leave out a heading that has nothing:

1. **Traffic**: page views per page, countries, referrers, campaigns (`utm_*`, sticker campaigns `ams-<id>`).
2. **Shared poems**: `/g/:id` views, `Open shared poem`, `Shared poem to form`.
3. **Poems**: count, styles, languages, cost, seconds to the first text and in total, ratings, rewrites.
4. **Payment**: why the payment window opened and how it closed, `Proceed to payment`, `Payment verified`, webhooks with amounts, gift claims.
5. **Problems**: errors, failed streams, retries, refused contact messages. Give the time and what the visitor did before and after.
6. **Contact form**: `Contact sent` per topic, `Contact refused`, `Contact failed`.
7. **Insights**: 2 to 4 points. Each point says what the data shows and, if there is one, what to do. Base each point on the numbers. Do not make up a trend from a few events: say when a count is too small to mean much.

Give numbers, not adjectives. Use no tables unless the user asks.

## Never

- Never put names, poem text, payment IDs or IP addresses in the reply. The events do not hold them; do not try to find them elsewhere.
- Never write events, send test events or change the dataset.
- Never send the report to Telegram or another service unless the user asks.
