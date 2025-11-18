<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
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
    <!-- Paper Scroll Background -->
    <div
      class="bg-[#f8e4b8] text-red-900 px-8 py-2 relative shadow-lg border-2 border-[#d4b483] transform transition-transform hover:scale-105 duration-300"
      style="border-radius: 2px 2px 2px 2px"
    >
      <!-- Scroll Ends (CSS shapes) -->
      <div
        class="absolute top-0 bottom-0 -left-3 w-4 bg-[#e6cd9a] border-l border-t border-b border-[#c0a070] rounded-l-full shadow-inner flex items-center justify-center overflow-hidden"
      >
        <div class="w-1 h-[80%] bg-[#d4b483]/30 rounded-full"></div>
      </div>
      <div
        class="absolute top-0 bottom-0 -right-3 w-4 bg-[#e6cd9a] border-r border-t border-b border-[#c0a070] rounded-r-full shadow-inner flex items-center justify-center overflow-hidden"
      >
        <div class="w-1 h-[80%] bg-[#d4b483]/30 rounded-full"></div>
      </div>

      <!-- Content -->
      <div class="flex flex-col items-center justify-center">
        <span
          class="font-cinzel font-bold text-lg md:text-xl leading-none tracking-wide"
        >
          {{ formattedCount }}
        </span>
        <span
          class="font-cinzel text-xs md:text-sm font-bold opacity-80 uppercase tracking-wider mt-0.5"
        >
          Gedichten Gegenereerd
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Optional: Add a subtle texture or gradient to the scroll if needed */
</style>
