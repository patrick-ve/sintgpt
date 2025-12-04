interface PoemRequest {
  name: string;
  present?: string;
  writtenBy?: string;
  writtenForAudience?: string;
  style: 'funny' | 'classic' | 'ironic' | 'old-fashioned';
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
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // Decode the chunk
        buffer += decoder.decode(value, { stream: true });

        // Process complete lines (SSE format)
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            // Extract the JSON part after "data: "
            const jsonStr = line.substring(6);

            // Skip [DONE] message
            if (jsonStr === '[DONE]') {
              continue;
            }

            try {
              const parsed = JSON.parse(jsonStr);

              // Only process text-delta events
              if (parsed.type === 'text-delta' && parsed.delta) {
                poem.value += parsed.delta;
              }
            } catch (e) {
              console.error('Failed to parse stream data:', e);
            }
          }
        }
      }

      // Trim the final poem
      if (poem.value) {
        poem.value = poem.value.trim();
      }
    } catch (e: any) {
      console.error('Poem generation error:', e);
      error.value = e.message || 'Failed to generate poem';
      poem.value = null;
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
