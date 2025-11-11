<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import VuePdfEmbed from 'vue-pdf-embed';

interface Props {
  documentSource: string | File;
  initialPage?: number;
  currentPage?: number;
  totalPages?: number;
}

const props = withDefaults(defineProps<Props>(), {
  initialPage: 1,
  currentPage: 1,
  totalPages: 1,
});

const emit = defineEmits<{
  (e: 'update:currentPage', page: number): void;
}>();

const documentType = computed(() => {
  if (typeof props.documentSource === 'string') {
    const lowerCaseSrc = props.documentSource.toLowerCase();
    if (lowerCaseSrc.endsWith('.pdf')) {
      return 'pdf';
    }
    if (
      [
        '.jpg',
        '.jpeg',
        '.png',
        '.tiff',
        '.gif',
        '.bmp',
        '.webp',
      ].some((ext) => lowerCaseSrc.endsWith(ext))
    ) {
      return 'image';
    }
  } else if (props.documentSource instanceof File) {
    if (props.documentSource.type === 'application/pdf') {
      return 'pdf';
    }
    if (props.documentSource.type.startsWith('image/')) {
      return 'image';
    }
  }
  return 'unknown'; // Or handle as an error
});

const imageSrc = ref<string | null>(null);
const pdfSource = ref<string | null>(null);

let objectUrl: string | null = null;

onMounted(() => {
  if (props.documentSource instanceof File) {
    objectUrl = URL.createObjectURL(props.documentSource);
    if (documentType.value === 'image') {
      imageSrc.value = objectUrl;
    } else if (documentType.value === 'pdf') {
      pdfSource.value = objectUrl;
    }
  } else {
    // documentSource is a string URL
    if (documentType.value === 'image') {
      imageSrc.value = props.documentSource;
    } else if (documentType.value === 'pdf') {
      pdfSource.value = props.documentSource;
    }
  }
});

onUnmounted(() => {
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
    objectUrl = null;
  }
});

// Placeholder for zoom/pan state and functions
const currentZoom = ref(1);
const currentPan = ref({ x: 0, y: 0 });

const zoomIn = () => {
  currentZoom.value += 0.1;
};

const zoomOut = () => {
  currentZoom.value = Math.max(0.1, currentZoom.value - 0.1);
};

const resetZoom = () => {
  currentZoom.value = 1;
  currentPan.value = { x: 0, y: 0 }; // Reset pan as well
};

const panUp = () => {
  currentPan.value.y -= 10;
};
const panDown = () => {
  currentPan.value.y += 10;
};
const panLeft = () => {
  currentPan.value.x -= 10;
};
const panRight = () => {
  currentPan.value.x += 10;
};

const goToPreviousPage = () => {
  if (props.currentPage > 1) {
    emit('update:currentPage', props.currentPage - 1);
  }
};

const goToNextPage = () => {
  if (props.currentPage < props.totalPages) {
    emit('update:currentPage', props.currentPage + 1);
  }
};
</script>

<template>
  <div class="document-display-container">
    <div class="viewer-area">
      <NuxtImg
        v-if="documentType === 'image' && imageSrc"
        :src="imageSrc"
        alt="Document Page"
        class="displayed-document image-document"
        :style="{
          transform: `scale(${currentZoom}) translate(${currentPan.x}px, ${currentPan.y}px)`,
        }"
        fit="contain"
        preload
      />
      <ClientOnly>
        <VuePdfEmbed
          v-if="documentType === 'pdf' && pdfSource"
          :source="pdfSource"
          :page="props.currentPage"
          class="displayed-document pdf-document"
          :style="{
            transform: `scale(${currentZoom}) translate(${currentPan.x}px, ${currentPan.y}px)`,
          }"
        />
        <template #fallback>
          <p v-if="documentType === 'pdf'">Loading PDF viewer...</p>
        </template>
      </ClientOnly>
      <div
        v-if="documentType === 'unknown'"
        class="unsupported-format"
      >
        <p>Unsupported document format.</p>
      </div>
    </div>

    <!-- PDF Navigation Controls -->
    <div
      v-if="documentType === 'pdf' && totalPages > 1"
      class="pdf-navigation-controls mt-4 flex items-center justify-center gap-4"
    >
      <UButton
        icon="i-heroicons-arrow-left-circle"
        @click="goToPreviousPage"
        :disabled="props.currentPage <= 1"
        aria-label="Previous Page"
      />
      <span class="text-sm text-gray-700 dark:text-gray-300">
        Page {{ props.currentPage }} of {{ props.totalPages }}
      </span>
      <UButton
        icon="i-heroicons-arrow-right-circle"
        @click="goToNextPage"
        :disabled="props.currentPage >= props.totalPages"
        aria-label="Next Page"
      />
    </div>

    <!-- Zoom/Pan Controls (Example) -->
    <div class="controls mt-4 flex items-center justify-center gap-2">
      <UButton
        icon="i-heroicons-zoom-in"
        @click="zoomIn"
        aria-label="Zoom In"
      />
      <UButton
        icon="i-heroicons-zoom-out"
        @click="zoomOut"
        aria-label="Zoom Out"
      />
      <UButton
        icon="i-heroicons-reset"
        @click="resetZoom"
        aria-label="Reset Zoom"
      />
    </div>
  </div>
</template>

<style scoped>
.document-display-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%; /* Or a specific height */
}

.viewer-area {
  width: 100%; /* Or adjust as needed */
  max-width: 800px; /* Example max width */
  height: calc(
    100% - 40px
  ); /* Adjust height to make space for controls if they are inside */
  overflow: hidden; /* Important for panning and zooming within bounds */
  border: 1px solid #ccc;
  position: relative; /* For positioning the document if needed */
  background-color: #f0f0f0; /* Background for the viewer area */
}

.displayed-document {
  display: block;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain; /* Scale down to fit, preserving aspect ratio */
  margin: auto; /* Center the document */
  transform-origin: center center; /* Zoom from the center */
  transition: transform 0.2s ease-out; /* Smooth zoom/pan */
}

.image-document {
  /* Specific styles for image if needed */
}

.pdf-document {
  /* Specific styles for PDF if needed, vue-pdf-embed might have its own structure */
  width: 100%;
  height: 100%;
}

.unsupported-format {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%; /* Make sure this also considers potential controls height */
  color: red;
}

.pdf-navigation-controls {
  /* Styles for PDF navigation, e.g., button styling, spacing */
  /* These will be UButton, so rely on Nuxt UI for base styling */
}

.controls button {
  /* Basic styling for buttons, use Nuxt UI components later */
  padding: 8px 12px;
  border: 1px solid #ccc;
  background-color: #f9f9f9;
  cursor: pointer;
}

.controls button:hover {
  background-color: #e9e9e9;
}
</style>
