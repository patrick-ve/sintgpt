<script setup lang="ts">
const { t } = useI18n();

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'paymentSuccess'): void;
}>();

const isOpen = ref(props.modelValue);

watch(
  () => props.modelValue,
  (newValue) => {
    isOpen.value = newValue;
  }
);

watch(isOpen, (newValue) => {
  emit('update:modelValue', newValue);
});

const handleDevPayment = async () => {
  // Simulate payment success in development
  try {
    // Set the unlimited access cookie
    await $fetch('/api/payment/set-access-cookie', {
      method: 'POST',
    });

    console.log('DEV MODE: Access cookie set successfully');

    // Notify parent component
    setTimeout(() => {
      emit('paymentSuccess');
      isOpen.value = false;
    }, 500);
  } catch (err) {
    console.error('Error setting access cookie:', err);
  }
};

const closeModal = () => {
  isOpen.value = false;
};
</script>

<template>
  <UModal v-model:open="isOpen" :ui="{ width: 'sm:max-w-md' }">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">
            🧪 DEV MODE - Free Unlimited Access
          </h3>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-heroicons-x-mark"
            @click="closeModal"
          />
        </div>
      </template>

      <div class="space-y-4">
        <div
          class="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
        >
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
            <div class="text-sm text-yellow-800">
              <p class="font-semibold mb-1">Development Mode Active</p>
              <p>
                You're in development mode. Click the button below to
                bypass payment and grant unlimited access for testing.
              </p>
              <p class="mt-2 text-xs italic">
                To test real payments, switch to Test Mode API key in
                Dodo Payments dashboard.
              </p>
            </div>
          </div>
        </div>

        <div
          class="bg-gradient-to-br from-red-50 to-yellow-50 rounded-lg p-6 border border-red-200"
        >
          <div class="text-center">
            <div class="text-4xl font-bold text-red-900 mb-2">FREE</div>
            <div class="text-sm text-gray-700 mb-4">
              Development Testing
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
                Bypass payment for testing
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
                Get unlimited access immediately
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
                Test the full flow
              </li>
            </ul>
          </div>
        </div>

        <UButton
          block
          size="xl"
          class="bg-yellow-600 hover:bg-yellow-700"
          @click="handleDevPayment"
        >
          🧪 Grant Dev Access (Free)
        </UButton>

        <p class="text-xs text-center text-gray-500">
          Development mode only - no real payment
        </p>
      </div>
    </UCard>
  </UModal>
</template>
