<script setup lang="ts">
import {
  DodoPayments,
  type CheckoutEvent,
  type CheckoutMode,
} from 'dodopayments-checkout';

const { t } = useI18n();

const isOpen = defineModel<boolean>({ default: false });

const emit = defineEmits<{
  (e: 'paymentSuccess'): void;
}>();

const dialogRef = ref<HTMLDialogElement | null>(null);

const isLoading = ref(false);
const error = ref<string | null>(null);
const paymentSuccess = ref(false);
const checkoutInitialized = ref(false);

// Sync dialog element with isOpen state
watch(isOpen, (newValue) => {
  if (newValue) {
    dialogRef.value?.showModal();
  } else {
    dialogRef.value?.close();
  }
});

// Handle native dialog close (e.g., pressing Escape)
const handleDialogClose = () => {
  isOpen.value = false;
  error.value = null;
  paymentSuccess.value = false;
};

// Handle backdrop click
const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === dialogRef.value) {
    closeModal();
  }
};

// Initialize Dodo Payments SDK when component mounts
onMounted(() => {
  if (!checkoutInitialized.value) {
    try {
      DodoPayments.Initialize({
        mode: 'test' as CheckoutMode,
        onEvent: (event: CheckoutEvent) => {
          console.log('Checkout event:', event);

          if (event.event_type === 'checkout.payment_completed') {
            handlePaymentSuccess();
          } else if (event.event_type === 'checkout.error') {
            error.value = t('payment.error');
          } else if (event.event_type === 'checkout.closed') {
            // User closed the checkout without completing payment
            if (!paymentSuccess.value) {
              error.value = null;
            }
          }
        },
      });
      checkoutInitialized.value = true;
    } catch (err) {
      console.error('Error initializing Dodo Payments:', err);
      error.value = t('payment.initError');
    }
  }
});

const handlePayment = async () => {
  error.value = null;
  isLoading.value = true;

  try {
    // Create checkout session
    const response = await $fetch<{ checkoutUrl: string }>(
      '/api/payment/create-checkout',
      {
        method: 'POST',
      }
    );

    // Open the checkout overlay
    DodoPayments.Checkout.open({
      checkoutUrl: response.checkoutUrl,
    });

    // Close the payment modal so it doesn't block the Dodo checkout
    isOpen.value = false;
  } catch (err: any) {
    console.error('Error creating checkout:', err);
    error.value =
      err.data?.statusMessage || err.message || t('payment.error');
  } finally {
    isLoading.value = false;
  }
};

const handlePaymentSuccess = async () => {
  console.log('Payment successful!');
  paymentSuccess.value = true;

  try {
    // Set the unlimited access cookie
    await $fetch('/api/payment/set-access-cookie', {
      method: 'POST',
    });

    console.log('Access cookie set successfully');
  } catch (err) {
    console.error('Error setting access cookie:', err);
  }

  // Notify parent component
  setTimeout(() => {
    emit('paymentSuccess');
    isOpen.value = false;
    paymentSuccess.value = false;
  }, 2000);
};

const closeModal = () => {
  isOpen.value = false;
  error.value = null;
  paymentSuccess.value = false;
};
</script>

<template>
  <dialog
    ref="dialogRef"
    class="modal-dialog"
    @close="handleDialogClose"
    @click="handleBackdropClick"
  >
    <div class="modal-content" @click.stop>
      <!-- Header -->
      <div class="modal-header">
        <h3 class="text-lg font-semibold">
          {{ t('payment.title') }}
        </h3>
        <button
          type="button"
          class="close-button"
          @click="closeModal"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="modal-body">
        <div v-if="paymentSuccess" class="text-center py-8">
          <div class="flex justify-center mb-4">
            <svg
              class="w-16 h-16 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h4 class="text-xl font-semibold text-gray-900 mb-2">
            {{ t('payment.successTitle') }}
          </h4>
          <p class="text-gray-600">
            {{ t('payment.successMessage') }}
          </p>
        </div>

        <div v-else class="space-y-4">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="flex items-start">
              <svg
                class="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p class="text-sm text-blue-800">
                {{ t('payment.limitReached') }}
              </p>
            </div>
          </div>

          <div class="bg-gradient-to-br from-red-50 to-yellow-50 rounded-lg p-6 border border-red-200">
            <div class="text-center">
              <div class="text-4xl font-bold text-red-900 mb-2">
                €3
              </div>
              <div class="text-sm text-gray-700 mb-4">
                {{ t('payment.unlimitedAccess') }}
              </div>
              <ul class="text-left space-y-2 mb-6">
                <li class="flex items-center text-sm text-gray-700">
                  <svg
                    class="w-4 h-4 text-green-500 mr-2 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {{ t('payment.feature1') }}
                </li>
                <li class="flex items-center text-sm text-gray-700">
                  <svg
                    class="w-4 h-4 text-green-500 mr-2 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {{ t('payment.feature2') }}
                </li>
                <li class="flex items-center text-sm text-gray-700">
                  <svg
                    class="w-4 h-4 text-green-500 mr-2 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {{ t('payment.feature3') }}
                </li>
              </ul>
            </div>
          </div>

          <div v-if="error" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div class="flex items-start">
              <svg
                class="w-5 h-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <p class="text-sm font-medium text-yellow-800">{{ t('payment.errorTitle') }}</p>
                <p class="text-sm text-yellow-700">{{ error }}</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            class="pay-button"
            :disabled="isLoading"
            @click="handlePayment"
          >
            <span v-if="isLoading" class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ t('payment.processing') }}
            </span>
            <span v-else>{{ t('payment.payNow') }}</span>
          </button>

          <p class="text-xs text-center text-gray-500">
            {{ t('payment.securePayment') }}
          </p>
        </div>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.modal-dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 0.75rem;
  max-width: 28rem;
  width: calc(100% - 2rem);
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
  background: transparent;
}

.modal-dialog::backdrop {
  background: rgba(0, 0, 0, 0.5);
}

.modal-content {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.close-button {
  padding: 0.5rem;
  border-radius: 0.375rem;
  color: #6b7280;
  background: none;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}

.close-button:hover {
  background-color: #f3f4f6;
  color: #111827;
}

.modal-body {
  padding: 1.5rem;
}

.pay-button {
  width: 100%;
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background-color: #dc2626;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.pay-button:hover:not(:disabled) {
  background-color: #b91c1c;
}

.pay-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Mobile responsive adjustments */
@media (max-width: 640px) {
  .modal-dialog {
    width: calc(100% - 1rem);
    max-height: calc(100vh - 1rem);
    border-radius: 0.5rem;
  }

  .modal-content {
    border-radius: 0.5rem;
  }

  .modal-header {
    padding: 0.875rem 1rem;
  }

  .modal-body {
    padding: 1rem;
  }

  .pay-button {
    padding: 0.75rem 1rem;
  }
}
</style>
