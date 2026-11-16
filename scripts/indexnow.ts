// Tell Bing, Yandex and the other IndexNow engines which pages changed.
// Bing feeds DuckDuckGo, Ecosia and ChatGPT search; Google does not use IndexNow.
//
//   npx tsx scripts/indexnow.ts [--since YYYY-MM-DD | --all | <url> ...] [--send]
//
// Without --send it only prints the URLs. --since takes the pages whose
// <lastmod> in public/sitemap.xml is on or after that date (default: 2 days
// ago). Run it after a deploy is live (the deploy skill does), never before:
// the engines crawl the URLs and check the key file at once.
//
// The key is public by design: IndexNow checks it at https://sintgpt.com/<key>.txt
// (public/<key>.txt). To change it, write a new file and change KEY here.
import { readFileSync } from 'node:fs';

const HOST = 'sintgpt.com';
const KEY = 'f3a523d955a76579db721cd7f22b55db';
const ENDPOINT = 'https://api.indexnow.org/indexnow';

interface SitemapEntry {
  loc: string;
  lastmod: string;
}

export function readSitemap(xml: string): SitemapEntry[] {
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, block]) => ({
    loc: block!.match(/<loc>([^<]+)<\/loc>/)?.[1]?.trim() ?? '',
    lastmod: block!.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1]?.trim() ?? '',
  })).filter(entry => entry.loc);
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

async function main() {
  const args = process.argv.slice(2);
  const send = args.includes('--send');
  const all = args.includes('--all');
  const sinceIndex = args.indexOf('--since');
  const since = sinceIndex >= 0 ? args[sinceIndex + 1] : daysAgo(2);
  if (!since || !/^\d{4}-\d{2}-\d{2}$/.test(since)) {
    throw new Error('--since needs a date as YYYY-MM-DD');
  }
  const named = args.filter((arg, i) => !arg.startsWith('--') && (sinceIndex < 0 || i !== sinceIndex + 1));

  const sitemap = readSitemap(readFileSync('public/sitemap.xml', 'utf8'));
  const urls = named.length > 0
    ? named
    : sitemap.filter(entry => all || entry.lastmod >= since).map(entry => entry.loc);

  for (const url of urls) {
    if (new URL(url).host !== HOST) throw new Error(`Not on ${HOST}: ${url}`);
  }
  if (urls.length === 0) {
    console.log(`No URLs (sitemap lastmod on or after ${since}).`);
    return;
  }
  console.log(`${urls.length} URL(s):\n${urls.map(url => `  ${url}`).join('\n')}`);
  if (!send) {
    console.log('Dry run. Add --send to submit.');
    return;
  }

  const keyFile = await fetch(`https://${HOST}/${KEY}.txt`);
  const keyText = keyFile.ok ? (await keyFile.text()).trim() : '';
  if (keyText !== KEY) {
    throw new Error(`https://${HOST}/${KEY}.txt is not live (status ${keyFile.status}). Deploy first.`);
  }

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls }),
  });
  // 200: received. 202: received, key check pending. Anything else is a failure.
  console.log(`IndexNow: ${response.status} ${response.statusText}`);
  if (response.status !== 200 && response.status !== 202) {
    console.log(await response.text());
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
