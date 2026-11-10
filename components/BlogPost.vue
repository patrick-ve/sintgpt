<script setup lang="ts">
import { findBlogPost, formatDutchDate, relatedBlogPosts } from '~/utils/blogPosts';

/**
 * Layout for a blog article: header, article card, "Lees ook" and footer, plus
 * the SEO tags every article needs (meta, Open Graph image, canonical link,
 * Article and BreadcrumbList JSON-LD). Title, dates and reading time come from
 * utils/blogPosts.ts. The article body goes in the default slot, starting at h2.
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
}>();

const post = findBlogPost(props.slug);
if (!post) throw new Error(`Blog post ${props.slug} is missing from utils/blogPosts.ts`);

const related = relatedBlogPosts(props.slug);
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
  <div class="min-h-screen bg-sinterklaas-pattern">
    <header class="bg-red-900 text-white shadow-xl border-b-4 border-[#F4CD60] relative overflow-hidden">
      <div class="absolute top-0 left-0 w-16 h-16 bg-[#F4CD60] -translate-x-8 -translate-y-8 rotate-45 transform" aria-hidden="true"></div>
      <div class="absolute top-0 right-0 w-16 h-16 bg-[#F4CD60] translate-x-8 -translate-y-8 rotate-45 transform" aria-hidden="true"></div>

      <div class="container mx-auto px-6 py-8 text-[#F4CD60] relative z-10">
        <NuxtLink to="/blog" class="hover:opacity-80 transition-opacity inline-block mb-2 font-bold">
          <span class="text-lg">← Terug naar Blog</span>
        </NuxtLink>
        <p class="text-3xl md:text-5xl font-bold font-display drop-shadow-md">SintGPT Blog</p>
      </div>
    </header>

    <article class="container mx-auto px-6 py-12">
      <div class="max-w-4xl mx-auto bg-[#fffdf0] rounded-2xl shadow-2xl p-8 md:p-12 sint-border relative">
        <div class="absolute top-4 right-4 text-4xl opacity-50" aria-hidden="true">🌙</div>

        <header class="mb-8 border-b-2 border-red-100 pb-8">
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-red-700 mb-4 font-bold">
            <time :datetime="post.published">{{ publishedLabel }}</time>
            <template v-if="modifiedLabel">
              <span aria-hidden="true">•</span>
              <span>bijgewerkt <time :datetime="post.modified">{{ modifiedLabel }}</time></span>
            </template>
            <span aria-hidden="true">•</span>
            <span>{{ post.readMinutes }} minuten lezen</span>
          </div>
          <h1 class="text-4xl md:text-5xl font-bold text-red-900 mb-6 leading-tight font-display text-balance">
            {{ post.title }}
          </h1>
          <p class="text-xl text-gray-800 leading-relaxed font-medium text-pretty">
            {{ lead }}
          </p>
        </header>

        <div class="prose prose-lg max-w-none prose-headings:font-display prose-headings:text-red-900 prose-p:text-gray-800 prose-strong:text-red-900">
          <slot />
        </div>
      </div>
    </article>

    <section v-if="related.length" aria-labelledby="related-title" class="container mx-auto px-6">
      <div class="max-w-4xl mx-auto">
        <h2 id="related-title" class="text-3xl font-bold text-white mb-6 font-display drop-shadow-md">Lees ook</h2>
        <ul class="grid gap-4 md:grid-cols-3">
          <li v-for="item in related" :key="item.slug">
            <NuxtLink
              :to="`/blog/${item.slug}`"
              class="related-card flex h-full flex-col gap-2 rounded-xl bg-[#fffdf0] p-5 border-2 border-[#F4CD60]"
            >
              <span class="font-display text-lg font-bold leading-snug text-red-900 text-balance">{{ item.title }}</span>
              <span class="text-sm leading-relaxed text-gray-700">{{ item.description }}</span>
            </NuxtLink>
          </li>
        </ul>
        <p class="mt-6 text-lg text-[#F4CD60] font-medium">
          Op zoek naar inspiratie? Lees de
          <NuxtLink to="/voorbeelden" class="font-bold underline underline-offset-4">voorbeelden van sinterklaasgedichten</NuxtLink>
          in zes stijlen.
        </p>
      </div>
    </section>

    <footer class="bg-red-900 mt-12 border-t-4 border-[#F4CD60] relative">
      <div class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-900 border-4 border-[#F4CD60] rounded-full p-3" aria-hidden="true">
        <div class="text-2xl">🎁</div>
      </div>
      <div class="container mx-auto px-6 py-12 text-center text-[#F4CD60]">
        <div class="flex justify-center gap-8 mb-6 text-3xl opacity-80" aria-hidden="true">
          <span>🌙</span>
          <span>🐴</span>
          <span>🥕</span>
        </div>
        <nav class="mb-6 flex flex-wrap justify-center gap-x-6 gap-y-3 font-bold" aria-label="Voettekst">
          <NuxtLink to="/" class="underline underline-offset-4">Sinterklaasgedicht maken</NuxtLink>
          <NuxtLink to="/voorbeelden" class="underline underline-offset-4">Voorbeelden</NuxtLink>
          <NuxtLink to="/blog" class="underline underline-offset-4">Blog</NuxtLink>
          <NuxtLink to="/lootjes" class="underline underline-offset-4">Lootjes trekken</NuxtLink>
          <NuxtLink to="/privacy" class="underline underline-offset-4">Privacy</NuxtLink>
          <NuxtLink to="/voorwaarden" class="underline underline-offset-4">Voorwaarden</NuxtLink>
        </nav>
        <p class="font-bold text-lg">
          Copyright {{ new Date().getFullYear() }} SintGPT. Alle rechten voorbehouden.
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.bg-sinterklaas-pattern {
  background-color: #7f1d1d;
  background-image:
    radial-gradient(#F4CD60 1px, transparent 1px),
    radial-gradient(#F4CD60 1px, transparent 1px);
  background-size: 50px 50px;
  background-position: 0 0, 25px 25px;
  background-attachment: fixed;
}

.related-card {
  transition-property: border-color;
  transition-duration: 150ms;
}
@media (hover: hover) {
  .related-card:hover {
    border-color: #7f1d1d;
  }
}
.related-card:focus-visible {
  outline: 3px solid #F4CD60;
  outline-offset: 3px;
}

.sint-border {
  border: 4px solid #7f1d1d;
  outline: 2px solid #F4CD60;
  outline-offset: -8px;
}
</style>
