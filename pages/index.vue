<script setup lang="ts">
import { buildShareUrl } from '~/utils/poemLink';
import { POEM_INPUT_LIMITS } from '~/utils/poemLimits';
import type { PoemHistoryEntry } from '~/composables/usePoemHistory';

const { generatePoem, isLoading, error, poem, isRateLimitError, share: generatedShare } =
  usePoemGenerator();
const { t, locale, setLocale } = useI18n();
const {
  canGeneratePoem,
  incrementPoemCount,
  remainingFreePoems,
  isPaid,
  claimPayment,
  storedTrialPoem,
  storedTrialPoemName,
  saveTrialPoem,
} = usePaymentTracking();
const { hasAcceptedCookies, showConsentBanner } = useCookieConsent();
const poemHistory = usePoemHistory();
const historyEntries = poemHistory.entries;
const route = useRoute();

// Poem history drawer. `displayedRecipient` is who the poem on screen is
// for, so the title stays right while the form is edited or an older poem
// is opened.
const showHistory = ref(false);
const activeHistoryId = ref<string | null>(null);
const displayedRecipient = ref('');
const router = useRouter();

// Payment status from redirect
const paymentStatus = ref<'success' | 'pending' | 'failed' | 'cancelled' | null>(null);

// Handle payment redirect query params and restore trial poem
onMounted(async () => {
  const paymentId = route.query.payment_id;
  if (typeof paymentId === 'string') {
    paymentStatus.value = 'pending';
    const claim = await claimPayment(paymentId);
    if (claim === 'granted') {
      paymentStatus.value = 'success';
      (window as any).umami?.track('Payment succeeded');
    } else {
      paymentStatus.value = claim === 'pending' ? 'pending' : 'failed';
    }
    // While pending, keep the ID in the URL so a reload checks again.
    if (claim !== 'pending') {
      router.replace({ query: {} });
    }
  } else if (route.query.payment === 'cancelled') {
    paymentStatus.value = 'cancelled';
    router.replace({ query: {} });
  }

  // Restore persisted trial poem for unpaid users
  if (storedTrialPoem.value && !isPaid.value) {
    poem.value = storedTrialPoem.value;
    if (storedTrialPoemName.value) {
      formData.value.name = storedTrialPoemName.value;
      displayedRecipient.value = storedTrialPoemName.value;
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

// Compact labels for the narrow mobile header
const uiLanguageItemsShort = [
  { value: 'nl', label: '🇳🇱 NL' },
  { value: 'en', label: '🇬🇧 EN' },
];

const selectedLocale = computed({
  get: () => locale.value,
  set: (value) => setLocale(value),
});

const copySuccess = ref(false);
const showPaymentModal = ref(false);
const poemSectionRef = ref<HTMLElement | null>(null);

// Respect the visitor's motion preference for scripted scrolling too.
const scrollBehavior = (): ScrollBehavior =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

const scrollToForm = () => {
  const el = document.getElementById('poem-form');
  el?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
};

const scrollToFaq = () => {
  const el = document.getElementById('faq-section');
  el?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
};

const handleSubmit = async () => {
  if (!isFormValid.value) {
    showNameError.value = true;
    document.getElementById('poem-name')?.focus();
    return;
  }

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
      behavior: scrollBehavior(),
      block: 'start',
    });
  }

  poemAnnouncement.value = t('poem.loading');

  // Generate the poem
  displayedRecipient.value = formData.value.name.trim();
  activeHistoryId.value = null;
  await generatePoem(formData.value);

  // If rate limit was hit, it will be displayed in the UI with upgrade button
  // No need to show modal immediately

  // Only increment count if generation was successful (no error and no rate limit)
  poemAnnouncement.value = poem.value ? t('poem.ready') : '';

  if (!error.value && !isRateLimitError.value && poem.value) {
    incrementPoemCount();

    // Track successful poem generation
    (window as any).umami?.track('Generate poem');

    // Keep it in the on-device history drawer
    const saved = poemHistory.add({
      recipient: displayedRecipient.value,
      poem: poem.value,
      style: formData.value.style,
      rhymeScheme: formData.value.rhymeScheme,
      language: formData.value.language,
      lines: formData.value.lines,
      share: generatedShare.value,
    });
    activeHistoryId.value = saved.id;

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

// The signed link for the poem on screen. Older poems have none, and fall back
// to sharing the text. Built ahead of time, because browsers block pop-ups that
// open after waiting for something.
const shareUrl = ref<string | null>(null);
const linkCopied = ref(false);

watchEffect(async () => {
  const text = poem.value;
  const signed = historyEntries.value.find(entry => entry.poem === text)?.share;
  shareUrl.value = text && signed && !isLoading.value
    ? await buildShareUrl(window.location.origin, signed, text)
    : null;
});

const copyShareLink = async () => {
  if (!shareUrl.value) return;
  await navigator.clipboard.writeText(shareUrl.value);
  linkCopied.value = true;
  (window as any).umami?.track('Copy share link');
  setTimeout(() => {
    linkCopied.value = false;
  }, 2000);
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
  const text = encodeURIComponent(
    shareUrl.value ? `${poemTitle.value}\n${shareUrl.value}` : getPoemWithAttribution(),
  );
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
  const link = encodeURIComponent(shareUrl.value ?? window.location.origin);
  (window as any).umami?.track('Shared via Facebook');
  window.open(
    `https://www.facebook.com/sharer/sharer.php?u=${link}`,
    '_blank'
  );
};

const isFormValid = computed(() => {
  return formData.value.name.trim() !== '';
});

// Screen readers hear the start and the end, not every word of the stream.
const poemAnnouncement = ref('');

const showNameError = ref(false);
watch(() => formData.value.name, () => {
  showNameError.value = false;
});

const poemTitle = computed(() => {
  const name = (poem.value || isLoading.value)
    ? displayedRecipient.value
    : formData.value.name.trim();
  return name ? t('poem.title', { name }) : t('poem.defaultTitle');
});

const openPoemFromHistory = (entry: PoemHistoryEntry) => {
  // The poem being written would overwrite the chosen one.
  if (isLoading.value) return;

  poem.value = entry.poem;
  error.value = null;
  isRateLimitError.value = false;
  displayedRecipient.value = entry.recipient;
  activeHistoryId.value = entry.id;
  (window as any).umami?.track('Open poem from history');
  nextTick(() => {
    poemSectionRef.value?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
  });
};

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
  ogLocale: computed(() =>
    locale.value === 'nl' ? 'nl_NL' : 'en_US'
  ),
  ogType: 'website',
  ogSiteName: 'SintGPT',
});

useOgImage('home', () => t('seo.ogImageAlt'));

useHead({
  link: [{ rel: 'canonical', href: 'https://sintgpt.com/' }],
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
        price: '6.99',
        priceCurrency: 'EUR',
        description:
          locale.value === 'nl'
            ? 'Onbeperkt toegang na 1 gratis gedicht'
            : 'Unlimited access after 1 free poem',
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
      logo: 'https://sintgpt.com/favicon-192x192.png',
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
        class="container mx-auto px-6 pt-6 pb-10 md:pt-10 md:pb-12 relative z-10"
      >
        <div
          class="flex flex-col md:flex-row md:items-center md:justify-between w-full gap-4 md:gap-8"
        >
          <!-- Mobile: Title, history and language in one row -->
          <div class="flex md:hidden items-center justify-between w-full gap-3">
            <p
              class="text-3xl font-bold font-display text-gold-gradient drop-shadow-lg leading-none"
            >
              {{ t('header.title') }}
            </p>
            <div class="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                class="history-trigger size-11 justify-center"
                :aria-label="t('history.open')"
                @click="showHistory = true"
              >
                <UIcon name="i-heroicons-book-open" class="size-5" />
                <span
                  v-if="historyEntries.length"
                  class="history-badge"
                >{{ historyEntries.length }}</span>
              </button>
              <USelect
                v-model="selectedLocale"
                :items="uiLanguageItemsShort"
                class="w-[6.5rem]"
                size="lg"
                :aria-label="'Taal / Language'"
                :ui="{
                  base: 'h-11 bg-[#5c0f26] border-[#d4a853] border-2 text-[#f4cd60] font-bold rounded-lg shadow-lg',
                  value: 'text-[#f4cd60]',
                  trailingIcon: 'text-[#f4cd60]',
                }"
              />
            </div>
          </div>

          <!-- Desktop: Logo and Title -->
          <div class="hidden md:flex flex-shrink-0 items-center gap-5">
            <div
              class="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#f4cd60] to-[#d4a853] shadow-lg"
            >
              <span class="text-4xl">🎁</span>
            </div>
            <p
              class="text-5xl font-bold font-display text-gold-gradient drop-shadow-lg leading-none"
            >
              {{ t('header.title') }}
            </p>
          </div>

          <!-- Right: History + Language Switcher (Desktop only) -->
          <div class="hidden md:flex items-center gap-3">
            <button
              type="button"
              class="history-trigger h-10 px-4"
              @click="showHistory = true"
            >
              <UIcon name="i-heroicons-book-open" class="size-5" />
              <span>{{ t('history.open') }}</span>
              <span
                v-if="historyEntries.length"
                class="history-badge"
              >{{ historyEntries.length }}</span>
            </button>
            <!-- Language Switcher -->
            <USelect
              v-model="selectedLocale"
              :items="uiLanguageItems"
              :aria-label="'Taal / Language'"
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
    </header>

    <!-- Payment Status Notifications -->
    <div
      v-if="paymentStatus"
      role="status"
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
              class="text-base font-bold text-green-800 font-display"
            >
              {{ t('payment.successTitle') }}
            </h3>
            <p class="text-sm text-green-700 mt-1">
              {{ t('payment.successMessage') }}
            </p>
          </div>
          <button
            type="button"
            :aria-label="t('payment.dismiss')"
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

      <!-- Pending, Failed and Cancelled Notification -->
      <div
        v-else
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
              class="text-base font-bold text-amber-800 font-display"
            >
              {{ t(`payment.${paymentStatus}Title`) }}
            </h3>
            <p class="text-sm text-amber-700 mt-1">
              {{ t(`payment.${paymentStatus}Message`) }}
            </p>
          </div>
          <button
            type="button"
            :aria-label="t('payment.dismiss')"
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

    <main>
    <!-- Hero Section with Video -->
    <section class="relative z-10 overflow-hidden">
      <!-- Decorative background layer -->
      <div class="absolute inset-0 bg-gradient-to-b from-transparent via-[#8b1538]/20 to-transparent pointer-events-none"></div>

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
              <p class="text-center mt-4 text-[#f7e6c0] text-sm">
                {{ t('video.title') }}
              </p>
            </div>

            <!-- Right: Title and CTAs -->
            <div class="lg:order-2 text-center lg:text-left mt-6 lg:mt-0">
              <h1 class="font-display text-3xl sm:text-4xl xl:text-5xl leading-[1.1] text-white mb-6">
                <span class="block">{{ t('hero.question') }}</span>
                <span class="block mt-2 text-[#f4cd60]">{{ t('hero.answer') }}</span>
              </h1>

              <!-- Decorative divider -->
              <div class="flex items-center justify-center lg:justify-start gap-4 mb-6" aria-hidden="true">
                <div class="w-12 md:w-20 h-[2px] bg-gradient-to-r from-transparent via-[#d4a853] to-[#d4a853]"></div>
                <div class="w-3 h-3 bg-[#d4a853] rotate-45"></div>
                <div class="w-12 md:w-20 h-[2px] bg-gradient-to-l from-transparent via-[#d4a853] to-[#d4a853]"></div>
              </div>

              <p class="text-[#f7e6c0] text-lg md:text-xl mb-8 max-w-lg mx-auto lg:mx-0 leading-normal text-pretty">
                {{ t('header.subtitle1') }}
              </p>

              <div class="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <button
                  type="button"
                  data-umami-event="Scroll to poem form"
                  class="hero-action w-full sm:w-auto px-8 bg-[#f4cd60] text-[#5c0f26] font-display text-xl shadow-lg hover:bg-[#ffe08a]"
                  @click="scrollToForm"
                >
                  {{ t('hero.cta') }}
                </button>
                <button
                  type="button"
                  data-umami-event="Scroll to FAQ"
                  class="hero-action w-full sm:w-auto px-6 border-2 border-[#d4a853] text-[#f4cd60] text-lg hover:bg-[#d4a853]/15"
                  @click="scrollToFaq"
                >
                  {{ t('hero.moreInfo') }}
                </button>
              </div>

              <p class="mt-4 text-[#f7e6c0] text-base text-center lg:text-start">
                {{ t('hero.note') }}
              </p>
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
    <div
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
            class="absolute -top-6 -right-4 text-5xl rotate-12 drop-shadow-lg filter"
            aria-hidden="true"
          >
            📜
          </div>

          <h2
            class="text-2xl md:text-3xl font-bold text-[#8b1538] mb-6 font-display border-b-2 border-[#d4a853]/30 pb-3 ps-8 md:ps-6 flex items-center gap-3"
          >
            {{ t('form.title') }}
          </h2>

          <form novalidate class="space-y-5" @submit.prevent="handleSubmit">
            <!-- Recipient Name -->
            <div class="form-group">
              <label
                for="poem-name"
                class="block text-base font-bold text-[#8b1538] mb-2"
              >
                {{ t('form.name.label')
                }}<span class="text-[#b91c4a] ml-1">*</span>
              </label>
              <UInput
                id="poem-name"
                :maxlength="POEM_INPUT_LIMITS.name"
                v-model="formData.name"
                required
                autocomplete="off"
                :aria-invalid="showNameError || undefined"
                :aria-describedby="showNameError ? 'poem-name-error' : undefined"
                :placeholder="t('form.name.placeholder')"
                size="xl"
                :disabled="isLoading"
                class="w-full input-festive"
                :ui="{
                  base: 'bg-white border-2 border-[#a08850] focus:border-[#d4a853] rounded-lg',
                }"
              />
              <p
                v-if="showNameError"
                id="poem-name-error"
                class="mt-1.5 flex items-center gap-1.5 text-sm font-bold text-[#8b1538]"
              >
                <UIcon name="i-heroicons-exclamation-circle" class="size-4 shrink-0" aria-hidden="true" />
                {{ t('form.name.required') }}
              </p>
            </div>

            <!-- Present -->
            <div class="form-group">
              <label
                for="poem-present"
                class="block text-base font-bold text-[#8b1538] mb-2"
              >
                {{ t('form.present.label') }}
              </label>
              <UInput
                id="poem-present"
                :maxlength="POEM_INPUT_LIMITS.present"
                v-model="formData.present"
                autocomplete="off"
                :placeholder="t('form.present.placeholder')"
                size="xl"
                :disabled="isLoading"
                class="w-full input-festive"
                :ui="{
                  base: 'bg-white border-2 border-[#a08850] focus:border-[#d4a853] rounded-lg',
                }"
              />
            </div>

            <!-- Reveal Present -->
            <div class="form-group">
              <label
                for="poem-reveal"
                class="block text-base font-bold text-[#8b1538] mb-2"
              >
                {{ t('form.revealPresent.label') }}
              </label>
              <select
                id="poem-reveal"
                v-model="formData.revealPresent"
                :disabled="isLoading"
                class="w-full px-4 py-3 text-base border-2 border-[#a08850] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a853] focus:border-[#d4a853] bg-white disabled:bg-gray-100 disabled:cursor-not-allowed transition"
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
                for="poem-facts"
                class="block text-base font-bold text-[#8b1538] mb-2"
              >
                {{ t('form.funFacts.label') }}
              </label>
              <UTextarea
                id="poem-facts"
                :maxlength="POEM_INPUT_LIMITS.funFacts"
                v-model="formData.funFacts"
                aria-describedby="poem-facts-help"
                :placeholder="t('form.funFacts.placeholder')"
                :rows="5"
                size="xl"
                :disabled="isLoading"
                class="w-full input-festive"
                :ui="{
                  base: 'bg-white border-2 border-[#a08850] focus:border-[#d4a853] rounded-lg',
                }"
              />
              <p
                id="poem-facts-help"
                class="text-sm text-[#5c0f26] mt-1.5"
              >
                {{ t('form.funFacts.help') }}
              </p>
            </div>

            <!-- Optional details -->
            <details class="form-more">
              <summary>{{ t('form.more') }}</summary>
              <div class="space-y-5 pt-4">
            <!-- Written By -->
            <div class="form-group">
              <label
                for="poem-written-by"
                class="block text-base font-bold text-[#8b1538] mb-2"
              >
                {{ t('form.writtenBy.label') }}
              </label>
              <UInput
                id="poem-written-by"
                :maxlength="POEM_INPUT_LIMITS.writtenBy"
                v-model="formData.writtenBy"
                aria-describedby="poem-written-by-help"
                :placeholder="t('form.writtenBy.placeholder')"
                size="xl"
                :disabled="isLoading"
                class="w-full input-festive"
                :ui="{
                  base: 'bg-white border-2 border-[#a08850] focus:border-[#d4a853] rounded-lg',
                }"
              />
              <p
                id="poem-written-by-help"
                class="text-sm text-[#5c0f26] mt-1.5"
              >
                {{ t('form.writtenBy.help') }}
              </p>
            </div>

            <!-- Written For Audience -->
            <div class="form-group">
              <label
                for="poem-audience"
                class="block text-base font-bold text-[#8b1538] mb-2"
              >
                {{ t('form.writtenForAudience.label') }}
              </label>
              <UInput
                id="poem-audience"
                :maxlength="POEM_INPUT_LIMITS.writtenForAudience"
                v-model="formData.writtenForAudience"
                aria-describedby="poem-audience-help"
                :placeholder="
                  t('form.writtenForAudience.placeholder')
                "
                size="xl"
                :disabled="isLoading"
                class="w-full input-festive"
                :ui="{
                  base: 'bg-white border-2 border-[#a08850] focus:border-[#d4a853] rounded-lg',
                }"
              />
              <p
                id="poem-audience-help"
                class="text-sm text-[#5c0f26] mt-1.5"
              >
                {{ t('form.writtenForAudience.help') }}
              </p>
            </div>
              </div>
            </details>

            <!-- Style Selection -->
            <fieldset class="form-group">
              <legend
                class="block text-base font-bold text-[#8b1538] mb-3"
              >
                {{ t('form.style.label') }}
                <span class="text-[#b91c4a] ml-1">*</span>
              </legend>
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
                    class="text-sm text-[#8b1538] font-bold"
                    >{{ option.label }}</span
                  >
                </label>
              </div>
            </fieldset>

            <!-- Rhyme Scheme -->
            <fieldset class="form-group">
              <legend
                class="block text-base font-bold text-[#8b1538] mb-3"
              >
                {{ t('form.rhymeScheme.label') }}
                <span class="text-[#b91c4a] ml-1">*</span>
              </legend>
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
                    class="text-sm text-[#8b1538] font-bold"
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
            </fieldset>

            <!-- Language -->
            <fieldset class="form-group">
              <legend
                class="block text-base font-bold text-[#8b1538] mb-3"
              >
                {{ t('form.language.label') }}
                <span class="text-[#b91c4a] ml-1">*</span>
              </legend>
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
                    class="text-sm text-[#8b1538] font-bold whitespace-nowrap"
                    >{{ option.label }}</span
                  >
                </label>
              </div>
            </fieldset>

            <!-- Number of Lines Slider -->
            <div class="form-group">
              <label
                for="poem-lines"
                class="block text-base font-bold text-[#8b1538] mb-3"
              >
                {{ t('form.lines.label') }}:
                <span class="tabular-nums">{{
                  formData.lines
                }}</span>
              </label>
              <div class="relative pt-1">
                <input
                  id="poem-lines"
                  v-model.number="formData.lines"
                  type="range"
                  :min="sliderMin"
                  :max="sliderMax"
                  :step="sliderStep"
                  class="slider-festive w-full"
                  :disabled="isLoading"
                />
                <div
                  class="flex justify-between text-sm font-bold text-[#5c0f26] mt-2"
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
                class="text-sm text-[#5c0f26] mt-2"
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
                  class="text-sm font-bold text-green-800"
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
              <p class="text-sm font-bold text-[#8b1538]">
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
              :disabled="isLoading"
              class="btn-festive w-full py-3.5 text-xl disabled:opacity-70 disabled:cursor-wait"
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
                {{ t('form.submit.generate') }}
              </span>
            </button>
          </form>
        </section>

        <!-- Poem Display Section -->
        <section
          ref="poemSectionRef"
          class="sint-card p-5 md:p-8 relative min-h-[420px] md:min-h-[600px] flex flex-col scroll-mt-4"
        >
          <!-- Decorative ribbon -->
          <div class="ribbon-decoration ribbon-corner-tl"></div>
          <div class="ribbon-decoration ribbon-corner-br"></div>

          <!-- Floating quill icon -->
          <div
            class="absolute -top-6 -left-4 text-5xl -rotate-12 drop-shadow-lg filter"
            aria-hidden="true"
          >
            🪶
          </div>

          <p class="sr-only" role="status">{{ poemAnnouncement }}</p>

          <div class="mb-6 border-b-2 border-[#d4a853]/30 pb-4">
            <h2
              class="text-2xl md:text-3xl font-bold text-[#8b1538] font-display w-full mb-3 ps-8 md:ps-6 flex items-center gap-3 break-words"
            >
              <span class="text-2xl" aria-hidden="true">📖</span>
              <span class="min-w-0">{{ poemTitle }}</span>
            </h2>

            <!-- Earlier poems (on-device history) -->
            <button
              v-if="historyEntries.length"
              type="button"
              class="mb-4 -ml-1 inline-flex items-center gap-1.5 min-h-11 px-1 text-sm font-bold text-[#8b1538]/80 hover:text-[#8b1538] underline decoration-[#d4a853] underline-offset-4 cursor-pointer"
              @click="showHistory = true"
            >
              <UIcon name="i-heroicons-book-open" class="size-4" />
              {{ t('history.previous') }} ({{ historyEntries.length }})
            </button>

            <!-- Share buttons -->
            <!-- Keeps its space while streaming, so the poem does not jump at the end -->
            <div
              v-if="poem || isLoading"
              class="flex gap-2 flex-wrap w-full"
              :class="{ invisible: isLoading }"
            >
              <p v-if="shareUrl" class="w-full order-last text-sm text-[#5c0f26]">
                {{ t('poem.linkPrivacy') }}
              </p>
              <UButton
                v-if="shareUrl"
                icon="i-heroicons-link"
                size="sm"
                :color="linkCopied ? 'success' : 'primary'"
                variant="outline"
                class="border-2 border-[#d4a853] hover:bg-[#f4cd60]/20 text-[#8b1538] cursor-pointer rounded-lg"
                @click="copyShareLink"
              >
                {{ linkCopied ? t('poem.linkCopied') : t('poem.copyLink') }}
              </UButton>
              <UButton
                icon="i-heroicons-clipboard-document"
                size="sm"
                :color="copySuccess ? 'success' : 'primary'"
                variant="outline"
                class="border-2 border-[#d4a853] hover:bg-[#f4cd60]/20 text-[#8b1538] cursor-pointer rounded-lg"
                @click="copyToClipboard"
                data-umami-event="Copy to clipboard"
              >
                {{ copySuccess ? t('poem.copied') : t('poem.copy') }}
              </UButton>
              <UButton
                size="sm"
                color="primary"
                variant="outline"
                class="border-2 border-[#d4a853] hover:bg-[#f4cd60]/20 text-[#8b1538] cursor-pointer rounded-lg"
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
                class="border-2 border-[#d4a853] hover:bg-[#f4cd60]/20 text-[#8b1538] cursor-pointer rounded-lg"
                @click="shareViaEmail"
              >
                {{ t('poem.shareEmail') }}
              </UButton>
              <UButton
                size="sm"
                color="primary"
                variant="outline"
                class="border-2 border-[#d4a853] hover:bg-[#f4cd60]/20 text-[#8b1538] cursor-pointer rounded-lg"
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
            v-if="isLoading && !poem"
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
                src="/sint-352.webp"
                width="176"
                height="176"
                loading="lazy"
                alt="Sinterklaas"
                class="w-44 h-44 object-contain relative z-10 drop-shadow-2xl"
              />
            </div>
            <h3
              class="text-2xl font-bold text-[#8b1538] mb-3 font-display"
            >
              {{ t('payment.limitReached') }}
            </h3>
            <p class="text-gray-700 mb-8 max-w-md font-medium">
              {{ t('payment.description') }}
            </p>
            <button
              class="btn-festive px-8 py-4 text-lg"
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
            <PaperScroll :poem="poem" :streaming="isLoading" />
          </div>

          <!-- Empty State -->
          <div v-else class="flex-grow flex flex-col">
            <p class="self-start rounded-full border border-[#8b1538] px-3 py-0.5 text-sm font-bold text-[#8b1538]">
              {{ t('poem.sampleLabel') }}
            </p>
            <p class="poem-text mt-4">{{ t('poem.sampleText') }}</p>
            <p class="mt-auto pt-6 text-base font-medium text-[#5c0f26] text-pretty">
              {{ t('poem.empty') }}
            </p>
          </div>
        </section>
      </div>
    </div>

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
          class="text-2xl md:text-3xl font-bold text-[#8b1538] mb-8 text-center font-display border-b-2 border-[#d4a853]/30 pb-4 flex items-center justify-center gap-3"
        >
          {{ t('faq.title') }}
        </h2>

        <div class="space-y-4">
          <details
            v-for="(faq, index) in t('faq.questions')"
            :key="index"
            class="group border-2 border-[#a08850] rounded-xl overflow-hidden bg-white/80 hover:border-[#d4a853] transition-colors"
          >
            <summary
              class="flex justify-between items-center cursor-pointer px-6 py-4 hover:bg-[#f4cd60]/10 transition-colors"
            >
              <h3
                class="text-base font-bold text-[#8b1538] pr-4 font-display"
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
              class="px-6 py-4 bg-gradient-to-r from-[#f4cd60]/5 to-transparent border-t-2 border-[#a08850]"
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
    </main>

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
          <span aria-hidden="true"
            >🌙</span
          >
          <span aria-hidden="true"
            >🐴</span
          >
          <span aria-hidden="true"
            >🥕</span
          >
        </div>

        <!-- Contact button -->
        <nav class="mb-8 flex flex-wrap items-center justify-center gap-3" :aria-label="t('footer.nav')">
          <NuxtLink
            to="/blog"
            class="inline-flex items-center min-h-11 px-4 rounded-md border-2 border-[#d4a853] text-[#f4cd60] font-bold hover:bg-[#d4a853]/15"
          >
            {{ t('footer.blog') }}
          </NuxtLink>
          <UButton
            as="a"
            href="mailto:patrick@sintgpt.com"
            size="lg"
            variant="outline"
            class="border-2 border-[#d4a853] text-[#f4cd60] hover:bg-[#d4a853] hover:text-[#5c0f26] transition rounded-xl"
            icon="i-heroicons-envelope"
          >
            {{ t('footer.contact') }}
          </UButton>
        </nav>

        <!-- Copyright -->
        <p class="font-bold text-lg">
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
      <PaymentModal v-model="showPaymentModal" @restored="paymentStatus = 'success'" />
    </ClientOnly>

    <!-- Earlier poems, stored on this device -->
    <ClientOnly>
      <PoemHistoryDrawer
        v-model:open="showHistory"
        :active-id="activeHistoryId"
        @select="openPoemFromHistory"
      />
    </ClientOnly>
  </div>
</template>

<style scoped>
/* Header button that opens the poem history drawer */
.history-trigger {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 0.5rem;
  border: 2px solid #d4a853;
  background: #5c0f26;
  color: #f4cd60;
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 0.875rem;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.25);
  cursor: pointer;
  transition: background-color 0.2s;
}
.history-trigger:hover {
  background: #7a1533;
}
.history-trigger:focus-visible {
  outline: 2px solid #f4cd60;
  outline-offset: 2px;
}
.history-badge {
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.3rem;
  border-radius: 9999px;
  background: #f4cd60;
  color: #5c0f26;
  font-size: 0.7rem;
  line-height: 1.25rem;
  text-align: center;
}
/* On the icon-only mobile button, pin the badge to the corner */
.history-trigger.size-11 .history-badge {
  position: absolute;
  top: -0.4rem;
  right: -0.4rem;
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
  font-family: var(--font-text);
  white-space: pre-wrap;
  color: #3d2914;
  line-height: 1.6;
  font-variant-numeric: oldstyle-nums;
  margin: 0;
  /* Small enough on phones that a line of verse stays on one line. */
  font-size: 1.0625rem;
}

@media (min-width: 40rem) {
  .poem-text {
    font-size: 1.25rem;
  }
}

.poem-text.has-dropcap::first-letter {
  font-family: var(--font-display);
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

/* Hero buttons */
.hero-action {
  min-height: 3rem;
  border-radius: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition-property: background-color, scale;
  transition-duration: 150ms;
  transition-timing-function: ease-out;
}
.hero-action:active {
  scale: 0.96;
}
.hero-action:focus-visible,
.slider-festive:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 3px;
}
.slider-festive:focus-visible {
  color: #8b1538;
}

/* Optional form fields */
.form-more summary {
  min-height: 2.75rem;
  padding-block: 0.625rem;
  font-weight: 700;
  color: #8b1538;
  cursor: pointer;
}

/* Rhyme scheme examples */
.rhyme-example {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  font-family: var(--font-text);
  font-size: 0.75rem;
  line-height: 1.2;
}

.rhyme-line-a {
  color: #8b1538;
}

.rhyme-line-b {
  color: #7a5c14;
}
</style>
