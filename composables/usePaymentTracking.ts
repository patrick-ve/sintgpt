interface PaymentState {
  poemCount: number;
  trialPoem?: string | null;
  trialPoemName?: string | null;
}

const STORAGE_KEY = 'sinterklaas-payment';
const MAX_FREE_POEMS = 1;
const CLAIM_ATTEMPTS = 6;
const CLAIM_RETRY_MS = 2500;

// Shared reactive state across all composable instances
const poemCount = ref(0);
const hasUnlimitedAccess = ref(false);
const isInitialized = ref(false);
const storedTrialPoem = ref<string | null>(null);
const storedTrialPoemName = ref<string | null>(null);
// True while Dodo refuses checkouts. Then the page does not offer payment and
// only the server's daily limit applies.
const paymentsUnavailable = ref(false);

export const usePaymentTracking = () => {
  const loadFromStorage = () => {
    if (import.meta.server) return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const state: PaymentState = JSON.parse(stored);
        poemCount.value = state.poemCount;
        storedTrialPoem.value = state.trialPoem ?? null;
        storedTrialPoemName.value = state.trialPoemName ?? null;
      }
    } catch (error) {
      console.error('Error reading payment state:', error);
    }
  };

  const saveToStorage = () => {
    if (import.meta.server) return;

    try {
      const state: PaymentState = {
        poemCount: poemCount.value,
        trialPoem: storedTrialPoem.value,
        trialPoemName: storedTrialPoemName.value,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving payment state:', error);
    }
  };

  // Check server-side cookie for unlimited access
  const checkServerAccess = async () => {
    if (import.meta.server) return;

    try {
      const response = await $fetch<{ hasAccess: boolean }>('/api/payment/check-access');
      hasUnlimitedAccess.value = response.hasAccess;
    } catch (error) {
      console.error('Error checking access:', error);
      hasUnlimitedAccess.value = false;
    }
  };

  // Initialize on first use (client-side only)
  if (!isInitialized.value && !import.meta.server) {
    loadFromStorage();
    checkServerAccess();
    isInitialized.value = true;
  }

  // Computed properties for reactivity
  const isPaid = computed(() => hasUnlimitedAccess.value);

  const canGeneratePoem = computed(() => {
    return hasUnlimitedAccess.value
      || paymentsUnavailable.value
      || poemCount.value < MAX_FREE_POEMS;
  });

  /** Asks the server whether a checkout can work now. */
  const refreshPaymentsStatus = async (): Promise<boolean> => {
    try {
      const { available } = await $fetch<{ available: boolean }>('/api/payment/status');
      paymentsUnavailable.value = !available;
    } catch {
      // Unknown: offer payment, and let the checkout give the answer.
      paymentsUnavailable.value = false;
    }
    return !paymentsUnavailable.value;
  };

  const remainingFreePoems = computed(() => {
    if (hasUnlimitedAccess.value) return Infinity;
    return Math.max(0, MAX_FREE_POEMS - poemCount.value);
  });

  const incrementPoemCount = () => {
    if (hasUnlimitedAccess.value) return;

    poemCount.value += 1;
    saveToStorage();
  };

  // Ask the server to verify a payment with Dodo. A payment can take a moment
  // to settle, so keep trying while it is pending or the request fails.
  // `source` tells analytics whether a buyer came back from Dodo or typed
  // their payment ID to restore access.
  const claimPayment = async (
    paymentId: string,
    source: 'return' | 'restore' = 'return',
  ): Promise<'granted' | 'pending' | 'denied'> => {
    for (let attempt = 0; attempt < CLAIM_ATTEMPTS; attempt++) {
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, CLAIM_RETRY_MS));
      }
      try {
        const { status } = await $fetch<{ status: 'granted' | 'pending' | 'denied' }>(
          '/api/payment/claim-access',
          { method: 'POST', body: { paymentId, source } },
        );
        if (status === 'granted') {
          hasUnlimitedAccess.value = true;
          // Clear trial poem when user upgrades
          storedTrialPoem.value = null;
          storedTrialPoemName.value = null;
          saveToStorage();
        }
        if (status !== 'pending') return status;
      } catch (error) {
        console.error('Error verifying payment:', error);
      }
    }
    return 'pending';
  };

  const saveTrialPoem = (poem: string, name: string) => {
    if (import.meta.server) return;
    storedTrialPoem.value = poem;
    storedTrialPoemName.value = name;
    saveToStorage();
  };

  const resetPaymentState = () => {
    if (import.meta.server) return;
    poemCount.value = 0;
    hasUnlimitedAccess.value = false;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error resetting payment state:', error);
    }
  };

  return {
    isPaid,
    canGeneratePoem,
    remainingFreePoems,
    incrementPoemCount,
    claimPayment,
    resetPaymentState,
    maxFreePoems: MAX_FREE_POEMS,
    paymentsUnavailable,
    refreshPaymentsStatus,
    storedTrialPoem,
    storedTrialPoemName,
    saveTrialPoem,
  };
};
