interface PaymentState {
  poemCount: number;
  hasPaid: boolean;
  paymentToken?: string;
}

const STORAGE_KEY = 'sinterklaas-payment';
const MAX_FREE_POEMS = 1;

// Shared reactive state across all composable instances
const poemCount = ref(0);
const hasPaid = ref(false);
const hasUnlimitedAccess = ref(false);
const isInitialized = ref(false);

export const usePaymentTracking = () => {
  const loadFromStorage = () => {
    if (import.meta.server) return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const state: PaymentState = JSON.parse(stored);
        poemCount.value = state.poemCount;
        hasPaid.value = state.hasPaid;
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
        hasPaid: hasPaid.value,
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
  const isPaid = computed(() => {
    if (hasUnlimitedAccess.value) {
      return true;
    }
    return hasPaid.value;
  });

  const canGeneratePoem = computed(() => {
    if (hasUnlimitedAccess.value) return true;
    return hasPaid.value || poemCount.value < MAX_FREE_POEMS;
  });

  const remainingFreePoems = computed(() => {
    if (hasUnlimitedAccess.value) return Infinity;
    if (hasPaid.value) return Infinity;
    return Math.max(0, MAX_FREE_POEMS - poemCount.value);
  });

  const incrementPoemCount = () => {
    if (hasUnlimitedAccess.value) return;

    if (!hasPaid.value) {
      poemCount.value += 1;
      saveToStorage();
    }
  };

  const markAsPaid = () => {
    hasUnlimitedAccess.value = true;
    hasPaid.value = true;
    saveToStorage();
  };

  const resetPaymentState = () => {
    if (import.meta.server) return;
    poemCount.value = 0;
    hasPaid.value = false;
    hasUnlimitedAccess.value = false;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error resetting payment state:', error);
    }
  };

  // Re-check access (useful after payment)
  const refreshAccess = () => {
    checkServerAccess();
  };

  return {
    isPaid,
    canGeneratePoem,
    remainingFreePoems,
    incrementPoemCount,
    markAsPaid,
    resetPaymentState,
    refreshAccess,
    maxFreePoems: MAX_FREE_POEMS,
  };
};
