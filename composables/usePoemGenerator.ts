import type { PoemShare } from '~/utils/poemLink';

interface PoemRequest {
  name: string;
  present?: string;
  writtenBy?: string;
  writtenForAudience?: string;
  style: 'funny' | 'classic' | 'ironic' | 'old-fashioned' | 'spicy' | 'roast';
  rhymeScheme: 'AABB' | 'ABAB' | 'ABBA' | 'Limerick';
  lines: number;
  linkedinUrl?: string;
  jobTitle?: string;
  language: 'dutch' | 'english';
  /** Write a new version with the larger model. */
  regenerate?: boolean;
}

export const usePoemGenerator = () => {
  const { track } = useAnalytics();
  const { t } = useI18n();
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const poem = ref<string | null>(null);
  const isRateLimitError = ref(false);
  const share = ref<PoemShare | null>(null);

  const generatePoem = async (request: PoemRequest) => {
    isLoading.value = true;
    error.value = null;
    poem.value = '';
    isRateLimitError.value = false;
    share.value = null;

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

      // The free limit shows the upgrade offer. A short wait, or the cap for
      // buyers, is a message.
      if (response.status === 429) {
        const { data } = await response.json().catch(() => ({}));
        poem.value = null;
        if (data?.reason === 'debounce') {
          error.value = t('poem.wait', { seconds: data.retryAfterSeconds ?? 10 });
        } else if (data?.reason === 'fair-use') {
          error.value = t('poem.fairUse');
        } else {
          isRateLimitError.value = true;
          error.value = null;
        }
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

      await readPoemStream(response.body, reveal.push, (signed) => {
        share.value = signed;
      });
      await reveal.finish();

      // Trim the final poem
      if (poem.value) {
        poem.value = poem.value.trim();
      }
    } catch (e: any) {
      reveal.cancel();
      console.error('Poem generation error:', e);
      // A dropped connection never reaches the server's own failure event.
      track('Poem stream failed', { detail: e?.name === 'TypeError' ? 'network' : 'stream' });
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
    share,
    generatePoem,
  };
};
