<script setup lang="ts">
import type { PoemShare } from '~/utils/poemLink';

interface StoredPoem {
  opening: string;
  language: 'nl' | 'en';
  share: PoemShare;
  poem: string;
}

const route = useRoute();
const { data } = await useFetch<StoredPoem>(`/api/share/links/${route.params.id}`);

// Also an expired link: stored poems remove themselves after 90 days.
if (!data.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true });
}

const stored = data.value;

useSharedPoemMeta({
  opening: stored.opening,
  language: stored.language,
  imageQuery: new URLSearchParams({ ...stored.share }).toString(),
  url: useRequestURL().href,
});
</script>

<template>
  <SharedPoemView :poem="stored.poem.trim()" />
</template>
