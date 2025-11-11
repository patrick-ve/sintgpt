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
  return props.error.statusMessage || 'Sorry, er is iets misgegaan.';
});

useHead({
  title: pageTitle,
});

const handleError = () => clearError({ redirect: '/app' });
</script>

<template>
  <div
    class="flex min-h-screen flex-col bg-primary-500 items-center justify-center bg-background p-4 text-center"
  >
    <UCard class="w-full max-w-md">
      <template #header>
        <h1 class="text-2xl font-bold text-primary sm:text-3xl">
          {{ pageTitle }}
        </h1>
      </template>

      <div class="space-y-4">
        <p
          class="text-6xl font-extrabold text-destructive text-primary-500"
        >
          {{ error.statusCode }}
        </p>
        <p class="text-muted-foreground">
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
        <UButton
          variant="solid"
          class="font-bold"
          size="lg"
          @click="handleError"
        >
          Terug naar Home
        </UButton>
      </template>
    </UCard>
  </div>
</template>
