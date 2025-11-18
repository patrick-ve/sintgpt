<script setup lang="ts">
const { generatePoem, isLoading, error, poem, isRateLimitError } =
  usePoemGenerator();
const { t, locale, setLocale } = useI18n();
const {
  canGeneratePoem,
  incrementPoemCount,
  getRemainingFreePoems,
  isPaid,
} = usePaymentTracking();

// Form state
const formData = ref({
  name: '',
  present: '',
  funFacts: '',
  revealPresent: true,
  style: 'funny' as 'funny' | 'classic' | 'ironic' | 'old-fashioned',
  rhymeScheme: 'AABB' as 'AABB' | 'ABBA' | 'Limerick',
  lines: 12,
  language: 'dutch' as 'dutch' | 'english',
});

const styleOptions = computed(() => [
  { value: 'funny', label: t('form.style.funny') },
  { value: 'classic', label: t('form.style.classic') },
  { value: 'ironic', label: t('form.style.ironic') },
  { value: 'old-fashioned', label: t('form.style.oldFashioned') },
]);

const rhymeSchemeOptions = computed(() => [
  { value: 'AABB', label: t('form.rhymeScheme.aabb') },
  { value: 'ABBA', label: t('form.rhymeScheme.abba') },
  { value: 'Limerick', label: t('form.rhymeScheme.limerick') },
]);

const languageOptions = computed(() => [
  { value: 'dutch', label: t('form.language.dutch') },
  { value: 'english', label: t('form.language.english') },
]);

const revealPresentOptions = computed(() => [
  { value: true, label: t('form.revealPresent.yes') },
  {
    value: false,
    label: t('form.revealPresent.no'),
  },
]);

const uiLanguageItems = [
  { value: 'nl', label: '🇳🇱 Nederlands' },
  { value: 'en', label: '🇬🇧 English' },
];

const selectedLocale = computed({
  get: () => locale.value,
  set: (value) => setLocale(value),
});

const copySuccess = ref(false);
const showPaymentModal = ref(false);
const poemSectionRef = ref<HTMLElement | null>(null);

const handleSubmit = async () => {
  // Check if user can generate a poem
  if (!canGeneratePoem()) {
    showPaymentModal.value = true;
    return;
  }

  // Generate the poem
  await generatePoem(formData.value);

  // If rate limit was hit, it will be displayed in the UI with upgrade button
  // No need to show modal immediately

  // Only increment count if generation was successful (no error and no rate limit)
  if (!error.value && !isRateLimitError.value && poem.value) {
    incrementPoemCount();

    // Scroll to poem on mobile (when stacked layout)
    setTimeout(() => {
      if (window.innerWidth < 1024 && poemSectionRef.value) {
        poemSectionRef.value.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }, 100);
  }
};

const handlePaymentSuccess = () => {
  showPaymentModal.value = false;
  // Optionally show a success toast or message
};

const copyToClipboard = async () => {
  if (!poem.value) return;

  try {
    await navigator.clipboard.writeText(poem.value);
    copySuccess.value = true;
    setTimeout(() => {
      copySuccess.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};

const isFormValid = computed(() => {
  return formData.value.name.trim() !== '';
});

const poemTitle = computed(() => {
  return formData.value.name.trim() !== ''
    ? t('poem.title').replace('{name}', formData.value.name)
    : t('poem.defaultTitle');
});

const isLimerick = computed(
  () => formData.value.rhymeScheme === 'Limerick'
);

// Dynamic slider parameters based on rhyme scheme
const sliderMin = computed(() => (isLimerick.value ? 10 : 8));
const sliderMax = computed(() => (isLimerick.value ? 50 : 40));
const sliderStep = computed(() => (isLimerick.value ? 5 : 4));

// Auto-adjust lines when switching rhyme schemes
watch(
  () => formData.value.rhymeScheme,
  (newScheme, oldScheme) => {
    if (newScheme === 'Limerick') {
      // Set to nearest valid value for Limerick (10-50, step 5)
      if (formData.value.lines < 10) {
        formData.value.lines = 10;
      } else {
        // Round to nearest multiple of 5
        formData.value.lines =
          Math.round(formData.value.lines / 5) * 5;
        if (formData.value.lines > 50) formData.value.lines = 50;
      }
    } else if (oldScheme === 'Limerick') {
      // Set to nearest valid value for non-Limerick (8-40, step 4)
      if (formData.value.lines < 8) {
        formData.value.lines = 12;
      } else {
        // Round to nearest multiple of 4
        formData.value.lines =
          Math.round(formData.value.lines / 4) * 4;
        if (formData.value.lines > 40) formData.value.lines = 40;
      }
    }
  }
);

useSeoMeta({
  title: computed(() => t('seo.title')),
  description: computed(() => t('seo.description')),
  ogTitle: computed(() => t('seo.ogTitle')),
  ogDescription: computed(() => t('seo.ogDescription')),
  ogImage: '/og-image.png',
  ogImageAlt: computed(() => t('seo.ogImageAlt')),
  twitterCard: 'summary_large_image',
  twitterImage: '/og-image.png',
  keywords: computed(() => t('seo.keywords')),
  ogLocale: computed(() =>
    locale.value === 'nl' ? 'nl_NL' : 'en_US'
  ),
  ogType: 'website',
  ogSiteName: 'SintGPT',
});

// Structured data for SEO
const structuredData = computed(() => ({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'SintGPT',
      url: 'https://sintgpt.com',
      description: t('seo.description'),
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web Browser',
      offers: {
        '@type': 'Offer',
        price: '3',
        priceCurrency: 'EUR',
        description:
          locale.value === 'nl'
            ? 'Onbeperkt toegang na 3 gratis gedichten'
            : 'Unlimited access after 3 free poems',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '127',
        bestRating: '5',
        worstRating: '1',
      },
      featureList:
        locale.value === 'nl'
          ? "Gepersonaliseerde sinterklaasgedichten, Meerdere stijlen (grappig, klassiek, ironisch, ouderwets), AI-gegenereerd, Verschillende rijmschema's"
          : 'Personalized Sinterklaas poems, Multiple styles (funny, classic, ironic, old-fashioned), AI-generated, Various rhyme schemes',
    },
    {
      '@type': 'FAQPage',
      mainEntity: t('faq.questions').map(
        (faq: { question: string; answer: string }) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })
      ),
    },
    {
      '@type': 'Organization',
      name: 'SintGPT',
      url: 'https://sintgpt.com',
      logo: 'https://sintgpt.com/sint.png',
      description: t('seo.description'),
      sameAs: [],
    },
  ],
}));

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(structuredData.value),
    },
  ],
});
</script>

<template>
  <div class="min-h-screen bg-sinterklaas-pattern">
    <!-- Header Wrapper with Mobile Banner -->
    <div class="relative z-20">
      <header
        class="bg-red-900 text-white shadow-xl border-b-4 border-[#F4CD60] relative overflow-hidden"
      >
        <!-- Decorative corner elements -->
        <div
          class="absolute top-0 left-0 w-16 h-16 bg-[#F4CD60] -translate-x-8 -translate-y-8 rotate-45 transform"
        ></div>
        <div
          class="absolute top-0 right-0 w-16 h-16 bg-[#F4CD60] translate-x-8 -translate-y-8 rotate-45 transform"
        ></div>

        <div
          class="container mx-auto px-6 pt-8 pb-12 md:py-8 text-[#F4CD60] relative z-10"
        >
          <div
            class="flex flex-col md:flex-row md:items-center md:justify-between w-full gap-4 md:gap-8"
          >
            <!-- Left: Heading -->
            <div class="flex-shrink-0 flex items-center gap-4">
              <div class="hidden md:block text-5xl">🎁</div>
              <h1
                class="text-4xl md:text-6xl font-bold font-cinzel drop-shadow-md"
              >
                {{ t('header.title') }}
              </h1>
            </div>

            <!-- Center: Poem Counter (Desktop) -->
            <div class="hidden md:block">
              <PoemCounter
                class="transform hover:scale-110 transition-transform duration-300"
              />
            </div>

            <!-- Right: Paragraphs and Language Switcher -->
            <div class="flex flex-col md:items-end gap-3">
              <div class="flex flex-col md:text-right">
                <p class="font-semibold text-sm md:text-base">
                  {{ t('header.subtitle1') }}
                </p>

                <p class="font-semibold text-sm md:text-base">
                  {{ t('header.subtitle2') }}
                </p>
              </div>

              <!-- Language Switcher -->
              <USelect
                v-model="selectedLocale"
                :items="uiLanguageItems"
                class="w-44"
                size="md"
                :ui="{
                  base: 'bg-red-900 border-[rgb(244,205,96)] border-1 text-[rgb(244,205,96)] font-bold',
                  value: 'text-[rgb(244,205,96)]',
                  trailingIcon: 'text-[rgb(244,205,96)]',
                }"
              />
            </div>
          </div>
        </div>
      </header>

      <!-- Mobile Banner (Overlapping Bottom Border) -->
      <div
        class="md:hidden absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 z-30 filter drop-shadow-lg"
      >
        <PoemCounter />
      </div>
    </div>

    <!-- Main Content -->
    <main class="container mx-auto px-6 pb-12 py-12">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Form Section -->
        <section
          class="bg-[#fffdf0] rounded-2xl shadow-2xl p-6 md:p-8 sint-border relative"
        >
          <div
            class="absolute -top-5 -right-5 text-6xl rotate-12 drop-shadow-lg filter"
          >
            📜
          </div>
          <h2
            class="text-3xl font-bold text-red-900 mb-6 font-cinzel border-b-2 border-red-100 pb-2"
          >
            {{ t('form.title') }}
          </h2>

          <form @submit.prevent="handleSubmit" class="space-y-6">
            <!-- Recipient Name -->
            <div>
              <label
                class="block text-lg font-bold text-red-900 mb-2 font-cinzel"
              >
                {{ t('form.name.label')
                }}<span class="text-red-500 ml-1">*</span>
              </label>

              <UInput
                v-model="formData.name"
                :placeholder="t('form.name.placeholder')"
                size="xl"
                :disabled="isLoading"
                class="w-full font-handwriting"
                :ui="{
                  base: 'bg-white',
                }"
              />
            </div>

            <!-- Present -->
            <div>
              <label
                class="block text-lg font-bold text-red-900 mb-2 font-cinzel"
              >
                {{ t('form.present.label') }}
              </label>
              <UInput
                v-model="formData.present"
                :placeholder="t('form.present.placeholder')"
                size="xl"
                :disabled="isLoading"
                class="w-full font-handwriting"
                :ui="{
                  base: 'bg-white',
                }"
              />
            </div>

            <!-- Reveal Present -->
            <div>
              <label
                class="block text-lg font-bold text-red-900 mb-2 font-cinzel"
              >
                {{ t('form.revealPresent.label') }}
              </label>
              <select
                v-model="formData.revealPresent"
                :disabled="isLoading"
                class="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option
                  v-for="option in revealPresentOptions"
                  :key="option.value!.toString()"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </div>

            <!-- Fun Facts -->
            <div>
              <label
                class="block text-lg font-bold text-red-900 mb-2 font-cinzel"
              >
                {{ t('form.funFacts.label') }}
              </label>
              <UTextarea
                v-model="formData.funFacts"
                :placeholder="t('form.funFacts.placeholder')"
                :rows="5"
                size="xl"
                :disabled="isLoading"
                class="w-full font-handwriting"
                :ui="{
                  base: 'bg-white',
                }"
              />
              <p class="text-xs text-red-800 italic mt-1 font-cinzel">
                {{ t('form.funFacts.help') }}
              </p>
            </div>

            <!-- Style -->
            <div>
              <label
                class="block text-lg font-bold text-red-900 mb-3 font-cinzel"
              >
                {{ t('form.style.label') }}
                <span class="text-red-500 ml-1">*</span>
              </label>
              <div class="space-y-2">
                <label
                  v-for="option in styleOptions"
                  :key="option.value"
                  class="flex items-center p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  :class="{
                    'border-red-600 bg-red-50':
                      formData.style === option.value,
                    'border-gray-300':
                      formData.style !== option.value,
                  }"
                >
                  <input
                    type="radio"
                    v-model="formData.style"
                    :value="option.value"
                    :disabled="isLoading"
                    class="w-4 h-4 text-red-600 focus:ring-red-500"
                  />
                  <span
                    class="ml-2 text-base text-red-900 font-medium font-cinzel"
                    >{{ option.label }}</span
                  >
                </label>
              </div>
            </div>

            <!-- Rhyme Scheme -->
            <div>
              <label
                class="block text-lg font-bold text-red-900 mb-3 font-cinzel"
              >
                {{ t('form.rhymeScheme.label') }}
                <span class="text-red-500 ml-1">*</span>
              </label>
              <div class="space-y-2">
                <label
                  v-for="option in rhymeSchemeOptions"
                  :key="option.value"
                  class="flex items-center p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  :class="{
                    'border-red-600 bg-red-50':
                      formData.rhymeScheme === option.value,
                    'border-gray-300':
                      formData.rhymeScheme !== option.value,
                  }"
                >
                  <input
                    type="radio"
                    v-model="formData.rhymeScheme"
                    :value="option.value"
                    :disabled="isLoading"
                    class="w-4 h-4 text-red-600 focus:ring-red-500"
                  />
                  <span
                    class="ml-2 text-base text-red-900 font-medium font-cinzel"
                    >{{ option.label }}</span
                  >
                </label>
              </div>
            </div>

            <!-- Language -->
            <div>
              <label
                class="block text-lg font-bold text-red-900 mb-3 font-cinzel"
              >
                {{ t('form.language.label') }}
                <span class="text-red-500 ml-1">*</span>
              </label>
              <div class="space-y-2">
                <label
                  v-for="option in languageOptions"
                  :key="option.value"
                  class="flex items-center p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  :class="{
                    'border-red-600 bg-red-50':
                      formData.language === option.value,
                    'border-gray-300':
                      formData.language !== option.value,
                  }"
                >
                  <input
                    type="radio"
                    v-model="formData.language"
                    :value="option.value"
                    :disabled="isLoading"
                    class="w-4 h-4 text-red-600 focus:ring-red-500"
                  />
                  <span
                    class="ml-2 text-base text-red-900 font-medium font-cinzel"
                    >{{ option.label }}</span
                  >
                </label>
              </div>
            </div>

            <!-- Number of Lines Slider -->
            <div>
              <label
                class="block text-lg font-bold text-red-900 mb-2 font-cinzel"
              >
                {{ t('form.lines.label') }}: {{ formData.lines }}
              </label>
              <input
                v-model.number="formData.lines"
                type="range"
                :min="sliderMin"
                :max="sliderMax"
                :step="sliderStep"
                class="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="isLoading"
              />
              <div
                class="flex justify-between text-xs font-bold text-red-800 mt-1 font-cinzel"
              >
                <span>{{ sliderMin }} {{ t('form.lines.min') }}</span>
                <span>{{ sliderMax }} {{ t('form.lines.max') }}</span>
              </div>
              <p
                v-if="isLimerick"
                class="text-xs text-red-800 italic mt-2 font-cinzel"
              >
                {{ t('form.lines.limerickNote') }}
              </p>
            </div>

            <!-- Remaining Poems Info -->
            <div
              v-if="!isPaid()"
              class="bg-[#fff3c9] border-2 border-[#F4CD60] rounded-lg p-3 text-center shadow-sm"
            >
              <p class="text-sm font-bold text-red-900 font-cinzel">
                {{
                  t('payment.remainingPoems', {
                    count: getRemainingFreePoems(),
                  })
                }}
              </p>
            </div>

            <!-- Submit Button -->
            <UButton
              type="submit"
              size="xl"
              block
              :disabled="!isFormValid || isLoading"
              :loading="isLoading"
              class="bg-red-600 hover:bg-red-700"
              data-umami-event="Generate poem"
            >
              {{
                isLoading
                  ? t('form.submit.generating')
                  : t('form.submit.generate')
              }}
            </UButton>
          </form>
        </section>

        <!-- Poem Display Section -->
        <section
          ref="poemSectionRef"
          class="bg-[#fffdf0] rounded-2xl shadow-2xl p-6 md:p-8 sint-border relative min-h-[600px] flex flex-col"
        >
          <div
            class="absolute -top-5 -left-5 text-6xl -rotate-12 drop-shadow-lg filter"
          >
            🪶
          </div>

          <div
            class="flex justify-between items-center mb-6 border-b-2 border-red-100 pb-4"
          >
            <h2 class="text-3xl font-bold text-red-900 font-cinzel">
              {{ poemTitle }}
            </h2>
            <UButton
              v-if="poem"
              icon="i-heroicons-clipboard-document"
              size="md"
              :color="copySuccess ? 'success' : 'primary'"
              variant="ghost"
              class="hover:bg-red-50 text-red-700"
              @click="copyToClipboard"
              data-umami-event="Copy to clipboard"
            >
              {{ copySuccess ? t('poem.copied') : t('poem.copy') }}
            </UButton>
          </div>

          <!-- Loading State -->
          <div
            v-if="isLoading"
            class="prose prose-lg max-w-none flex-grow flex items-center justify-center"
          >
            <div class="text-center">
              <div class="animate-bounce text-6xl mb-4">✍️</div>
              <p
                class="text-xl font-cinzel text-red-800 animate-pulse"
              >
                {{ t('poem.loading') }}
              </p>
              <p class="text-sm text-red-600 mt-2 font-handwriting">
                De rijmpiet is aan het denken...
              </p>
            </div>
          </div>

          <!-- Rate Limit Error State -->
          <div
            v-else-if="isRateLimitError"
            class="flex flex-col items-center justify-center flex-grow text-center py-8"
          >
            <div class="relative">
              <div
                class="absolute inset-0 bg-yellow-100 rounded-full opacity-50 blur-xl animate-pulse"
              ></div>
              <img
                src="/sint.png"
                alt="Sinterklaas"
                class="w-40 h-40 object-contain mb-6 relative z-10 drop-shadow-xl"
              />
            </div>

            <h3
              class="text-2xl font-bold text-red-900 mb-2 font-cinzel"
            >
              {{ t('payment.limitReached') }}
            </h3>
            <p class="text-gray-700 mb-8 max-w-md font-medium">
              {{ t('payment.description') }}
            </p>
            <UButton
              size="xl"
              class="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-red-900 border-2 border-red-900 shadow-lg transform hover:scale-105 transition-all"
              @click="showPaymentModal = true"
            >
              <span class="font-bold font-cinzel">{{
                t('payment.unlimitedAccess')
              }}</span>
            </UButton>
          </div>

          <!-- Error State -->
          <div
            v-else-if="error"
            class="flex items-center justify-center flex-grow"
          >
            <UAlert
              color="error"
              variant="subtle"
              :title="t('poem.error')"
              :description="error"
              icon="i-heroicons-exclamation-triangle"
              class="border-2 border-red-200 bg-red-50"
            />
          </div>

          <!-- Poem Display -->
          <div
            v-else-if="poem"
            class="prose prose-lg max-w-none relative flex-grow"
          >
            <div
              class="poem-parchment transform rotate-1 transition-transform hover:rotate-0 duration-500"
            >
              <div
                class="absolute top-4 left-1/2 transform -translate-x-1/2 text-red-900/20 text-8xl pointer-events-none select-none"
              >
                S
              </div>
              <pre class="poem-text has-dropcap relative z-10">{{
                poem
              }}</pre>
            </div>
          </div>

          <!-- Empty State -->
          <div
            v-else
            class="flex flex-col items-center justify-center flex-grow text-red-300/50"
          >
            <div class="text-9xl opacity-30 mb-4">🎁</div>
            <p
              class="text-2xl font-cinzel text-red-300 opacity-60 text-center"
            >
              {{ t('poem.empty') }}
            </p>
            <p
              class="text-sm font-handwriting text-red-300 opacity-60 mt-2"
            >
              Vul het formulier in voor een gedicht
            </p>
          </div>
        </section>
      </div>
    </main>

    <!-- Testimonials Section -->
    <TestimonialsSection />

    <!-- FAQ Section -->
    <section class="container mx-auto px-6 py-12">
      <div
        class="bg-[#fffdf0] rounded-2xl shadow-xl p-6 md:p-8 max-w-4xl mx-auto sint-border relative"
      >
        <h2
          class="text-3xl font-bold text-red-900 mb-8 text-center font-cinzel border-b-2 border-red-100 pb-4"
        >
          {{ t('faq.title') }}
        </h2>
        <div class="space-y-4">
          <details
            v-for="(faq, index) in t('faq.questions')"
            :key="index"
            class="group border-2 border-red-100 rounded-xl overflow-hidden bg-white"
          >
            <summary
              class="flex justify-between items-center cursor-pointer px-6 py-4 hover:bg-red-50 transition-colors"
            >
              <h3
                class="text-lg font-bold text-red-900 pr-4 font-cinzel"
              >
                {{ faq.question }}
              </h3>
              <span
                class="w-8 h-8 flex items-center justify-center bg-red-100 rounded-full text-red-600 group-open:rotate-180 transition-transform"
              >
                ▼
              </span>
            </summary>
            <div
              class="px-6 py-4 bg-red-50/30 border-t-2 border-red-100"
            >
              <p class="text-gray-800 leading-relaxed font-medium">
                {{ faq.answer }}
              </p>
            </div>
          </details>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer
      class="bg-red-900 mt-12 border-t-4 border-[#F4CD60] relative"
    >
      <div
        class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-900 border-4 border-[#F4CD60] rounded-full p-3"
      >
        <div class="text-2xl">🎁</div>
      </div>
      <div
        class="container mx-auto px-6 py-12 text-center text-[#F4CD60]"
      >
        <div
          class="flex justify-center gap-8 mb-6 text-3xl opacity-80"
        >
          <span>🌙</span>
          <span>🐴</span>
          <span>🥕</span>
        </div>
        <p class="font-cinzel font-bold text-lg">
          {{
            t('footer.copyright').replace(
              '{year}',
              new Date().getFullYear().toString()
            )
          }}
        </p>
      </div>
    </footer>

    <!-- Payment Modal - Temporarily Hidden -->
    <!--
    <ClientOnly>
      <PaymentModal
        v-model="showPaymentModal"
        @payment-success="handlePaymentSuccess"
      />
    </ClientOnly>
    -->
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Cinzel+Decorative:wght@400;700;900&family=IM+Fell+DW+Pica+SC&family=IM+Fell+DW+Pica:ital@0;1&display=swap');

.font-cinzel {
  font-family: 'Cinzel', serif;
}

.font-handwriting {
  font-family: 'IM Fell DW Pica', serif;
}

.bg-sinterklaas-pattern {
  background-color: #7f1d1d;
  background-image:
    radial-gradient(#f4cd60 1px, transparent 1px),
    radial-gradient(#f4cd60 1px, transparent 1px);
  background-size: 50px 50px;
  background-position:
    0 0,
    25px 25px;
  background-attachment: fixed;
}

.sint-border {
  border: 4px solid #7f1d1d;
  outline: 2px solid #f4cd60;
  outline-offset: -8px;
}

input[type='range']::-webkit-slider-thumb {
  appearance: none;
  width: 24px;
  height: 24px;
  background: #dc2626;
  cursor: pointer;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 0 2px #dc2626;
}

input[type='range']::-moz-range-thumb {
  width: 24px;
  height: 24px;
  background: #dc2626;
  cursor: pointer;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 0 2px #dc2626;
}

.poem-parchment {
  background-color: #fff3c9;
  background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.15'/%3E%3C/svg%3E");
  padding: 2.5rem;
  border-radius: 0.5rem;
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.1),
    inset 0 0 40px rgba(139, 69, 19, 0.1);
  border: 1px solid #e6d5a9;
  position: relative;
}

.poem-parchment::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 2px dashed #d4c5a0;
  margin: 8px;
  pointer-events: none;
  border-radius: 4px;
}

.poem-text {
  font-family: 'IM Fell DW Pica', serif;
  white-space: pre-wrap;
  color: #2d1810;
  line-height: 1.8;
  margin: 0;
  font-size: 1.35rem;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5);
}

.poem-text.has-dropcap::first-letter {
  font-family: 'Cinzel Decorative', serif;
  float: left;
  font-size: 4.5rem;
  line-height: 0.7;
  margin: 0.1em 0.15em 0 0;
  color: #991b1b;
  text-shadow: 2px 2px 0px rgba(244, 205, 96, 0.3);
}
</style>
