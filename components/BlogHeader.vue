<script setup lang="ts">
/**
 * The bar above the blog index and every blog post: the logo, links to the
 * main sections and one button to the poem form.
 */
defineProps<{
  /** `data-cta` of the button, so analytics sees which page sent the writer. */
  cta: string;
}>();
</script>

<template>
  <header class="border-b border-[#d9c596]">
    <div class="mx-auto flex max-w-[1120px] items-center justify-between gap-3 px-4 py-4 sm:px-6">
      <NuxtLink to="/" class="blog-focus flex min-h-11 items-center gap-2.5 text-[#8b1538]">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">
          <path d="M12 2.5c3.2 3 5 6 5 9.5V20H7v-8c0-3.5 1.8-6.5 5-9.5z" />
          <path d="M12 8v9M9 12.5h6" />
        </svg>
        <span class="font-display text-[26px] font-bold leading-none">SintGPT</span>
      </NuxtLink>
      <nav aria-label="Hoofdmenu" class="flex items-center gap-x-7 font-medium text-[#2b1b12]">
        <NuxtLink to="/voorbeelden" class="blog-focus hidden py-2.5 hover:text-[#8b1538] sm:block">Voorbeelden</NuxtLink>
        <NuxtLink to="/lootjes" class="blog-focus hidden py-2.5 hover:text-[#8b1538] sm:block">Lootjes trekken</NuxtLink>
        <NuxtLink
          to="/blog"
          class="blog-focus hidden py-2.5 font-bold text-[#8b1538] underline decoration-2 underline-offset-[6px] sm:block"
        >
          Blog
        </NuxtLink>
        <NuxtLink
          to="/#poem-form"
          :data-cta="cta"
          class="blog-focus whitespace-nowrap rounded-md bg-[#8b1538] px-4 py-2.5 font-display sm:px-5 font-bold text-[#fff8e7] transition-colors hover:bg-[#6e1030]"
        >
          Schrijf een gedicht
        </NuxtLink>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.blog-focus:focus-visible {
  outline: 2px solid #8b1538;
  outline-offset: 3px;
  border-radius: 4px;
}
</style>
