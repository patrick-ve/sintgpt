<script setup lang="ts">
import {
  DodoPayments,
  type CheckoutEvent,
  type CheckoutMode,
} from 'dodopayments-checkout';

const { t } = useI18n();

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'paymentSuccess'): void;
}>();

const isOpen = ref(props.modelValue);

// Watch for external changes to modelValue
watch(
  () => props.modelValue,
  (newValue) => {
    isOpen.value = newValue;
  }
);

// Emit changes when isOpen changes
watch(isOpen, (newValue) => {
  emit('update:modelValue', newValue);
});

const isLoading = ref(false);
const error = ref<string | null>(null);
const paymentSuccess = ref(false);
const checkoutInitialized = ref(false);

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
  <UModal v-model:open="isOpen" :ui="{ width: 'sm:max-w-md' }">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">
            {{ t('payment.title') }}
          </h3>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-heroicons-x-mark"
            @click="closeModal"
          />
        </div>
      </template>

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

      <div v-else>
        <div class="space-y-4">
          <div
            class="bg-blue-50 border border-blue-200 rounded-lg p-4"
          >
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

          <div
            class="bg-gradient-to-br from-red-50 to-yellow-50 rounded-lg p-6 border border-red-200"
          >
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

          <UAlert
            v-if="error"
            color="warning"
            variant="soft"
            :title="t('payment.errorTitle')"
            :description="error"
            icon="i-heroicons-exclamation-triangle"
          />

          <UButton
            block
            size="xl"
            :loading="isLoading"
            :disabled="isLoading"
            class="bg-red-600 hover:bg-red-700"
            @click="handlePayment"
          >
            {{
              isLoading
                ? t('payment.processing')
                : t('payment.payNow')
            }}
          </UButton>

          <p class="text-xs text-center text-gray-500">
            {{ t('payment.securePayment') }}
          </p>
        </div>
      </div>
    </UCard>
  </UModal>
</template>
