<script setup lang="ts">
import { fillSeasons, formatPrice, pricePerPoemCents, RECOMMENDED_TIER, TIER_IDS, TIERS, type TierId } from '~/utils/pricingTiers';

export type PaymentTrigger = 'submit' | 'rewrite' | 'limit' | 'credits' | 'surprise' | 'design';

const { t, locale } = useI18n();

const isOpen = defineModel<boolean>({ default: false });

// Why the window opened, for analytics and the first line: the second poem, a
// rewrite, the server's daily limit, the Drie poems used up, or a Hele
// familie feature. `tier` is the card to select, if it can be bought.
const props = defineProps<{ trigger?: PaymentTrigger; tier?: TierId }>();

const dialogRef = ref<HTMLDialogElement | null>(null);

const isLoading = ref(false);
const error = ref<string | null>(null);

// `checkout` fires just before the page leaves for Dodo, so the form can be kept.
const emit = defineEmits<{ restored: []; checkout: [] }>();
const {
  claimPayment,
  paymentsUnavailable,
  refreshPaymentsStatus,
  tier: ownedTier,
  tiersOnSale,
  suggestedTier,
} = usePaymentTracking();

// The tier cards. Gezin is the recommended one and selected by default; a
// buyer sees what they have and can only choose a tier above it.
const selectedTier = ref<TierId>(RECOMMENDED_TIER);
const tierCards = computed(() => TIER_IDS.filter(id => tiersOnSale.value.includes(id)).map((id) => {
  const tier = TIERS[id];
  const perPoem = pricePerPoemCents(tier);
  const owned = ownedTier.value !== null && TIER_IDS.indexOf(id) <= TIER_IDS.indexOf(ownedTier.value);
  return {
    id,
    name: t(`payment.tiers.${id}.name`),
    price: formatPrice(tier.priceCents, locale.value),
    note: perPoem
      ? t('payment.tiers.perPoem', { price: formatPrice(perPoem, locale.value) })
      : t(`payment.tiers.${id}.note`),
    features: (t(`payment.tiers.${id}.features`) as string[]).map(feature => fillSeasons(feature)),
    missing: t(`payment.tiers.${id}.missing`) as string[],
    recommended: id === RECOMMENDED_TIER,
    owned,
  };
}));

const selectedCard = computed(() => tierCards.value.find(card => card.id === selectedTier.value));

// "Voor €3 meer schrijf je met Gezin zoveel gedichten als je wilt": plain maths.
const upgradeNudge = computed(() => {
  if (selectedTier.value !== 'drie' || !tiersOnSale.value.includes('gezin')) return '';
  const difference = TIERS.gezin.priceCents - TIERS.drie.priceCents;
  const amount = difference % 100 === 0 ? `€${difference / 100}` : formatPrice(difference, locale.value);
  return t('payment.tiers.nudge', { difference: amount });
});

const intro = computed(() => {
  if (props.trigger === 'rewrite' && ownedTier.value) return t('payment.intro.rewriteTier');
  if (props.trigger === 'credits' || props.trigger === 'surprise' || props.trigger === 'design') {
    return t(`payment.intro.${props.trigger}`);
  }
  return t('payment.nextStep');
});
const { track } = useAnalytics();

// Buyers on another browser, or with a cookie from before Nov 2026, can get
// access back with their payment ID. The server verifies it with Dodo.
const restoreId = ref('');
const restoreError = ref<string | null>(null);
const isRestoring = ref(false);

const handleRestore = async () => {
  const paymentId = restoreId.value.trim();
  if (!/^pay_[A-Za-z0-9]+$/.test(paymentId)) {
    restoreError.value = t('payment.restore.invalid');
    track('Restore failed', { detail: 'invalid' });
    return;
  }

  restoreError.value = null;
  isRestoring.value = true;
  const status = await claimPayment(paymentId, 'restore');
  isRestoring.value = false;

  if (status === 'granted') {
    track('Access restored');
    isOpen.value = false;
    emit('restored');
  } else {
    restoreError.value = t(`payment.restore.${status === 'pending' ? 'pending' : 'failed'}`);
    track('Restore failed', { detail: status });
  }
};

// Sync dialog element with isOpen state
watch(isOpen, (newValue) => {
  if (newValue) {
    selectedTier.value = suggestedTier(props.tier);
    dialogRef.value?.showModal();
    track('Show payment modal', { detail: props.trigger });
    // Payments may have stopped or started working since the page loaded.
    refreshPaymentsStatus().then(() => {
      selectedTier.value = suggestedTier(props.tier);
    });
  } else {
    dialogRef.value?.close();
  }
}, { immediate: true });

// Also handle case where isOpen is true on mount
onMounted(() => {
  if (isOpen.value) {
    dialogRef.value?.showModal();
  }
});

// Handle native dialog close (e.g., pressing Escape)
const handleDialogClose = () => {
  isOpen.value = false;
  error.value = null;
};

// Handle backdrop click
const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === dialogRef.value) {
    closeModal('backdrop');
  }
};

// Escape fires `cancel` before the dialog closes itself.
const handleCancel = () => {
  track('Close payment modal', { detail: 'escape' });
};

const handlePayment = async () => {
  error.value = null;
  isLoading.value = true;

  // The server records "Proceed to payment" when Dodo gives a checkout.
  try {
    // Create checkout session
    const response = await $fetch<{ checkoutUrl: string }>(
      '/api/payment/create-checkout',
      {
        method: 'POST',
        body: { tier: selectedTier.value },
      }
    );

    emit('checkout');

    // Close the dialog before redirecting to avoid browser navigation issues
    dialogRef.value?.close();
    isOpen.value = false;

    // Small delay to ensure dialog is fully closed before redirect
    await new Promise(resolve => setTimeout(resolve, 500));

    // Redirect to checkout page (instead of overlay, to support iDeal and other redirect-based payment methods)
    window.location.href = response.checkoutUrl;
  } catch (err: any) {
    console.error('Error creating checkout:', err);
    isLoading.value = false;
    if (err.data?.data?.code === 'payments_unavailable') {
      // The server records "Payments unavailable".
      paymentsUnavailable.value = true;
      return;
    }
    error.value = t('payment.error');
  }
};

// While payments do not work, the visitor can go on with free poems.
const continueFree = () => {
  closeModal('continue free');
  document.getElementById('poem-form')?.scrollIntoView({ block: 'start' });
};

const closeModal = (how: 'button' | 'backdrop' | 'continue free') => {
  track('Close payment modal', { detail: how });
  isOpen.value = false;
  error.value = null;
};
</script>

<template>
  <dialog
    ref="dialogRef"
    class="payment-dialog"
    @close="handleDialogClose"
    @cancel="handleCancel"
    @click="handleBackdropClick"
  >
    <div class="modal-container" @click.stop>
      <!-- Decorative corner ribbons -->
      <div class="ribbon-corner ribbon-tl"></div>
      <div class="ribbon-corner ribbon-br"></div>

      <!-- Floating decorative elements -->
      <div class="floating-gift">🎁</div>
      <div class="floating-star">✨</div>

      <!-- Close button -->
      <button
        type="button"
        class="close-btn"
        @click="closeModal('button')"
        aria-label="Sluiten"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Header section with Sinterklaas imagery -->
      <div class="modal-header">
        <div class="sint-badge">
          <span class="sint-emoji">🎅</span>
        </div>
        <h3 class="modal-title">{{ t('payment.title') }}</h3>
        <div class="title-flourish">
          <span class="flourish-line"></span>
          <span class="flourish-diamond">◆</span>
          <span class="flourish-line"></span>
        </div>
      </div>

      <!-- Info banner -->
      <div class="info-banner">
        <div class="banner-icon">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p class="banner-text">{{ intro }}</p>
      </div>

      <!-- The tiers: one choice, Gezin selected -->
      <fieldset v-if="!paymentsUnavailable" class="tiers">
        <legend class="sr-only">{{ t('payment.tiers.legend') }}</legend>
        <label
          v-for="card in tierCards"
          :key="card.id"
          class="tier"
          :class="{ 'tier-recommended': card.recommended, 'tier-owned': card.owned }"
          :data-tier="card.id"
        >
          <input
            v-model="selectedTier"
            type="radio"
            name="payment-tier"
            class="sr-only"
            :value="card.id"
            :disabled="card.owned"
          >
          <span v-if="card.owned" class="tier-badge tier-badge-owned">{{ t('payment.tiers.owned') }}</span>
          <span v-else-if="card.recommended" class="tier-badge">{{ t('payment.tiers.recommended') }}</span>
          <span class="tier-name">{{ card.name }}</span>
          <span class="tier-price">{{ card.price }}</span>
          <span class="tier-note">{{ card.note }}</span>
          <ul class="tier-features">
            <li v-for="feature in card.features" :key="feature" class="tier-feature">
              <span class="tier-mark tier-mark-yes" aria-hidden="true">✓</span>{{ feature }}
            </li>
            <li v-for="feature in card.missing" :key="feature" class="tier-feature tier-feature-missing">
              <span class="tier-mark tier-mark-no" aria-hidden="true">✕</span>
              <span><span class="sr-only">{{ t('payment.tiers.notIncluded') }}: </span>{{ feature }}</span>
            </li>
          </ul>
        </label>
      </fieldset>

      <p v-if="!paymentsUnavailable" class="tier-summary">
        {{ t('payment.oneTimePayment') }} · {{ t('payment.includesVAT') }}
      </p>
      <p v-if="upgradeNudge" class="tier-nudge" aria-live="polite">{{ upgradeNudge }}</p>

      <!-- Error display -->
      <div v-if="error" class="error-banner">
        <div class="error-icon">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div class="error-content">
          <p class="error-title">{{ t('payment.errorTitle') }}</p>
          <p class="error-message">{{ error }}</p>
        </div>
      </div>

      <!-- Payments do not work right now: say so, and offer free poems -->
      <div v-if="paymentsUnavailable" class="unavailable" role="status">
        <p class="unavailable-title">{{ t('payment.unavailable.title') }}</p>
        <p class="unavailable-message">{{ t('payment.unavailable.message') }}</p>
        <button type="button" class="pay-button" @click="continueFree">
          <span class="button-content">{{ t('payment.unavailable.continue') }}</span>
        </button>
      </div>

      <!-- CTA Button -->
      <button
        v-else
        type="button"
        class="pay-button"
        :disabled="isLoading || !selectedCard || selectedCard.owned"
        @click="handlePayment"
      >
        <span v-if="isLoading" class="button-loading">
          <svg class="spinner" viewBox="0 0 24 24">
            <circle class="spinner-track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
            <path class="spinner-fill" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ t('payment.processing') }}
        </span>
        <span v-else class="button-content">
          <span class="button-icon" aria-hidden="true">🎁</span>
          {{ t('payment.payNow', { tier: selectedCard?.name ?? '', price: selectedCard?.price ?? '' }) }}
          <span class="button-icon" aria-hidden="true">🎁</span>
        </span>
        <!-- Shimmer effect -->
        <div class="button-shimmer"></div>
      </button>

      <!-- Restore access for earlier buyers -->
      <details class="restore">
        <summary>{{ t('payment.restore.title') }}</summary>
        <form novalidate class="restore-form" @submit.prevent="handleRestore">
          <label for="restore-payment-id" class="restore-label">{{ t('payment.restore.label') }}</label>
          <div class="restore-row">
            <input
              id="restore-payment-id"
              v-model="restoreId"
              type="text"
              class="restore-input"
              placeholder="pay_…"
              autocomplete="off"
              autocapitalize="off"
              spellcheck="false"
              :aria-invalid="restoreError ? true : undefined"
              aria-describedby="restore-message"
            />
            <button type="submit" class="restore-submit" :disabled="isRestoring">
              {{ isRestoring ? t('payment.restore.checking') : t('payment.restore.submit') }}
            </button>
          </div>
          <p id="restore-message" class="restore-message" :class="{ 'restore-error': restoreError }" aria-live="polite">
            {{ restoreError || t('payment.restore.help') }}
          </p>
        </form>
      </details>

      <p v-if="!paymentsUnavailable" class="legal-note">
        {{ t('payment.legal.before') }}
        <NuxtLink to="/voorwaarden" target="_blank">{{ t('payment.legal.terms') }}</NuxtLink>
        {{ t('payment.legal.middle') }}
        <NuxtLink to="/privacy" target="_blank">{{ t('payment.legal.privacy') }}</NuxtLink>{{ t('payment.legal.after') }}
      </p>

      <!-- Trust footer -->
      <div class="trust-footer">
        <div class="trust-icons">
          <span class="trust-icon">🔒</span>
          <span class="trust-icon">💳</span>
        </div>
        <p class="trust-text">{{ t('payment.securePayment') }}</p>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
/* Tier cards */
.tiers {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
  gap: 0.75rem;
  margin: 0 0 0.75rem;
  padding: 0;
  border: 0;
}

.tier {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.125rem;
  padding: 1rem 1rem 0.875rem;
  background: rgba(255, 255, 255, 0.55);
  border: 2px solid rgba(160, 136, 80, 0.55);
  border-radius: 14px;
  cursor: pointer;
  transition-property: border-color, background-color, box-shadow;
  transition-duration: 150ms;
}

@media (hover: hover) {
  .tier:not(.tier-owned):not(:has(input:checked)):hover {
    border-color: #d4a853;
    background: rgba(255, 255, 255, 0.8);
  }
}

.tier:has(input:checked) {
  background: #fff;
  border: 3px solid #8b1538;
  padding: calc(1rem - 1px) calc(1rem - 1px) calc(0.875rem - 1px);
  box-shadow: 0 6px 20px rgba(139, 21, 56, 0.18);
}

.tier:has(input:focus-visible) {
  outline: 3px solid #3d0716;
  outline-offset: 3px;
}

.tier-owned {
  cursor: default;
  opacity: 0.65;
}

.tier-recommended {
  padding-top: 1.375rem;
}

.tier-recommended:has(input:checked) {
  padding-top: calc(1.375rem - 1px);
}

@media (min-width: 720px) {
  /* The recommended card stands a little taller than the others. */
  .tier-recommended {
    margin-top: -0.5rem;
    margin-bottom: -0.5rem;
  }
}

.tier-badge {
  position: absolute;
  top: -0.75rem;
  left: 50%;
  translate: -50% 0;
  padding: 0.125rem 0.75rem;
  white-space: nowrap;
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #f4cd60;
  background: #8b1538;
  border: 2px solid #d4a853;
  border-radius: 999px;
}

.tier-badge-owned {
  color: #fff;
  background: #2d5a3d;
  border-color: #2d5a3d;
}

.tier-name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.25rem;
  line-height: 1.2;
  color: #8b1538;
}

.tier-price {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 2rem;
  line-height: 1.15;
  font-variant-numeric: tabular-nums;
  color: #3d0716;
}

.tier-note {
  font-size: 0.875rem;
  font-weight: 700;
  line-height: 1.35;
  color: #5c0f26;
}

.tier-features {
  list-style: none;
  margin: 0.5rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.tier-feature {
  display: flex;
  gap: 0.5rem;
  font-size: 0.9375rem;
  line-height: 1.35;
  color: #3d2914;
}

.tier-feature-missing {
  color: #6b5a4a;
}

.tier-mark {
  flex-shrink: 0;
  width: 1.125rem;
  font-weight: 800;
  text-align: center;
}

.tier-mark-yes {
  color: #2d5a3d;
}

.tier-mark-no {
  color: #8b1538;
}

.tier-summary {
  position: relative;
  z-index: 1;
  margin-bottom: 0.5rem;
  font-size: 0.8125rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  text-align: center;
  color: #5c0f26;
}

.tier-nudge {
  position: relative;
  z-index: 1;
  margin-bottom: 0.75rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.9375rem;
  font-weight: 700;
  text-align: center;
  color: #5c0f26;
  background: rgba(212, 168, 83, 0.2);
  border-radius: 10px;
}

.unavailable {
  margin-top: 1rem;
  padding: 1rem;
  border: 2px solid #d4a853;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.6);
  text-align: center;
}

.unavailable-title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.125rem;
  color: #8b1538;
  margin-bottom: 0.375rem;
}

.unavailable-message {
  font-size: 0.9375rem;
  line-height: 1.5;
  color: #4a3728;
  margin-bottom: 0.875rem;
}

.legal-note {
  margin-top: 0.75rem;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: #5c4a3a;
  text-align: center;
}

.legal-note a {
  color: #8b1538;
  text-decoration: underline;
  text-underline-offset: 2px;
}

/* Dialog base */
.payment-dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 20px;
  max-width: 860px;
  width: calc(100% - 2rem);
  max-height: calc(100dvh - 2rem);
  overflow: visible;
  background: transparent;
  z-index: 1000;
}

.payment-dialog::backdrop {
  background: linear-gradient(135deg, rgba(92, 15, 38, 0.85) 0%, rgba(139, 21, 56, 0.9) 100%);
  backdrop-filter: blur(4px);
}

.payment-dialog[open] {
  animation: dialogEnter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes dialogEnter {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1) translateY(0);
  }
}

/* Modal container */
.modal-container {
  position: relative;
  background: linear-gradient(145deg, #fef9e7 0%, #f5e6c8 50%, #ede0c0 100%);
  border: 4px solid #8b1538;
  border-radius: 20px;
  padding: 2rem 1.5rem 1.5rem;
  box-shadow:
    0 25px 80px rgba(92, 15, 38, 0.5),
    0 0 0 1px rgba(212, 168, 83, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.8),
    inset 0 -2px 10px rgba(139, 21, 56, 0.05);
  /* Scrolls on short screens, so the pay button always stays reachable. */
  max-height: inherit;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
}

/* Parchment texture overlay */
.modal-container::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
  pointer-events: none;
  border-radius: 16px;
}

/* Dashed inner border */
.modal-container::after {
  content: '';
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  bottom: 12px;
  border: 2px dashed #d4a853;
  border-radius: 12px;
  pointer-events: none;
  opacity: 0.5;
}

/* Corner ribbons */
.ribbon-corner {
  position: absolute;
  width: 80px;
  height: 80px;
  overflow: hidden;
  pointer-events: none;
  z-index: 10;
}

.ribbon-corner::before {
  content: '';
  position: absolute;
  width: 120px;
  height: 28px;
  background: linear-gradient(90deg, #f4cd60 0%, #d4a853 30%, #f4cd60 50%, #d4a853 70%, #f4cd60 100%);
  box-shadow:
    0 3px 10px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.ribbon-tl {
  top: -4px;
  left: -4px;
}

.ribbon-tl::before {
  top: 20px;
  left: -30px;
  transform: rotate(-45deg);
}

.ribbon-br {
  bottom: 0;
  right: 0;
}

.ribbon-br::before {
  bottom: 20px;
  right: -30px;
  transform: rotate(-45deg);
}

/* Floating decorations */
.floating-gift,
.floating-star {
  position: absolute;
  font-size: 1.5rem;
  pointer-events: none;
  z-index: 5;
  animation: floatBounce 3s ease-in-out infinite;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.floating-gift {
  top: -10px;
  right: 60px;
  animation-delay: 0s;
}

.floating-star {
  top: 40px;
  left: -5px;
  font-size: 1.2rem;
  animation-delay: 1s;
}

@keyframes floatBounce {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-8px) rotate(5deg); }
  75% { transform: translateY(4px) rotate(-5deg); }
}

/* Close button */
.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #8b1538 0%, #5c0f26 100%);
  border: 2px solid #d4a853;
  border-radius: 50%;
  color: #f4cd60;
  cursor: pointer;
  transition-property: background-color, border-color, color, box-shadow, transform, opacity;
  transition-duration: 0.3s;
  z-index: 20;
}

.close-btn:hover {
  transform: scale(1.1) rotate(90deg);
  background: linear-gradient(135deg, #b91c4a 0%, #8b1538 100%);
  box-shadow: 0 4px 15px rgba(139, 21, 56, 0.4);
}

/* Header */
.modal-header {
  text-align: center;
  margin-bottom: 1.25rem;
  position: relative;
  z-index: 1;
}

.sint-badge {
  width: 70px;
  height: 70px;
  margin: 0 auto 0.75rem;
  background: linear-gradient(145deg, #8b1538 0%, #5c0f26 100%);
  border: 3px solid #d4a853;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 8px 25px rgba(139, 21, 56, 0.4),
    inset 0 2px 0 rgba(255, 255, 255, 0.1);
  animation: badgePulse 2s ease-in-out infinite;
}

@keyframes badgePulse {
  0%, 100% { box-shadow: 0 8px 25px rgba(139, 21, 56, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.1); }
  50% { box-shadow: 0 8px 35px rgba(139, 21, 56, 0.5), 0 0 20px rgba(212, 168, 83, 0.3), inset 0 2px 0 rgba(255, 255, 255, 0.1); }
}

.sint-emoji {
  font-size: 2.25rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.modal-title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  color: #8b1538;
  margin: 0;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.8);
}

.title-flourish {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.flourish-line {
  width: 40px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #d4a853, transparent);
}

.flourish-diamond {
  color: #d4a853;
  font-size: 0.75rem;
}

/* Info banner */
.info-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: linear-gradient(135deg, rgba(139, 21, 56, 0.08) 0%, rgba(212, 168, 83, 0.1) 100%);
  border: 2px solid rgba(139, 21, 56, 0.2);
  border-radius: 12px;
  margin-bottom: 1.25rem;
  position: relative;
  z-index: 1;
}

.banner-icon {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #8b1538 0%, #5c0f26 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f4cd60;
}

.banner-text {
  font-family: var(--font-text);
  font-size: 0.95rem;
  color: #5c0f26;
  margin: 0;
  line-height: 1.5;
}

/* Error banner */
.error-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 2px solid #f59e0b;
  border-radius: 12px;
  margin-bottom: 1rem;
  position: relative;
  z-index: 1;
}

.error-icon {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.error-content {
  flex: 1;
}

.error-title {
  font-family: var(--font-display);
  font-size: 0.9rem;
  font-weight: 700;
  color: #92400e;
  margin: 0 0 0.25rem 0;
}

.error-message {
  font-family: var(--font-text);
  font-size: 0.875rem;
  color: #a16207;
  margin: 0;
}

/* Pay button */
.pay-button {
  position: relative;
  width: 100%;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #8b1538 0%, #b91c4a 50%, #8b1538 100%);
  background-size: 200% auto;
  border: 3px solid #d4a853;
  border-radius: 14px;
  color: #f4cd60;
  font-family: var(--font-sans);
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  overflow: hidden;
  transition-property: background-color, border-color, color, box-shadow, transform, opacity;
  transition-duration: 0.3s;
  box-shadow:
    0 6px 20px rgba(139, 21, 56, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  z-index: 1;
}

.pay-button:hover:not(:disabled) {
  background-position: right center;
  transform: translateY(-2px);
  box-shadow:
    0 8px 30px rgba(139, 21, 56, 0.5),
    0 0 25px rgba(212, 168, 83, 0.4);
}

.pay-button:active:not(:disabled) {
  transform: translateY(0);
}

.pay-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.button-content,
.button-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  position: relative;
  z-index: 2;
}

.button-icon {
  font-size: 1.1rem;
}

.button-shimmer {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  animation: shimmerSlide 3s ease-in-out infinite;
}

@keyframes shimmerSlide {
  0% { left: -100%; }
  50%, 100% { left: 100%; }
}

.spinner {
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
}

.spinner-track {
  opacity: 0.25;
}

.spinner-fill {
  opacity: 0.75;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Trust footer */
.restore {
  margin-top: 1rem;
  text-align: start;
}

.restore summary {
  min-height: 2.75rem;
  padding-block: 0.625rem;
  font-weight: 700;
  color: #8b1538;
  cursor: pointer;
}

.restore-label {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: #5c0f26;
}

.restore-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.restore-input {
  flex: 1 1 10rem;
  min-width: 0;
  min-height: 2.75rem;
  padding-inline: 0.75rem;
  font-size: 1rem;
  background: #fff;
  border: 2px solid #a08850;
  border-radius: 0.5rem;
}

.restore-input[aria-invalid='true'] {
  border-color: #8b1538;
}

.restore-submit {
  min-height: 2.75rem;
  padding-inline: 1rem;
  font-weight: 700;
  color: #8b1538;
  background: transparent;
  border: 2px solid #8b1538;
  border-radius: 0.5rem;
  cursor: pointer;
  transition-property: background-color;
  transition-duration: 150ms;
}

.restore-submit:enabled:hover {
  background: rgba(139, 21, 56, 0.1);
}

.restore-submit:disabled {
  cursor: wait;
  opacity: 0.7;
}

.restore-message {
  margin-top: 0.375rem;
  font-size: 0.875rem;
  line-height: 1.4;
  color: #5c0f26;
}

.restore-error {
  font-weight: 700;
  color: #8b1538;
}

.trust-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  margin-top: 1rem;
  position: relative;
  z-index: 1;
}

.trust-icons {
  display: flex;
  gap: 0.5rem;
}

.trust-icon {
  font-size: 1rem;
  opacity: 0.7;
}

.trust-text {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  color: #5c0f26;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  opacity: 0.7;
}

/* On narrow screens the cards stack; keep the pay button in view at the bottom. */
@media (max-width: 719px) {
  .pay-button {
    position: sticky;
    bottom: 0;
  }
}

/* A compact header on wide screens, so the three cards fit without scrolling. */
@media (min-width: 720px) {
  .modal-header {
    margin-bottom: 1rem;
  }

  .sint-badge {
    width: 56px;
    height: 56px;
    margin-bottom: 0.5rem;
  }

  .sint-emoji {
    font-size: 1.75rem;
  }
}

/* Mobile responsive */
/* Where the window scrolls, this corner ribbon would end up mid-content. */
@media (max-height: 800px) {
  .ribbon-br {
    display: none;
  }
}

@media (max-width: 480px) {
  .payment-dialog {
    width: calc(100% - 1.5rem);
    max-height: calc(100dvh - 1.5rem);
  }

  .modal-container {
    padding: 1.75rem 1.25rem 1.25rem;
  }

  .sint-badge {
    width: 60px;
    height: 60px;
  }

  .sint-emoji {
    font-size: 1.875rem;
  }

  .modal-title {
    font-size: 1.25rem;
  }

  .floating-gift,
  .floating-star,
  .button-icon {
    display: none;
  }

  .ribbon-corner {
    width: 60px;
    height: 60px;
  }

  .ribbon-corner::before {
    width: 90px;
    height: 22px;
  }

  .ribbon-tl::before {
    top: 14px;
    left: -22px;
  }

  .ribbon-br::before {
    bottom: 14px;
    right: -22px;
  }
}
</style>
