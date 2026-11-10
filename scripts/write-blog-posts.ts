// Has the default poem model write (or rewrite) the blog posts from the briefs
// in scripts/blogBriefs.ts, and renders each one to pages/blog/<slug>.vue.
//
//   npx tsx --env-file=.env scripts/write-blog-posts.ts <out-dir> [slug ...]
//   npx tsx scripts/write-blog-posts.ts <out-dir> --render [slug ...]
//
// The first form calls AI Gateway (a few cents per post) and saves the answer
// as <out-dir>/<slug>.json. The second renders saved answers again without a
// call. Review every post before you commit: facts, rhymes, links and tone.
// Then update utils/blogPosts.ts, scripts/og-images.ts, public/sitemap.xml and
// public/llms.txt (the script prints the values to use).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createGateway, generateText, Output } from 'ai';
import { z } from 'zod';
import { DEFAULT_POEM_MODEL } from '../server/utils/poem';
import { BLOG_BRIEFS, SITE_FACTS, STYLE_RULES, type BlogBrief } from './blogBriefs';

// Every field is required (empty when unused): with optional fields the model
// sometimes put a tip's text in its title.
const BlockSchema = z.object({
  type: z.enum(['paragraph', 'bullets', 'steps', 'subheading', 'poem', 'tip'])
    .describe('paragraph: text. bullets/steps: items (steps is a numbered list). subheading: text (an h3). poem: items = the lines, "" between stanzas, title optional. tip: a highlighted box with a short title and the text.'),
  title: z.string().describe('Only for poem and tip: a short title of at most 8 words. Empty otherwise.'),
  text: z.string().describe('For paragraph, subheading and tip. Empty otherwise.'),
  items: z.array(z.string()).describe('For bullets, steps and poem. Empty otherwise.'),
});

const PostSchema = z.object({
  title: z.string().describe('De h1: 40 tot 75 tekens, met het zoekwoord.'),
  seoTitle: z.string().describe('Titel voor Google, zonder de sitenaam: hooguit 48 tekens, zoekwoord vooraan.'),
  seoDescription: z.string().describe('Meta description: 120 tot 155 tekens, zegt wat de lezer leert.'),
  cardDescription: z.string().describe('Eén of twee zinnen voor het blogoverzicht, hooguit 160 tekens.'),
  ogTitle: z.string().describe('Titel op de deelafbeelding, hooguit 45 tekens.'),
  ogSubtitle: z.string().describe('Ondertitel op de deelafbeelding, hooguit 60 tekens.'),
  lead: z.string().describe('De eerste alinea onder de titel: 2 of 3 zinnen, met het zoekwoord.'),
  sections: z.array(z.object({ heading: z.string(), blocks: z.array(BlockSchema) })).describe('5 tot 9 secties; elke heading is een h2.'),
  ctaTitle: z.string().describe('Kop van de afsluitende oproep, hooguit 60 tekens.'),
  ctaText: z.string().describe('Eén of twee zinnen die de lezer naar de pagina van de oproep sturen.'),
  ctaLinkText: z.string().describe('Beschrijvende linktekst, eindigt op " →".'),
});
type Post = z.infer<typeof PostSchema>;

const ROOT = new URL('../', import.meta.url);
const ALLOWED_LINKS = ['/', '/voorbeelden', '/lootjes', '/blog', ...BLOG_BRIEFS.map(b => `/blog/${b.slug}`)];
const BANNED = /\b(ontdek\w*|ultiem\w*|hilarisch\w*|geweldig\w*|magisch\w*|genereer\w*|gegenereerd|tool|chatgpt|gemini|gpt|openai)\b|AI-gegenereerd/i;

function currentText(slug: string): string | null {
  const file = new URL(`pages/blog/${slug}.vue`, ROOT);
  if (!existsSync(file)) return null;
  return readFileSync(file, 'utf8')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<\/(p|li|h[1-6]|div)>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

function buildPrompt(brief: BlogBrief): string {
  const others = BLOG_BRIEFS.filter(b => b.slug !== brief.slug).map(b => `- /blog/${b.slug} (over: ${b.keyword})`).join('\n');
  const existing = currentText(brief.slug);
  return `Je schrijft een blogartikel voor sintgpt.com, een site waar je een persoonlijk sinterklaasgedicht laat schrijven. Het artikel moet lezers echt helpen en goed vindbaar zijn in Google.

Zoekwoord: ${brief.keyword}
Verwante zoekopdrachten die het artikel ook beantwoordt: ${brief.secondary.join('; ')}

Waar het artikel over gaat:
${brief.angle}
${brief.material ? `\nMateriaal:\n${brief.material}\n` : ''}
Feiten over SintGPT (de enige bron voor wat je over SintGPT schrijft):
${SITE_FACTS}

Schrijfregels:
${STYLE_RULES}

Toegestane links:
- / (de pagina waar je een gedicht laat schrijven)
- /voorbeelden (voorbeeldgedichten)
- /lootjes (lootjes trekken)
- /blog (alle artikelen)
${others}

De afsluitende oproep stuurt de lezer naar ${brief.cta === '/lootjes' ? '/lootjes, om lootjes te trekken' : '/, om een gedicht te laten schrijven'}. Zet die oproep niet in de secties: daar zijn ctaTitle, ctaText en ctaLinkText voor.
${existing ? `\nDit is de huidige versie van het artikel. Herschrijf het: behoud wat klopt en nuttig is, verbeter de opbouw, de vindbaarheid en de leesbaarheid, en haal overdrijving weg.\n<huidige_versie>\n${existing}\n</huidige_versie>\n` : ''}`;
}

function reviewPrompt(brief: BlogBrief, draft: Post): string {
  return `Je bent eindredacteur van sintgpt.com. Hieronder staat een concept van een blogartikel als JSON. Geef het verbeterde artikel terug in precies dezelfde vorm.

Controleer en verbeter:
1. Spelling en grammatica. Elke zin moet kloppen en iets zeggen. Herschrijf zinnen die rammelen of onbegrijpelijk zijn.
2. Feiten. Haal alles weg wat niet zeker klopt: uitspraak, geschiedenis, cijfers, en alles over SintGPT dat niet in de feitenlijst staat.
3. Rijm in voorbeeldgedichten. Elk rijmpaar moet volrijm zijn vanaf de laatste beklemtoonde klinker. "biedt" rijmt niet op "Bakpiet", want de klemtoon van "Bakpiet" ligt op "Bak". Vervang een paar dat niet rijmt.
4. De schrijfregels hieronder, ook de woorden die niet mogen.
5. Geen aparte sectie die SintGPT aanprijst: daarvoor is de afsluitende oproep.
6. Lengtes: seoTitle hooguit 48 tekens, seoDescription 120 tot 155 tekens.
7. Bij een tip staat de kop in title en de uitleg in text.

Feiten over SintGPT:
${SITE_FACTS}

Schrijfregels:
${STYLE_RULES}

Zoekwoord: ${brief.keyword}

<concept>
${JSON.stringify(draft, null, 2)}
</concept>`;
}

const escapeHtml = (text: string) => text
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/\{/g, '&#123;').replace(/\}/g, '&#125;');
// The lead is an attribute and the meta tags are plain text: no markup there.
const plain = (text: string) => text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
const escapeAttr = (text: string) => escapeHtml(text).replace(/"/g, '&quot;');

function inline(text: string, warnings: string[]): string {
  let html = escapeHtml(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label: string, href: string) => {
    if (!ALLOWED_LINKS.includes(href)) {
      warnings.push(`link not allowed: ${href}`);
      return label;
    }
    return `<NuxtLink to="${href}" class="text-red-700 underline underline-offset-2 hover:text-red-900">${label}</NuxtLink>`;
  });
  return html;
}

function renderBlock(block: z.infer<typeof BlockSchema>, warnings: string[]): string {
  const items = block.items ?? [];
  switch (block.type) {
    case 'paragraph':
      return `    <p class="leading-relaxed mb-4">\n      ${inline(block.text ?? '', warnings)}\n    </p>`;
    case 'subheading':
      return `    <h3 class="text-2xl font-bold mt-6 mb-3">${inline(block.text ?? '', warnings)}</h3>`;
    case 'bullets':
    case 'steps': {
      const tag = block.type === 'steps' ? 'ol' : 'ul';
      const list = block.type === 'steps' ? 'list-decimal' : 'list-disc';
      return [
        `    <${tag} class="${list} pl-6 text-gray-800 space-y-2 mb-4 marker:text-red-600">`,
        ...items.map(item => `      <li>${inline(item, warnings)}</li>`),
        `    </${tag}>`,
      ].join('\n');
    }
    case 'poem': {
      const stanzas: string[][] = [[]];
      for (const line of items) {
        if (line.trim() === '') stanzas.push([]);
        else stanzas.at(-1)!.push(line);
      }
      return [
        '    <div class="bg-red-50 border-l-4 border-red-600 p-6 my-6 rounded-r-lg">',
        ...(block.title ? [`      <p class="font-bold text-red-900 mb-2">${inline(block.title, warnings)}</p>`] : []),
        ...stanzas.filter(s => s.length).map(s => `      <p class="font-text text-lg text-red-900 leading-relaxed mb-3 last:mb-0">\n        ${s.map(l => escapeHtml(l)).join('<br>\n        ')}\n      </p>`),
        '    </div>',
      ].join('\n');
    }
    case 'tip':
      return [
        '    <div class="bg-[#fff3c9] p-6 rounded-lg my-6 border border-[#F4CD60]">',
        `      <h3 class="text-xl font-bold text-red-900 mb-3 font-display">${inline(block.title || 'Tip', warnings)}</h3>`,
        `      <p class="text-red-800">${inline(block.text ?? '', warnings)}</p>`,
        '    </div>',
      ].join('\n');
  }
}

function render(brief: BlogBrief, post: Post, warnings: string[]): string {
  const body = post.sections.map(section => [
    `    <h2 class="text-3xl font-bold mt-8 mb-4">${inline(section.heading, warnings)}</h2>`,
    ...section.blocks.map(block => renderBlock(block, warnings)),
  ].join('\n')).join('\n\n');
  return `<template>
  <BlogPost
    slug="${brief.slug}"
    lead="${escapeAttr(plain(post.lead))}"
    seo-title="${escapeAttr(`${plain(post.seoTitle)} | SintGPT`)}"
    seo-description="${escapeAttr(plain(post.seoDescription))}"
    og-image="blog-${brief.slug}"
  >
${body}

    <div class="bg-red-50 border-2 border-red-600 rounded-xl p-8 my-8 text-center shadow-lg">
      <h3 class="text-2xl font-bold text-red-900 mb-4 font-display">${escapeHtml(post.ctaTitle)}</h3>
      <p class="text-red-800 mb-6 font-medium">
        ${inline(post.ctaText, warnings)}
      </p>
      <NuxtLink
        to="${brief.cta}"${brief.cta === '/' ? `\n        data-cta="blog:${brief.slug}"` : ''}
        class="inline-block px-8 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-transform transform hover:scale-105 text-lg border border-[#F4CD60]"
      >
        ${escapeHtml(post.ctaLinkText)}
      </NuxtLink>${brief.cta === '/' ? '' : `
      <p class="mt-6 text-red-800">
        <!-- data-cta counts as "Go to poem form", so only links to the form carry it. -->
        <NuxtLink to="/" data-cta="blog:${brief.slug}" class="font-bold underline underline-offset-2 hover:text-red-900">Lootje getrokken? Schrijf gratis een sinterklaasgedicht →</NuxtLink>
      </p>`}
    </div>
  </BlogPost>
</template>
`;
}

function words(post: Post): number {
  const text = [post.lead, ...post.sections.flatMap(s => [s.heading, ...s.blocks.flatMap(b => [b.text ?? '', b.title ?? '', ...(b.items ?? [])])])].join(' ');
  return text.split(/\s+/).filter(Boolean).length;
}

function check(post: Post, warnings: string[]) {
  const seoTitle = `${post.seoTitle} | SintGPT`;
  if (seoTitle.length > 62) warnings.push(`seoTitle ${seoTitle.length} chars`);
  if (post.seoDescription.length < 110 || post.seoDescription.length > 160) warnings.push(`seoDescription ${post.seoDescription.length} chars`);
  if (post.cardDescription.length > 170) warnings.push(`cardDescription ${post.cardDescription.length} chars`);
  const all = JSON.stringify(post);
  const banned = all.match(new RegExp(BANNED, 'gi'));
  if (banned) warnings.push(`banned words: ${[...new Set(banned)].join(', ')}`);
  const shouts = post.sections.flatMap(s => s.blocks.filter(b => b.type !== 'poem')).map(b => `${b.text ?? ''}${b.title ?? ''}${(b.items ?? []).join(' ')}`).join(' ').match(/!/g);
  if (shouts) warnings.push(`${shouts.length} exclamation marks outside poems`);
  const n = words(post);
  if (n < 800 || n > 1600) warnings.push(`${n} words`);
}

const [outDir, ...rest] = process.argv.slice(2);
if (!outDir) throw new Error('Usage: write-blog-posts.ts <out-dir> [--render] [slug ...]');
const renderOnly = rest.includes('--render');
const slugs = rest.filter(arg => arg !== '--render');
const briefs = BLOG_BRIEFS.filter(b => !slugs.length || slugs.includes(b.slug));
mkdirSync(outDir, { recursive: true });

let gateway: ReturnType<typeof createGateway> | null = null;
if (!renderOnly) {
  const apiKey = process.env.NUXT_AI_GATEWAY_API_KEY || process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) throw new Error('No AI Gateway key in the environment');
  gateway = createGateway({ apiKey });
}

async function one(brief: BlogBrief) {
  const jsonFile = `${outDir}/${brief.slug}.json`;
  let post: Post;
  if (renderOnly) {
    post = PostSchema.parse(JSON.parse(readFileSync(jsonFile, 'utf8')));
  } else {
    const started = Date.now();
    const settings = {
      model: gateway!(DEFAULT_POEM_MODEL),
      output: Output.object({ schema: PostSchema }),
      temperature: 1,
      maxRetries: 3,
      providerOptions: { google: { thinkingConfig: { thinkingLevel: 'high' } } },
    } as const;
    const draft = await generateText({ ...settings, prompt: buildPrompt(brief) });
    // A second pass by the same model: proofread and correct the draft.
    const final = await generateText({ ...settings, prompt: reviewPrompt(brief, draft.output) });
    post = final.output;
    writeFileSync(jsonFile, JSON.stringify(post, null, 2));
    writeFileSync(`${outDir}/${brief.slug}.draft.json`, JSON.stringify(draft.output, null, 2));
    const tokens = (draft.usage.outputTokens ?? 0) + (final.usage.outputTokens ?? 0);
    console.log(`${brief.slug}: ${((Date.now() - started) / 1000).toFixed(0)} s, ${tokens} output tokens`);
  }
  const warnings: string[] = [];
  check(post, warnings);
  writeFileSync(new URL(`pages/blog/${brief.slug}.vue`, ROOT), render(brief, post, warnings));
  const n = words(post);
  return { slug: brief.slug, title: post.title, cardDescription: post.cardDescription, ogTitle: post.ogTitle, ogSubtitle: post.ogSubtitle, words: n, readMinutes: Math.max(1, Math.round(n / 200)), warnings };
}

const results: Awaited<ReturnType<typeof one>>[] = [];
const queue = [...briefs];
await Promise.all(Array.from({ length: 4 }, async () => {
  for (let brief = queue.shift(); brief; brief = queue.shift()) {
    try {
      results.push(await one(brief));
    } catch (error) {
      console.error(`${brief.slug}: FAILED ${error instanceof Error ? error.message : error}`);
    }
  }
}));
writeFileSync(`${outDir}/summary.json`, JSON.stringify(results, null, 2));
for (const r of results) console.log(`${r.slug}: ${r.words} words, ${r.readMinutes} min${r.warnings.length ? ` | ${r.warnings.join('; ')}` : ''}`);
