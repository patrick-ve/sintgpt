import { ref } from 'vue';

// The DocumentAnalysis interface here is no longer fully representative
// of what `analysis.value` will hold. It will hold the entire backend response.
// For simplicity, we'll type `analysis` as `any` for now, and the
// consuming component (`pages/index.vue`) will handle the detailed structure.
/*
interface DocumentAnalysis {
  transcription: string;
  entities: {
    people: string[];
    locations: string[];
    dates: string[];
    organizations: string[];
  };
  timeline: Array<{
    date: string;
    event: string;
  }>;
  topics: string[];
  sentiment: {
    overall: string;
    details: string;
  };
  vocabulary: Array<{
    term: string;
    definition: string;
  }>;
  locations: Array<{
    name: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  }>;
}
*/

export const useOcr = () => {
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  // analysis.value will now hold the entire response object from the backend
  const analysis = ref<any | null>(null);

  const analyzeDocument = async (file: File) => {
    isLoading.value = true;
    error.value = null;
    analysis.value = null;

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await $fetch('/api/ocr/image', {
        method: 'POST',
        body: formData,
      });

      // Assign the whole response, not just response.analysis
      analysis.value = response;
    } catch (e: any) {
      // Make sure to handle different types of errors from $fetch
      if (e.data && e.data.statusMessage) {
        error.value = e.data.statusMessage; // Use server-provided error message
      } else if (
        e.response &&
        e.response._data &&
        e.response._data.statusMessage
      ) {
        // Handle errors wrapped by $fetch
        error.value = e.response._data.statusMessage;
      } else {
        error.value = e.message || 'Failed to analyze document';
      }
      console.error('OCR Error in useOcr:', e);
      analysis.value = null; // Ensure analysis is null on error
    } finally {
      isLoading.value = false;
    }
  };

  return {
    isLoading,
    error,
    analysis,
    analyzeDocument,
  };
};
