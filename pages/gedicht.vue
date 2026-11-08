<script setup lang="ts">
import { poemDigest, decodePoem } from '~/utils/poemLink';

interface VerifiedShare {
  opening: string;
  language: 'nl' | 'en';
  digest: string;
}

const route = useRoute();

const { data: share } = await useFetch<VerifiedShare>('/api/share/verify', {
  query: {
    s: route.query.s,
    l: route.query.l,
    d: route.query.d,
    sig: route.query.sig,
  },
});

if (!share.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true });
}

const verified = share.value;
const query = new URLSearchParams(route.query as Record<string, string>).toString();

useSharedPoemMeta({
  opening: verified.opening,
  language: verified.language,
  imageQuery: query,
  url: `${useRequestURL().origin}/gedicht?${query}`,
});

// The whole poem is in the part of the link that only the browser can see.
// It shows only if it matches the digest that the server signed.
const fullPoem = ref<string | null>(null);
const isPartial = ref(false);

onMounted(async () => {
  const decoded = await decodePoem(window.location.hash.slice(1));
  if (decoded && (await poemDigest(decoded)) === verified.digest) {
    fullPoem.value = decoded.trim();
  } else {
    isPartial.value = true;
  }
});
</script>

<template>
  <SharedPoemView :poem="fullPoem ?? verified.opening" :partial="isPartial" />
</template>
