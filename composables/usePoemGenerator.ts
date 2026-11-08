interface PoemRequest {
  name: string;
  present?: string;
  writtenBy?: string;
  writtenForAudience?: string;
  style: 'funny' | 'classic' | 'ironic' | 'old-fashioned' | 'spicy';
  rhymeScheme: 'AABB' | 'ABAB' | 'ABBA' | 'Limerick';
  lines: number;
  linkedinUrl?: string;
  jobTitle?: string;
  language: 'dutch' | 'english';
}

export const usePoemGenerator = () => {
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const poem = ref<string | null>(null);
  const isRateLimitError = ref(false);

  const generatePoem = async (request: PoemRequest) => {
    isLoading.value = true;
    error.value = null;
    poem.value = '';
    isRateLimitError.value = false;

    const reveal = createSmoothReveal((text) => {
      poem.value = text.trimStart();
    });

    try {
      const response = await fetch('/api/poem/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      // Check for rate limit error
      if (response.status === 429) {
        isRateLimitError.value = true;
        error.value = null;
        poem.value = null;
        return;
      }

      // Check for other errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        error.value = errorData.statusMessage || `Error: ${response.status}`;
        poem.value = null;
        return;
      }

      // Read the UI message stream
      if (!response.body) {
        throw new Error('No response body reader available');
      }

      await readPoemStream(response.body, reveal.push);
      await reveal.finish();

      // Trim the final poem
      if (poem.value) {
        poem.value = poem.value.trim();
      }
    } catch (e: any) {
      reveal.cancel();
      console.error('Poem generation error:', e);
      error.value = e.message || 'Failed to generate poem';
      poem.value = null;
      (window as any).umami?.track('Poem generation failed');
    } finally {
      isLoading.value = false;
    }
  };

  return {
    isLoading,
    error,
    poem,
    isRateLimitError,
    generatePoem,
  };
};
