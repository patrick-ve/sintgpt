<script setup lang="ts">
/** The footer of the blog index and every blog post. */
defineProps<{
  /** Blog posts link back to the index; the index does not link to itself. */
  blogLink?: boolean;
}>();

const year = new Date().getFullYear();
</script>

<template>
  <footer class="bg-[#3d0a19] text-[#f7dfc0]">
    <div class="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-x-8 gap-y-4 px-6 pb-12 pt-9">
      <nav aria-label="Voettekst" class="flex flex-wrap gap-x-6 gap-y-1 font-medium">
        <NuxtLink to="/" class="footer-link">Sinterklaasgedicht maken</NuxtLink>
        <NuxtLink to="/voorbeelden" class="footer-link">Voorbeelden</NuxtLink>
        <NuxtLink v-if="blogLink" to="/blog" class="footer-link">Blog</NuxtLink>
        <NuxtLink to="/lootjes" class="footer-link">Lootjes trekken</NuxtLink>
        <NuxtLink to="/privacy" class="footer-link">Privacy</NuxtLink>
        <NuxtLink to="/voorwaarden" class="footer-link">Voorwaarden</NuxtLink>
      </nav>
      <p class="text-base">Copyright {{ year }} SintGPT. Alle rechten voorbehouden.</p>
    </div>
  </footer>
</template>

<style scoped>
.footer-link {
  padding: 10px 0;
  text-decoration: underline;
  text-underline-offset: 4px;
}
.footer-link:hover {
  color: #f4cd60;
}
.footer-link:focus-visible {
  outline: 2px solid #f4cd60;
  outline-offset: 3px;
  border-radius: 4px;
}
</style>
