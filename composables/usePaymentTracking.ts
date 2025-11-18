interface PaymentState {
  poemCount: number;
  hasPaid: boolean;
  paymentToken?: string;
}

const STORAGE_KEY = 'sinterklaas-payment';
const MAX_FREE_POEMS = 3;

export const usePaymentTracking = () => {
  const getPaymentState = (): PaymentState => {
    if (import.meta.server) {
      return { poemCount: 0, hasPaid: false };
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error reading payment state:', error);
    }

    return { poemCount: 0, hasPaid: false };
  };

  const savePaymentState = (state: PaymentState) => {
    if (import.meta.server) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving payment state:', error);
    }
  };

  const isPaid = (): boolean => {
    const state = getPaymentState();
    return state.hasPaid;
  };

  const canGeneratePoem = (): boolean => {
    // Skip payment check in development
    if (import.meta.dev) return true;

    const state = getPaymentState();
    return state.hasPaid || state.poemCount < MAX_FREE_POEMS;
  };

  const getRemainingFreePoems = (): number => {
    const state = getPaymentState();
    if (state.hasPaid) return Infinity;
    return Math.max(0, MAX_FREE_POEMS - state.poemCount);
  };

  const incrementPoemCount = () => {
    const state = getPaymentState();
    if (!state.hasPaid) {
      state.poemCount += 1;
      savePaymentState(state);
    }
  };

  const markAsPaid = (paymentToken?: string) => {
    const state = getPaymentState();
    state.hasPaid = true;
    state.paymentToken = paymentToken;
    savePaymentState(state);
  };

  const resetPaymentState = () => {
    if (import.meta.server) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error resetting payment state:', error);
    }
  };

  return {
    isPaid,
    canGeneratePoem,
    getRemainingFreePoems,
    incrementPoemCount,
    markAsPaid,
    resetPaymentState,
    maxFreePoems: MAX_FREE_POEMS,
  };
};
