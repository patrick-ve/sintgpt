<script setup lang="ts">
const props = defineProps<{ page: 'privacy' | 'terms'; path: string }>();

const { t } = useI18n();
const { track } = useAnalytics();

interface LegalSection {
  heading: string;
  body: string[];
}

const sections = computed<LegalSection[]>(() => t(`legal.${props.page}.sections`));

// Search engines see the Dutch text, like on every other page.
useSeoMeta({
  title: () => t(`legal.${props.page}.seoTitle`),
  description: () => t(`legal.${props.page}.description`),
});

useHead({
  link: [{ rel: 'canonical', href: `https://sintgpt.com${props.path}` }],
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

    <main class="mx-auto max-w-[68ch] px-4 sm:px-6 py-10 md:py-14 text-[#3b2a1f]">
      <NuxtLink to="/" class="back-link">← {{ t('legal.back') }}</NuxtLink>

      <h1 class="mt-6 font-display font-bold text-4xl md:text-5xl leading-tight text-[#8b1538] text-balance">
        {{ t(`legal.${page}.title`) }}
      </h1>
      <p class="mt-2 text-sm text-[#6b5545]">{{ t('legal.updated') }}</p>
      <p class="mt-6 font-text text-lg leading-relaxed">{{ t(`legal.${page}.intro`) }}</p>

      <section v-for="section in sections" :key="section.heading" class="mt-10">
        <h2 class="font-display font-bold text-2xl leading-snug text-[#8b1538]">
          {{ section.heading }}
        </h2>
        <p
          v-for="(paragraph, index) in section.body"
          :key="index"
          class="mt-3 font-text text-[1.0625rem] leading-relaxed text-pretty"
        >
          {{ paragraph }}
        </p>
      </section>

      <p class="mt-12">
        <a href="mailto:patrick@sintgpt.com" class="back-link" @click="track('Contact')">patrick@sintgpt.com</a>
      </p>
    </main>
    <SiteLinks />
  </div>
</template>

<style scoped>
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
