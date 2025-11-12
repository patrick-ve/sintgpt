<template>
  <div>
    <NuxtLoadingIndicator :height="3" :color="'#40939a'" />

    <UApp>
      <NuxtErrorBoundary @error="logClientError">
        <template #error="{ error, clearError }">
          <div class="p-4 text-center bg-primary-500">
            <h3 class="text-lg font-semibold text-red-600">
              Oeps! Er ging iets mis.
            </h3>
            <p class="mt-4 text-sm text-gray-700">
              Er is een fout opgetreden bij het weergeven van dit
              gedeelte van de pagina.
            </p>
            <p
              v-if="error.message"
              class="mt-2 text-xs text-gray-500"
            >
              Fout: {{ error.message }}
            </p>

            <UButton
              class="mt-4"
              variant="outline"
              color="neutral"
              size="sm"
              @click="clearError"
            >
              Probeer opnieuw
            </UButton>
          </div>
        </template>
      </NuxtErrorBoundary>

      <NuxtPage />
    </UApp>
  </div>
</template>

<script setup lang="ts">
import { consola } from 'consola';

useHead({
  script: [
    {
      defer: true,
      src: 'https://cloud.umami.is/script.js',
      'data-website-id': 'd1e0319e-4736-4487-9be1-34f3878278eb',
    },
  ],
});

function logClientError(error: unknown) {
  consola.error(error);
}

// Redirect to Rick Astley when devtools are opened
useDisableDevTools().config.onDetectOpen = () => {
  window.location.href = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
};
</script>

<style>
* {
  font-family: 'Funnel Sans', serif;
}

h1,
h2,
h3,
h4,
h5,
h6 {
  font-family: 'Ranchers', serif;
  letter-spacing: 0.1em;
}
</style>
