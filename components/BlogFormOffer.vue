<script setup lang="ts">
/**
 * An offer to let the Sint write the poem, high up in a blog post: for readers
 * who came for one line (an opening, a rhyme) and would rather have the whole
 * poem. `cta` is the `data-cta` of the link, `blog:<slug>:blok`.
 */
defineProps<{
  cta: string;
  title: string;
  /** Where the link goes; a `?stijl=` or `?voor=` preset may go before the hash. */
  to?: string;
}>();
</script>

<template>
  <aside class="form-offer" :aria-label="title">
    <p class="form-offer-title">{{ title }}</p>
    <p class="form-offer-text"><slot /></p>
    <NuxtLink :to="to ?? '/#poem-form'" :data-cta="cta" class="form-offer-link">
      Laat de Sint je gedicht schrijven
      <span aria-hidden="true">→</span>
    </NuxtLink>
  </aside>
</template>

<style scoped>
/* `.form-offer .x`: beats the paragraph rules of BlogPost (`.article-body :deep(p)`). */
.form-offer {
  display: grid;
  justify-items: start;
  gap: 0.5rem;
  margin: 1.5rem 0 2rem;
  padding: 1.125rem 1.25rem;
  background: #fffbee;
  border: 1px solid #d9c596;
  border-left: 4px solid #8b1538;
  border-radius: 6px;
}

.form-offer .form-offer-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.3;
  color: #8b1538;
}

.form-offer .form-offer-text {
  margin: 0;
  font-family: var(--font-text);
  font-size: 1.0625rem;
  line-height: 1.55;
  color: #2b1b12;
  text-wrap: pretty;
}

.form-offer-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  margin-top: 0.25rem;
  padding: 0.5rem 1.125rem;
  font-family: var(--font-display);
  font-weight: 700;
  color: #fff8e7;
  background: #8b1538;
  border-radius: 6px;
  text-decoration: none;
  transition-property: background-color;
  transition-duration: 150ms;
}

.form-offer-link:hover {
  background: #6e1030;
}

.form-offer-link:focus-visible {
  outline: 2px solid #8b1538;
  outline-offset: 3px;
}
</style>
