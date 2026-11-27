<script setup lang="ts">
import { chapterOfBlogPost, findBlogPost, formatDutchDate, relatedBlogPosts } from '~/utils/blogPosts';

/**
 * Layout for a blog article ("Het Grote Boek": a page of Sint's book): header,
 * article sheet, "Lees ook" and footer, plus
 * the SEO tags every article needs (meta, Open Graph image, canonical link,
 * Article and BreadcrumbList JSON-LD). Title, dates and reading time come from
 * utils/blogPosts.ts. The article body goes in the default slot, starting at h2.
 * The posts carry their own utility classes; the styles below give the body
 * its look (headings, lists, example boxes, the closing offer), so a post
 * needs no change when the design changes.
 */
const props = defineProps<{
  /** The part after /blog/; must be in utils/blogPosts.ts. */
  slug: string;
  /** The opening paragraph under the title. */
  lead: string;
  seoTitle: string;
  seoDescription: string;
  /** A name from scripts/og-images.ts. */
  ogImage: string;
  /** Sections for the contents list in the margin; `id` is the id of an h2 or h3 in the body. */
  toc?: { id: string; label: string }[];
}>();

const post = findBlogPost(props.slug);
if (!post) throw new Error(`Blog post ${props.slug} is missing from utils/blogPosts.ts`);

const related = relatedBlogPosts(props.slug);
const relatedPosts = related.map(item => ({ ...item, chapter: chapterOfBlogPost(item.slug) }));
const chapter = chapterOfBlogPost(props.slug);
const pageUrl = `https://sintgpt.com/blog/${props.slug}`;
const modified = post.modified ?? post.published;
const publishedLabel = formatDutchDate(post.published);
const modifiedLabel = post.modified && post.modified !== post.published ? formatDutchDate(post.modified) : null;

useSeoMeta({
  title: props.seoTitle,
  description: props.seoDescription,
  ogTitle: props.seoTitle,
  ogDescription: props.seoDescription,
  articlePublishedTime: post.published,
  articleModifiedTime: modified,
  ogType: 'article',
});

useOgImage(props.ogImage, `SintGPT Blog: ${post.title}`);

useHead({
  link: [{ rel: 'canonical', href: pageUrl }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Article',
            headline: post.title,
            description: props.seoDescription,
            image: `https://sintgpt.com/og/${props.ogImage}.jpg`,
            datePublished: post.published,
            dateModified: modified,
            inLanguage: 'nl',
            author: {
              '@type': 'Organization',
              name: 'SintGPT',
              url: 'https://sintgpt.com',
            },
            publisher: {
              '@type': 'Organization',
              name: 'SintGPT',
              logo: { '@type': 'ImageObject', url: 'https://sintgpt.com/favicon-192x192.png' },
            },
            mainEntityOfPage: pageUrl,
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'SintGPT', item: 'https://sintgpt.com/' },
              { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://sintgpt.com/blog' },
              { '@type': 'ListItem', position: 3, name: post.title, item: pageUrl },
            ],
          },
        ],
      }),
    },
  ],
});
</script>

<template>
  <div class="min-h-screen bg-[#f6ecd4] text-[#2b1b12]">
    <BlogHeader :cta="`blog:${slug}:kop`" />

    <div class="mx-auto max-w-[1120px] px-4 pb-[72px] pt-6 sm:px-6 sm:pt-10">
      <article class="sheet border border-[#d9c596] bg-[#fffbee]">
        <header class="border-b border-[#e6d6ae] px-6 pb-9 pt-10 text-center sm:pb-11 sm:pt-14">
          <nav aria-label="Kruimelpad" class="mb-5 text-[15px] font-bold uppercase tracking-[0.14em] text-[#7a5c16]">
            <NuxtLink to="/blog" class="crumb underline underline-offset-4">Blog</NuxtLink>
            <template v-if="chapter">
              <span aria-hidden="true" class="px-2 text-[#b8923c]">/</span>
              <span>Hoofdstuk {{ chapter.numeral }} · {{ chapter.name }}</span>
            </template>
          </nav>
          <h1 class="mx-auto max-w-[780px] font-display text-[clamp(2.1rem,5vw,3.5rem)] font-bold leading-[1.08] text-[#8b1538] text-balance">
            {{ post.title }}
          </h1>
          <div class="mb-4 mt-6 flex items-center justify-center gap-3.5 text-[#b8923c]" aria-hidden="true">
            <span class="h-px w-[90px] bg-[#b8923c]"></span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.2H22l-6.1 4.5 2.3 7.3L12 16.6 5.8 21l2.3-7.3L2 9.2h7.6z" /></svg>
            <span class="h-px w-[90px] bg-[#b8923c]"></span>
          </div>
          <p class="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-base text-[#5e4a36]">
            <time :datetime="post.published">{{ publishedLabel }}</time>
            <template v-if="modifiedLabel">
              <span aria-hidden="true">·</span>
              <span>bijgewerkt <time :datetime="post.modified">{{ modifiedLabel }}</time></span>
            </template>
            <span aria-hidden="true">·</span>
            <span>{{ post.readMinutes }} minuten lezen</span>
          </p>
        </header>

        <div :class="toc ? 'lg:grid lg:grid-cols-[280px_minmax(0,1fr)]' : ''">
          <aside v-if="toc" class="hidden border-r border-[#e6d6ae] px-8 py-11 lg:block">
            <nav aria-label="In dit artikel" class="sticky top-6">
              <p class="mb-3.5 text-sm font-bold uppercase tracking-[0.16em] text-[#7a5c16]">In dit hoofdstuk</p>
              <ul class="text-[17px]">
                <li v-for="item in toc" :key="item.id">
                  <a :href="`#${item.id}`" class="toc-item">{{ item.label }}</a>
                </li>
              </ul>
            </nav>
          </aside>

          <div class="mx-auto w-full max-w-[760px] px-5 pb-12 pt-9 sm:px-10 sm:pb-14 sm:pt-11">
            <p class="lead font-text text-[1.3rem] leading-[1.6] text-[#33231a] text-pretty sm:text-[1.4rem]">
              {{ lead }}
            </p>

            <details v-if="toc" class="mt-7 border-y border-[#b8923c] py-1 text-lg lg:hidden">
              <summary class="cursor-pointer py-3 font-bold text-[#7a5c16]">In dit hoofdstuk ({{ toc.length }} onderdelen)</summary>
              <ul class="pb-2.5">
                <li v-for="item in toc" :key="item.id">
                  <a :href="`#${item.id}`" class="block py-2 text-[#8b1538] underline underline-offset-4">{{ item.label }}</a>
                </li>
              </ul>
            </details>

            <div class="article-body prose max-w-none">
              <slot />
            </div>
          </div>
        </div>
      </article>

      <section v-if="related.length" aria-labelledby="related-title" class="mt-16">
        <div class="mb-6 flex items-center gap-4">
          <h2 id="related-title" class="font-display text-[2rem] font-bold text-[#8b1538]">Lees ook</h2>
          <span class="h-px flex-1 bg-[#b8923c]" aria-hidden="true"></span>
        </div>
        <ul class="grid gap-5 md:grid-cols-3">
          <li v-for="item in relatedPosts" :key="item.slug">
            <NuxtLink
              :to="`/blog/${item.slug}`"
              class="related-card flex h-full flex-col gap-2 border border-[#d9c596] bg-[#fffbee] p-6"
            >
              <span class="text-sm font-bold uppercase tracking-[0.14em] text-[#7a5c16]">
                <template v-if="item.chapter">{{ item.chapter.name }} · </template>{{ item.readMinutes }} min
              </span>
              <span class="font-display text-[1.35rem] font-bold leading-tight text-[#8b1538] text-balance">{{ item.title }}</span>
              <span class="text-[17px] leading-relaxed text-[#4a3728]">{{ item.description }}</span>
            </NuxtLink>
          </li>
        </ul>
        <p class="mt-6 text-lg text-[#4a3728]">
          Op zoek naar inspiratie? Lees de
          <NuxtLink to="/voorbeelden" class="crumb font-bold text-[#8b1538] underline underline-offset-4">voorbeelden van sinterklaasgedichten</NuxtLink>
          in zes stijlen.
        </p>
      </section>
    </div>

    <BlogFooter blog-link />
  </div>
</template>

<style scoped>
.sheet {
  box-shadow: 0 18px 40px rgba(74, 55, 40, 0.16);
}

/* The drop cap of the book. */
.lead::first-letter {
  float: left;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 5.2rem;
  line-height: 0.8;
  color: #8b1538;
  padding: 0.5rem 0.7rem 0 0;
}

.toc-item {
  display: block;
  padding: 0.5rem 0 0.5rem 0.875rem;
  border-left: 3px solid #eadcb8;
  color: #4a3728;
}
.toc-item:hover {
  border-left-color: #8b1538;
  color: #8b1538;
}
.toc-item:focus-visible,
.crumb:focus-visible,
.related-card:focus-visible {
  outline: 2px solid #8b1538;
  outline-offset: 3px;
}

.related-card {
  transition-property: border-color;
  transition-duration: 150ms;
}
@media (hover: hover) {
  .related-card:hover {
    border-color: #8b1538;
  }
}

/* ===== The article body =====
   The posts set utility classes (Tailwind, in a layer); these rules are not in
   a layer, so they win and every post gets the look of the book. */
.article-body {
  margin-top: 1.75rem;
  font-family: var(--font-text);
  font-size: 1.25rem;
  line-height: 1.65;
  color: #33231a;
}
.article-body :deep(:is(h2, h3, [id])) {
  scroll-margin-top: 1.5rem;
}
.article-body :deep(h2) {
  margin: 3rem 0 0.875rem;
  font-size: clamp(1.7rem, 4vw, 2.125rem);
  line-height: 1.15;
  color: #8b1538;
}
.article-body :deep(> h2:first-child) {
  margin-top: 2.25rem;
}
.article-body :deep(h3) {
  margin: 2.25rem 0 0.625rem;
  font-size: 1.5rem;
  line-height: 1.2;
  color: #5c0f26;
}
.article-body :deep(p) {
  color: inherit;
}
.article-body :deep(strong) {
  color: #5c0f26;
}
.article-body :deep(a:not([data-cta]):not(.inline-block)),
.article-body :deep(a.text-red-700) {
  color: #8b1538;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.article-body :deep(a:focus-visible) {
  outline: 2px solid #8b1538;
  outline-offset: 2px;
}
.article-body :deep(:is(ul, ol)) {
  color: inherit;
  margin-bottom: 1.25rem;
}
.article-body :deep(li::marker) {
  color: #b8923c;
  font-weight: 700;
}

/* A list of "word: rhymes" (rijmwoorden-sinterklaas): the rhyme register. */
.article-body :deep(.rijmregister) {
  width: 100%;
  margin: 0 0 1.375rem;
  border-collapse: collapse;
  border-top: 2px solid #8b1538;
}
.article-body :deep(.rijmregister tr) {
  border-bottom: 1px solid #e6d6ae;
}
.article-body :deep(.rijmregister :is(th, td)) {
  padding: 0.75rem 0;
  text-align: left;
  vertical-align: top;
}
.article-body :deep(.rijmregister th) {
  width: 34%;
  padding-right: 1.25rem;
  font-family: var(--font-display);
  font-weight: 700;
  color: #8b1538;
  overflow-wrap: break-word;
}
@media (max-width: 480px) {
  .article-body :deep(.rijmregister :is(th, td)) {
    display: block;
    width: 100%;
    padding: 0;
  }
  .article-body :deep(.rijmregister tr) {
    display: block;
    padding: 0.7rem 0;
  }
}

/* An example (verses, sentences): between two gold rules, like a quotation. */
.article-body :deep(.bg-red-50.border-l-4) {
  margin: 2.25rem 0;
  padding: 1.75rem 0.5rem;
  background: transparent;
  border: 0;
  border-top: 1px solid #b8923c;
  border-bottom: 1px solid #b8923c;
  border-radius: 0;
  text-align: center;
}
.article-body :deep(.bg-red-50.border-l-4 > .font-bold:first-child) {
  margin-bottom: 1rem;
  font-family: var(--font-sans);
  font-size: 0.875rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #7a5c16;
}
.article-body :deep(.bg-red-50.border-l-4 .font-text) {
  font-style: italic;
  font-size: 1.4rem;
  line-height: 1.5;
  color: #5c0f26;
}

/* Two examples in a row share one rule. */
.article-body :deep(.bg-red-50.border-l-4 + .bg-red-50.border-l-4) {
  margin-top: -2.25rem;
  border-top: 0;
}
@media (max-width: 480px) {
  .article-body :deep(.bg-red-50.border-l-4) {
    padding-inline: 0;
  }
  .article-body :deep(.bg-red-50.border-l-4 .font-text) {
    font-size: 1.15rem;
  }
}

/* A tip or summary box. */
.article-body :deep(.bg-\[\#fff3c9\]) {
  margin: 2rem 0;
  padding: 1.5rem 1.75rem;
  background: #f6ecd4;
  border: 1px solid #d9c596;
  border-radius: 4px;
}
.article-body :deep(.bg-\[\#fff3c9\] h3) {
  margin-top: 0;
  color: #8b1538;
}

/* The offer that closes every post. */
.article-body :deep(.bg-red-50.border-2) {
  margin: 3rem 0 0;
  padding: 2.25rem 1.5rem;
  background: #8b1538;
  border: 0;
  border-radius: 4px;
  box-shadow: none;
  font-family: var(--font-sans);
}
.article-body :deep(.bg-red-50.border-2 h3) {
  margin-top: 0;
  font-size: 1.75rem;
  color: #f4cd60;
}
.article-body :deep(.bg-red-50.border-2 p) {
  color: #fff8e7;
}
.article-body :deep(.bg-red-50.border-2 a) {
  background: #f4cd60;
  border: 0;
  border-radius: 6px;
  color: #5c0f26;
  font-family: var(--font-display);
  text-decoration: none;
}
.article-body :deep(.bg-red-50.border-2 a:focus-visible) {
  outline: 3px solid #f4cd60;
  outline-offset: 3px;
}
</style>
