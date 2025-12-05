<script setup lang="ts">
const { t } = useI18n();

const isOpen = defineModel<boolean>({ default: false });

const dialogRef = ref<HTMLDialogElement | null>(null);

const isLoading = ref(false);
const error = ref<string | null>(null);

// Sync dialog element with isOpen state
watch(isOpen, (newValue) => {
  if (newValue) {
    dialogRef.value?.showModal();
    // Track analytics event
    (window as any).umami?.track('Show payment modal');
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
    closeModal();
  }
};

const handlePayment = async () => {
  error.value = null;
  isLoading.value = true;

  // Track analytics event
  (window as any).umami?.track('Proceed to payment');

  try {
    // Create checkout session
    const response = await $fetch<{ checkoutUrl: string }>(
      '/api/payment/create-checkout',
      {
        method: 'POST',
      }
    );

    // Close the dialog before redirecting to avoid browser navigation issues
    dialogRef.value?.close();
    isOpen.value = false;

    // Small delay to ensure dialog is fully closed before redirect
    await new Promise(resolve => setTimeout(resolve, 500));

    // Redirect to checkout page (instead of overlay, to support iDeal and other redirect-based payment methods)
    window.location.href = response.checkoutUrl;
  } catch (err: any) {
    console.error('Error creating checkout:', err);
    error.value =
      err.data?.statusMessage || err.message || t('payment.error');
    isLoading.value = false;
  }
};

const closeModal = () => {
  isOpen.value = false;
  error.value = null;
};
</script>

<template>
  <dialog
    ref="dialogRef"
    class="payment-dialog"
    @close="handleDialogClose"
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
        @click="closeModal"
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
        <p class="banner-text">{{ t('payment.limitReached') }}</p>
      </div>

      <!-- Pricing card -->
      <div class="pricing-card">
        <!-- Decorative inner border -->
        <div class="pricing-inner-border"></div>

        <!-- Price display -->
        <div class="price-wrapper">
          <span class="price-currency">€</span>
          <span class="price-amount">1</span>
          <span class="price-cents">,99</span>
        </div>

        <p class="price-description">{{ t('payment.oneTimePayment') }} · {{ t('payment.includesVAT') }}</p>

        <!-- Features list -->
        <ul class="features-list">
          <li class="feature-item">
            <span class="feature-check">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <span class="feature-text">{{ t('payment.feature1') }}</span>
          </li>
          <li class="feature-item">
            <span class="feature-check">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <span class="feature-text">{{ t('payment.feature2') }}</span>
          </li>
          <li class="feature-item">
            <span class="feature-check">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <span class="feature-text">{{ t('payment.feature3') }}</span>
          </li>
        </ul>
      </div>

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

      <!-- CTA Button -->
      <button
        type="button"
        class="pay-button"
        :disabled="isLoading"
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
          <span class="button-icon">🎁</span>
          {{ t('payment.payNow') }}
          <span class="button-icon">🎁</span>
        </span>
        <!-- Shimmer effect -->
        <div class="button-shimmer"></div>
      </button>

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
  max-width: 420px;
  width: calc(100% - 2rem);
  max-height: calc(100vh - 2rem);
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
  overflow: hidden;
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
  bottom: -4px;
  right: -4px;
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
  transition: all 0.3s ease;
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
  font-family: 'Cinzel', serif;
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
  font-family: 'IM Fell DW Pica', serif;
  font-size: 0.95rem;
  color: #5c0f26;
  margin: 0;
  line-height: 1.5;
}

/* Pricing card */
.pricing-card {
  position: relative;
  background: linear-gradient(145deg, #fff 0%, #fef9e7 100%);
  border: 3px solid #8b1538;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  text-align: center;
  box-shadow:
    0 6px 20px rgba(139, 21, 56, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 1);
  z-index: 1;
}

.pricing-inner-border {
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  bottom: 8px;
  border: 2px dashed #d4a853;
  border-radius: 10px;
  pointer-events: none;
  opacity: 0.4;
}

/* Price display */
.price-wrapper {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  margin-bottom: 0.25rem;
}

.price-currency {
  font-family: 'Cinzel', serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #8b1538;
  margin-top: 0.5rem;
  margin-right: 0.125rem;
}

.price-amount {
  font-family: 'Cinzel', serif;
  font-size: 4rem;
  font-weight: 900;
  background: linear-gradient(135deg, #8b1538 0%, #b91c4a 50%, #8b1538 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: none;
  filter: drop-shadow(0 2px 4px rgba(139, 21, 56, 0.2));
}

.price-cents {
  font-family: 'Cinzel', serif;
  font-size: 1.75rem;
  font-weight: 700;
  color: #8b1538;
  margin-top: 0.5rem;
}

.price-description {
  font-family: 'Cinzel', serif;
  font-size: 0.8rem;
  color: #5c0f26;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Card divider */
.card-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 1rem 0;
}

.divider-ornament {
  color: #d4a853;
  font-size: 1.25rem;
  opacity: 0.7;
}

/* Features list */
.features-list {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
}

.feature-item:not(:last-child) {
  border-bottom: 1px solid rgba(212, 168, 83, 0.2);
}

.feature-check {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #2d5a3d 0%, #1a472a 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f4cd60;
  box-shadow: 0 2px 6px rgba(26, 71, 42, 0.3);
}

.feature-text {
  font-family: 'IM Fell DW Pica', serif;
  font-size: 0.95rem;
  color: #3d2914;
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
  font-family: 'Cinzel', serif;
  font-size: 0.9rem;
  font-weight: 700;
  color: #92400e;
  margin: 0 0 0.25rem 0;
}

.error-message {
  font-family: 'IM Fell DW Pica', serif;
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
  font-family: 'Cinzel', serif;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
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
  font-family: 'Cinzel', serif;
  font-size: 0.75rem;
  color: #5c0f26;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  opacity: 0.7;
}

/* Mobile responsive */
@media (max-width: 480px) {
  .payment-dialog {
    width: calc(100% - 1.5rem);
    max-height: calc(100vh - 1.5rem);
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

  .price-amount {
    font-size: 3.5rem;
  }

  .price-currency,
  .price-cents {
    font-size: 1.25rem;
  }

  .floating-gift,
  .floating-star {
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
