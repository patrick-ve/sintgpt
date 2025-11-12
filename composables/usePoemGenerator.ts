interface PoemRequest {
  name: string;
  present?: string;
  style: 'funny' | 'classic' | 'ironic' | 'old-fashioned';
  rhymeScheme: 'AABB' | 'ABBA' | 'Limerick';
  lines: number;
  linkedinUrl?: string;
  jobTitle?: string;
  language: 'dutch' | 'english';
}

interface PoemResponse {
  poem: string;
}

export const usePoemGenerator = () => {
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const poem = ref<string | null>(null);

  const generatePoem = async (request: PoemRequest) => {
    isLoading.value = true;
    error.value = null;
    poem.value = null;

    try {
      const response = await $fetch<PoemResponse>('/api/poem/generate', {
        method: 'POST',
        body: request,
      });

      poem.value = response.poem;
    } catch (e: any) {
      // Handle different types of errors from $fetch
      if (e.data && e.data.statusMessage) {
        error.value = e.data.statusMessage;
      } else if (e.response && e.response._data && e.response._data.statusMessage) {
        error.value = e.response._data.statusMessage;
      } else {
        error.value = e.message || 'Failed to generate poem';
      }
      console.error('Poem generation error:', e);
      poem.value = null;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    isLoading,
    error,
    poem,
    generatePoem,
  };
};
