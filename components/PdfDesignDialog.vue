<script setup lang="ts">
import {
  DEFAULT_PDF_DESIGN,
  PDF_DESIGNS,
  PDF_DESIGN_IDS,
  isPdfDesignId,
  type PdfDesignId,
} from '~/utils/pdfDesigns';

// Lets the visitor pick the look of the poem PDF. The page builds the file and
// closes the window when the download starts.
const isOpen = defineModel<boolean>({ default: false });
defineProps<{ busy: boolean; failed: boolean }>();
const emit = defineEmits<{ save: [design: PdfDesignId] }>();

const { t } = useI18n();
const dialogRef = ref<HTMLDialogElement | null>(null);

const STORAGE_KEY = 'sintgpt-pdf-design';
const selected = ref<PdfDesignId>(DEFAULT_PDF_DESIGN);

onMounted(() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isPdfDesignId(saved)) selected.value = saved;
  } catch {
    // Storage can be blocked; the default design is fine.
  }
});

watch(isOpen, (open) => {
  if (open) dialogRef.value?.showModal();
  else dialogRef.value?.close();
});

const save = () => {
  try {
    localStorage.setItem(STORAGE_KEY, selected.value);
  } catch {
    // Only a convenience.
  }
  emit('save', selected.value);
};

const onBackdropClick = (event: MouseEvent) => {
  if (event.target === dialogRef.value) isOpen.value = false;
};
</script>

<template>
  <dialog
    ref="dialogRef"
    class="pdf-dialog"
    aria-labelledby="pdf-dialog-title"
    @close="isOpen = false"
    @click="onBackdropClick"
  >
    <form class="pdf-dialog-body" method="dialog" @submit.prevent="save">
      <h2 id="pdf-dialog-title" class="font-display font-bold text-2xl leading-tight text-[#8b1538]">
        {{ t('poem.pdfDesign.title') }}
      </h2>
      <p class="mt-1 text-[#5c4a3d]">{{ t('poem.pdfDesign.intro') }}</p>

      <fieldset class="mt-5">
        <legend class="sr-only">{{ t('poem.pdfDesign.title') }}</legend>
        <div class="designs">
          <label v-for="id in PDF_DESIGN_IDS" :key="id" class="design">
            <input v-model="selected" type="radio" name="pdf-design" :value="id" class="sr-only peer">
            <span class="design-preview">
              <img :src="PDF_DESIGNS[id].preview" alt="" width="160" height="226" loading="lazy" decoding="async">
            </span>
            <span class="design-name">{{ t(`poem.pdfDesign.${id}.name`) }}</span>
            <span class="design-description">{{ t(`poem.pdfDesign.${id}.description`) }}</span>
          </label>
        </div>
      </fieldset>

      <p v-if="failed" role="alert" class="mt-4 text-sm font-medium text-[#8b1538]">
        {{ t('poem.pdfError') }}
      </p>

      <div class="mt-6 flex flex-wrap items-center justify-end gap-3">
        <button type="button" class="pdf-cancel" @click="isOpen = false">
          {{ t('poem.pdfDesign.cancel') }}
        </button>
        <button type="submit" class="btn-festive inline-flex items-center gap-2 min-h-12 px-6 text-lg" :disabled="busy">
          <UIcon
            :name="busy ? 'i-heroicons-arrow-path' : 'i-heroicons-arrow-down-tray'"
            class="size-5"
            :class="{ 'motion-safe:animate-spin': busy }"
            aria-hidden="true"
          />
          {{ t('poem.pdfDesign.download') }}
        </button>
      </div>
    </form>
  </dialog>
</template>

<style scoped>
.pdf-dialog {
  width: min(100% - 32px, 760px);
  max-height: calc(100dvh - 32px);
  margin: auto;
  padding: 0;
  border: none;
  border-radius: 16px;
  background: #fdf6e3;
  color: #3b2a1f;
  box-shadow: 0 24px 64px rgb(61 7 22 / 0.35);
  overflow-y: auto;
  overscroll-behavior: contain;
}
.pdf-dialog::backdrop {
  background: rgb(61 7 22 / 0.7);
}
.pdf-dialog-body {
  padding: 24px;
}
.designs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
@media (min-width: 640px) {
  .designs {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
.design {
  display: flex;
  flex-direction: column;
  gap: 2px;
  cursor: pointer;
}
.design-preview {
  display: block;
  margin-bottom: 6px;
  border-radius: 8px;
  outline: 3px solid transparent;
  outline-offset: 2px;
  box-shadow: 0 2px 8px rgb(61 7 22 / 0.18);
  overflow: hidden;
  transition-property: outline-color;
  transition-duration: 150ms;
}
.design-preview img {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 595 / 842;
}
@media (hover: hover) {
  .design:hover .design-preview {
    outline-color: #d4a853;
  }
}
.peer:checked ~ .design-preview {
  outline-color: #8b1538;
}
.peer:focus-visible ~ .design-preview {
  outline-color: #8b1538;
  box-shadow: 0 0 0 7px #fdf6e3, 0 0 0 9px #3d0716;
}
.design-name {
  font-weight: 700;
  line-height: 1.3;
}
.peer:checked ~ .design-name {
  color: #8b1538;
}
.peer:checked ~ .design-name::before {
  content: '✓ ';
}
.design-description {
  font-size: 0.875rem;
  line-height: 1.4;
  color: #5c4a3d;
}
.pdf-cancel {
  min-height: 3rem;
  padding: 0 1rem;
  font-weight: 700;
  color: #8b1538;
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
