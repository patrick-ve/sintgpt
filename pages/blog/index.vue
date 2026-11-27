<script setup lang="ts">
import { BLOG_CHAPTERS, BLOG_POSTS, chapterBlogPosts, formatDutchDate, latestBlogPost } from '~/utils/blogPosts';

const { locale } = useI18n();

const chapters = BLOG_CHAPTERS.map(chapter => ({ ...chapter, posts: chapterBlogPosts(chapter) }));
// The open book: chapters I and II on the left page, III and IV on the right.
const bookPages = [chapters.slice(0, 2), chapters.slice(2)];

const postCount = BLOG_POSTS.length;

const latest = latestBlogPost();
const latestLabel = latest.modified && latest.modified !== latest.published
  ? `Bijgewerkt ${formatDutchDate(latest.modified)}`
  : `Nieuw, ${formatDutchDate(latest.published)}`;

const title = 'Tips voor sinterklaasgedichten en surprises | SintGPT';
const description = 'Tips voor je sinterklaasgedicht en surprise: rijm en ritme, grappige en roast-gedichten, lootjes trekken en Sinterklaas op het werk.';

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
});

useOgImage('blog', 'SintGPT Blog: tips en inspiratie voor sinterklaasgedichten');

useHead({
  link: [
    { rel: 'canonical', href: 'https://sintgpt.com/blog' },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Blog',
            name: 'SintGPT Blog',
            url: 'https://sintgpt.com/blog',
            description,
            inLanguage: 'nl',
            blogPost: BLOG_POSTS.map(post => ({
              '@type': 'BlogPosting',
              headline: post.title,
              url: `https://sintgpt.com/blog/${post.slug}`,
              datePublished: post.published,
              dateModified: post.modified ?? post.published,
            })),
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'SintGPT', item: 'https://sintgpt.com/' },
              { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://sintgpt.com/blog' },
            ],
          },
        ],
      }),
    },
  ],
});
</script>

<template>
  <div class="blog-book min-h-screen bg-[#f6ecd4] text-[#2b1b12]">
    <BlogHeader cta="blog:index:kop" />

    <main>
      <div class="mx-auto max-w-[820px] px-6 pb-10 pt-14 text-center md:pt-[72px]">
        <p class="mb-4 text-[15px] font-bold uppercase tracking-[0.18em] text-[#7a5c16]">Uit het Grote Boek van Sinterklaas</p>
        <h1 class="font-display text-[clamp(2.5rem,6vw,4.25rem)] font-bold leading-[1.05] text-[#8b1538] text-balance">
          Tips voor je sinterklaasgedicht
        </h1>
        <div class="my-7 flex items-center justify-center gap-3.5 text-[#b8923c]" aria-hidden="true">
          <span class="h-px w-24 bg-[#b8923c] sm:w-[120px]"></span>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.2H22l-6.1 4.5 2.3 7.3L12 16.6 5.8 21l2.3-7.3L2 9.2h7.6z" /></svg>
          <span class="h-px w-24 bg-[#b8923c] sm:w-[120px]"></span>
        </div>
        <p class="font-text text-[1.35rem] leading-normal text-[#4a3728] text-pretty">
          {{ postCount }} artikelen in vier hoofdstukken: van de eerste regel tot het voorlezen op pakjesavond. Sla het boek open waar je vastloopt.
        </p>
      </div>

      <div class="mx-auto max-w-[1120px] px-6 pb-14">
        <NuxtLink :to="`/blog/${latest.slug}`" class="latest-card flex flex-wrap items-center gap-x-8 gap-y-4 rounded bg-[#8b1538] px-6 py-6 text-[#fff8e7] sm:px-8">
          <span class="whitespace-nowrap text-sm font-bold uppercase tracking-[0.16em] text-[#f4cd60]">{{ latestLabel }}</span>
          <span class="flex min-w-0 flex-[999_1_420px] flex-col gap-1">
            <span class="font-display text-2xl font-bold leading-tight">{{ latest.title }}</span>
            <span class="text-lg text-[#f7dfc0]">{{ latest.description }}</span>
          </span>
          <span class="flex items-center gap-2 whitespace-nowrap font-bold text-[#f4cd60]" aria-hidden="true">
            Sla open
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </span>
        </NuxtLink>
      </div>

      <section aria-label="Inhoudsopgave" class="mx-auto max-w-[1120px] px-6 pb-[72px]">
        <div class="book grid border border-[#d9c596] bg-[#fffbee] lg:grid-cols-2">
          <div
            v-for="(bookPage, pageIndex) in bookPages"
            :key="pageIndex"
            class="book-page px-6 pb-4 pt-10 sm:px-11 sm:pb-8 sm:pt-12"
          >
            <section
              v-for="chapter in bookPage"
              :key="chapter.id"
              :aria-labelledby="`chapter-${chapter.id}`"
              class="chapter"
            >
              <div class="mb-1.5 flex items-baseline gap-4">
                <span class="font-display text-[2.75rem] font-bold leading-none text-[#b8923c]" aria-hidden="true">{{ chapter.numeral }}</span>
                <h2 :id="`chapter-${chapter.id}`" class="font-display text-[1.75rem] font-bold text-[#8b1538] sm:text-[2rem]">{{ chapter.question }}</h2>
              </div>
              <p class="mb-3.5 font-text text-[1.2rem] italic text-[#5e4a36]">{{ chapter.intro }}</p>
              <ul>
                <li v-for="post in chapter.posts" :key="post.slug" class="toc-row">
                  <NuxtLink :to="`/blog/${post.slug}`" class="toc-link">{{ post.title }}</NuxtLink>
                  <span class="toc-leader" aria-hidden="true"></span>
                  <span class="whitespace-nowrap text-[15px] font-bold text-[#7a5c16]">{{ post.readMinutes }} min</span>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </section>

      <section class="bg-[#8b1538] text-[#fff8e7]">
        <div class="mx-auto max-w-[820px] px-6 py-16 text-center">
          <h2 class="mb-3.5 font-display text-[2.25rem] font-bold leading-[1.1] text-[#f4cd60] sm:text-[2.5rem]">
            {{ locale === 'nl' ? 'Zin in je eigen gedicht?' : 'Ready for your own poem?' }}
          </h2>
          <p class="mb-8 font-text text-[1.35rem] leading-normal">
            {{ locale === 'nl'
              ? 'SintGPT schrijft in ongeveer een minuut een persoonlijk sinterklaasgedicht. Je eerste gedicht is gratis.'
              : 'SintGPT writes a personal Sinterklaas poem in about a minute. Your first poem is free.' }}
          </p>
          <NuxtLink
            to="/"
            data-cta="blog:index"
            class="cta-button inline-block rounded-md bg-[#f4cd60] px-7 py-4 font-display text-xl font-bold text-[#5c0f26]"
          >
            {{ locale === 'nl' ? 'Schrijf gratis je sinterklaasgedicht' : 'Write your first poem for free' }}
          </NuxtLink>
          <p class="mt-6 text-lg">
            Eerst inspiratie opdoen? Lees de
            <NuxtLink to="/voorbeelden" class="cta-link font-bold text-[#f4cd60] underline underline-offset-4">voorbeelden van sinterklaasgedichten</NuxtLink>.
          </p>
        </div>
      </section>
    </main>

    <BlogFooter />
  </div>
</template>

<style scoped>
.book {
  box-shadow: 0 18px 40px rgba(74, 55, 40, 0.16);
}
.book-page + .book-page {
  border-top: 1px solid #e6d6ae;
}
@media (min-width: 1024px) {
  .book-page + .book-page {
    border-top: 0;
    border-left: 1px solid #e6d6ae;
  }
}
.chapter + .chapter {
  margin-top: 2.75rem;
}

/* The whole row is clickable, but the link text is only the title. */
.toc-row {
  position: relative;
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  min-height: 44px;
  padding: 0.85rem 0;
  border-top: 1px solid #eadcb8;
}
.toc-link {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.2rem;
  line-height: 1.25;
  color: #2b1b12;
  min-width: 0;
}
.toc-link::after {
  content: '';
  position: absolute;
  inset: 0;
}
.toc-leader {
  flex: 1;
  min-width: 1rem;
  border-bottom: 2px dotted #c9b37c;
  transform: translateY(-5px);
}
@media (hover: hover) {
  .toc-row:hover .toc-link {
    color: #8b1538;
  }
  .latest-card:hover,
  .cta-button:hover {
    filter: brightness(1.08);
  }
}
.toc-link:focus-visible {
  outline: none;
}
.toc-link:focus-visible::after {
  outline: 2px solid #8b1538;
  outline-offset: 2px;
  border-radius: 4px;
}

/* A double frame, like the cover of the book. */
.latest-card {
  box-shadow: 0 0 0 5px #f6ecd4, 0 0 0 6px #b8923c;
}
.latest-card:focus-visible,
.cta-button:focus-visible,
.cta-link:focus-visible {
  outline: 3px solid #f4cd60;
  outline-offset: 3px;
}
.latest-card:focus-visible {
  outline-color: #8b1538;
  outline-offset: 8px;
}
</style>
