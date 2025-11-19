<template>
  <Transition
    enter-active-class="transform ease-out duration-700 transition"
    enter-from-class="translate-y-full opacity-0 sm:translate-y-10 sm:translate-x-10"
    enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
    leave-active-class="transition ease-in duration-300"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0 translate-y-full sm:translate-y-10 sm:translate-x-10"
  >
    <div
      v-if="showBanner"
      class="fixed bottom-2 left-2 right-2 md:bottom-4 md:left-auto md:right-4 md:max-w-sm z-50"
    >
      <div
        class="bg-[#fffdf0] rounded-xl shadow-2xl p-3 md:p-4 sint-border relative"
      >
        <!-- Decorative cookie icon -->
        <div
          class="absolute -top-4 -left-2 md:-top-5 md:-left-3 bg-[#fffdf0] border-4 border-[#7f1d1d] rounded-full p-1 md:p-1.5 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center shadow-lg z-10"
        >
          <span class="text-lg md:text-xl">🍪</span>
        </div>

        <div class="flex flex-col gap-1.5 md:gap-2 mt-0.5 md:mt-1">
          <h3
            class="text-base md:text-lg font-bold text-red-900 font-cinzel ml-5 md:ml-6"
          >
            {{ t('cookie.title') }}
          </h3>

          <p
            class="text-xs md:text-sm text-gray-800 font-medium leading-relaxed"
          >
            {{ t('cookie.message') }}
          </p>

          <div class="flex justify-end gap-2 mt-1">
            <button
              @click="declineCookies"
              class="cursor-pointer bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs md:text-sm font-bold py-1 px-2 md:py-1.5 md:px-3 rounded-lg shadow-md transform hover:scale-105 transition-all border-2 border-gray-300"
              data-umami-event="Decline cookies"
            >
              {{ t('cookie.decline') }}
            </button>
            <button
              @click="acceptCookies"
              class="cursor-pointer bg-red-600 hover:bg-red-700 text-white text-xs md:text-sm font-bold py-1 px-3 md:py-1.5 md:px-4 rounded-lg shadow-md transform hover:scale-105 transition-all border-2 border-[#F4CD60]"
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
const showBanner = ref(false);

onMounted(() => {
  // Wait 5 seconds before showing the banner
  setTimeout(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      showBanner.value = true;
    }
  }, 5000);
});

function acceptCookies() {
  localStorage.setItem('cookie_consent', 'accepted');
  showBanner.value = false;
}

function declineCookies() {
  window.location.href = 'https://google.com';
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&display=swap');

.font-cinzel {
  font-family: 'Cinzel', serif;
}

.sint-border {
  border: 4px solid #7f1d1d;
  outline: 2px solid #f4cd60;
  outline-offset: -6px;
}
</style>
