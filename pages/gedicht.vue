<script setup lang="ts">
import { poemDigest, decodePoem } from '~/utils/poemLink';

interface VerifiedShare {
  opening: string;
  language: 'nl' | 'en';
  digest: string;
}

const { t } = useI18n();
const route = useRoute();

const { data: share } = await useFetch<VerifiedShare>('/api/share/verify', {
  query: {
    s: route.query.s,
    l: route.query.l,
    d: route.query.d,
    sig: route.query.sig,
  },
});

if (!share.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true });
}

const verified = share.value;
const language = verified.language;
const title = language === 'nl'
  ? 'Een sinterklaasgedicht van SintGPT'
  : 'A Sinterklaas poem from SintGPT';
const description = verified.opening.replace(/\n/g, ' ');

const requestUrl = useRequestURL();
const query = new URLSearchParams(route.query as Record<string, string>).toString();
const image = `${requestUrl.origin}/gedicht/preview.png?${query}`;

// Personal content that only makes sense for the people it is shared with.
useSeoMeta({
  title,
  description,
  robots: 'noindex, follow',
  ogTitle: title,
  ogDescription: description,
  ogType: 'article',
  ogSiteName: 'SintGPT',
  ogLocale: language === 'nl' ? 'nl_NL' : 'en_US',
  ogUrl: `${requestUrl.origin}/gedicht?${query}`,
  ogImage: image,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageType: 'image/png',
  ogImageAlt: description,
  twitterCard: 'summary_large_image',
  twitterImage: image,
  twitterImageAlt: description,
});

// The whole poem is in the part of the link that only the browser can see.
// It shows only if it matches the digest that the server signed.
const fullPoem = ref<string | null>(null);
const isPartial = ref(false);

onMounted(async () => {
  (window as any).umami?.track('Open shared poem');
  const decoded = await decodePoem(window.location.hash.slice(1));
  if (decoded && (await poemDigest(decoded)) === verified.digest) {
    fullPoem.value = decoded.trim();
  } else {
    isPartial.value = true;
  }
});
</script>

<template>
  <div class="min-h-screen bg-festive-pattern">
    <header class="festive-header relative">
      <div class="container mx-auto px-6 pt-6 pb-10">
        <NuxtLink to="/" class="text-3xl md:text-4xl font-bold font-display text-[#f4cd60]">
          {{ t('header.title') }}
        </NuxtLink>
      </div>
      <div class="header-decoration"></div>
    </header>

    <main class="container mx-auto px-4 md:px-6 py-8 md:py-12 max-w-3xl">
      <h1 class="text-3xl md:text-4xl text-white text-center mb-6">
        {{ t('share.heading') }}
      </h1>

      <div class="sint-card p-5 md:p-8">
        <PaperScroll :poem="fullPoem ?? verified.opening" />
        <p v-if="isPartial" class="mt-4 text-base font-medium text-[#5c0f26]">
          {{ t('share.partial') }}
        </p>
      </div>

      <div class="mt-8 text-center">
        <NuxtLink
          to="/"
          data-umami-event="Shared poem to form"
          class="share-cta inline-flex items-center justify-center min-h-12 px-8 bg-[#f4cd60] text-[#5c0f26] font-display font-bold text-xl rounded-xl shadow-lg hover:bg-[#ffe08a]"
        >
          {{ t('share.cta') }}
        </NuxtLink>
        <p class="mt-3 text-[#f7e6c0] text-base">
          {{ t('hero.note') }}
        </p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.share-cta {
  transition-property: background-color, scale;
  transition-duration: 150ms;
  transition-timing-function: ease-out;
}
.share-cta:active {
  scale: 0.96;
}
.share-cta:focus-visible {
  outline: 2px solid #fff8e7;
  outline-offset: 3px;
}
</style>
