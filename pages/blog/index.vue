<script setup lang="ts">
import { BLOG_POSTS, formatDutchDate } from '~/utils/blogPosts';

const { locale } = useI18n();

const posts = BLOG_POSTS.map(post => ({ ...post, dateLabel: formatDutchDate(post.published) }));

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
  <div class="min-h-screen bg-sinterklaas-pattern">
    <header class="bg-red-900 text-white shadow-xl border-b-4 border-[#F4CD60] relative overflow-hidden">
      <div class="absolute top-0 left-0 w-16 h-16 bg-[#F4CD60] -translate-x-8 -translate-y-8 rotate-45 transform" aria-hidden="true"></div>
      <div class="absolute top-0 right-0 w-16 h-16 bg-[#F4CD60] translate-x-8 -translate-y-8 rotate-45 transform" aria-hidden="true"></div>

      <div class="container mx-auto px-6 py-8 text-[#F4CD60] relative z-10">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <NuxtLink to="/" class="hover:opacity-80 transition-opacity flex items-center gap-4">
            <span class="hidden md:block text-4xl" aria-hidden="true">🎁</span>
            <span class="text-3xl md:text-5xl font-bold font-display drop-shadow-md">SintGPT Blog</span>
          </NuxtLink>
          <NuxtLink
            to="/"
            class="px-4 py-2 bg-[#F4CD60] text-red-900 rounded-lg font-bold hover:bg-yellow-400 transition-colors border-2 border-red-900 shadow-md"
          >
            {{ locale === 'nl' ? 'Terug naar SintGPT' : 'Back to SintGPT' }}
          </NuxtLink>
        </div>
      </div>
    </header>

    <main class="container mx-auto px-6 py-12">
      <div class="max-w-4xl mx-auto">
        <div class="text-center mb-12 relative">
          <div class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-12 text-6xl opacity-20 pointer-events-none" aria-hidden="true">✍️</div>
          <h1 class="text-4xl font-bold text-white mb-4 font-display drop-shadow-lg text-balance">
            Tips voor je sinterklaasgedicht
          </h1>
          <p class="text-xl text-[#F4CD60] font-medium drop-shadow-md text-pretty">
            Rijm en ritme, grappige en roast-gedichten, surprises en lootjes trekken.
          </p>
        </div>

        <ul class="grid gap-8">
          <li
            v-for="post in posts"
            :key="post.slug"
            class="post-card bg-[#fffdf0] rounded-2xl shadow-xl border-4 border-red-900 relative p-8"
          >
            <div class="absolute top-3 right-3 text-2xl opacity-50" aria-hidden="true">📜</div>
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-red-700 mb-3 font-bold">
              <time :datetime="post.published">{{ post.dateLabel }}</time>
              <span aria-hidden="true">•</span>
              <span>{{ post.readMinutes }} min</span>
            </div>
            <h2 class="text-2xl font-bold text-red-900 mb-3 font-display text-balance pr-8">
              <NuxtLink :to="`/blog/${post.slug}`" class="post-link">{{ post.title }}</NuxtLink>
            </h2>
            <p class="text-gray-800 mb-4 leading-relaxed font-medium">
              {{ post.description }}
            </p>
            <span class="text-red-600 font-bold flex items-center gap-2" aria-hidden="true">
              Lees meer <span class="text-xl">→</span>
            </span>
          </li>
        </ul>

        <div class="mt-16 bg-[#fffdf0] rounded-2xl shadow-xl p-8 text-center sint-border relative overflow-hidden">
          <div class="absolute -left-4 -bottom-4 text-6xl opacity-20 rotate-45" aria-hidden="true">🎁</div>
          <div class="absolute -right-4 -top-4 text-6xl opacity-20 -rotate-12" aria-hidden="true">🌙</div>
          <h2 class="text-3xl font-bold text-red-900 mb-4 font-display">
            {{ locale === 'nl' ? 'Zin in je eigen gedicht?' : 'Ready for your own poem?' }}
          </h2>
          <p class="text-gray-800 mb-8 text-lg font-medium max-w-2xl mx-auto">
            {{ locale === 'nl'
              ? 'SintGPT schrijft binnen 30 seconden een persoonlijk sinterklaasgedicht. Je eerste gedicht is gratis.'
              : 'SintGPT writes a personal Sinterklaas poem in 30 seconds. Your first poem is free.' }}
          </p>
          <NuxtLink
            to="/"
            data-cta="blog:index"
            class="inline-block px-8 py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-transform transform hover:scale-105 shadow-lg border-2 border-[#F4CD60] text-xl"
          >
            {{ locale === 'nl' ? 'Schrijf gratis je sinterklaasgedicht' : 'Write your first poem for free' }}
          </NuxtLink>
          <p class="mt-6 text-gray-800 font-medium">
            Eerst inspiratie opdoen? Lees de
            <NuxtLink to="/voorbeelden" class="font-bold text-red-800 underline underline-offset-4">voorbeelden van sinterklaasgedichten</NuxtLink>.
          </p>
        </div>
      </div>
    </main>

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
          <NuxtLink to="/lootjes" class="underline underline-offset-4">Lootjes trekken</NuxtLink>
          <NuxtLink to="/privacy" class="underline underline-offset-4">Privacy</NuxtLink>
          <NuxtLink to="/voorwaarden" class="underline underline-offset-4">{{ locale === 'nl' ? 'Voorwaarden' : 'Terms' }}</NuxtLink>
        </nav>
        <p class="font-bold text-lg">
          Copyright {{ new Date().getFullYear() }} SintGPT. {{ locale === 'nl' ? 'Alle rechten voorbehouden.' : 'All rights reserved.' }}
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

.sint-border {
  border: 4px solid #7f1d1d;
  outline: 2px solid #F4CD60;
  outline-offset: -8px;
}

/* The whole card is clickable, but the link text is only the title. */
.post-link::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 1rem;
}
.post-link:focus-visible {
  outline: none;
}
.post-link:focus-visible::after {
  outline: 3px solid #F4CD60;
  outline-offset: 4px;
}
.post-card {
  transition-property: box-shadow, translate;
  transition-duration: 150ms;
}
@media (hover: hover) {
  .post-card:hover {
    translate: 0 -4px;
  }
  .post-card:hover .post-link {
    color: #b91c1c;
  }
}
</style>
