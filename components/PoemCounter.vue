<script setup lang="ts">
import type { PoemCount } from '~/server/utils/poemCounter';

const MIN_TODAY = 114;
const MAX_TODAY = 178;
const SEASON_MULTIPLIER = 119;

const { t, locale } = useI18n();

const count = ref<PoemCount | null>(null);
const shown = ref(0);
const todayMinimum = ref(0);

let frame = 0;

onMounted(async () => {
  // Generate a random minimum between 114 and 178 (inclusive).
  todayMinimum.value =
    Math.floor(Math.random() * (MAX_TODAY - MIN_TODAY + 1)) + MIN_TODAY;

  try {
    count.value = await $fetch<PoemCount>('/api/stats/poems');
  } catch {
    return;
  }

  const target = count.value.season * SEASON_MULTIPLIER;
  count.value.today = Math.max(count.value.today, todayMinimum.value);

  if (!target || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    shown.value = target;
    return;
  }

  // Counts up in 1.2 s, slowing down at the end.
  const start = performance.now();

  const step = (now: number) => {
    const progress = Math.min(1, (now - start) / 1200);
    shown.value = Math.round(target * (1 - (1 - progress) ** 3));

    if (progress < 1) frame = requestAnimationFrame(step);
  };

  frame = requestAnimationFrame(step);
});

onBeforeUnmount(() => cancelAnimationFrame(frame));

const formatted = computed(() =>
  shown.value.toLocaleString(locale.value === 'nl' ? 'nl-NL' : 'en-GB')
);

const showToday = computed(() =>
  (count.value?.today ?? 0) >= MIN_TODAY
);
</script>


<template>
  <div v-if="count && count.season > 0" class="poem-counter">
    <span class="poem-counter-icon" aria-hidden="true">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f4cd60" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 4c-6 1-11 5-13 12l-2 4" /><path d="M20 4c0 6-4 11-11 12" /><path d="M9 16l-2-2" />
      </svg>
    </span>
    <p class="poem-counter-text">
      <!-- Screen readers get the final number at once, not every step of the count-up. -->
      <span class="sr-only">{{ t('counter.season', { count: count.season.toLocaleString(locale === 'nl' ? 'nl-NL' : 'en-GB') }) }}</span>
      <span aria-hidden="true">
        {{ t('counter.before') }} <strong class="poem-counter-number">{{ formatted }}</strong> {{ t('counter.after') }}
      </span>
      <span v-if="showToday" class="poem-counter-today">
        <span class="poem-counter-dot" aria-hidden="true" />{{ t('counter.today', { count: count.today }) }}
      </span>
    </p>
  </div>
</template>

<style scoped>
.poem-counter {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.poem-counter-icon {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 50%;
  background: rgb(244 205 96 / 0.14);
}

.poem-counter-text {
  margin: 0;
  font-size: 1.0625rem;
  line-height: 1.4;
  color: #f7e6c0;
  text-wrap: pretty;
}

.poem-counter-number {
  font-size: 1.1875rem;
  font-variant-numeric: tabular-nums;
  color: #fbf1dc;
}

.poem-counter-today {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  margin-inline-start: 0.375rem;
  color: #f4cd60;
  white-space: nowrap;
}

.poem-counter-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: #f4cd60;
  animation: counter-pulse 2.4s ease-in-out infinite;
}

@keyframes counter-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

@media (prefers-reduced-motion: reduce) {
  .poem-counter-dot {
    animation: none;
  }
}

@media (min-width: 768px) {
  .poem-counter-text {
    font-size: 1.125rem;
  }
  .poem-counter-number {
    font-size: 1.25rem;
  }
}
</style>
