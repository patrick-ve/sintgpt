<template>
  <Transition
    enter-active-class="transition-all duration-700 ease-out"
    enter-from-class="translate-y-full opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition-all duration-300 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-full opacity-0"
  >
    <div
      v-if="showBanner"
      class="fixed bottom-0 left-0 right-0 md:bottom-6 md:left-auto md:right-6 md:max-w-md z-50"
    >
      <div class="cookie-banner">
        <!-- Decorative pepernoot icon -->
        <div class="cookie-icon">
          <span class="text-xl md:text-2xl">🍪</span>
        </div>

        <div class="cookie-content">
          <!-- Title -->
          <h3 class="cookie-title">
            {{ t('cookie.title') }}
          </h3>

          <!-- Required message (shown when trying to generate without consent) -->
          <p v-if="showRequiredMessage" class="cookie-required">
            {{ t('cookie.required') }}
          </p>

          <!-- Message -->
          <p class="cookie-message">
            {{ t('cookie.message') }}
          </p>

          <!-- Action buttons -->
          <div class="cookie-actions">
            <button
              @click="declineCookies"
              class="cookie-btn-secondary"
              data-umami-event="Decline cookies"
            >
              {{ t('cookie.decline') }}
            </button>
            <button
              @click="acceptCookies"
              class="cookie-btn-primary"
              data-umami-event="Accept cookies"
            >
              {{ t('cookie.accept') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const { t } = useI18n();
const {
  showBanner,
  showRequiredMessage,
  initConsent,
  acceptCookies,
  declineCookies,
} = useCookieConsent();

onMounted(() => {
  initConsent();

  // Check if user has already given consent
  const consent = localStorage.getItem('cookie_consent');
  if (consent) return;

  // Show banner on first scroll
  const handleFirstScroll = () => {
    showBanner.value = true;
    window.removeEventListener('scroll', handleFirstScroll);
  };

  window.addEventListener('scroll', handleFirstScroll, { passive: true });

  // Cleanup listener on unmount
  onUnmounted(() => {
    window.removeEventListener('scroll', handleFirstScroll);
  });
});
</script>

<style scoped>
.cookie-banner {
  background: linear-gradient(135deg, #fef9e7 0%, #f5e6c8 100%);
  border-top: 3px solid #8b1538;
  position: relative;
  padding: 1rem 1.25rem 1.25rem;
  box-shadow:
    0 -4px 30px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

@media (min-width: 768px) {
  .cookie-banner {
    border: 3px solid #8b1538;
    border-radius: 16px;
    padding: 1.25rem 1.5rem 1.5rem;
    box-shadow:
      0 10px 40px rgba(0, 0, 0, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.8);
  }

  /* Decorative dashed inner border on desktop */
  .cookie-banner::before {
    content: '';
    position: absolute;
    top: 8px;
    left: 8px;
    right: 8px;
    bottom: 8px;
    border: 2px dashed #d4a853;
    border-radius: 10px;
    pointer-events: none;
    opacity: 0.5;
  }
}

.cookie-icon {
  position: absolute;
  top: -16px;
  left: 16px;
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #fef9e7 0%, #f5e6c8 100%);
  border: 3px solid #8b1538;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(139, 21, 56, 0.25);
  z-index: 10;
}

@media (min-width: 768px) {
  .cookie-icon {
    top: -18px;
    left: -12px;
    width: 44px;
    height: 44px;
  }
}

.cookie-content {
  position: relative;
  z-index: 1;
}

.cookie-title {
  font-family: 'Cinzel', serif;
  font-weight: 700;
  font-size: 1rem;
  color: #8b1538;
  margin-bottom: 0.375rem;
  letter-spacing: 0.02em;
  padding-left: 2.5rem;
}

@media (min-width: 768px) {
  .cookie-title {
    font-size: 1.125rem;
    margin-bottom: 0.5rem;
    padding-left: 1.5rem;
  }
}

.cookie-required {
  font-family: 'IM Fell DW Pica', serif;
  font-size: 0.875rem;
  line-height: 1.4;
  color: #8b1538;
  background: rgba(139, 21, 56, 0.1);
  border-left: 3px solid #8b1538;
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.625rem;
  border-radius: 0 4px 4px 0;
}

@media (min-width: 768px) {
  .cookie-required {
    font-size: 0.9375rem;
    padding: 0.625rem 0.875rem;
    margin-bottom: 0.75rem;
  }
}

.cookie-message {
  font-family: 'IM Fell DW Pica', serif;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #4a3728;
  margin-bottom: 0.875rem;
}

@media (min-width: 768px) {
  .cookie-message {
    font-size: 0.9375rem;
    line-height: 1.6;
    margin-bottom: 1rem;
  }
}

.cookie-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.625rem;
}

.cookie-btn-secondary {
  font-family: 'Cinzel', serif;
  font-weight: 600;
  font-size: 0.75rem;
  color: #5c0f26;
  background: transparent;
  border: 2px solid #d4c5a0;
  border-radius: 8px;
  padding: 0.5rem 0.875rem;
  cursor: pointer;
  transition: all 0.25s ease;
}

.cookie-btn-secondary:hover {
  background: rgba(212, 168, 83, 0.1);
  border-color: #d4a853;
  transform: translateY(-1px);
}

@media (min-width: 768px) {
  .cookie-btn-secondary {
    font-size: 0.8125rem;
    padding: 0.5rem 1rem;
  }
}

.cookie-btn-primary {
  font-family: 'Cinzel', serif;
  font-weight: 700;
  font-size: 0.75rem;
  color: #f4cd60;
  background: linear-gradient(135deg, #8b1538 0%, #b91c4a 50%, #8b1538 100%);
  background-size: 200% auto;
  border: 2px solid #d4a853;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow:
    0 2px 8px rgba(139, 21, 56, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
}

.cookie-btn-primary:hover {
  background-position: right center;
  transform: translateY(-2px);
  box-shadow:
    0 4px 12px rgba(139, 21, 56, 0.4),
    0 0 20px rgba(212, 168, 83, 0.2);
}

/* Subtle shimmer effect on primary button */
.cookie-btn-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.15),
    transparent
  );
  animation: cookie-shimmer 4s infinite;
}

@keyframes cookie-shimmer {
  0% {
    left: -100%;
  }
  50%,
  100% {
    left: 100%;
  }
}

@media (min-width: 768px) {
  .cookie-btn-primary {
    font-size: 0.8125rem;
    padding: 0.5rem 1.25rem;
  }
}
</style>
