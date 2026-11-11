<script setup lang="ts">
import { EXAMPLE_POEMS } from '~/utils/examplePoems';
import { PDF_SHOWCASE, PDF_SHOWCASE_HEIGHT, PDF_SHOWCASE_WIDTH, pdfShowcaseImage } from '~/utils/pdfShowcase';

// An endless row of the PDF designs, each with a different example poem.
// The row moves only without reduced motion and stops on hover. With reduced
// motion it is a row that scrolls by hand.
const emit = defineEmits<{ start: [] }>();
const { t } = useI18n();

const items = PDF_SHOWCASE.map(({ design, exampleId }) => {
  const example = EXAMPLE_POEMS.find(item => item.id === exampleId)!;
  return {
    design,
    name: example.request.name,
    src: pdfShowcaseImage(design),
  };
});
</script>

<template>
  <section
    aria-labelledby="pdf-showcase-title"
    class="relative z-10 bg-[#3d0716] text-[#fbf1dc] py-14 md:py-18 overflow-hidden"
  >
    <div class="mx-auto max-w-[1240px] px-4 sm:px-6 flex flex-col gap-3">
      <h2
        id="pdf-showcase-title"
        class="font-display font-bold text-[1.75rem] md:text-[2.5rem] leading-tight text-[#f4cd60] text-balance"
      >
        {{ t('pdfShowcase.title') }}
      </h2>
      <p class="text-lg leading-normal text-[#f7e6c0] max-w-[40em] text-pretty">
        {{ t('pdfShowcase.intro') }}
      </p>
    </div>

    <div class="marquee mt-8">
      <div class="marquee-track">
        <ul v-for="copy in 3" :key="copy" class="marquee-group" :aria-hidden="copy > 1 ? 'true' : undefined">
          <li v-for="item in items" :key="item.design" class="design-card">
            <img
              :src="item.src"
              :alt="copy === 1 ? t('pdfShowcase.alt', { design: t(`poem.pdfDesign.${item.design}.name`), name: item.name }) : ''"
              :width="PDF_SHOWCASE_WIDTH"
              :height="PDF_SHOWCASE_HEIGHT"
              loading="lazy"
              decoding="async"
            >
            <p class="design-caption">{{ t(`poem.pdfDesign.${item.design}.name`) }}</p>
          </li>
        </ul>
      </div>
    </div>

    <div class="mx-auto max-w-[1240px] px-4 sm:px-6 mt-8">
      <button type="button" class="showcase-cta" @click="emit('start')">
        {{ t('pdfShowcase.cta') }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.marquee {
  --card-width: 15rem;
  --gap: 1.5rem;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x proximity;
  scrollbar-width: thin;
  scrollbar-color: #d4a853 transparent;
  padding-block: 0.5rem 1rem;
}

.marquee-track {
  display: flex;
  width: max-content;
}

.marquee-group {
  display: flex;
  gap: var(--gap);
  padding-inline: calc(var(--gap) / 2);
}

/* Reduced motion: one row to scroll by hand, without the copies. */
.marquee-group[aria-hidden='true'] {
  display: none;
}

.design-card {
  flex: none;
  width: var(--card-width);
  scroll-snap-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.design-card img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 6px;
  box-shadow: 0 10px 30px rgb(0 0 0 / 0.35), 0 2px 6px rgb(0 0 0 / 0.25);
  outline: 1px solid oklch(1 0 0 / 0.1);
  outline-offset: -1px;
}

.design-caption {
  font-size: 1rem;
  font-weight: 700;
  color: #fbf1dc;
}


@media (min-width: 768px) {
  .marquee {
    --card-width: 17rem;
    --gap: 2rem;
  }
}

@media (prefers-reduced-motion: no-preference) {
  .marquee {
    overflow: hidden;
    scroll-snap-type: none;
    mask-image: linear-gradient(to right, transparent, #000 4%, #000 96%, transparent);
  }

  .marquee-group[aria-hidden='true'] {
    display: flex;
  }

  /*
   * Three equal groups: moving one group width loops without a jump, and the
   * other two cover screens up to twice the width of a group.
   */
  .marquee-track {
    animation: marquee 46s linear infinite;
  }

  .marquee:focus-within .marquee-track {
    animation-play-state: paused;
  }

  @media (hover: hover) {
    .marquee:hover .marquee-track {
      animation-play-state: paused;
    }
  }
}

@keyframes marquee {
  to {
    transform: translateX(calc(-100% / 3));
  }
}

.showcase-cta {
  min-height: 3rem;
  padding: 0 1.5rem;
  border-radius: 12px;
  background: #f4cd60;
  color: #3d0716;
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 700;
  cursor: pointer;
  transition-property: background-color, scale;
  transition-duration: 150ms;
  transition-timing-function: ease-out;
}

.showcase-cta:active {
  scale: 0.96;
}


@media (hover: hover) {
  .showcase-cta:hover {
    background: #ffe08a;
  }
}

.showcase-cta:focus-visible {
  outline: 2px solid #f4cd60;
  outline-offset: 3px;
}
</style>
