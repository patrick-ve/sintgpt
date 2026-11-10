<script setup lang="ts">
import type { ExamplePoem } from '~/utils/examplePoems';

const props = withDefaults(
  defineProps<{ example: ExamplePoem; headingLevel?: 'h2' | 'h3' | 'h4'; showDetails?: boolean }>(),
  { headingLevel: 'h3', showDetails: true },
);

const { t } = useI18n();

const styleKeys: Record<ExamplePoem['request']['style'], string> = {
  funny: 'funny',
  classic: 'classic',
  ironic: 'ironic',
  'old-fashioned': 'oldFashioned',
  spicy: 'spicy',
  roast: 'roast',
};

const request = computed(() => props.example.request);
const lines = computed(() => props.example.poem.split('\n'));
</script>

<template>
  <article class="example-letter" :lang="request.language === 'english' ? 'en' : 'nl'">
    <p class="text-[0.8125rem] font-bold tracking-[0.06em] uppercase text-[#8b1538]">
      {{ t(`form.style.${styleKeys[request.style]}`) }}
    </p>
    <component
      :is="headingLevel"
      class="font-display font-bold text-[1.75rem] leading-tight text-[#8b1538] break-words"
    >
      {{ t('poem.title', { name: request.name }) }}
    </component>

    <p class="example-text"><span v-for="(line, index) in lines" :key="index" class="example-line">{{ line }}</span></p>

    <dl v-if="showDetails" class="example-details">
      <div v-if="request.present">
        <dt>{{ t('examples.present') }}</dt>
        <dd>
          {{ request.present }}<template v-if="request.revealPresent === false"> ({{ t('examples.secret') }})</template>
        </dd>
      </div>
      <div v-if="request.funFacts">
        <dt>{{ t('examples.facts') }}</dt>
        <dd>{{ request.funFacts }}</dd>
      </div>
      <div v-if="request.writtenBy">
        <dt>{{ t('examples.writtenBy') }}</dt>
        <dd>{{ request.writtenBy }}</dd>
      </div>
      <div v-if="request.writtenForAudience">
        <dt>{{ t('examples.audience') }}</dt>
        <dd>{{ request.writtenForAudience }}</dd>
      </div>
      <div>
        <dt>{{ t('examples.rhyme') }}</dt>
        <dd>
          {{ request.rhymeScheme }}, {{ t('examples.lines', { count: request.lines }) }}<template v-if="request.language === 'english'">, {{ t('examples.english') }}</template>
        </dd>
      </div>
    </dl>
  </article>
</template>

<style scoped>
.example-letter {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 2rem 2.5rem 2.25rem;
  background: #fffaf0;
  border: 1px solid #e6d5b0;
  border-radius: 6px;
  box-shadow:
    0 1px 2px rgb(61 7 22 / 0.08),
    0 24px 48px -20px rgb(61 7 22 / 0.35);
  color: #3d2914;
}
@media (max-width: 40rem) {
  .example-letter {
    padding: 1.75rem 1.25rem;
  }
}

.example-text {
  font-family: var(--font-text);
  line-height: 1.6;
  font-size: 1.0625rem;
  margin: 0;
}
@media (min-width: 40rem) {
  .example-text {
    font-size: 1.1875rem;
  }
}

/* A wrapped line hangs under its verse line; an empty line keeps the stanza gap. */
.example-line {
  display: block;
  min-height: 1lh;
  padding-inline-start: 0.9em;
  text-indent: -0.9em;
}

.example-details {
  display: grid;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e6d5b0;
  font-size: 0.9375rem;
  color: #5c0f26;
}
.example-details dt {
  display: inline;
  font-weight: 700;
}
.example-details dt::after {
  content: ': ';
}
.example-details dd {
  display: inline;
  margin: 0;
}
</style>
