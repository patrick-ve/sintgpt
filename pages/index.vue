<script setup lang="ts">
const { generatePoem, isLoading, error, poem, isRateLimitError } =
  usePoemGenerator();
const { t, locale, setLocale } = useI18n();
const {
  canGeneratePoem,
  incrementPoemCount,
  remainingFreePoems,
  isPaid,
  refreshAccess,
  storedTrialPoem,
  storedTrialPoemName,
  saveTrialPoem,
} = usePaymentTracking();
const { hasAcceptedCookies, showConsentBanner } = useCookieConsent();
const route = useRoute();
const router = useRouter();

// Payment status from redirect
const paymentStatus = ref<'success' | 'cancelled' | null>(null);

// Handle payment redirect query params and restore trial poem
onMounted(async () => {
  const payment = route.query.payment as string;
  if (payment === 'success') {
    paymentStatus.value = 'success';
    // Track payment success
    (window as any).umami?.track('Payment succeeded');
    // Set the unlimited access cookie
    try {
      await $fetch('/api/payment/set-access-cookie', {
        method: 'POST',
      });
      console.log('Access cookie set successfully');
      // Refresh access state from server
      refreshAccess();
    } catch (err) {
      console.error('Error setting access cookie:', err);
    }
    // Clear the query parameter from URL without reload
    router.replace({ query: {} });
  } else if (payment === 'cancelled') {
    paymentStatus.value = 'cancelled';
    router.replace({ query: {} });
  }

  // Restore persisted trial poem for unpaid users
  if (storedTrialPoem.value && !isPaid.value) {
    poem.value = storedTrialPoem.value;
    if (storedTrialPoemName.value) {
      formData.value.name = storedTrialPoemName.value;
    }
  }
});

// Dismiss payment status notification
const dismissPaymentStatus = () => {
  paymentStatus.value = null;
};

// Default language is Dutch
const getDefaultLanguage = (): 'dutch' | 'english' => {
  return 'dutch';
};

// Form state
const formData = ref({
  name: '',
  present: '',
  funFacts: '',
  revealPresent: true,
  writtenBy: '',
  writtenForAudience: '',
  style: 'funny' as 'funny' | 'classic' | 'ironic' | 'old-fashioned' | 'spicy',
  rhymeScheme: 'AABB' as 'AABB' | 'ABAB' | 'ABBA' | 'Limerick',
  lines: 12,
  language: getDefaultLanguage(),
});

const styleOptions = computed(() => [
  { value: 'funny', label: t('form.style.funny') },
  { value: 'classic', label: t('form.style.classic') },
  { value: 'ironic', label: t('form.style.ironic') },
  { value: 'old-fashioned', label: t('form.style.oldFashioned') },
  { value: 'spicy', label: t('form.style.spicy') },
]);

const rhymeSchemeOptions = computed(() => [
  { value: 'AABB', label: t('form.rhymeScheme.aabb') },
  { value: 'ABAB', label: t('form.rhymeScheme.abab') },
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

const scrollToForm = () => {
  const el = document.getElementById('poem-form');
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const scrollToFaq = () => {
  const el = document.getElementById('faq-section');
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const handleSubmit = async () => {
  // Check if user has accepted cookies (skip in development)
  if (!import.meta.dev && !hasAcceptedCookies.value) {
    showConsentBanner(true);
    return;
  }

  // Check if user can generate a poem (skip in development)
  if (!import.meta.dev && !canGeneratePoem.value) {
    showPaymentModal.value = true;
    return;
  }

  // Scroll to poem section on mobile immediately so user sees loading state
  if (window.innerWidth < 1024 && poemSectionRef.value) {
    poemSectionRef.value.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  // Generate the poem
  await generatePoem(formData.value);

  // If rate limit was hit, it will be displayed in the UI with upgrade button
  // No need to show modal immediately

  // Only increment count if generation was successful (no error and no rate limit)
  if (!error.value && !isRateLimitError.value && poem.value) {
    incrementPoemCount();

    // Track successful poem generation
    (window as any).umami?.track('Generate poem');

    // Save trial poem for unpaid users so it persists across page refreshes
    if (!isPaid.value) {
      saveTrialPoem(poem.value, formData.value.name);
    }
  }
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

const getPoemWithAttribution = () => {
  if (!poem.value) return '';
  const attribution =
    locale.value === 'nl'
      ? 'Geschreven met www.sintgpt.com'
      : 'Written using www.sintgpt.com';
  return `${poem.value}\n\n${attribution}`;
};

const shareViaWhatsApp = () => {
  const text = encodeURIComponent(getPoemWithAttribution());
  (window as any).umami?.track('Shared via WhatsApp');
  window.open(`https://wa.me/?text=${text}`, '_blank');
};

const shareViaEmail = () => {
  const subject = encodeURIComponent(poemTitle.value);
  const body = encodeURIComponent(getPoemWithAttribution());
  (window as any).umami?.track('Shared via Email');
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
};

const shareViaFacebook = () => {
  const text = encodeURIComponent(getPoemWithAttribution());
  (window as any).umami?.track('Shared via Facebook');
  window.open(
    `https://www.facebook.com/sharer/sharer.php?quote=${text}`,
    '_blank'
  );
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
  <div
    class="min-h-screen bg-festive-pattern relative overflow-hidden"
  >
    <!-- Animated Snowflakes -->
    <ClientOnly>
      <Snowflakes />
    </ClientOnly>

    <!-- Header -->
    <header
      class="festive-header text-white shadow-2xl relative z-20"
    >
      <!-- Decorative top border -->
      <div
        class="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#d4a853] via-[#f4cd60] to-[#d4a853]"
      ></div>

      <!-- Golden corner accents -->
      <div class="absolute top-2 left-0 w-24 h-24 overflow-hidden">
        <div
          class="absolute -top-12 -left-12 w-24 h-24 bg-[#d4a853] rotate-45 opacity-20"
        ></div>
      </div>
      <div class="absolute top-2 right-0 w-24 h-24 overflow-hidden">
        <div
          class="absolute -top-12 -right-12 w-24 h-24 bg-[#d4a853] rotate-45 opacity-20"
        ></div>
      </div>

      <div
        class="container mx-auto px-6 pt-6 pb-14 md:pt-10 md:pb-10 relative z-10"
      >
        <div
          class="flex flex-col md:flex-row md:items-center md:justify-between w-full gap-4 md:gap-8"
        >
          <!-- Mobile: Title and Language Switcher in one row -->
          <div class="flex md:hidden items-center justify-between w-full gap-4">
            <h1
              class="text-2xl font-bold font-cinzel text-gold-gradient drop-shadow-lg tracking-wide leading-none"
            >
              {{ t('header.title') }}
            </h1>
            <USelect
              v-model="selectedLocale"
              :items="uiLanguageItems"
              class="w-40 flex-shrink-0"
              size="sm"
              :ui="{
                base: 'bg-[#5c0f26] border-[#d4a853] border-2 text-[#f4cd60] font-bold rounded-lg shadow-lg',
                value: 'text-[#f4cd60]',
                trailingIcon: 'text-[#f4cd60]',
              }"
            />
          </div>

          <!-- Desktop: Logo and Title -->
          <div class="hidden md:flex flex-shrink-0 items-center gap-5">
            <div
              class="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#f4cd60] to-[#d4a853] shadow-lg animate-float"
            >
              <span class="text-4xl">🎁</span>
            </div>
            <h1
              class="text-5xl font-bold font-cinzel text-gold-gradient drop-shadow-lg tracking-wide leading-none"
            >
              {{ t('header.title') }}
            </h1>
          </div>

          <!-- Center: Poem Counter (Desktop) -->
          <div class="hidden md:block">
            <PoemCounter
              class="transform hover:scale-105 transition-transform duration-300"
            />
          </div>

          <!-- Right: Language Switcher (Desktop only) -->
          <div class="hidden md:flex flex-col items-end gap-4">
            <!-- Language Switcher -->
            <USelect
              v-model="selectedLocale"
              :items="uiLanguageItems"
              class="w-44"
              size="md"
              :ui="{
                base: 'bg-[#5c0f26] border-[#d4a853] border-2 text-[#f4cd60] font-bold rounded-lg shadow-lg',
                value: 'text-[#f4cd60]',
                trailingIcon: 'text-[#f4cd60]',
              }"
            />
          </div>
        </div>
      </div>

      <!-- Decorative zigzag border -->
      <div class="header-decoration"></div>

      <!-- Mobile Banner (Overlapping Bottom Border) -->
      <div
        class="md:hidden absolute -bottom-8 left-1/2 transform -translate-x-1/2 z-30 filter drop-shadow-xl"
      >
        <PoemCounter />
      </div>
    </header>

    <!-- Payment Status Notifications -->
    <div
      v-if="paymentStatus"
      class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4"
    >
      <!-- Success Notification -->
      <div
        v-if="paymentStatus === 'success'"
        class="bg-gradient-to-r from-green-50 to-emerald-50 border-3 border-green-500 rounded-2xl p-5 shadow-2xl"
      >
        <div class="flex items-start">
          <div
            class="flex-shrink-0 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center"
          >
            <svg
              class="w-6 h-6 text-white"
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
          </div>
          <div class="ml-4 flex-1">
            <h3
              class="text-base font-bold text-green-800 font-cinzel"
            >
              {{ t('payment.successTitle') }}
            </h3>
            <p class="text-sm text-green-700 mt-1">
              {{ t('payment.successMessage') }}
            </p>
          </div>
          <button
            @click="dismissPaymentStatus"
            class="ml-3 text-green-500 hover:text-green-700 transition-colors"
          >
            <svg
              class="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Cancelled Notification -->
      <div
        v-if="paymentStatus === 'cancelled'"
        class="bg-gradient-to-r from-amber-50 to-yellow-50 border-3 border-amber-500 rounded-2xl p-5 shadow-2xl"
      >
        <div class="flex items-start">
          <div
            class="flex-shrink-0 w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center"
          >
            <svg
              class="w-6 h-6 text-white"
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
          </div>
          <div class="ml-4 flex-1">
            <h3
              class="text-base font-bold text-amber-800 font-cinzel"
            >
              {{ t('payment.cancelledTitle') }}
            </h3>
            <p class="text-sm text-amber-700 mt-1">
              {{ t('payment.cancelledMessage') }}
            </p>
          </div>
          <button
            @click="dismissPaymentStatus"
            class="ml-3 text-amber-500 hover:text-amber-700 transition-colors"
          >
            <svg
              class="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Hero Section with Video -->
    <section class="relative z-10 overflow-hidden">
      <!-- Decorative background layer -->
      <div class="absolute inset-0 bg-gradient-to-b from-transparent via-[#8b1538]/20 to-transparent pointer-events-none"></div>

      <!-- Floating decorative elements -->
      <div class="absolute top-8 left-[5%] text-4xl opacity-20 animate-float hidden lg:block" style="animation-delay: 0s;">🎁</div>
      <div class="absolute top-24 right-[8%] text-3xl opacity-15 animate-float hidden lg:block" style="animation-delay: 1s;">✨</div>
      <div class="absolute bottom-20 left-[8%] text-2xl opacity-10 animate-float hidden lg:block" style="animation-delay: 0.5s;">📜</div>
      <div class="absolute bottom-12 right-[5%] text-3xl opacity-15 animate-float hidden lg:block" style="animation-delay: 1.5s;">🪶</div>

      <div class="container mx-auto px-4 md:px-6 py-8 md:py-12 lg:py-16">
        <div class="max-w-7xl mx-auto">
          <!-- Two-column layout: Video left, Content right -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-center">
            <!-- Left: Video (hidden on mobile, shown on desktop) -->
            <div class="hidden lg:block lg:order-1 relative">
              <!-- Decorative glow behind video -->
              <div class="absolute -inset-8 bg-gradient-to-r from-[#d4a853]/10 via-[#8b1538]/20 to-[#d4a853]/10 blur-3xl rounded-full opacity-60 pointer-events-none"></div>

              <ClientOnly>
                <HeroVideo />
              </ClientOnly>

              <!-- Video caption -->
              <p class="text-center mt-4 text-[#f4cd60]/70 text-sm font-cinzel tracking-wide">
                {{ t('video.title') }}
              </p>
            </div>

            <!-- Right: Title and CTAs -->
            <div class="lg:order-2 text-center lg:text-left mt-6 lg:mt-0">
              <!-- Main headline with ornate styling -->
              <div class="relative mb-8 lg:mb-10">
                <!-- Decorative corner flourishes -->
                <div class="absolute -top-4 left-0 lg:-left-6 text-[#d4a853] text-2xl md:text-3xl opacity-60 hidden sm:block">❧</div>
                <div class="absolute -top-4 right-0 lg:right-auto lg:left-full lg:ml-4 text-[#d4a853] text-2xl md:text-3xl opacity-60 scale-x-[-1] hidden sm:block">❧</div>

                <h2 class="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl leading-tight md:leading-none font-bold font-cinzel text-white tracking-tight">
                  <span class="block">Wil het rijmen met ChatGPT</span>
                  <span class="block">maar niet lukken?</span>
                  <span class="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-[#f4cd60] via-[#fff8e7] to-[#f4cd60] drop-shadow-lg">
                    SintGPT schrijft binnen 30 seconden een leuk gedicht!
                  </span>
                </h2>

                <!-- Decorative bottom flourishes -->
                <div class="absolute -bottom-4 left-0 lg:-left-6 text-[#d4a853] text-2xl md:text-3xl opacity-60 rotate-180 hidden sm:block">❧</div>
                <div class="absolute -bottom-4 right-0 lg:right-auto lg:left-full lg:ml-4 text-[#d4a853] text-2xl md:text-3xl opacity-60 rotate-180 scale-x-[-1] hidden sm:block">❧</div>
              </div>

              <!-- Decorative divider -->
              <div class="flex items-center justify-center lg:justify-start gap-4 mb-8">
                <div class="w-12 md:w-20 h-[2px] bg-gradient-to-r from-transparent via-[#d4a853] to-[#d4a853]"></div>
                <div class="w-3 h-3 bg-[#d4a853] rotate-45 shadow-[0_0_10px_rgba(212,168,83,0.5)]"></div>
                <div class="w-12 md:w-20 h-[2px] bg-gradient-to-l from-transparent via-[#d4a853] to-[#d4a853]"></div>
              </div>

              <!-- Subtitle text -->
              <p class="text-[#f4cd60]/90 text-base md:text-lg mb-8 max-w-lg mx-auto lg:mx-0 font-light leading-relaxed">
                {{ t('header.subtitle1') }} {{ t('header.subtitle2') }}
              </p>

              <!-- CTA Buttons -->
              <div class="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <!-- Primary Button - Scroll to form -->
                <button
                  @click="scrollToForm"
                  data-umami-event="Scroll to poem form"
                  class="group relative w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-[#8b1538] via-[#b91c4a] to-[#8b1538] text-[#f4cd60] font-cinzel font-bold text-base sm:text-lg rounded-xl border-3 border-[#d4a853] shadow-[0_4px_20px_rgba(139,21,56,0.5),0_0_30px_rgba(212,168,83,0.2)] hover:shadow-[0_6px_30px_rgba(139,21,56,0.6),0_0_40px_rgba(212,168,83,0.4)] transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer"
                >
                  <span class="relative z-10 flex items-center justify-center gap-2">
                    <span class="text-xl">✨</span>
                    Begin met rijmen
                    <span class="text-xl">✨</span>
                  </span>
                  <!-- Shimmer effect -->
                  <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </button>

                <!-- Secondary Button - Scroll to FAQ -->
                <button
                  @click="scrollToFaq"
                  data-umami-event="Scroll to FAQ"
                  class="group w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 bg-transparent text-[#f4cd60] font-cinzel font-bold text-base sm:text-lg rounded-xl border-2 border-[#d4a853]/60 hover:border-[#d4a853] hover:bg-[#d4a853]/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                >
                  <span class="flex items-center justify-center gap-2">
                    <span class="text-lg opacity-70 group-hover:opacity-100 transition-opacity">❓</span>
                    Meer informatie
                  </span>
                </button>
              </div>

              <!-- Trust badge -->
              <div class="mt-8 flex items-center justify-center lg:justify-start gap-3 text-[#f4cd60]/60">
                <div class="flex -space-x-2">
                  <div class="w-8 h-8 rounded-full bg-gradient-to-br from-[#d4a853] to-[#8b1538] border-2 border-[#f4cd60]/30 flex items-center justify-center text-xs">🎅</div>
                  <div class="w-8 h-8 rounded-full bg-gradient-to-br from-[#d4a853] to-[#8b1538] border-2 border-[#f4cd60]/30 flex items-center justify-center text-xs">🎁</div>
                  <div class="w-8 h-8 rounded-full bg-gradient-to-br from-[#d4a853] to-[#8b1538] border-2 border-[#f4cd60]/30 flex items-center justify-center text-xs">📜</div>
                </div>
                <span class="text-sm font-cinzel">5000+ blije hulpsinterklazen</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom decorative wave -->
      <div class="absolute bottom-0 left-0 right-0 h-8 overflow-hidden">
        <div class="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#8b1538]/50 to-transparent"></div>
      </div>
    </section>

    <!-- Main Content -->
    <main
      id="poem-form"
      class="container mx-auto px-4 md:px-6 pb-12 pt-8 md:pt-12 relative z-10"
    >
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
        <!-- Form Section -->
        <section class="sint-card p-6 md:p-8 relative">
          <!-- Decorative ribbon -->
          <div class="ribbon-decoration ribbon-corner-tl"></div>
          <div class="ribbon-decoration ribbon-corner-br"></div>

          <!-- Floating scroll icon -->
          <div
            class="absolute -top-6 -right-4 text-5xl rotate-12 drop-shadow-lg filter animate-float"
            style="animation-delay: 0.5s"
          >
            📜
          </div>

          <h2
            class="text-2xl md:text-3xl font-bold text-[#8b1538] mb-6 font-cinzel border-b-2 border-[#d4a853]/30 pb-3 flex items-center gap-3"
          >
            <span class="text-2xl">✨</span>
            {{ t('form.title') }}
          </h2>

          <form @submit.prevent="handleSubmit" class="space-y-5">
            <!-- Recipient Name -->
            <div class="form-group">
              <label
                class="block text-base font-bold text-[#8b1538] mb-2 font-cinzel"
              >
                {{ t('form.name.label')
                }}<span class="text-[#b91c4a] ml-1">*</span>
              </label>
              <UInput
                v-model="formData.name"
                :placeholder="t('form.name.placeholder')"
                size="xl"
                :disabled="isLoading"
                class="w-full font-handwriting input-festive"
                :ui="{
                  base: 'bg-white border-2 border-[#d4c5a0] focus:border-[#d4a853] rounded-lg',
                }"
              />
            </div>

            <!-- Present -->
            <div class="form-group">
              <label
                class="block text-base font-bold text-[#8b1538] mb-2 font-cinzel"
              >
                {{ t('form.present.label') }}
              </label>
              <UInput
                v-model="formData.present"
                :placeholder="t('form.present.placeholder')"
                size="xl"
                :disabled="isLoading"
                class="w-full font-handwriting input-festive"
                :ui="{
                  base: 'bg-white border-2 border-[#d4c5a0] focus:border-[#d4a853] rounded-lg',
                }"
              />
            </div>

            <!-- Reveal Present -->
            <div class="form-group">
              <label
                class="block text-base font-bold text-[#8b1538] mb-2 font-cinzel"
              >
                {{ t('form.revealPresent.label') }}
              </label>
              <select
                v-model="formData.revealPresent"
                :disabled="isLoading"
                class="w-full px-4 py-3 text-base border-2 border-[#d4c5a0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a853] focus:border-[#d4a853] bg-white disabled:bg-gray-100 disabled:cursor-not-allowed font-handwriting transition-all"
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
            <div class="form-group">
              <label
                class="block text-base font-bold text-[#8b1538] mb-2 font-cinzel"
              >
                {{ t('form.funFacts.label') }}
              </label>
              <UTextarea
                v-model="formData.funFacts"
                :placeholder="t('form.funFacts.placeholder')"
                :rows="8"
                size="xl"
                :disabled="isLoading"
                class="w-full font-handwriting input-festive"
                :ui="{
                  base: 'bg-white border-2 border-[#d4c5a0] focus:border-[#d4a853] rounded-lg',
                }"
              />
              <p
                class="text-xs text-[#5c0f26] italic mt-1.5 font-cinzel"
              >
                {{ t('form.funFacts.help') }}
              </p>
            </div>

            <!-- Written By -->
            <div class="form-group">
              <label
                class="block text-base font-bold text-[#8b1538] mb-2 font-cinzel"
              >
                {{ t('form.writtenBy.label') }}
              </label>
              <UInput
                v-model="formData.writtenBy"
                :placeholder="t('form.writtenBy.placeholder')"
                size="xl"
                :disabled="isLoading"
                class="w-full font-handwriting input-festive"
                :ui="{
                  base: 'bg-white border-2 border-[#d4c5a0] focus:border-[#d4a853] rounded-lg',
                }"
              />
              <p
                class="text-xs text-[#5c0f26] italic mt-1.5 font-cinzel"
              >
                {{ t('form.writtenBy.help') }}
              </p>
            </div>

            <!-- Written For Audience -->
            <div class="form-group">
              <label
                class="block text-base font-bold text-[#8b1538] mb-2 font-cinzel"
              >
                {{ t('form.writtenForAudience.label') }}
              </label>
              <UInput
                v-model="formData.writtenForAudience"
                :placeholder="
                  t('form.writtenForAudience.placeholder')
                "
                size="xl"
                :disabled="isLoading"
                class="w-full font-handwriting input-festive"
                :ui="{
                  base: 'bg-white border-2 border-[#d4c5a0] focus:border-[#d4a853] rounded-lg',
                }"
              />
              <p
                class="text-xs text-[#5c0f26] italic mt-1.5 font-cinzel"
              >
                {{ t('form.writtenForAudience.help') }}
              </p>
            </div>

            <!-- Style Selection -->
            <div class="form-group">
              <label
                class="block text-base font-bold text-[#8b1538] mb-3 font-cinzel"
              >
                {{ t('form.style.label') }}
                <span class="text-[#b91c4a] ml-1">*</span>
              </label>
              <div class="grid grid-cols-2 gap-3">
                <label
                  v-for="option in styleOptions"
                  :key="option.value"
                  class="radio-festive flex items-center gap-2 cursor-pointer"
                  :class="{
                    selected: formData.style === option.value,
                  }"
                >
                  <input
                    type="radio"
                    v-model="formData.style"
                    :value="option.value"
                    :disabled="isLoading"
                    class="sr-only"
                  />
                  <span
                    class="text-sm text-[#8b1538] font-bold font-cinzel"
                    >{{ option.label }}</span
                  >
                </label>
              </div>
            </div>

            <!-- Rhyme Scheme -->
            <div class="form-group">
              <label
                class="block text-base font-bold text-[#8b1538] mb-3 font-cinzel"
              >
                {{ t('form.rhymeScheme.label') }}
                <span class="text-[#b91c4a] ml-1">*</span>
              </label>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <label
                  v-for="option in rhymeSchemeOptions"
                  :key="option.value"
                  class="radio-festive flex flex-col items-center justify-start py-3 md:py-4 cursor-pointer text-center"
                  :class="{
                    selected: formData.rhymeScheme === option.value,
                  }"
                >
                  <input
                    type="radio"
                    v-model="formData.rhymeScheme"
                    :value="option.value"
                    :disabled="isLoading"
                    class="sr-only"
                  />
                  <span
                    class="text-xs text-[#8b1538] font-bold font-cinzel"
                    >{{ option.label }}</span
                  >
                  <!-- Rhyme scheme example (tablet/desktop only) -->
                  <div
                    class="hidden md:flex flex-col items-center mt-2 pt-2 border-t border-[#d4a853]/30 w-full"
                  >
                    <div
                      v-if="option.value === 'AABB'"
                      class="rhyme-example"
                    >
                      <span class="rhyme-line-a">━━━━ A</span>
                      <span class="rhyme-line-a">━━━━ A</span>
                      <span class="rhyme-line-b">━━━━ B</span>
                      <span class="rhyme-line-b">━━━━ B</span>
                    </div>
                    <div
                      v-else-if="option.value === 'ABAB'"
                      class="rhyme-example"
                    >
                      <span class="rhyme-line-a">━━━━ A</span>
                      <span class="rhyme-line-b">━━━━ B</span>
                      <span class="rhyme-line-a">━━━━ A</span>
                      <span class="rhyme-line-b">━━━━ B</span>
                    </div>
                    <div
                      v-else-if="option.value === 'ABBA'"
                      class="rhyme-example"
                    >
                      <span class="rhyme-line-a">━━━━ A</span>
                      <span class="rhyme-line-b">━━━━ B</span>
                      <span class="rhyme-line-b">━━━━ B</span>
                      <span class="rhyme-line-a">━━━━ A</span>
                    </div>
                    <div
                      v-else-if="option.value === 'Limerick'"
                      class="rhyme-example"
                    >
                      <span class="rhyme-line-a">━━━━ A</span>
                      <span class="rhyme-line-a">━━━━ A</span>
                      <span class="rhyme-line-b">━━ B</span>
                      <span class="rhyme-line-b">━━ B</span>
                      <span class="rhyme-line-a">━━━━ A</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <!-- Language -->
            <div class="form-group">
              <label
                class="block text-base font-bold text-[#8b1538] mb-3 font-cinzel"
              >
                {{ t('form.language.label') }}
                <span class="text-[#b91c4a] ml-1">*</span>
              </label>
              <div class="grid grid-cols-2 gap-3">
                <label
                  v-for="option in languageOptions"
                  :key="option.value"
                  class="radio-festive flex items-center justify-center gap-2 py-3 cursor-pointer"
                  :class="{
                    selected: formData.language === option.value,
                  }"
                >
                  <input
                    type="radio"
                    v-model="formData.language"
                    :value="option.value"
                    :disabled="isLoading"
                    class="sr-only"
                  />
                  <span
                    class="text-sm text-[#8b1538] font-bold font-cinzel"
                    >{{ option.label }}</span
                  >
                </label>
              </div>
            </div>

            <!-- Number of Lines Slider -->
            <div class="form-group">
              <label
                class="block text-base font-bold text-[#8b1538] mb-3 font-cinzel"
              >
                {{ t('form.lines.label') }}:
                <span class="text-[#d4a853]">{{
                  formData.lines
                }}</span>
              </label>
              <div class="relative pt-1">
                <input
                  v-model.number="formData.lines"
                  type="range"
                  :min="sliderMin"
                  :max="sliderMax"
                  :step="sliderStep"
                  class="slider-festive w-full"
                  :disabled="isLoading"
                />
                <div
                  class="flex justify-between text-xs font-bold text-[#5c0f26] mt-2 font-cinzel"
                >
                  <span
                    >{{ sliderMin }} {{ t('form.lines.min') }}</span
                  >
                  <span
                    >{{ sliderMax }} {{ t('form.lines.max') }}</span
                  >
                </div>
              </div>
              <p
                v-if="isLimerick"
                class="text-xs text-[#5c0f26] italic mt-2 font-cinzel"
              >
                {{ t('form.lines.limerickNote') }}
              </p>
            </div>

            <!-- Unlimited Access Badge -->
            <div
              v-if="isPaid"
              class="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-xl p-4 text-center shadow-md"
            >
              <div class="flex items-center justify-center gap-2">
                <div
                  class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
                >
                  <svg
                    class="w-5 h-5 text-white"
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
                </div>
                <p
                  class="text-sm font-bold text-green-800 font-cinzel"
                >
                  {{ t('payment.unlimitedUnlocked') }}
                </p>
              </div>
            </div>

            <!-- Remaining Poems Info -->
            <div
              v-else
              class="bg-gradient-to-r from-[#fff8e7] to-[#f5e6c8] border-2 border-[#d4a853] rounded-xl p-4 text-center shadow-md"
            >
              <p class="text-sm font-bold text-[#8b1538] font-cinzel">
                {{
                  t('payment.remainingPoems', {
                    count: remainingFreePoems,
                  })
                }}
              </p>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              :disabled="!isFormValid || isLoading"
              class="btn-festive w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span
                v-if="isLoading"
                class="flex items-center justify-center gap-3"
              >
                <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                    fill="none"
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {{ t('form.submit.generating') }}
              </span>
              <span
                v-else
                class="flex items-center justify-center gap-2"
              >
                <span>✨</span>
                {{ t('form.submit.generate') }}
                <span>✨</span>
              </span>
            </button>
          </form>
        </section>

        <!-- Poem Display Section -->
        <section
          ref="poemSectionRef"
          class="sint-card p-6 md:p-8 relative min-h-[600px] flex flex-col"
        >
          <!-- Decorative ribbon -->
          <div class="ribbon-decoration ribbon-corner-tl"></div>
          <div class="ribbon-decoration ribbon-corner-br"></div>

          <!-- Floating quill icon -->
          <div
            class="absolute -top-6 -left-4 text-5xl -rotate-12 drop-shadow-lg filter animate-float"
          >
            🪶
          </div>

          <div class="mb-6 border-b-2 border-[#d4a853]/30 pb-4">
            <h2
              class="text-2xl md:text-3xl font-bold text-[#8b1538] font-cinzel w-full mb-4 flex items-center gap-3"
            >
              <span class="text-2xl">📖</span>
              {{ poemTitle }}
            </h2>

            <!-- Share buttons -->
            <div v-if="poem" class="flex gap-2 flex-wrap w-full">
              <UButton
                icon="i-heroicons-clipboard-document"
                size="sm"
                :color="copySuccess ? 'success' : 'primary'"
                variant="outline"
                class="border-2 border-[#d4a853] hover:bg-[#f4cd60]/20 text-[#8b1538] cursor-pointer rounded-lg font-cinzel"
                @click="copyToClipboard"
                data-umami-event="Copy to clipboard"
              >
                {{ copySuccess ? t('poem.copied') : t('poem.copy') }}
              </UButton>
              <UButton
                size="sm"
                color="primary"
                variant="outline"
                class="border-2 border-[#d4a853] hover:bg-[#f4cd60]/20 text-[#8b1538] cursor-pointer rounded-lg font-cinzel"
                @click="shareViaWhatsApp"
              >
                <template #leading>
                  <svg
                    class="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
                    />
                  </svg>
                </template>
                {{ t('poem.shareWhatsApp') }}
              </UButton>
              <UButton
                icon="i-heroicons-envelope"
                size="sm"
                color="primary"
                variant="outline"
                class="border-2 border-[#d4a853] hover:bg-[#f4cd60]/20 text-[#8b1538] cursor-pointer rounded-lg font-cinzel"
                @click="shareViaEmail"
              >
                {{ t('poem.shareEmail') }}
              </UButton>
              <UButton
                size="sm"
                color="primary"
                variant="outline"
                class="border-2 border-[#d4a853] hover:bg-[#f4cd60]/20 text-[#8b1538] cursor-pointer rounded-lg font-cinzel"
                @click="shareViaFacebook"
              >
                <template #leading>
                  <svg
                    class="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                    />
                  </svg>
                </template>
                {{ t('poem.shareFacebook') }}
              </UButton>
            </div>
          </div>

          <!-- Loading State -->
          <div
            v-if="isLoading"
            class="flex-grow flex items-center justify-center"
          >
            <PoemWritingAnimation />
          </div>

          <!-- Rate Limit Error State -->
          <div
            v-else-if="isRateLimitError"
            class="flex flex-col items-center justify-center flex-grow text-center py-8"
          >
            <div class="relative mb-6">
              <div
                class="absolute inset-0 bg-[#f4cd60]/40 rounded-full blur-3xl animate-pulse"
              ></div>
              <img
                src="/sint.png"
                alt="Sinterklaas"
                class="w-44 h-44 object-contain relative z-10 drop-shadow-2xl"
              />
            </div>
            <h3
              class="text-2xl font-bold text-[#8b1538] mb-3 font-cinzel"
            >
              {{ t('payment.limitReached') }}
            </h3>
            <p class="text-gray-700 mb-8 max-w-md font-medium">
              {{ t('payment.description') }}
            </p>
            <button
              class="btn-festive px-8 py-4 text-lg animate-glow"
              @click="showPaymentModal = true"
            >
              <span class="flex items-center gap-2">
                <span>🎁</span>
                {{ t('payment.unlimitedAccess') }}
                <span>🎁</span>
              </span>
            </button>
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
              class="border-2 border-red-300 bg-red-50/80 rounded-xl"
            />
          </div>

          <!-- Poem Display -->
          <div v-else-if="poem" class="flex-grow noselect">
            <PaperScroll :poem="poem" />
          </div>

          <!-- Empty State -->
          <div
            v-else
            class="flex flex-col items-center justify-center flex-grow"
          >
            <div class="relative">
              <div
                class="absolute inset-0 bg-[#d4a853]/10 rounded-full blur-3xl"
              ></div>
              <div
                class="text-9xl opacity-30 mb-6 relative animate-float"
              >
                🎁
              </div>
            </div>
            <p
              class="text-2xl font-cinzel text-[#8b1538]/40 text-center"
            >
              {{ t('poem.empty') }}
            </p>
            <p
              class="text-sm font-handwriting text-[#8b1538]/30 mt-3"
            >
              Vul het formulier in voor een gedicht
            </p>
          </div>
        </section>
      </div>
    </main>

    <TestimonialsSection />

    <!-- Sinterklaas Video Message (Mobile only) -->
    <section class="lg:hidden container mx-auto px-6 py-12 relative z-10">
      <SinterklaasVideo />
    </section>

    <!-- FAQ Section -->
    <section id="faq-section" class="container mx-auto px-6 py-12 relative z-10">
      <div class="sint-card p-6 md:p-8 max-w-4xl mx-auto relative">
        <!-- Decorative ribbon -->
        <div class="ribbon-decoration ribbon-corner-tl"></div>
        <div class="ribbon-decoration ribbon-corner-br"></div>

        <h2
          class="text-2xl md:text-3xl font-bold text-[#8b1538] mb-8 text-center font-cinzel border-b-2 border-[#d4a853]/30 pb-4 flex items-center justify-center gap-3"
        >
          <span>❓</span>
          {{ t('faq.title') }}
          <span>❓</span>
        </h2>

        <div class="space-y-4">
          <details
            v-for="(faq, index) in t('faq.questions')"
            :key="index"
            class="group border-2 border-[#d4c5a0] rounded-xl overflow-hidden bg-white/80 hover:border-[#d4a853] transition-colors"
          >
            <summary
              class="flex justify-between items-center cursor-pointer px-6 py-4 hover:bg-[#f4cd60]/10 transition-colors"
            >
              <h3
                class="text-base font-bold text-[#8b1538] pr-4 font-cinzel"
              >
                {{ faq.question }}
              </h3>
              <span
                class="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-[#8b1538] rounded-full text-[#f4cd60] group-open:rotate-180 transition-transform"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </summary>
            <div
              class="px-6 py-4 bg-gradient-to-r from-[#f4cd60]/5 to-transparent border-t-2 border-[#d4c5a0]"
            >
              <p class="text-gray-700 leading-relaxed">
                {{ faq.answer }}
              </p>
            </div>
          </details>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="festive-footer mt-12 relative z-10">
      <!-- Decorative top medallion -->
      <div
        class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
      >
        <div
          class="w-16 h-16 bg-gradient-to-br from-[#8b1538] to-[#5c0f26] border-4 border-[#d4a853] rounded-full flex items-center justify-center shadow-xl"
        >
          <span class="text-2xl">🎁</span>
        </div>
      </div>

      <div
        class="container mx-auto px-6 py-16 text-center text-[#f4cd60]"
      >
        <!-- Decorative icons -->
        <div
          class="flex justify-center gap-10 mb-8 text-4xl opacity-80"
        >
          <span class="animate-float" style="animation-delay: 0s"
            >🌙</span
          >
          <span class="animate-float" style="animation-delay: 0.3s"
            >🐴</span
          >
          <span class="animate-float" style="animation-delay: 0.6s"
            >🥕</span
          >
        </div>

        <!-- Contact button -->
        <div class="mb-8">
          <UButton
            as="a"
            href="mailto:patrick@sintgpt.com"
            size="lg"
            variant="outline"
            class="border-2 border-[#d4a853] text-[#f4cd60] hover:bg-[#d4a853] hover:text-[#5c0f26] transition-all rounded-xl font-cinzel"
            icon="i-heroicons-envelope"
          >
            {{ t('footer.contact') }}
          </UButton>
        </div>

        <!-- Copyright -->
        <p class="font-cinzel font-bold text-lg">
          {{
            t('footer.copyright').replace(
              '{year}',
              new Date().getFullYear().toString()
            )
          }}
        </p>

        <!-- Decorative bottom flourish -->
        <div
          class="flex justify-center items-center gap-4 mt-6 text-[#d4a853]/60"
        >
          <div
            class="w-20 h-0.5 bg-gradient-to-r from-transparent to-[#d4a853]/40"
          ></div>
          <span class="text-xl">✦</span>
          <div
            class="w-20 h-0.5 bg-gradient-to-l from-transparent to-[#d4a853]/40"
          ></div>
        </div>
      </div>
    </footer>

    <!-- Payment Modal -->
    <ClientOnly>
      <PaymentModal v-model="showPaymentModal" />
    </ClientOnly>
  </div>
</template>

<style scoped>
.font-cinzel {
  font-family: 'Cinzel', serif;
}

.font-handwriting {
  font-family: 'IM Fell DW Pica', serif;
}

.text-gold-gradient {
  background: linear-gradient(
    135deg,
    #f4cd60 0%,
    #d4a853 50%,
    #f4cd60 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
  display: inline-block;
  line-height: 1.4;
}

/* Slider styling */
.slider-festive {
  -webkit-appearance: none;
  appearance: none;
  height: 8px;
  background: linear-gradient(90deg, #d4c5a0, #d4a853);
  border-radius: 4px;
  outline: none;
}

.slider-festive::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #8b1538 0%, #b91c4a 100%);
  cursor: pointer;
  border-radius: 50%;
  border: 3px solid #f4cd60;
  box-shadow: 0 4px 10px rgba(139, 21, 56, 0.4);
  transition: transform 0.2s ease;
}

.slider-festive::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

.slider-festive::-moz-range-thumb {
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #8b1538 0%, #b91c4a 100%);
  cursor: pointer;
  border-radius: 50%;
  border: 3px solid #f4cd60;
  box-shadow: 0 4px 10px rgba(139, 21, 56, 0.4);
}

/* Poem text styling */
.poem-text {
  font-family: 'IM Fell DW Pica', serif;
  white-space: pre-wrap;
  color: #3d2914;
  line-height: 1.9;
  margin: 0;
  font-size: 1.25rem;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5);
}

.poem-text.has-dropcap::first-letter {
  font-family: 'Cinzel Decorative', serif;
  float: left;
  font-size: 4.5rem;
  line-height: 0.7;
  margin: 0.1em 0.15em 0 0;
  color: #8b1538;
  text-shadow: 2px 2px 0px rgba(212, 168, 83, 0.4);
}

.noselect {
  user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;
}

/* Form group animations */
.form-group {
  transition: transform 0.2s ease;
}

.form-group:focus-within {
  transform: translateX(4px);
}

/* Rhyme scheme examples */
.rhyme-example {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  font-family: 'IM Fell DW Pica', serif;
  font-size: 0.65rem;
  line-height: 1.2;
}

.rhyme-line-a {
  color: #8b1538;
  opacity: 0.8;
}

.rhyme-line-b {
  color: #d4a853;
  opacity: 0.9;
}
</style>
