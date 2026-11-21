import type { PoemShare } from '~/utils/poemLink';

/**
 * "Write first, then pay" (server/utils/poemPreview.ts). A free visitor
 * without poems left gets the start of the poem; the whole poem comes after
 * payment. The browser keeps the preview ID and the start (never the whole
 * poem: the server does not send it) in localStorage until the server lets it
 * go (2 hours).
 */
export interface PoemPreview {
  id: string;
  /** The greeting and the first lines. */
  shown: string[];
  /** The other lines as their length (0 = an empty line). */
  hidden: number[];
  expiresAt: number;
  recipient: string;
}

export interface UnlockedPoem {
  poem: string;
  share: PoemShare | null;
  style: string;
  rhymeScheme: string;
  language: 'dutch' | 'english';
  lines: number;
}

const STORAGE_KEY = 'sintgpt-poem-preview';

const preview = ref<PoemPreview | null>(null);
const writing = ref(false);
const unlocking = ref(false);
let loaded = false;

function save(value: PoemPreview | null) {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private mode or full storage: the preview lives for this page only.
  }
}

function load(): PoemPreview | null {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as PoemPreview | null;
    if (value && typeof value.id === 'string' && Array.isArray(value.shown) && Array.isArray(value.hidden) && value.expiresAt > Date.now()) {
      return value;
    }
  } catch {
    // Unreadable: drop it.
  }
  save(null);
  return null;
}

export const usePoemPreview = () => {
  if (!loaded && import.meta.client) {
    loaded = true;
    preview.value = load();
  }

  /** Writes the poem on the server. `fallback`: the page opens the payment window as before. */
  const write = async (request: Record<string, unknown> & { name: string }): Promise<'ok' | 'fallback'> => {
    writing.value = true;
    try {
      const result = await $fetch<Omit<PoemPreview, 'recipient'>>('/api/poem/preview', { method: 'POST', body: request });
      preview.value = { ...result, recipient: request.name.trim() };
      save(preview.value);
      return 'ok';
    } catch {
      return 'fallback';
    } finally {
      writing.value = false;
    }
  };

  /**
   * After payment: the whole poem. `expired` when the server no longer has it
   * (or it was another buyer's); `credits` and `fair-use` as for a poem.
   */
  const unlock = async (): Promise<UnlockedPoem | 'expired' | 'credits' | 'fair-use' | 'error'> => {
    const current = preview.value;
    if (!current) return 'expired';
    unlocking.value = true;
    try {
      const poem = await $fetch<UnlockedPoem>('/api/poem/unlock', { method: 'POST', body: { id: current.id } });
      clear();
      return poem;
    } catch (error: any) {
      const reason = error?.data?.data?.reason;
      if (error?.statusCode === 404 || reason === 'expired' || reason === 'invalid') {
        clear();
        return 'expired';
      }
      if (reason === 'credits' || reason === 'fair-use') return reason;
      return 'error';
    } finally {
      unlocking.value = false;
    }
  };

  const clear = () => {
    preview.value = null;
    save(null);
  };

  return { preview: readonly(preview), writing: readonly(writing), unlocking: readonly(unlocking), write, unlock, clear };
};
