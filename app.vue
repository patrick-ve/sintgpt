<template>
  <div>
    <NuxtLoadingIndicator :height="3" :color="'#40939a'" />

    <UApp>
      <NuxtErrorBoundary @error="logClientError">
        <template #error="{ error, clearError }">
          <div class="p-4 text-center bg-primary-500">
            <h3 class="text-lg font-semibold text-red-600">
              {{ t('error.title') }}
            </h3>
            <p class="mt-4 text-sm text-gray-700">
              {{ t('error.message') }}
            </p>
            <p
              v-if="error.message"
              class="mt-2 text-xs text-gray-500"
            >
              {{ t('error.label') }}: {{ error.message }}
            </p>

            <UButton
              class="mt-4"
              variant="outline"
              color="neutral"
              size="sm"
              @click="clearError"
            >
              {{ t('error.retry') }}
            </UButton>
          </div>
        </template>
      </NuxtErrorBoundary>

      <NuxtPage />
      <ClientOnly>
        <CookieBanner />
      </ClientOnly>
    </UApp>
  </div>
</template>

<script setup lang="ts">
import { consola } from 'consola';

const { t, locale } = useI18n();

useHead({
  htmlAttrs: { lang: locale },
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

</script>

