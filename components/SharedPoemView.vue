<script setup lang="ts">
defineProps<{
  poem: string;
  partial?: boolean;
}>();

const { t } = useI18n();

onMounted(() => {
  (window as any).umami?.track('Open shared poem');
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
        <PaperScroll :poem="poem" />
        <p v-if="partial" class="mt-4 text-base font-medium text-[#5c0f26]">
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
