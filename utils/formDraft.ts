// Keeps the poem form while the visitor pays at Dodo, so they can go on where
// they were when they come back. Only on this device, and only for a short
// time: the privacy page says so.

export const FORM_DRAFT_KEY = 'sintgpt-form-draft';
export const FORM_DRAFT_TTL_MS = 2 * 60 * 60 * 1000;

interface StoredDraft<T> {
  savedAt: number;
  form: T;
}

type DraftStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function saveFormDraft<T>(storage: DraftStorage, form: T, now = Date.now()): void {
  try {
    storage.setItem(FORM_DRAFT_KEY, JSON.stringify({ savedAt: now, form } satisfies StoredDraft<T>));
  } catch {
    // Storage can be full or blocked; the visitor then fills in the form again.
  }
}

/** Returns the saved form once and removes it. Old drafts are dropped. */
export function takeFormDraft<T>(storage: DraftStorage, now = Date.now()): T | null {
  try {
    const raw = storage.getItem(FORM_DRAFT_KEY);
    storage.removeItem(FORM_DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as Partial<StoredDraft<T>>;
    if (typeof draft.savedAt !== 'number' || now - draft.savedAt > FORM_DRAFT_TTL_MS) return null;
    if (!draft.form || typeof draft.form !== 'object') return null;
    return draft.form;
  } catch {
    return null;
  }
}

/** Removes a draft that is no longer needed, such as after a cancelled payment window. */
export function clearFormDraft(storage: DraftStorage): void {
  try {
    storage.removeItem(FORM_DRAFT_KEY);
  } catch {
    // Nothing to do.
  }
}
