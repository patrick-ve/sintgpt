<script setup lang="ts">
import { EXAMPLE_POEMS, type ExampleStyle } from '~/utils/examplePoems';

const emit = defineEmits<{ start: [] }>();
const { t } = useI18n();

const styles: { value: ExampleStyle; key: string }[] = [
  { value: 'funny', key: 'funny' },
  { value: 'classic', key: 'classic' },
  { value: 'ironic', key: 'ironic' },
  { value: 'old-fashioned', key: 'oldFashioned' },
  { value: 'spicy', key: 'spicy' },
  { value: 'roast', key: 'roast' },
];

const selected = ref<ExampleStyle>('funny');

// The first Dutch example of the chosen style.
const example = computed(() =>
  EXAMPLE_POEMS.find(item => item.request.style === selected.value && item.request.language === 'dutch')
  ?? EXAMPLE_POEMS.find(item => item.request.style === selected.value)!,
);
</script>

<template>
  <section
    aria-labelledby="examples-title"
    class="relative z-10 bg-[#fbf3e2] text-[#3d0716] px-4 sm:px-6 pb-16 md:pb-20"
  >
    <div class="mx-auto max-w-[760px] flex flex-col gap-6">
      <div class="flex flex-col gap-2">
        <h2
          id="examples-title"
          class="font-display font-bold text-[1.75rem] md:text-[2.5rem] leading-tight text-[#8b1538] text-balance"
        >
          {{ t('examples.title') }}
        </h2>
        <p class="text-lg text-[#5c0f26]">{{ t('examples.intro') }}</p>
      </div>

      <div role="group" :aria-label="t('examples.styleLabel')" class="flex flex-wrap gap-2">
        <button
          v-for="style in styles"
          :key="style.value"
          type="button"
          class="style-chip"
          :aria-pressed="selected === style.value"
          @click="selected = style.value"
        >
          {{ t(`form.style.${style.key}`) }}
        </button>
      </div>

      <ExamplePoemCard :example="example" />

      <div class="flex flex-wrap items-center gap-x-6 gap-y-3">
        <button type="button" class="btn-festive min-h-12 px-6 text-lg" @click="emit('start')">
          {{ t('examples.cta') }}
        </button>
        <NuxtLink
          to="/voorbeelden"
          class="inline-flex items-center min-h-11 font-bold text-[#8b1538] underline decoration-[#d4a853] underline-offset-4"
        >
          {{ t('examples.more') }}
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.style-chip {
  min-height: 2.75rem;
  padding: 0 1rem;
  border: 2px solid #a08850;
  border-radius: 999px;
  background: #fff;
  color: #3d0716;
  font-weight: 700;
  cursor: pointer;
  transition-property: background-color, border-color, color;
  transition-duration: 150ms;
}
@media (hover: hover) {
  .style-chip:hover {
    border-color: #8b1538;
  }
}
.style-chip[aria-pressed='true'] {
  background: #8b1538;
  border-color: #8b1538;
  color: #fff8e7;
}
.style-chip:focus-visible {
  outline: 3px solid #8b1538;
  outline-offset: 2px;
}
</style>
