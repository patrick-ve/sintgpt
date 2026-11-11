<script setup lang="ts">
import { CHATGPT_POEMS } from '~/utils/chatgptPoems';
import { EXAMPLE_POEMS, type ExampleStyle } from '~/utils/examplePoems';

// The home page compares ChatGPT's poem with SintGPT's for the same request,
// one style at a time. Wide screens show both side by side; phones switch.
const emit = defineEmits<{ start: [] }>();
const { t } = useI18n();
const { track } = useAnalytics();

const styles: { value: ExampleStyle; key: string }[] = [
  { value: 'funny', key: 'funny' },
  { value: 'classic', key: 'classic' },
  { value: 'ironic', key: 'ironic' },
  { value: 'old-fashioned', key: 'oldFashioned' },
  { value: 'spicy', key: 'spicy' },
  { value: 'roast', key: 'roast' },
];

// The style labels start with an emoji ("😄 Grappig"). A plain space next to an
// emoji renders very narrow, so the chip puts a fixed gap between the two.
const chips = computed(() =>
  styles.map((style) => {
    const label = t(`form.style.${style.key}`);
    const space = label.indexOf(' ');
    return {
      ...style,
      emoji: space > 0 ? label.slice(0, space) : '',
      text: space > 0 ? label.slice(space + 1) : label,
    };
  }),
);

const selected = ref<ExampleStyle>('funny');
const shown = ref<'chatgpt' | 'sintgpt'>('chatgpt');

const choose = (style: ExampleStyle) => {
  selected.value = style;
  track('Show example', { detail: style });
};

// The first Dutch example of the chosen style.
const example = computed(() =>
  EXAMPLE_POEMS.find(item => item.request.style === selected.value && item.request.language === 'dutch')
  ?? EXAMPLE_POEMS.find(item => item.request.style === selected.value)!,
);

const chatgpt = computed(() => {
  const poem = CHATGPT_POEMS.find(item => item.exampleId === example.value.id);
  if (!poem) return null;
  const faults = new Set(poem.faults.map(fault => fault.line));
  return {
    prompt: poem.prompt,
    lines: poem.poem.split('\n').map((text, index) => ({ text, fault: faults.has(index) })),
  };
});
</script>

<template>
  <section
    aria-labelledby="examples-title"
    class="relative z-10 bg-[#fbf3e2] text-[#3d0716] px-4 sm:px-6 pt-14 pb-16 md:pt-18 md:pb-20"
  >
    <div class="mx-auto max-w-[760px] lg:max-w-[1120px] flex flex-col gap-6">
      <h2
        id="examples-title"
        class="font-display font-bold text-[1.75rem] md:text-[2.5rem] leading-tight text-[#8b1538] text-balance"
      >
        {{ t('examples.title') }}
      </h2>

      <div role="group" :aria-label="t('examples.styleLabel')" class="flex flex-wrap gap-2">
        <button
          v-for="chip in chips"
          :key="chip.value"
          type="button"
          class="style-chip"
          :aria-pressed="selected === chip.value"
          @click="choose(chip.value)"
        >
          <span v-if="chip.emoji" aria-hidden="true">{{ chip.emoji }}</span>
          <span>{{ chip.text }}</span>
        </button>
      </div>

      <div v-if="chatgpt" role="group" :aria-label="t('examples.showLabel')" class="poem-switch">
        <button type="button" :aria-pressed="shown === 'chatgpt'" @click="shown = 'chatgpt'">
          {{ t('examples.chatgpt') }}
        </button>
        <button type="button" :aria-pressed="shown === 'sintgpt'" @click="shown = 'sintgpt'">
          {{ t('examples.sintgpt') }}
        </button>
      </div>

      <div class="grid gap-8 items-start" :class="{ 'lg:grid-cols-2': chatgpt }">
        <div v-if="chatgpt" class="flex flex-col gap-3.5" :class="{ 'max-lg:hidden': shown !== 'chatgpt' }">
          <h3 class="text-[1.375rem] font-bold text-[#3d0716] max-lg:sr-only">{{ t('examples.chatgpt') }}</h3>
          <article lang="nl" class="chatgpt-card" :aria-label="t('examples.chatgptPoem')">
            <p class="chatgpt-request"><span class="sr-only">{{ t('examples.request') }}: </span>{{ chatgpt.prompt }}</p>
            <p class="chatgpt-text"><span v-for="(line, index) in chatgpt.lines" :key="index" class="chatgpt-line"><span :class="{ 'chatgpt-fault': line.fault }">{{ line.text }}</span><span v-if="line.fault" class="sr-only"> ({{ t('examples.fault') }})</span></span></p>
          </article>
          <button
            type="button"
            class="read-sintgpt lg:hidden"
            @click="shown = 'sintgpt'"
          >
            {{ t('examples.readSintgpt') }}
          </button>
        </div>

        <div class="flex flex-col gap-3.5" :class="{ 'max-lg:hidden': chatgpt && shown !== 'sintgpt' }">
          <h3 v-if="chatgpt" class="text-[1.375rem] font-bold text-[#3d0716] max-lg:sr-only">{{ t('examples.sintgpt') }}</h3>
          <ExamplePoemCard :example="example" :heading-level="chatgpt ? 'h4' : 'h3'" :show-details="false" />
        </div>
      </div>

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
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
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
.style-chip:focus-visible,
.poem-switch button:focus-visible,
.read-sintgpt:focus-visible {
  outline: 3px solid #8b1538;
  outline-offset: 2px;
}

/* Phones: one poem at a time. Hidden here, not with lg:hidden: scoped CSS beats Tailwind utilities. */
.poem-switch {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
  padding: 4px;
  background: #efe2c4;
  border-radius: 14px;
}
@media (min-width: 64rem) {
  .poem-switch {
    display: none;
  }
}
.poem-switch button {
  min-height: 2.75rem;
  padding: 0 0.625rem;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #5c0f26;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
}
.poem-switch button[aria-pressed='true'] {
  background: #fff;
  color: #3d0716;
  box-shadow: 0 1px 3px rgb(61 7 22 / 0.18);
}
.read-sintgpt {
  min-height: 3rem;
  padding: 0 1.25rem;
  border: 2px solid #8b1538;
  border-radius: 12px;
  background: #fff;
  color: #8b1538;
  font-weight: 700;
  font-size: 1.0625rem;
  cursor: pointer;
}

/* ChatGPT's answer looks like a plain chat: a request bubble, then the reply. */
.chatgpt-card {
  display: flex;
  flex-direction: column;
  gap: 1.125rem;
  padding: 1.5rem;
  background: #fff;
  border: 1px solid #dcd7cc;
  border-radius: 18px;
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  color: #1f1f1f;
}
@media (max-width: 40rem) {
  .chatgpt-card {
    padding: 1.125rem 1rem;
  }
}
.chatgpt-request {
  margin: 0 0 0 auto;
  max-width: 88%;
  padding: 0.75rem 1rem;
  background: #efede8;
  border-radius: 18px;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #2b2b2b;
}
.chatgpt-text {
  margin: 0;
  font-size: 1rem;
  line-height: 1.7;
}
/* A wrapped line hangs under its verse line, as on the SintGPT card. */
.chatgpt-line {
  display: block;
  min-height: 1lh;
  padding-inline-start: 0.9em;
  text-indent: -0.9em;
}
.chatgpt-fault {
  text-decoration: underline wavy #a3360a;
  text-decoration-thickness: 1.5px;
  text-underline-offset: 5px;
}
</style>
