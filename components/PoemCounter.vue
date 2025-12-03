<script setup lang="ts">
import { computed } from 'vue';
import { useTimestamp } from '@vueuse/core';

const START_DATE = new Date('2025-11-18T00:00:00').getTime();
const END_DATE = new Date('2025-12-05T18:00:00').getTime(); // Pakjesavond peak
const START_COUNT = 5819;
const END_COUNT = 61944;

const timestamp = useTimestamp({ interval: 1000 });

const currentCount = computed(() => {
  const now = timestamp.value;

  if (now < START_DATE) return START_COUNT;
  if (now > END_DATE) return END_COUNT;

  const totalDuration = END_DATE - START_DATE;
  const elapsed = now - START_DATE;
  const progress = elapsed / totalDuration;

  // Cubic ease-in for acceleration (slower start, faster end)
  const easeProgress = Math.pow(progress, 3);

  const count =
    START_COUNT + (END_COUNT - START_COUNT) * easeProgress;
  return Math.floor(count);
});

// Format number with dots for thousands (Dutch style)
const formattedCount = computed(() => {
  return currentCount.value.toLocaleString('nl-NL');
});
</script>

<template>
  <div class="relative inline-block group">
    <!-- Outer glow effect -->
    <div class="absolute inset-0 bg-[#f4cd60]/20 rounded-lg blur-xl group-hover:blur-2xl transition-all duration-500"></div>

    <!-- Main scroll container -->
    <div class="scroll-container relative bg-gradient-to-br from-[#f8e4b8] via-[#f5dca8] to-[#e6cd9a] px-6 md:px-10 py-3 shadow-xl border-2 border-[#c0a070] transform transition-all duration-300 group-hover:scale-105">
      <!-- Paper texture overlay -->
      <div class="absolute inset-0 opacity-20 pointer-events-none rounded" style="background-image: url('data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E');"></div>

      <!-- Scroll Ends -->
      <div class="absolute top-0 bottom-0 -left-3 w-4 scroll-end-left"></div>
      <div class="absolute top-0 bottom-0 -right-3 w-4 scroll-end-right"></div>

      <!-- Inner decorative border -->
      <div class="absolute inset-1 border border-dashed border-[#c9b896]/40 rounded pointer-events-none"></div>

      <!-- Sparkle decorations -->
      <div class="absolute -top-1 -right-1 text-xs animate-pulse">✨</div>
      <div class="absolute -bottom-1 -left-1 text-xs animate-pulse" style="animation-delay: 0.5s">✨</div>

      <!-- Content -->
      <div class="flex flex-col items-center justify-center relative z-10 whitespace-nowrap">
        <span class="font-cinzel font-bold text-lg md:text-xl leading-none tracking-wide text-[#8b1538] drop-shadow-sm">
          {{ formattedCount }}
        </span>
        <span class="font-cinzel text-[10px] md:text-xs font-bold text-[#8b1538]/70 uppercase tracking-wider mt-1">
          Gedichten Gegenereerd
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.font-cinzel {
  font-family: 'Cinzel', serif;
}

.scroll-container {
  border-radius: 4px;
}

.scroll-end-left {
  background: linear-gradient(90deg, #d4b483 0%, #e6cd9a 50%, #d4b483 100%);
  border-left: 2px solid #a08050;
  border-top: 2px solid #c0a070;
  border-bottom: 2px solid #c0a070;
  border-radius: 50% 0 0 50%;
  box-shadow: inset 2px 0 4px rgba(0, 0, 0, 0.1);
}

.scroll-end-left::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 2px;
  transform: translateY(-50%);
  width: 2px;
  height: 60%;
  background: linear-gradient(180deg, transparent, #c9b896, transparent);
  border-radius: 2px;
}

.scroll-end-right {
  background: linear-gradient(90deg, #d4b483 0%, #e6cd9a 50%, #d4b483 100%);
  border-right: 2px solid #a08050;
  border-top: 2px solid #c0a070;
  border-bottom: 2px solid #c0a070;
  border-radius: 0 50% 50% 0;
  box-shadow: inset -2px 0 4px rgba(0, 0, 0, 0.1);
}

.scroll-end-right::before {
  content: '';
  position: absolute;
  top: 50%;
  right: 2px;
  transform: translateY(-50%);
  width: 2px;
  height: 60%;
  background: linear-gradient(180deg, transparent, #c9b896, transparent);
  border-radius: 2px;
}
</style>
