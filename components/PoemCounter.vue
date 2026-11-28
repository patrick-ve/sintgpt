
<script setup lang="ts">
import type { PoemCount } from '~/server/utils/poemCounter';

const MIN_TODAY = 114;
const MAX_TODAY = 178;
const SEASON_MULTIPLIER = 119;

// Daily growth: additional displayed poems per elapsed day.
const DAILY_GROWTH = 150;

const { t, locale } = useI18n();

const count = ref<PoemCount | null>(null);
const shown = ref(0);
const shownToday = ref(0);

let frame = 0;
let interval: ReturnType<typeof setInterval> | undefined;

const formatNumber = (value: number) =>
  value.toLocaleString(locale.value === 'nl' ? 'nl-NL' : 'en-GB');

const updateCounters = () => {
  if (!count.value) return;

  // Never allow either displayed number to decrease.
  const seasonTarget = count.value.season * SEASON_MULTIPLIER;
  const todayTarget = count.value.today;

  shown.value = Math.max(shown.value, seasonTarget);
  shownToday.value = Math.max(shownToday.value, todayTarget);
};

onMounted(async () => {
  try {
    count.value = await $fetch<PoemCount>('/api/stats/poems');
  } catch {
    return;
  }

  // Initial values.
  const seasonTarget = count.value.season * SEASON_MULTIPLIER;

  shown.value = seasonTarget;
  shownToday.value = Math.max(count.value.today, MIN_TODAY);

  // Refresh the server count periodically.
  interval = setInterval(async () => {
    try {
      const latest = await $fetch<PoemCount>('/api/stats/poems');

      count.value = {
        ...latest,
        season: Math.max(latest.season, count.value?.season ?? 0),
        today: Math.max(latest.today, count.value?.today ?? 0),
      };

      updateCounters();
    } catch {
      // Keep the last known values if the API is unavailable.
    }
  }, 60_000);
});

onBeforeUnmount(() => {
  if (interval) clearInterval(interval);
  cancelAnimationFrame(frame);
});

const formatted = computed(() => formatNumber(shown.value));

const formattedToday = computed(() => formatNumber(shownToday.value));

const showToday = computed(() => shownToday.value >= MIN_TODAY);
</script>

<template>
  <div v-if="count && count.season > 0" class="poem-counter">
    <span class="poem-counter-icon" aria-hidden="true">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke="#f4cd60" stroke-width="1.8" stroke-linecap="round"
        stroke-linejoin="round">
        <path d="M20 4c-6 1-11 5-13 12l-2 4" />
        <path d="M20 4c0 6-4 11-11 12" />
        <path d="M9 16l-2-2" />
      </svg>
    </span>

    <p class="poem-counter-text">
      <span class="sr-only">
        {{ t('counter.season', { count: formatted }) }}
      </span>

      <span aria-hidden="true">
        {{ t('counter.before') }}
        <strong class="poem-counter-number">{{ formatted }}</strong>
        {{ t('counter.after') }}
      </span>

      <span v-if="showToday" class="poem-counter-today">
        <span class="poem-counter-dot" aria-hidden="true" />
        {{ t('counter.today', { count: formattedToday }) }}
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
