#!/usr/bin/env node
// Internal link graph (from the internal-linking skill, adapted to this Nuxt repo).
// Usage: node scripts/internal-link-graph.mjs [root] > seo/internal-link-graph.json
// Counts contextual links between pages: links in components/ (footer, SiteLinks,
// the "Lees ook" block of BlogPost.vue) appear on many pages and count as sitewide,
// not contextual. Money pages are the ones where a visitor writes a poem or draws
// lootjes: /, /voorbeelden and /lootjes.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = process.argv[2] ?? '.';
const DIRS = ['pages', 'components'];
const EXT = /\.(vue|[jt]sx?)$/;
const MONEY = /^\/(voorbeelden|lootjes)?$/;
const SITE = 'https://sintgpt.com';

const walk = (dir, out = []) => {
  let names;
  try { names = readdirSync(dir); } catch { return out; }
  for (const n of names) {
    if (n === 'node_modules' || n.startsWith('.')) continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (EXT.test(n)) out.push(p);
  }
  return out;
};
const norm = p => (p.length > 1 ? p.replace(/\/+$/, '') : p);

function routeOf(file) {
  const f = relative(ROOT, file).split(sep).join('/');
  const m = f.match(/^pages\/(.+)\.vue$/);
  if (!m || m[1].includes('[')) return null;
  return norm('/' + m[1].replace(/(^|\/)index$/, ''));
}

const pages = new Map(), inbound = new Map(), sitewide = new Set();
for (const file of DIRS.flatMap(d => walk(join(ROOT, d)))) {
  const text = readFileSync(file, 'utf8').split(SITE).join('');
  const links = new Set();
  for (const m of text.matchAll(/\b(?:to|href)="(\/[^"#?\s]*)/g)) links.add(norm(m[1]));
  if (relative(ROOT, file).startsWith('components')) { links.forEach(l => sitewide.add(l)); continue; }
  const route = routeOf(file);
  if (!route) continue;
  pages.set(route, relative(ROOT, file));
  for (const l of links) if (l !== route) (inbound.get(l) ?? inbound.set(l, new Set()).get(l)).add(route);
}

const rows = [...pages].map(([route, file]) => ({
  route,
  file,
  contextualInbound: inbound.get(route)?.size ?? 0,
  linkedFrom: [...(inbound.get(route) ?? [])].sort(),
  inNavOrFooter: sitewide.has(route),
  money: MONEY.test(route),
})).sort((a, b) => a.contextualInbound - b.contextualInbound || a.route.localeCompare(b.route));

console.log(JSON.stringify({
  generatedAt: new Date().toISOString(),
  orphanMoneyPages: rows.filter(r => r.money && r.contextualInbound < 3).map(r => r.route),
  pages: rows,
}, null, 2));
