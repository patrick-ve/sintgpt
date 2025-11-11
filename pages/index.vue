<script setup lang="ts">
import { computed } from 'vue';

const uploadedFile = ref<File | null>(null);
const analysisResult = ref<any>(null);
const analysisError = ref<string | null>(null);
const isAnalyzing = ref(false);
const hasUploadedFile = ref(false);
const isModalOpen = ref(false);
const currentPageForPdf = ref(1);
const totalPagesForPdf = ref(1);

const handleFileSelected = (file: File) => {
  hasUploadedFile.value = true;
  uploadedFile.value = file;
  analysisResult.value = null;
  analysisError.value = null;
  currentPageForPdf.value = 1; // Reset page for new file
  totalPagesForPdf.value = 1;
  isAnalyzing.value = true; // Start loading state
};

const handleAnalysisComplete = (response: any) => {
  try {
    if (response && Array.isArray(response.analyses)) {
      if (response.analyses.length > 0) {
        analysisResult.value = response.analyses; // Store array of analyses
        totalPagesForPdf.value =
          response.totalPages || response.analyses.length;
        currentPageForPdf.value = 1; // Start at page 1
        analysisError.value = null;
      } else {
        // PDF was processed, but no analysis results (e.g., 0 pages, or all pages failed individual analysis)
        analysisResult.value = null;
        totalPagesForPdf.value = response.totalPages || 0;
        currentPageForPdf.value = 1;
        analysisError.value =
          'No analysis data returned for the document.';
        if (
          response.overallUsage &&
          response.overallUsage.totalTokens === 0 &&
          response.totalPages > 0
        ) {
          analysisError.value = `Document processed (${response.totalPages} pages), but AI analysis did not return any data. Please check the document content or try again.`;
        }
      }
    } else if (response && response.analysis) {
      // Fallback for single image (old structure) or if backend reverts to single analysis object
      analysisResult.value = [response]; // Wrap single analysis in an array for consistency
      totalPagesForPdf.value = 1;
      currentPageForPdf.value = 1;
      analysisError.value = null;
    } else {
      // Unexpected response structure
      console.error(
        'Unexpected analysis response structure:',
        response
      );
      analysisResult.value = null;
      totalPagesForPdf.value = 1;
      currentPageForPdf.value = 1;
      analysisError.value =
        'Received an unexpected response format from the analysis service.';
    }
  } catch (e: any) {
    console.error('Error in handleAnalysisComplete:', e);
    analysisResult.value = null;
    analysisError.value =
      e.message ||
      'An error occurred while processing the analysis results.';
  } finally {
    isAnalyzing.value = false; // Stop loading state
  }
};

const handleAnalysisError = (errorMsg: string) => {
  try {
    analysisError.value = errorMsg;
    analysisResult.value = null;
    currentPageForPdf.value = 1;
    totalPagesForPdf.value = 1;
  } catch (e: any) {
    console.error('Error in handleAnalysisError:', e);
    // Ensure an error message is set even if the passed errorMsg is problematic
    analysisError.value =
      e.message ||
      'An unspecified error occurred during analysis error handling.';
  } finally {
    isAnalyzing.value = false; // Stop loading state
  }
};

const currentAnalysisForDisplay = computed(() => {
  if (
    Array.isArray(analysisResult.value) &&
    analysisResult.value.length > 0
  ) {
    const pageAnalysis = analysisResult.value.find(
      (ar) => ar.pageNumber === currentPageForPdf.value
    );
    return pageAnalysis ? pageAnalysis.analysis : null;
  }
  return analysisResult.value; // Fallback for single analysis or old structure
});

const appDescription =
  'Upload historical WWII-era documents (JPEG, PNG, TIFF, PDF) for comprehensive AI-powered analysis. This tool transcribes handwritten texts from WWII and extracts key insights, including: named entities (people, places, organizations), a timeline of historical events, dominant topics, overall sentiment, explanations of historical terms, and identified geographical locations. Your documents are processed for immediate analysis and are not stored anywhere.';
</script>

<template>
  <div class="flex flex-col min-h-screen bg-gray-600">
    <!-- Header -->
    <header class="bg-[#191D21] p-6 shadow-md">
      <div
        class="container mx-auto flex items-center justify-between"
      >
        <h1 class="text-3xl font-bold text-white">
          WWII Document Transcriber
        </h1>

        <UButton
          class="mt-4 font-bold cursor-pointer bg-red-600 hover:bg-red-500"
          icon="i-heroicons-information-circle"
          color="secondary"
          @click="isModalOpen = true"
        >
          About this tool
        </UButton>
      </div>
    </header>

    <UModal
      v-model:open="isModalOpen"
      :ui="{
        overlay: 'bg-black/70',
      }"
      title="About this tool"
      :close="{
        color: 'neutral',
        variant: 'outline',
        class: 'rounded-full cursor-pointer',
      }"
    >
      <template #body>
        <p class="text-gray-700">
          {{ appDescription }}
        </p>
      </template>
    </UModal>

    <!-- Main Content -->
    <main
      class="flex-grow container mx-auto py-6 flex flex-col lg:flex-row gap-6"
    >
      <!-- Left Panel -->
      <div class="lg:w-1/2 flex flex-col gap-6">
        <section
          class="bg-white dark:bg-gray-700 p-6 rounded-lg shadow"
        >
          <h2
            class="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200"
          >
            Upload Your Document
          </h2>

          <DocumentUploadForm
            @file-selected="handleFileSelected"
            @analysis-complete="handleAnalysisComplete"
            @analysis-error="handleAnalysisError"
          />
        </section>

        <section
          v-if="uploadedFile"
          class="bg-white dark:bg-gray-700 p-6 rounded-lg shadow flex-grow flex flex-col"
        >
          <h2
            class="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200"
          >
            Document Preview
          </h2>
          <div
            class="viewer-container flex-grow min-h-[400px] lg:min-h-[600px]"
          >
            <DocumentDisplay
              :document-source="uploadedFile"
              class="w-full h-full"
              :current-page="currentPageForPdf"
              :total-pages="totalPagesForPdf"
              @update:current-page="currentPageForPdf = $event"
            />
          </div>
        </section>
        <div
          v-else
          class="bg-white dark:bg-gray-700 p-6 rounded-lg shadow text-center text-gray-500 dark:text-gray-400 flex-grow flex items-center justify-center min-h-[200px]"
        >
          <p>Upload a document to see the preview here.</p>
        </div>
      </div>

      <!-- Right Panel -->
      <DocumentAnalysis
        :uploaded-file="uploadedFile"
        :analysis-result="currentAnalysisForDisplay"
        :analysis-error="analysisError"
        :is-loading="isAnalyzing"
      />
    </main>
  </div>
</template>

<style scoped>
/* Ensure viewer container and DocumentDisplay fill the space */
.viewer-container > :deep(div) {
  width: 100%;
  height: 100%;
}
.viewer-container :deep(.document-display-container) {
  width: 100%;
  height: 100%;
}
.viewer-container :deep(.viewer-area) {
  width: 100%;
  height: 100%;
  max-width: none; /* Override max-width if set in child */
  border: 1px solid #e5e7eb; /* dark:border-gray-600 */
}

/* Tailwind dark mode for border */
.dark .viewer-container :deep(.viewer-area) {
  border-color: #4b5563; /* gray-600 */
}
</style>
