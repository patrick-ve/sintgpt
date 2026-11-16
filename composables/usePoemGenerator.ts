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
  /** "Lieve <name>," above the poem and "Van Sint & Piet" below it. */
  greeting?: boolean;
  /** Write a new version with the larger model. */
  regenerate?: boolean;
  /** With regenerate: what should change, and the poem on screen. */
  rewriteHint?: string;
  previousPoem?: string;
}

/**
 * Retries after a dropped connection (a phone that locks or switches network
 * while the poem streams). The server does not count a retry of the same
 * attempt (MAX_POEM_RETRIES in server/utils/rateLimit.ts allows 3): the page
 * uses 2 by itself, and the third when the visitor asks for the same poem
 * again within RETRY_WINDOW_MS.
 */
const AUTO_RETRIES = 2;
const RETRY_WINDOW_MS = 10 * 60 * 1000;
/** Before retry 1 and 2, after the page is visible and online again. */
const RETRY_DELAYS_MS = [1000, 3000];
/** How long to wait for the browser to say it is online again. */
const ONLINE_WAIT_MS = 30_000;

/** A poem attempt, sent again with `retry` after a dropped connection. */
function newAttemptId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
  }
}

/** fetch and stream reads fail with a TypeError when the connection drops. */
const isNetworkError = (e: unknown) => (e as Error | undefined)?.name === 'TypeError';

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/** Waits until the page is visible and the browser is online (or 30 s pass). */
async function connectionBack(): Promise<void> {
  if (document.visibilityState === 'hidden') {
    await new Promise<void>((resolve) => {
      const onChange = () => {
        if (document.visibilityState !== 'visible') return;
        document.removeEventListener('visibilitychange', onChange);
        resolve();
      };
      document.addEventListener('visibilitychange', onChange);
    });
  }
  if (!navigator.onLine) {
    await Promise.race([
      new Promise<void>(resolve => window.addEventListener('online', () => resolve(), { once: true })),
      sleep(ONLINE_WAIT_MS),
    ]);
  }
}

export const usePoemGenerator = () => {
  const { track } = useAnalytics();
  const { t } = useI18n();
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const poem = ref<string | null>(null);
  const isRateLimitError = ref(false);
  // Why the payment offer shows: `limit` (free poems) or `credits` (Drie used up).
  const rateLimitReason = ref<'limit' | 'credits' | null>(null);
  const share = ref<PoemShare | null>(null);
  /** The retry in progress after a dropped connection (1, 2), or 0. */
  const retrying = ref(0);
  // The last attempt that failed on the connection, so asking for the same
  // poem again is a retry too.
  let dropped: { attempt: string; request: string; at: number } | null = null;

  const generatePoem = async (request: PoemRequest) => {
    isLoading.value = true;
    error.value = null;
    poem.value = '';
    isRateLimitError.value = false;
    rateLimitReason.value = null;
    share.value = null;
    retrying.value = 0;

    const requestKey = JSON.stringify(request);
    const again = dropped && dropped.request === requestKey && Date.now() - dropped.at < RETRY_WINDOW_MS ? dropped : null;
    const attempt = again?.attempt ?? newAttemptId();
    dropped = null;
    if (again) track('Poem retry', { detail: 'manual' });

    for (let retry = 0; ; retry++) {
      try {
        await streamOnce({ ...request, attempt, retry: retry > 0 || !!again });
        break;
      } catch (e: any) {
        poem.value = '';
        share.value = null;
        if (isNetworkError(e) && retry < AUTO_RETRIES) {
          retrying.value = retry + 1;
          track('Poem retry', { detail: 'network', value: retry + 1 });
          await connectionBack();
          await sleep(RETRY_DELAYS_MS[retry] ?? 3000);
          continue;
        }
        console.error('Poem generation error:', e);
        // A dropped connection never reaches the server's own failure event.
        track('Poem stream failed', { detail: isNetworkError(e) ? 'network' : 'stream', value: retry + 1 });
        if (isNetworkError(e)) dropped = { attempt, request: requestKey, at: Date.now() };
        error.value = isNetworkError(e) ? t('poem.connectionLost') : (e.message || 'Failed to generate poem');
        poem.value = null;
        break;
      }
    }
    retrying.value = 0;
    isLoading.value = false;
  };

  /** One request and its stream. Throws when the connection or the stream fails. */
  const streamOnce = async (body: PoemRequest & { attempt: string; retry: boolean }) => {
    const reveal = createSmoothReveal((text) => {
      poem.value = text.trimStart();
    });

    try {
      const response = await fetch('/api/poem/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
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
          // The page did not know (another device, cleared site data): the
          // server counted the attempt against a visitor without poems left.
          isRateLimitError.value = true;
          rateLimitReason.value = data?.reason === 'credits' ? 'credits' : 'limit';
          error.value = null;
          track('No poems left', { detail: `${rateLimitReason.value === 'credits' ? 'credits' : 'free'}:server` });
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
    } catch (e) {
      reveal.cancel();
      throw e;
    }
  };

  return {
    isLoading,
    error,
    poem,
    isRateLimitError,
    rateLimitReason,
    share,
    retrying,
    generatePoem,
  };
};
