import { RECOMMENDED_TIER, TIER_IDS, TIERS, type Tier, type TierId } from '~/utils/pricingTiers';

export type ClaimStatus = 'granted' | 'pending' | 'denied' | 'expired';

interface AccessResponse {
  hasAccess: boolean;
  tier: TierId | null;
  expiresAt: number | null;
  poemsLeft: number | null;
}

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
// What this browser bought, from the signed cookie. The server decides; this
// only drives what the page shows.
const tier = ref<TierId | null>(null);
const expiresAt = ref<number | null>(null);
// Poems left for a tier with a fixed number (Drie); null for the others.
const poemsLeft = ref<number | null>(null);
// The tiers the server can sell now.
const tiersOnSale = ref<TierId[]>([...TIER_IDS]);
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

  // Reads what the access cookie grants, and the poems left for Drie.
  const checkServerAccess = async () => {
    if (import.meta.server) return;

    try {
      const response = await $fetch<AccessResponse>('/api/payment/check-access');
      tier.value = response.hasAccess ? response.tier : null;
      expiresAt.value = response.expiresAt;
      poemsLeft.value = response.poemsLeft;
    } catch (error) {
      console.error('Error checking access:', error);
      tier.value = null;
    }
  };

  // Initialize on first use (client-side only)
  if (!isInitialized.value && !import.meta.server) {
    loadFromStorage();
    checkServerAccess();
    isInitialized.value = true;
  }

  // Computed properties for reactivity
  const isPaid = computed(() => tier.value !== null);
  const currentTier = computed<Tier | null>(() => (tier.value ? TIERS[tier.value] : null));

  /** Whether the purchase includes a feature. Free visitors have none of these. */
  const hasFeature = (feature: 'rewrites' | 'extraDesigns' | 'surpriseIdeas') =>
    currentTier.value?.[feature] ?? false;

  /** Drie with all its poems written. */
  const creditsUsed = computed(() => poemsLeft.value !== null && poemsLeft.value <= 0);

  const canGeneratePoem = computed(() => {
    if (isPaid.value) return !creditsUsed.value;
    return paymentsUnavailable.value || poemCount.value < MAX_FREE_POEMS;
  });

  /** The tier the payment window selects: the recommended one, or the next one up. */
  const suggestedTier = (wanted?: TierId): TierId => {
    const above = tiersOnSale.value.filter(id => TIER_IDS.indexOf(id) > (tier.value ? TIER_IDS.indexOf(tier.value) : -1));
    if (wanted && above.includes(wanted)) return wanted;
    if (above.includes(RECOMMENDED_TIER)) return RECOMMENDED_TIER;
    return above[0] ?? RECOMMENDED_TIER;
  };

  /** Asks the server whether a checkout can work now. */
  const refreshPaymentsStatus = async (): Promise<boolean> => {
    try {
      const { available, tiers } = await $fetch<{ available: boolean; tiers?: TierId[] }>('/api/payment/status');
      paymentsUnavailable.value = !available;
      // An older server sends no list: then only Gezin is on sale.
      tiersOnSale.value = tiers?.length ? tiers : [RECOMMENDED_TIER];
    } catch {
      // Unknown: offer payment, and let the checkout give the answer.
      paymentsUnavailable.value = false;
    }
    return !paymentsUnavailable.value;
  };

  const remainingFreePoems = computed(() => {
    if (isPaid.value) return Infinity;
    return Math.max(0, MAX_FREE_POEMS - poemCount.value);
  });

  // After a poem: count the free one, or ask the server how many Drie poems
  // are left (it counted the poem).
  const incrementPoemCount = () => {
    if (isPaid.value) {
      if (poemsLeft.value !== null) {
        poemsLeft.value = Math.max(0, poemsLeft.value - 1);
        checkServerAccess();
      }
      return;
    }

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
  ): Promise<ClaimStatus> => {
    for (let attempt = 0; attempt < CLAIM_ATTEMPTS; attempt++) {
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, CLAIM_RETRY_MS));
      }
      try {
        const claim = await $fetch<{ status: ClaimStatus; tier?: TierId; expiresAt?: number }>(
          '/api/payment/claim-access',
          { method: 'POST', body: { paymentId, source } },
        );
        const { status } = claim;
        if (status === 'granted') {
          // The server set the cookie. A payment from before the tiers is Gezin.
          tier.value = claim.tier ?? RECOMMENDED_TIER;
          expiresAt.value = claim.expiresAt ?? null;
          poemsLeft.value = TIERS[tier.value].poems;
          // A Drie payment may have poems written already; the server knows.
          if (poemsLeft.value !== null) checkServerAccess();
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
    tier.value = null;
    poemsLeft.value = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error resetting payment state:', error);
    }
  };

  return {
    isPaid,
    tier: readonly(tier),
    currentTier,
    expiresAt: readonly(expiresAt),
    poemsLeft: readonly(poemsLeft),
    creditsUsed,
    hasFeature,
    tiersOnSale: readonly(tiersOnSale),
    suggestedTier,
    refreshAccess: checkServerAccess,
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
