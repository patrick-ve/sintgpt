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

function logClientError(error: unknown) {
  consola.error(error);
}
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
