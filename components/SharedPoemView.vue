<script setup lang="ts">
import { pakjesavondCountdown } from '~/utils/pakjesavond';

defineProps<{
  poem: string;
  partial?: boolean;
}>();

const { t } = useI18n();
const { track } = useAnalytics();

// The form itself, not the top of the home page.
const FORM = '/#poem-form';

// Days until pakjesavond: a real date, never tied to a price or an offer.
// Worked out on the server too, so the line does not jump on load.
const countdown = useState('pakjesavond-countdown', () => pakjesavondCountdown(new Date()));
const countdownText = computed(() => {
  if (!countdown.value) return '';
  if (countdown.value.days === 0) return t('countdown.today');
  if (countdown.value.days === 1) return t('countdown.tomorrow');
  return t('countdown.days', { count: countdown.value.days });
});

// On phones a bar at the bottom offers the form once the reader is in the
// poem, and goes away when the button under the poem is in view.
const poemStart = ref<HTMLElement | null>(null);
const cta = ref<HTMLElement | null>(null);
const reading = ref(false);
const ctaVisible = ref(false);
const showBar = computed(() => reading.value && !ctaVisible.value);

let observer: IntersectionObserver | null = null;
onMounted(() => {
  countdown.value = pakjesavondCountdown(new Date());
  track('Open shared poem');
  observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.target === cta.value) ctaVisible.value = entry.isIntersecting;
      // The top of the poem went up out of view: the reader is reading.
      if (entry.target === poemStart.value) reading.value = !entry.isIntersecting && entry.boundingClientRect.top < 0;
    }
  });
  if (poemStart.value) observer.observe(poemStart.value);
  if (cta.value) observer.observe(cta.value);
});
onBeforeUnmount(() => observer?.disconnect());
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
      <h1 class="text-3xl md:text-4xl text-white text-center text-balance">
        {{ t('share.heading') }}
      </h1>
      <p class="mt-2 mb-6 text-center text-[#f7e6c0] text-base md:text-lg text-pretty">
        {{ t('share.byline') }}
      </p>

      <div ref="poemStart" aria-hidden="true"></div>
      <div class="sint-card p-5 md:p-8">
        <PaperScroll :poem="poem" />
        <p v-if="partial" class="mt-4 text-base font-medium text-[#5c0f26]">
          {{ t('share.partial') }}
        </p>
      </div>

      <div class="mt-10 text-center">
        <p v-if="countdown" class="mb-3 text-[#f4cd60] font-bold text-base">
          🎁 {{ countdownText }}
        </p>
        <p class="font-display text-2xl md:text-3xl text-white text-balance">
          {{ t('share.ctaLead') }}
        </p>
        <div ref="cta" class="mt-5">
          <NuxtLink
            :to="FORM"
            @click="track('Shared poem to form', { detail: 'button' })"
            class="share-cta inline-flex items-center justify-center min-h-12 px-8 bg-[#f4cd60] text-[#5c0f26] font-display font-bold text-xl rounded-xl shadow-lg hover:bg-[#ffe08a]"
          >
            {{ t('share.cta') }}
          </NuxtLink>
        </div>
        <p class="mt-3 text-[#f7e6c0] text-base">
          {{ t('share.ctaNote') }}
        </p>
      </div>
    </main>

    <Transition name="share-bar">
      <div
        v-if="showBar"
        class="share-bar md:hidden fixed inset-x-0 bottom-0 z-40 bg-[#5c0f26]/95 px-4 pt-3 shadow-[0_-4px_16px_rgb(0_0_0/0.25)]"
      >
        <NuxtLink
          :to="FORM"
          @click="track('Shared poem to form', { detail: 'bar' })"
          class="share-cta flex w-full items-center justify-center min-h-12 px-4 bg-[#f4cd60] text-[#5c0f26] font-display font-bold text-lg rounded-xl hover:bg-[#ffe08a]"
        >
          {{ t('share.bar') }}
        </NuxtLink>
      </div>
    </Transition>
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
.share-bar {
  padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
}
.share-bar-enter-active,
.share-bar-leave-active {
  transition: translate 200ms ease-out, opacity 200ms ease-out;
}
.share-bar-enter-from,
.share-bar-leave-to {
  translate: 0 100%;
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .share-bar-enter-active,
  .share-bar-leave-active {
    transition: none;
  }
}
</style>
