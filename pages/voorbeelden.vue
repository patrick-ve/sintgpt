<script setup lang="ts">
import { EXAMPLE_POEMS } from '~/utils/examplePoems';

const { t } = useI18n();

// Search engines see the Dutch text, like on every other page.
useSeoMeta({
  title: () => t('examples.seoTitle'),
  description: () => t('examples.description'),
  ogTitle: () => t('examples.pageTitle'),
  ogDescription: () => t('examples.description'),
});
useOgImage('voorbeelden', 'Voorbeelden van sinterklaasgedichten op SintGPT');
useHead({
  link: [{ rel: 'canonical', href: 'https://sintgpt.com/voorbeelden' }],
  script: [
    {
      type: 'application/ld+json',
      // Dutch, like the server-rendered page that search engines read.
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'CollectionPage',
            name: t('examples.pageTitle'),
            url: 'https://sintgpt.com/voorbeelden',
            description: t('examples.description'),
            inLanguage: 'nl',
            mainEntity: {
              '@type': 'ItemList',
              numberOfItems: EXAMPLE_POEMS.length,
              itemListElement: EXAMPLE_POEMS.map((example, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: t(`examples.headings.${example.id}`),
                url: `https://sintgpt.com/voorbeelden#${example.id}`,
              })),
            },
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'SintGPT', item: 'https://sintgpt.com/' },
              { '@type': 'ListItem', position: 2, name: t('examples.pageTitle'), item: 'https://sintgpt.com/voorbeelden' },
            ],
          },
        ],
      }),
    },
  ],
});
</script>

<template>
  <div class="min-h-screen bg-[#fdf6e3]">
    <header class="bg-[#3d0716] border-t-[6px] border-[#d4a853]">
      <div class="mx-auto max-w-[1240px] px-4 sm:px-6 py-5">
        <NuxtLink to="/" class="font-display font-bold text-3xl md:text-[2rem] leading-none text-[#f4cd60]">
          {{ t('header.title') }}
        </NuxtLink>
      </div>
    </header>

    <main class="mx-auto max-w-[760px] px-4 sm:px-6 py-10 md:py-14 text-[#3b2a1f]">
      <NuxtLink to="/" class="back-link">← {{ t('legal.back') }}</NuxtLink>

      <h1 class="mt-6 font-display font-bold text-4xl md:text-5xl leading-tight text-[#8b1538] text-balance">
        {{ t('examples.pageTitle') }}
      </h1>
      <p class="mt-4 font-text text-lg leading-relaxed text-pretty">{{ t('examples.pageIntro') }}</p>

      <nav class="mt-8" :aria-label="t('examples.indexTitle')">
        <p class="font-bold text-[#8b1538]">{{ t('examples.indexTitle') }}</p>
        <ul class="mt-2 grid gap-x-6 sm:grid-cols-2">
          <li v-for="example in EXAMPLE_POEMS" :key="example.id">
            <a :href="`#${example.id}`" class="index-link">{{ t(`examples.headings.${example.id}`) }}</a>
          </li>
        </ul>
      </nav>

      <div class="mt-10 flex flex-col gap-10">
        <ExamplePoemCard
          v-for="example in EXAMPLE_POEMS"
          :id="example.id"
          :key="example.id"
          :example="example"
          :heading="t(`examples.headings.${example.id}`)"
          heading-level="h2"
          class="scroll-mt-6"
        />
      </div>

      <div class="mt-12 flex flex-col items-start gap-4 rounded-xl border-2 border-[#d4a853] bg-white/70 p-6">
        <p class="font-text text-lg">{{ t('examples.ctaText') }}</p>
        <NuxtLink to="/#poem-form" data-cta="voorbeelden" class="btn-festive inline-flex items-center min-h-12 px-6 text-lg">
          {{ t('examples.cta') }}
        </NuxtLink>
      </div>
    </main>
    <SiteLinks />
  </div>
</template>

<style scoped>
.index-link {
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
  color: #8b1538;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.back-link {
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
  font-weight: 700;
  color: #8b1538;
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
