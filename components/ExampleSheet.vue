<script setup lang="ts">
import type { ExamplePoem } from '~/utils/examplePoems';
import { EXAMPLE_SHEET_HEIGHT, EXAMPLE_SHEET_WIDTH, exampleSheet } from '~/utils/exampleSheets';
import { STYLE_PARAM, STYLE_PRESETS } from '~/utils/stylePreset';

// One example on /voorbeelden as a sheet of paper: the front is page 1 of the
// real PDF in its design, the back is what the Sint knew (the form input).
// "Wat wist de Sint?" turns the sheet over. The poem is also on the page as
// text, for small screens, search engines and screen readers.
const props = defineProps<{
  example: ExamplePoem;
  heading: string;
  /** Load the picture at once (the first sheets on the page). */
  eager?: boolean;
}>();

const { t } = useI18n();
const { track } = useAnalytics();

const styleKeys: Record<ExamplePoem['request']['style'], string> = {
  funny: 'funny',
  classic: 'classic',
  ironic: 'ironic',
  'old-fashioned': 'oldFashioned',
  spicy: 'spicy',
  roast: 'roast',
};

const request = computed(() => props.example.request);
const sheet = computed(() => exampleSheet(props.example.id));
const designName = computed(() => t(`poem.pdfDesign.${sheet.value.design}.name`));
const styleLabel = computed(() => t(`form.style.${styleKeys[request.value.style]}`));
// The label starts with an emoji ("😄 Grappig"). A plain space next to an emoji
// renders very narrow, so the template puts a fixed gap between the two.
const style = computed(() => {
  const space = styleLabel.value.indexOf(' ');
  return space > 0
    ? { emoji: styleLabel.value.slice(0, space), text: styleLabel.value.slice(space + 1) }
    : { emoji: '', text: styleLabel.value };
});
const lang = computed(() => (request.value.language === 'english' ? 'en' : 'nl'));
const lines = computed(() => props.example.poem.split('\n'));
const tryLink = computed(() => {
  const word = Object.keys(STYLE_PRESETS).find(key => STYLE_PRESETS[key] === request.value.style);
  return word ? `/?${STYLE_PARAM}=${word}#poem-form` : '/#poem-form';
});

const sheetId = computed(() => `sheet-${props.example.id}`);
const turned = ref(false);

const turn = () => {
  turned.value = !turned.value;
  if (turned.value) track('Show example', { detail: `back:${props.example.id}` });
};

// A click anywhere on the sheet turns it, except on the link on the back.
const onSheetClick = (event: MouseEvent) => {
  if ((event.target as HTMLElement).closest('a, button')) return;
  turn();
};

const onText = (event: Event) => {
  if ((event.target as HTMLDetailsElement).open) track('Show example', { detail: `text:${props.example.id}` });
};
</script>

<template>
  <article class="example-sheet" :aria-labelledby="`${example.id}-title`">
    <header class="flex flex-col gap-1">
      <p class="style-label text-[0.8125rem] font-bold tracking-[0.06em] uppercase text-[#8b1538]">
        <span v-if="style.emoji" aria-hidden="true">{{ style.emoji }}</span><span>{{ style.text }}</span>
      </p>
      <h2 :id="`${example.id}-title`" class="font-display font-bold text-[1.625rem] md:text-[1.75rem] leading-tight text-[#8b1538] text-balance">
        {{ heading }}
      </h2>
      <p class="text-[0.9375rem] text-[#5c0f26]">
        {{ t('poem.title', { name: request.name }) }} · {{ t('examples.design', { design: designName }) }}
      </p>
    </header>

    <div class="sheet" :class="{ turned }">
      <!-- First in the DOM, so a screen reader reads the side it just showed next. -->
      <button
        type="button"
        class="turn-button"
        :aria-controls="sheetId"
        @click="turn"
      >
        <UIcon name="i-heroicons-arrow-path" class="turn-icon size-5" aria-hidden="true" />
        {{ turned ? t('examples.turnBack') : t('examples.turn') }}
      </button>

      <!-- A mouse click on the page turns it too; the button above does it for the keyboard. -->
      <div :id="sheetId" class="sheet-inner" @click="onSheetClick">
        <div class="face face-front" :inert="turned || undefined">
          <img
            :src="sheet.src"
            :srcset="sheet.srcset"
            sizes="(min-width: 1024px) 520px, min(560px, calc(100vw - 2rem))"
            :alt="t('examples.sheetAlt', { name: request.name, design: designName })"
            :width="EXAMPLE_SHEET_WIDTH"
            :height="EXAMPLE_SHEET_HEIGHT"
            :loading="eager ? 'eager' : 'lazy'"
            decoding="async"
          >
        </div>

        <div class="face face-back" :inert="!turned || undefined" :lang="lang">
          <p class="back-title">{{ t('examples.knew') }}</p>
          <dl class="back-list">
            <div>
              <dt>{{ t('examples.for') }}</dt>
              <dd class="back-value">{{ request.name }}</dd>
            </div>
            <div v-if="request.present">
              <dt>{{ t('examples.present') }}</dt>
              <dd class="back-value">
                {{ request.present }}<span v-if="request.revealPresent === false" class="back-note"> ({{ t('examples.secret') }})</span>
              </dd>
            </div>
            <div v-if="request.funFacts">
              <dt>{{ t('examples.facts') }}</dt>
              <dd class="back-value">{{ request.funFacts }}</dd>
            </div>
            <div v-if="request.writtenBy">
              <dt>{{ t('examples.writtenBy') }}</dt>
              <dd class="back-value">{{ request.writtenBy }}</dd>
            </div>
            <div v-if="request.writtenForAudience">
              <dt>{{ t('examples.audience') }}</dt>
              <dd class="back-value">{{ request.writtenForAudience }}</dd>
            </div>
            <div>
              <dt>{{ t('examples.choices') }}</dt>
              <dd class="back-chips">
                <span class="style-label"><span v-if="style.emoji" aria-hidden="true">{{ style.emoji }}</span><span>{{ style.text }}</span></span>
                <span>{{ request.rhymeScheme }}</span>
                <span>{{ t('examples.lines', { count: request.lines }) }}</span>
                <span v-if="request.language === 'english'">{{ t('examples.english') }}</span>
              </dd>
            </div>
          </dl>
          <NuxtLink :to="tryLink" :data-cta="`voorbeelden:${example.id}`" class="back-cta">
            {{ t('examples.tryStyle') }} →
          </NuxtLink>
        </div>
      </div>
    </div>

    <details class="as-text" @toggle="onText">
      <summary>{{ t('examples.asText') }}</summary>
      <p class="as-text-poem" :lang="lang"><span v-for="(line, index) in lines" :key="index" class="as-text-line">{{ line }}</span></p>
    </details>
  </article>
</template>

<style scoped>
.example-sheet {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
  max-width: 560px;
  margin-inline: auto;
}

/* The sheet: two faces of one A4 page that turns over around its middle. */
.style-label {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}

.sheet {
  position: relative;
  perspective: 1800px;
  /* The back scales its text and margins with the width of the sheet (cqw). */
  container-type: inline-size;
  /* Room for the button that hangs over the bottom edge. */
  padding-bottom: 1.5rem;
}

/*
 * Both faces share one grid cell: the sheet is A4, and only grows when the back
 * needs more room (very narrow screens). The front picture then fills it.
 */
.sheet-inner {
  position: relative;
  z-index: 1;
  display: grid;
  transform-style: preserve-3d;
  transition: transform 700ms cubic-bezier(0.3, 0.7, 0.2, 1);
  cursor: pointer;
}
.turned .sheet-inner {
  transform: rotateY(180deg);
}

.face {
  grid-area: 1 / 1;
  overflow: hidden;
  border-radius: 4px;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  box-shadow:
    0 1px 2px rgb(61 7 22 / 0.12),
    0 24px 48px -20px rgb(61 7 22 / 0.45);
}

.face-front {
  aspect-ratio: 595 / 842;
}
.face-front img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* The back of the page: the note with what the Sint knew. */
.face-back {
  transform: rotateY(180deg);
  display: flex;
  flex-direction: column;
  gap: 3.5cqw;
  /* The bottom keeps the link clear of the button that hangs over the edge. */
  padding: 7cqw 7cqw calc(4cqw + 1.25rem) 8cqw;
  background:
    linear-gradient(to right, transparent calc(8cqw - 14px), #e8a0a8 calc(8cqw - 14px), #e8a0a8 calc(8cqw - 13px), transparent calc(8cqw - 13px)),
    #fffaf0;
  color: #3d2914;
}

.back-title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(1.125rem, 6cqw, 1.875rem);
  line-height: 1.15;
  color: #8b1538;
}

.back-list {
  display: flex;
  flex-direction: column;
  gap: clamp(0.375rem, 2.6cqw, 1rem);
}
.back-list dt {
  font-size: clamp(0.6875rem, 2.4cqw, 0.8125rem);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #8b1538;
}
.back-value {
  margin: 0.125rem 0 0;
  padding-bottom: 0.25rem;
  border-bottom: 1px dashed #d9c49a;
  font-family: var(--font-text);
  font-size: clamp(0.875rem, 3.6cqw, 1.1875rem);
  line-height: 1.35;
  text-wrap: pretty;
}
.back-note {
  color: #6b5a48;
}
.back-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin: 0.375rem 0 0;
}
.back-chips > span {
  padding: 0.125rem 0.625rem;
  border: 1.5px solid #a08850;
  border-radius: 999px;
  background: #fff;
  font-size: clamp(0.8125rem, 2.8cqw, 0.9375rem);
  font-weight: 700;
  white-space: nowrap;
}

.back-cta {
  margin-top: auto;
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
  font-weight: 700;
  color: #8b1538;
  text-decoration: underline;
  text-decoration-color: #d4a853;
  text-underline-offset: 4px;
}
.back-cta:focus-visible {
  outline: 3px solid #8b1538;
  outline-offset: 2px;
}

/* The button hangs over the bottom edge, like a label clipped to the page. */
.turn-button {
  position: absolute;
  z-index: 2;
  left: 50%;
  bottom: 0;
  translate: -50% -0.25rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  padding: 0 1.125rem;
  border: 2px solid #3d0716;
  border-radius: 999px;
  background: #f4cd60;
  color: #3d0716;
  font-weight: 700;
  font-size: 1rem;
  white-space: nowrap;
  cursor: pointer;
  box-shadow: 0 6px 16px -6px rgb(61 7 22 / 0.5);
  transition-property: background-color, scale;
  transition-duration: 150ms;
  transition-timing-function: ease-out;
}
.turn-button:active {
  scale: 0.96;
}
@media (hover: hover) {
  .turn-button:hover {
    background: #ffe08a;
  }
}
.turn-button:focus-visible {
  outline: 3px solid #8b1538;
  outline-offset: 3px;
}
.turn-icon {
  transition: rotate 700ms cubic-bezier(0.3, 0.7, 0.2, 1);
}
.turned .turn-icon {
  rotate: 180deg;
}

/* Reduced motion: no turn, the back fades in over the front. */
@media (prefers-reduced-motion: reduce) {
  .sheet-inner,
  .turned .sheet-inner {
    transform: none;
    transition: none;
  }
  .face {
    transition: opacity 150ms linear;
  }
  .face-back {
    transform: none;
    opacity: 0;
  }
  .turned .face-front {
    opacity: 0;
  }
  .turned .face-back {
    opacity: 1;
  }
  .turn-icon,
  .turned .turn-icon {
    transition: none;
    rotate: none;
  }
}

/* The poem as text. */
.as-text summary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  font-weight: 700;
  color: #8b1538;
  cursor: pointer;
  list-style: none;
}
.as-text summary::-webkit-details-marker {
  display: none;
}
.as-text summary::before {
  content: '';
  width: 0.5rem;
  height: 0.5rem;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  rotate: -45deg;
  transition: rotate 150ms ease-out;
}
.as-text[open] summary::before {
  rotate: 45deg;
}
.as-text summary:focus-visible {
  outline: 3px solid #8b1538;
  outline-offset: 2px;
}
.as-text-poem {
  margin: 0.5rem 0 0;
  padding: 1.25rem 1.5rem;
  background: #fffaf0;
  border: 1px solid #e6d5b0;
  border-radius: 6px;
  font-family: var(--font-text);
  font-size: 1.0625rem;
  line-height: 1.6;
  color: #3d2914;
}
/* A wrapped line hangs under its verse line; an empty line keeps the stanza gap. */
.as-text-line {
  display: block;
  min-height: 1lh;
  padding-inline-start: 0.9em;
  text-indent: -0.9em;
}
</style>
