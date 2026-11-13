---
title: "A Sinterklaas poem writer on Cloudflare Workers: streaming, rate limits and share links without a database"
published: false
description: "How sintgpt.com streams a rhyming poem in about 30 seconds, counts free poems per IP with Durable Objects, and signs share links so the poem never reaches the server."
tags: cloudflare, nuxt, webdev, ai
---

<!-- No canonical_url: sintgpt.com has no English technical post to point at, so this article is the original. Add canonical_url only if you publish the same text on sintgpt.com first. -->

[SintGPT](https://sintgpt.com) writes a personal Dutch or English Sinterklaas poem in about 30 seconds. It runs on Cloudflare Workers with Nuxt 4, has no user database, and keeps every poem on the visitor's device. These are the parts that were less obvious than they look.

## Streaming without a waiting screen that lies

The model reasons before it writes, so the first text arrives after a few seconds and then comes in uneven chunks. The server streams an AI SDK UI message stream (SSE) from Vercel AI Gateway [CHOICE: name the model or not; the site itself does not]. The browser does not print chunks as they arrive. A small `requestAnimationFrame` loop releases the text at a steady pace, so a burst of 40 words does not jump onto the screen. With reduced motion, or in a hidden tab, the whole text shows at once.

Two Cloudflare details mattered:

- **`cache-control: no-transform`** on the stream, so zone compression does not buffer it.
- **`enable_request_signal`**, so a visitor who closes the tab aborts the upstream request too. Waiting on the gateway is not CPU time on Workers, so a long stream is cheap.

## Counting free poems without storing IP addresses

The first poem is free: 1 per day per IP. The count lives in a Durable Object per visitor, named by an HMAC of the IP (IPv6 per /64), never the raw address. Each object deletes its own data with an alarm when its 24-hour window ends. A Rate Limiting binding in front of it refuses fast repeats before they reach the object.

```ts
// The counter name is a keyed hash (HMAC-SHA-256) of "ip:<address>", never the IP itself.
const name = await counterName({ kind: 'ip', id: ipKey }, secret);
if (env.POEM_BURST && !(await env.POEM_BURST.limit({ key: name })).success) {
  return { ok: false, reason: 'debounce' };
}
const counter = env.RATE_LIMITER.get(env.RATE_LIMITER.idFromName(name));
const res = await counter.fetch('https://rate-limit.internal/check', {
  method: 'POST',
  body: JSON.stringify(rule),
});
```

If the binding fails, an in-memory limiter decides, so the site degrades instead of going down.

## Share links where the poem never reaches the server

A poem link looks like `/gedicht?s=<opening>&d=<digest>&sig=<signature>#<whole poem>`. Browsers never send the part after `#`, so only the opening lines reach the server, which needs them for the share image. The page shows the poem only if it matches the signed digest, so nobody can put other text on the domain through a crafted link.

Short links (`/g/<id>`) are stored in Workers KV only when someone shares, expire after 90 days, and get an ID derived from an HMAC over the signature: the same poem gets the same link, and IDs cannot be guessed.

## Analytics without cookies

There is no analytics script. The page sends a few named events (`Poem ready`, `Save as PDF`) with `sendBeacon` to the Worker, which writes them to Workers Analytics Engine without names, poem text, payment IDs or IP addresses. Cloudflare keeps the data for 3 months. That keeps the site free of a cookie banner.

## Try it

Write a poem at https://sintgpt.com (the first one is free), or draw names for Sinterklaas at https://sintgpt.com/lootjes: it runs fully in the browser and needs no email addresses.
