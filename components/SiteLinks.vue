<script setup lang="ts">
// A short link bar for pages without the big footer (lootjes, voorbeelden,
// privacy, voorwaarden), so every page links to the main sections.
const { t } = useI18n();
const route = useRoute();

const links = computed(() => [
  { to: '/', label: t('siteLinks.home') },
  { to: '/voorbeelden', label: t('footer.examples') },
  { to: '/blog', label: t('siteLinks.blog') },
  { to: '/lootjes', label: t('footer.lootjes') },
  { to: '/privacy', label: t('footer.privacy') },
  { to: '/voorwaarden', label: t('footer.terms') },
].filter(link => link.to !== route.path));
</script>

<template>
  <footer class="border-t-[6px] border-[#d4a853] bg-[#3d0716]">
    <nav :aria-label="t('footer.nav')" class="mx-auto max-w-[1240px] px-4 sm:px-6 py-6">
      <ul class="flex flex-wrap gap-x-6 gap-y-1">
        <li v-for="link in links" :key="link.to">
          <NuxtLink :to="link.to" class="site-link">{{ link.label }}</NuxtLink>
        </li>
      </ul>
    </nav>
  </footer>
</template>

<style scoped>
.site-link {
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
  font-weight: 700;
  color: #f4cd60;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.site-link:focus-visible {
  outline: 3px solid #f4cd60;
  outline-offset: 2px;
}
</style>
