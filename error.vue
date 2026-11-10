<script setup lang="ts">
import type { NuxtError } from '#app';

const props = defineProps({
  error: {
    type: Object as () => NuxtError,
    required: true,
  },
});

const pageTitle = computed(() => {
  return props.error.statusCode === 404
    ? 'Pagina niet gevonden'
    : 'Er is een fout opgetreden';
});

const message = computed(() => {
  if (props.error.statusCode === 404) return 'Deze pagina bestaat niet (meer). Kies hieronder waar je heen wilt.';
  return props.error.statusMessage || 'Sorry, er is iets misgegaan.';
});

useHead({
  title: () => `${pageTitle.value} | SintGPT`,
});

// Real links, so crawlers and visitors without JavaScript can go on. With
// JavaScript, the click clears the error first.
const links = [
  { to: '/', label: 'Sinterklaasgedicht maken' },
  { to: '/voorbeelden', label: 'Voorbeelden' },
  { to: '/blog', label: 'Blog' },
  { to: '/lootjes', label: 'Lootjes trekken' },
];

const go = (to: string) => clearError({ redirect: to });
</script>

<template>
  <div
    class="flex min-h-screen flex-col items-center justify-center bg-[#3d0716] p-4 text-center"
  >
    <UCard class="w-full max-w-md">
      <template #header>
        <h1 class="text-2xl font-bold text-[#8b1538] sm:text-3xl">
          {{ pageTitle }}
        </h1>
      </template>

      <div class="space-y-4">
        <p
          class="font-display text-6xl font-bold text-[#8b1538]"
        >
          {{ error.statusCode }}
        </p>
        <p class="text-[#3b2a1f] text-pretty">
          {{ message }}
        </p>
        <p
          v-if="error.message && error.statusCode !== 404"
          class="text-sm text-muted-foreground"
        >
          Foutdetails: {{ error.message }}
        </p>
      </div>

      <template #footer>
        <nav aria-label="Verder naar">
          <ul class="flex flex-wrap justify-center gap-3">
            <li v-for="(link, index) in links" :key="link.to">
              <a
                :href="link.to"
                class="error-link"
                :class="{ 'error-link-primary': index === 0 }"
                @click.prevent="go(link.to)"
              >
                {{ link.label }}
              </a>
            </li>
          </ul>
        </nav>
      </template>
    </UCard>
  </div>
</template>

<style scoped>
.error-link {
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
  padding: 0 1rem;
  border: 2px solid #8b1538;
  border-radius: 0.5rem;
  color: #8b1538;
  font-weight: 700;
}
.error-link-primary {
  background: #8b1538;
  color: #fff8e7;
}
.error-link:focus-visible {
  outline: 3px solid #8b1538;
  outline-offset: 2px;
}
</style>
