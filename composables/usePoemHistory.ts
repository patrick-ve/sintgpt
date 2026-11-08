import { createSharedComposable, useLocalStorage } from '@vueuse/core';

export interface PoemHistoryEntry {
  id: string;
  recipient: string;
  poem: string;
  createdAt: number;
  style: string;
  rhymeScheme: string;
  language: string;
  lines: number;
}

export type NewPoemHistoryEntry = Omit<PoemHistoryEntry, 'id' | 'createdAt'>;

const STORAGE_KEY = 'sintgpt-poem-history';
export const MAX_HISTORY_ENTRIES = 50;

function isEntry(value: unknown): value is PoemHistoryEntry {
  const e = value as PoemHistoryEntry;
  return !!e
    && typeof e.id === 'string'
    && typeof e.recipient === 'string'
    && typeof e.poem === 'string'
    && typeof e.createdAt === 'number';
}

function newId(): string {
  return globalThis.crypto?.randomUUID?.()
    ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Poems generated on this device, newest first. Stored in localStorage only;
 * nothing is sent to the server. Read after mount so SSR and hydration match.
 */
export const usePoemHistory = createSharedComposable(() => {
  const stored = useLocalStorage<PoemHistoryEntry[]>(STORAGE_KEY, [], {
    initOnMounted: true,
    // Storage can be full, blocked or corrupted; history is a convenience.
    onError: error => console.warn('Poem history unavailable:', error),
  });

  const entries = computed<PoemHistoryEntry[]>(() =>
    Array.isArray(stored.value) ? stored.value.filter(isEntry) : [],
  );

  const add = (entry: NewPoemHistoryEntry): PoemHistoryEntry => {
    const saved: PoemHistoryEntry = { ...entry, id: newId(), createdAt: Date.now() };
    stored.value = [saved, ...entries.value].slice(0, MAX_HISTORY_ENTRIES);
    return saved;
  };

  const remove = (id: string) => {
    stored.value = entries.value.filter(e => e.id !== id);
  };

  const clear = () => {
    stored.value = [];
  };

  return { entries, add, remove, clear };
});
