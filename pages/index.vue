<script setup lang="ts">
import { buildShareUrl } from '~/utils/poemLink';
import { POEM_INPUT_LIMITS } from '~/utils/poemLimits';
import { saveFormDraft, takeFormDraft } from '~/utils/formDraft';
import { pakjesavondCountdown } from '~/utils/pakjesavond';
import { PDF_DESIGNS, type PdfDesignId } from '~/utils/pdfDesigns';
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
  paymentsUnavailable,
  refreshPaymentsStatus,
} = usePaymentTracking();
const poemHistory = usePoemHistory();
const { track } = useAnalytics();
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

// True when the visitor came back from the payment page and the form they
// filled in before paying is back in place.
const restoredDraft = ref(false);

// Handle payment redirect query params and restore trial poem
onMounted(async () => {
  // Restore persisted trial poem for unpaid users. Before the payment check,
  // because a successful payment clears it, and the poem should stay on screen.
  if (storedTrialPoem.value && !isPaid.value) {
    poem.value = storedTrialPoem.value;
    if (storedTrialPoemName.value) {
      formData.value.name = storedTrialPoemName.value;
      displayedRecipient.value = storedTrialPoemName.value;
    }
  }

  // Always take the draft, so an old one does not linger; use it only when
  // the visitor comes back from the payment page.
  const draft = takeFormDraft<Partial<PoemFormData>>(localStorage);
  const paymentId = route.query.payment_id;
  if (draft && (typeof paymentId === 'string' || route.query.payment === 'cancelled')) {
    restoreForm(draft);
  }

  if (typeof paymentId === 'string') {
    paymentStatus.value = 'pending';
    const claim = await claimPayment(paymentId);
    if (claim === 'granted') {
      paymentStatus.value = 'success';
      track('Payment succeeded');
    } else {
      paymentStatus.value = claim === 'pending' ? 'pending' : 'failed';
      track('Payment returned', { detail: claim });
    }
    // While pending, keep the ID in the URL so a reload checks again.
    if (claim !== 'pending') {
      router.replace({ query: {} });
    }
  } else if (route.query.payment === 'cancelled') {
    paymentStatus.value = 'cancelled';
    track('Payment returned', { detail: 'cancelled' });
    router.replace({ query: {} });
  }
});

// Dismiss payment status notification
const dismissPaymentStatus = () => {
  paymentStatus.value = null;
};

// Keeps the form while the visitor pays, so they continue where they were.
const saveFormForCheckout = () => {
  saveFormDraft(localStorage, { ...formData.value });
};

// Copies only fields the form knows, with the right type.
const restoreForm = (draft: Partial<PoemFormData>) => {
  const form = formData.value as Record<string, unknown>;
  for (const [key, value] of Object.entries(draft)) {
    if (key in form && typeof value === typeof form[key]) form[key] = value;
  }
  restoredDraft.value = true;
};

// The next step after paying: write the poem from the restored form.
const continueAfterPayment = async () => {
  track('Continue after payment');
  dismissPaymentStatus();
  scrollToForm();
  await handleSubmit();
};

// Days until pakjesavond. Worked out on the server too, so the hero does not
// jump when the page loads; the browser updates it for its own date.
const countdown = useState('pakjesavond-countdown', () => pakjesavondCountdown(new Date()));
onMounted(() => {
  countdown.value = pakjesavondCountdown(new Date());
});
const countdownText = computed(() => {
  if (!countdown.value) return '';
  if (countdown.value.days === 0) return t('countdown.today');
  if (countdown.value.days === 1) return t('countdown.tomorrow');
  return t('countdown.days', { count: countdown.value.days });
});

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
  style: 'funny' as 'funny' | 'classic' | 'ironic' | 'old-fashioned' | 'spicy' | 'roast',
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
  { value: 'roast', label: t('form.style.roast') },
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

// Shared looks for Nuxt UI controls on this page.
const languageSelectUi = {
  base: 'h-11 bg-transparent border-[#d4a853] border-2 text-[#f4cd60] font-bold rounded-[10px]',
  value: 'text-[#f4cd60]',
  trailingIcon: 'text-[#f4cd60]',
};
const inputUi = {
  base: 'bg-white border-2 border-[#a08850] focus:border-[#8b1538] rounded-[10px]',
};

const selectedLocale = computed({
  get: () => locale.value,
  set: (value) => {
    setLocale(value);
    track('Switch language', { detail: value });
  },
});

const copySuccess = ref(false);
const showPaymentModal = ref(false);
const poemSectionRef = ref<HTMLElement | null>(null);

// Respect the visitor's motion preference for scripted scrolling too.
const scrollBehavior = (): ScrollBehavior =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

const startFromHero = () => {
  track('Scroll to poem form', { detail: 'hero' });
  scrollToForm();
};

const scrollToForm = () => {
  const el = document.getElementById('poem-form');
  el?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
};

const scrollToFaq = () => {
  track('Scroll to FAQ');
  const el = document.getElementById('faq-section');
  el?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
};

// The form as it was sent for the poem on screen. "Herschrijf dit gedicht"
// sends it again, so edits to the form after that do not change the rewrite.
// Poems opened from the history have none, because the history does not keep
// the details people typed.
type PoemFormData = typeof formData.value;
const lastRequest = ref<PoemFormData | null>(null);

// Why the payment window opened, for analytics.
const paymentTrigger = ref<'submit' | 'rewrite' | 'limit'>('submit');
const openPaymentModal = (trigger: 'submit' | 'rewrite' | 'limit') => {
  paymentTrigger.value = trigger;
  showPaymentModal.value = true;
};

// The free limit applies to a rewrite as well. While payments do not work,
// the page does not ask for one: only the server's daily limit applies.
const canStartGeneration = async (trigger: 'submit' | 'rewrite'): Promise<boolean> => {
  if (import.meta.dev || canGeneratePoem.value) return true;
  if (!(await refreshPaymentsStatus())) return true;
  openPaymentModal(trigger);
  return false;
};

// The first time the visitor types or picks something in the form.
let formStarted = false;
const onFormActivity = () => {
  if (formStarted) return;
  formStarted = true;
  track('Form started');
};

const startFromExamples = () => {
  track('Scroll to poem form', { detail: 'examples' });
  scrollToForm();
};

watch(showHistory, (open) => {
  if (open) track('Open history');
});

const runGeneration = async (request: PoemFormData, regenerate = false) => {
  // Scroll to poem section on mobile immediately so user sees loading state
  if (window.innerWidth < 1024 && poemSectionRef.value) {
    poemSectionRef.value.scrollIntoView({
      behavior: scrollBehavior(),
      block: 'start',
    });
  }

  poemAnnouncement.value = t('poem.loading');

  displayedRecipient.value = request.name.trim();
  activeHistoryId.value = null;
  lastRequest.value = { ...request };
  await generatePoem({ ...request, regenerate });

  // A rate limit shows the upgrade offer in the poem area.
  poemAnnouncement.value = poem.value ? t('poem.ready') : '';

  if (!error.value && !isRateLimitError.value && poem.value) {
    incrementPoemCount();

    // The server records "Generate poem" and "Regenerate poem", with the cost.

    // Keep it in the on-device history drawer
    const saved = poemHistory.add({
      recipient: displayedRecipient.value,
      poem: poem.value,
      style: request.style,
      rhymeScheme: request.rhymeScheme,
      language: request.language,
      lines: request.lines,
      share: generatedShare.value,
    });
    activeHistoryId.value = saved.id;
    // How many poems this device has (the history keeps up to 50).
    track('Poem ready', { detail: regenerate ? 'rewrite' : 'new', value: historyEntries.value.length });

    // Save trial poem for unpaid users so it persists across page refreshes
    if (!isPaid.value) {
      saveTrialPoem(poem.value, request.name);
    }
  }
};

const handleSubmit = async () => {
  if (!isFormValid.value) {
    showNameError.value = true;
    track('Form refused', { detail: 'no name' });
    document.getElementById('poem-name')?.focus();
    return;
  }
  if (!(await canStartGeneration('submit'))) return;
  await runGeneration(formData.value);
};

const regeneratePoem = async () => {
  if (!lastRequest.value || isLoading.value) return;
  if (!(await canStartGeneration('rewrite'))) return;
  await runGeneration(lastRequest.value, true);
};

const copyToClipboard = async () => {
  if (!poem.value) return;

  try {
    await navigator.clipboard.writeText(poem.value);
    copySuccess.value = true;
    track('Copy to clipboard');
    setTimeout(() => {
      copySuccess.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
    track('Copy failed');
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

// Stores the poem only now that someone shares it. The long link needs no
// storage, so it takes over when the short link is not available.
const shortLinks = new Map<string, string>();

const resolveShareLink = async (): Promise<string | null> => {
  const text = poem.value;
  const longLink = shareUrl.value;
  const signed = historyEntries.value.find(entry => entry.poem === text)?.share;
  if (!text || !longLink || !signed) return longLink;

  const known = shortLinks.get(text);
  if (known) return known;
  try {
    const { id } = await $fetch<{ id: string }>('/api/share/links', {
      method: 'POST',
      body: { share: signed, poem: text },
      timeout: 4000,
    });
    const link = `${window.location.origin}/g/${id}`;
    shortLinks.set(text, link);
    return link;
  } catch {
    return longLink;
  }
};

// Browsers block a new window that opens after waiting, so open it first.
const openWithShareLink = async (buildTarget: (link: string | null) => string) => {
  const opened = window.open('', '_blank');
  if (opened) opened.opener = null;
  const target = buildTarget(await resolveShareLink());
  if (opened) opened.location.href = target;
  else window.location.href = target;
};

const copyShareLink = async () => {
  if (!shareUrl.value) return;
  const link = resolveShareLink();
  try {
    // Safari only allows copying during the click, so hand it a pending value.
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/plain': link.then(url => new Blob([url ?? ''], { type: 'text/plain' })),
      }),
    ]);
  } catch {
    await navigator.clipboard.writeText((await link) ?? '');
  }
  linkCopied.value = true;
  track('Copy share link');
  setTimeout(() => {
    linkCopied.value = false;
  }, 2000);
};

const isSavingPdf = ref(false);
const pdfFailed = ref(false);
const pdfDialogOpen = ref(false);

const openPdfDialog = () => {
  pdfFailed.value = false;
  pdfDialogOpen.value = true;
};

const fetchBytes = async (path: string) => {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return new Uint8Array(await response.arrayBuffer());
};

// The PDF never names the site; only the file name does.
const savePoemPdf = async (designId: PdfDesignId) => {
  if (!import.meta.client || !poem.value || isSavingPdf.value) return;
  isSavingPdf.value = true;
  pdfFailed.value = false;
  try {
    const design = PDF_DESIGNS[designId];
    const [{ buildPoemPdf, poemPdfFileName }, background, textFont, capFont] = await Promise.all([
      import('~/utils/poemPdf'),
      fetchBytes(design.background),
      fetchBytes(design.textFont),
      design.capFont ? fetchBytes(design.capFont) : Promise.resolve(undefined),
    ]);
    const bytes = await buildPoemPdf({
      poem: poem.value,
      title: poemTitle.value,
      design,
      background,
      textFont,
      capFont,
    });
    const href = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = href;
    link.download = poemPdfFileName(displayedRecipient.value);
    link.click();
    setTimeout(() => URL.revokeObjectURL(href), 60_000);
    track('Save as PDF', { detail: designId });
    pdfDialogOpen.value = false;
  } catch (error) {
    console.error('Failed to save PDF:', error);
    track('PDF failed', { detail: designId });
    pdfFailed.value = true;
  } finally {
    isSavingPdf.value = false;
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
  track('Shared via WhatsApp');
  openWithShareLink((link) => {
    const text = link ? `${poemTitle.value}\n${link}` : getPoemWithAttribution();
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  });
};

const shareViaEmail = () => {
  const subject = encodeURIComponent(poemTitle.value);
  const body = encodeURIComponent(getPoemWithAttribution());
  track('Shared via Email');
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
};

const shareViaFacebook = () => {
  track('Shared via Facebook');
  openWithShareLink(link =>
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link ?? window.location.origin)}`,
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
  lastRequest.value = null;
  track('Open poem from history');
  nextTick(() => {
    poemSectionRef.value?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
  });
};

// One element per verse line, so a wrapped line hangs under its verse.
const poemLines = computed(() => (poem.value ?? '').split('\n'));

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
            ? 'Gedichten voor het hele gezin, na 1 gratis gedicht'
            : 'Poems for the whole family, after 1 free poem',
      },
      featureList:
        locale.value === 'nl'
          ? "Persoonlijke sinterklaasgedichten, Zes stijlen (grappig, klassiek, ironisch, ouderwets, pikant, roast), Nederlands en Engels, Verschillende rijmschema's"
          : 'Personal Sinterklaas poems, Six styles (funny, classic, ironic, old-fashioned, spicy, roast), Dutch and English, Various rhyme schemes',
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
    <header class="site-header relative z-20 bg-[#3d0716] border-t-[6px] border-[#d4a853]">
      <div class="mx-auto max-w-[1240px] px-4 sm:px-6 py-5 flex items-center justify-between gap-3">
        <p class="font-display font-bold text-3xl md:text-[2rem] leading-none text-[#f4cd60]">
          {{ t('header.title') }}
        </p>

        <!-- Mobile: icon-only history button and short language names -->
        <div class="flex md:hidden items-center gap-2 flex-shrink-0">
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
            :ui="languageSelectUi"
          />
        </div>

        <!-- Desktop -->
        <div class="hidden md:flex items-center gap-2">
          <button
            type="button"
            class="history-trigger h-11 px-4"
            @click="showHistory = true"
          >
            <UIcon name="i-heroicons-book-open" class="size-5" />
            <span>{{ t('history.open') }}</span>
            <span
              v-if="historyEntries.length"
              class="history-badge"
            >{{ historyEntries.length }}</span>
          </button>
          <USelect
            v-model="selectedLocale"
            :items="uiLanguageItems"
            :aria-label="'Taal / Language'"
            class="w-44"
            size="lg"
            :ui="languageSelectUi"
          />
        </div>
      </div>
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
              {{ restoredDraft ? t('payment.successDraft') : t('payment.successMessage') }}
            </p>
            <button
              v-if="restoredDraft && formData.name.trim()"
              type="button"
              class="btn-festive mt-3 min-h-11 px-5 text-base"
              @click="continueAfterPayment"
            >
              {{ t('payment.successNext') }}
            </button>
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
    <!-- Hero -->
    <section aria-labelledby="hero-title" class="relative z-10 bg-[#3d0716] text-[#fbf1dc]">
      <div class="mx-auto max-w-[1240px] px-4 sm:px-6 pt-4 pb-16 md:pt-6 md:pb-20 flex flex-wrap items-center gap-10 lg:gap-14">
        <div class="flex-[1_1_520px] min-w-0 flex flex-col gap-6">
          <p v-if="countdown" class="countdown self-start">
            <span class="countdown-days">🎁 {{ countdownText }}</span>
            <span v-if="countdown.hurry" class="block text-[#f7e6c0] font-normal">{{ t('countdown.hint') }}</span>
          </p>
          <h1
            id="hero-title"
            class="font-display font-bold text-[2.25rem] sm:text-5xl xl:text-6xl leading-[1.08] tracking-[-0.01em] text-balance"
          >
            <span class="block">{{ t('hero.question') }}</span>
            <span class="block mt-3 text-[#f4cd60]">{{ t('hero.answer') }}</span>
          </h1>

          <p class="text-lg md:text-xl leading-normal text-[#f7e6c0] max-w-[32em] text-pretty">
            {{ t('hero.subtitle') }}
          </p>

          <div class="flex flex-col sm:flex-row sm:flex-wrap gap-3">
            <button
              type="button"
              class="hero-action min-h-14 px-8 bg-[#f4cd60] text-[#3d0716] font-display text-xl hover:bg-[#ffe08a]"
              @click="startFromHero"
            >
              {{ t('hero.cta') }}
            </button>
            <button
              type="button"
              class="hero-action min-h-14 px-6 border-2 border-[#d4a853] text-[#f4cd60] text-lg hover:bg-[#d4a853]/15"
              @click="scrollToFaq"
            >
              {{ t('hero.moreInfo') }}
            </button>
          </div>

          <p class="text-base text-[#f7e6c0]">
            {{ t('hero.note') }}
          </p>
        </div>

        <figure class="flex-[1_1_400px] min-w-0 max-w-[300px] sm:max-w-[500px] mx-auto flex flex-col gap-3">
          <img
            src="/sint-hero-800.webp"
            srcset="/sint-hero-400.webp 400w, /sint-hero-800.webp 800w"
            sizes="(min-width: 640px) 500px, 300px"
            width="800"
            height="1000"
            fetchpriority="high"
            :alt="t('hero.photoAlt')"
            class="block w-full h-auto aspect-[4/5] object-cover rounded-[260px_260px_24px_24px] border-4 border-[#d4a853]"
          />
          <figcaption class="text-center text-[0.9375rem] text-[#f7e6c0]">
            {{ t('hero.photoCaption') }}
          </figcaption>
        </figure>
      </div>
    </section>

    <!-- Form and poem -->
    <section
      id="poem-form"
      aria-labelledby="form-title"
      class="relative z-10 bg-[#fbf3e2] text-[#3d0716] px-4 sm:px-6 pt-12 pb-16 md:pt-16 md:pb-20"
    >
      <div class="mx-auto max-w-[1240px] flex flex-col gap-9">
        <h2
          id="form-title"
          class="font-display font-bold text-[1.75rem] md:text-[2.5rem] leading-tight text-[#8b1538]"
        >
          {{ t('form.title') }}
        </h2>

        <div class="flex flex-wrap items-start gap-10">
          <form
            novalidate
            class="flex-[1_1_560px] min-w-0 flex flex-col gap-7"
            @submit.prevent="handleSubmit"
            @input="onFormActivity"
            @change="onFormActivity"
          >
            <!-- Step 1: who -->
            <fieldset class="form-step">
              <legend class="form-step-legend">
                <span class="step-number" aria-hidden="true">1</span>
                <span>{{ t('form.steps.who') }}</span>
              </legend>

              <div class="flex flex-wrap gap-4">
                <div class="flex-[1_1_200px] min-w-0">
                  <label for="poem-name" class="field-label">
                    {{ t('form.name.label') }}<span class="ms-1" aria-hidden="true">*</span>
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
                    :ui="inputUi"
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

                <div class="flex-[1_1_200px] min-w-0">
                  <label for="poem-present" class="field-label">
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
                    :ui="inputUi"
                  />
                </div>
              </div>

              <div
                role="radiogroup"
                :aria-label="t('form.revealPresent.label')"
                class="flex flex-wrap gap-x-7 gap-y-1"
              >
                <label
                  v-for="option in revealPresentOptions"
                  :key="String(option.value)"
                  class="radio-plain"
                >
                  <input
                    v-model="formData.revealPresent"
                    type="radio"
                    name="poem-reveal"
                    :value="option.value"
                    :disabled="isLoading"
                  />
                  {{ option.label }}
                </label>
              </div>
            </fieldset>

            <!-- Step 2: what makes them special -->
            <fieldset class="form-step">
              <legend class="form-step-legend">
                <span class="step-number" aria-hidden="true">2</span>
                <span>{{ t('form.steps.special') }}</span>
              </legend>

              <div>
                <label for="poem-facts" class="field-label">
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
                  :ui="inputUi"
                />
                <p id="poem-facts-help" class="text-sm text-[#5c0f26] mt-1.5">
                  {{ t('form.funFacts.help') }}
                </p>
              </div>
            </fieldset>

            <!-- Step 3: how it should sound -->
            <fieldset class="form-step">
              <legend class="form-step-legend">
                <span class="step-number" aria-hidden="true">3</span>
                <span>{{ t('form.steps.tone') }}</span>
              </legend>

              <fieldset>
                <legend class="field-label">{{ t('form.style.label') }}</legend>
                <div class="grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-2">
                  <label
                    v-for="option in styleOptions"
                    :key="option.value"
                    class="choice"
                  >
                    <input
                      v-model="formData.style"
                      type="radio"
                      name="poem-style"
                      :value="option.value"
                      :disabled="isLoading"
                    />
                    <span>{{ option.label }}</span>
                  </label>
                </div>
              </fieldset>

              <div class="flex flex-wrap gap-5">
                <fieldset class="flex-[1_1_260px] min-w-0">
                  <legend class="field-label">{{ t('form.rhymeScheme.label') }}</legend>
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    <label
                      v-for="option in rhymeSchemeOptions"
                      :key="option.value"
                      class="choice"
                    >
                      <input
                        v-model="formData.rhymeScheme"
                        type="radio"
                        name="poem-rhyme"
                        :value="option.value"
                        :disabled="isLoading"
                      />
                      <span>{{ option.label }}</span>
                    </label>
                  </div>
                </fieldset>

                <fieldset class="flex-[1_1_200px] min-w-0">
                  <legend class="field-label">{{ t('form.language.label') }}</legend>
                  <div class="grid grid-cols-2 gap-1.5">
                    <label
                      v-for="option in languageOptions"
                      :key="option.value"
                      class="choice"
                    >
                      <input
                        v-model="formData.language"
                        type="radio"
                        name="poem-language"
                        :value="option.value"
                        :disabled="isLoading"
                      />
                      <span class="whitespace-nowrap">{{ option.label }}</span>
                    </label>
                  </div>
                </fieldset>
              </div>

              <div>
                <label for="poem-lines" class="field-label">
                  {{ t('form.lines.label') }}:
                  <span class="tabular-nums">{{ formData.lines }}</span>
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
                  <div class="flex justify-between text-sm font-bold text-[#5c0f26] mt-2">
                    <span>{{ sliderMin }} {{ t('form.lines.min') }}</span>
                    <span>{{ sliderMax }} {{ t('form.lines.max') }}</span>
                  </div>
                </div>
                <p v-if="isLimerick" class="text-sm text-[#5c0f26] mt-2">
                  {{ t('form.lines.limerickNote') }}
                </p>
              </div>

              <!-- Optional details -->
              <details class="form-more">
                <summary>{{ t('form.more') }}</summary>
                <div class="space-y-5 pt-4">
                  <div>
                    <label for="poem-written-by" class="field-label">
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
                      :ui="inputUi"
                    />
                    <p id="poem-written-by-help" class="text-sm text-[#5c0f26] mt-1.5">
                      {{ t('form.writtenBy.help') }}
                    </p>
                  </div>

                  <div>
                    <label for="poem-audience" class="field-label">
                      {{ t('form.writtenForAudience.label') }}
                    </label>
                    <UInput
                      id="poem-audience"
                      :maxlength="POEM_INPUT_LIMITS.writtenForAudience"
                      v-model="formData.writtenForAudience"
                      aria-describedby="poem-audience-help"
                      :placeholder="t('form.writtenForAudience.placeholder')"
                      size="xl"
                      :disabled="isLoading"
                      class="w-full input-festive"
                      :ui="inputUi"
                    />
                    <p id="poem-audience-help" class="text-sm text-[#5c0f26] mt-1.5">
                      {{ t('form.writtenForAudience.help') }}
                    </p>
                  </div>
                </div>
              </details>
            </fieldset>

            <div class="flex flex-wrap items-center gap-4">
              <button
                type="submit"
                :disabled="isLoading"
                class="btn-festive flex-[1_1_280px] min-h-[3.625rem] px-6 text-[1.375rem] disabled:opacity-70 disabled:cursor-wait"
              >
                <span v-if="isLoading" class="flex items-center justify-center gap-3">
                  <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {{ t('form.submit.generating') }}
                </span>
                <span v-else>{{ t('form.submit.generate') }}</span>
              </button>
              <p class="flex-[1_1_220px] text-[0.9375rem] text-[#5c0f26]">
                <template v-if="isPaid">{{ t('payment.unlimitedUnlocked') }}</template>
                <template v-else-if="paymentsUnavailable">{{ t('payment.unavailable.hint') }}</template>
                <template v-else>{{ t('payment.remainingPoems', { count: remainingFreePoems }) }}.</template>
                {{ t('form.submit.time') }}
              </p>
            </div>
          </form>

          <!-- The poem, as a letter -->
          <section
            ref="poemSectionRef"
            aria-labelledby="poem-title"
            class="flex-[1_1_400px] min-w-0 flex flex-col gap-4 scroll-mt-4"
          >
            <p class="sr-only" role="status">{{ poemAnnouncement }}</p>

            <div class="poem-letter">
              <div class="wax-seal" aria-hidden="true">S</div>

              <!-- Rate limit: the upgrade offer -->
              <div
                v-if="isRateLimitError"
                class="flex flex-col items-center text-center py-6"
              >
                <img
                  src="/sint-352.webp"
                  width="176"
                  height="176"
                  loading="lazy"
                  alt=""
                  class="w-36 h-36 rounded-full object-cover ring-4 ring-[#f4cd60] mb-6"
                />
                <template v-if="paymentsUnavailable">
                  <h3 id="poem-title" class="text-2xl font-bold text-[#8b1538] mb-3 font-display">
                    {{ t('payment.unavailable.limitTitle') }}
                  </h3>
                  <p class="text-[#5c0f26] max-w-md font-medium">
                    {{ t('payment.unavailable.limitMessage') }}
                  </p>
                </template>
                <template v-else>
                  <h3 id="poem-title" class="text-2xl font-bold text-[#8b1538] mb-3 font-display">
                    {{ t('payment.limitReached') }}
                  </h3>
                  <p class="text-[#5c0f26] mb-8 max-w-md font-medium">
                    {{ t('payment.description') }}
                  </p>
                  <button
                    type="button"
                    class="btn-festive px-8 py-4 text-lg"
                    @click="openPaymentModal('limit')"
                  >
                    {{ t('payment.unlimitedAccess') }}
                  </button>
                </template>
              </div>

              <template v-else>
                <p
                  v-if="!poem && !isLoading && !error"
                  class="text-[0.8125rem] font-bold tracking-[0.06em] uppercase text-[#8b1538]"
                >
                  {{ t('poem.sample') }}
                </p>
                <h3
                  id="poem-title"
                  class="font-display font-bold text-[1.75rem] leading-tight text-[#8b1538] break-words"
                >
                  {{ poem || isLoading || error ? poemTitle : t('poem.sampleTitle') }}
                </h3>

                <!-- Writing -->
                <div v-if="isLoading && !poem" class="flex items-center justify-center py-6">
                  <PoemWritingAnimation />
                </div>

                <!-- Error -->
                <UAlert
                  v-else-if="error"
                  color="error"
                  variant="subtle"
                  :title="t('poem.error')"
                  :description="error"
                  icon="i-heroicons-exclamation-triangle"
                  class="border-2 border-red-300 bg-red-50/80 rounded-xl"
                />

                <!-- The poem -->
                <pre
                  v-else-if="poem"
                  class="poem-text has-dropcap noselect"
                  :aria-busy="isLoading || undefined"
                ><span v-for="(line, index) in poemLines" :key="index" class="poem-line">{{ line }}<span v-if="isLoading && index === poemLines.length - 1" class="stream-caret" aria-hidden="true"></span></span></pre>

                <!-- Example -->
                <template v-else>
                  <p class="poem-text has-dropcap">{{ t('poem.sampleText') }}</p>
                  <p class="font-text italic text-[1.0625rem] text-[#5c0f26] text-end">
                    {{ t('poem.sampleSignature') }}
                  </p>
                </template>
              </template>
            </div>

            <!-- Actions. Disabled on the example, hidden while writing. -->
            <div
              v-if="!isRateLimitError && !error"
              class="grid grid-cols-[repeat(auto-fill,minmax(12.5rem,1fr))] gap-2"
              :class="{ invisible: isLoading }"
            >
              <button
                v-if="lastRequest || !poem"
                type="button"
                class="poem-action poem-action-main col-span-full"
                :disabled="!poem"
                @click="regeneratePoem"
              >
                <UIcon name="i-heroicons-arrow-path" class="size-5" aria-hidden="true" />
                {{ t('poem.regenerate') }}
              </button>
              <button
                v-if="shareUrl || !poem"
                type="button"
                class="poem-action"
                :disabled="!poem"
                @click="copyShareLink"
              >
                <UIcon name="i-heroicons-link" class="size-[1.125rem]" aria-hidden="true" />
                {{ linkCopied ? t('poem.linkCopied') : t('poem.copyLink') }}
              </button>
              <button
                type="button"
                class="poem-action"
                :disabled="!poem"
                @click="copyToClipboard"
              >
                <UIcon name="i-heroicons-clipboard-document" class="size-[1.125rem]" aria-hidden="true" />
                {{ copySuccess ? t('poem.copied') : t('poem.copy') }}
              </button>
              <button
                type="button"
                class="poem-action"
                :disabled="!poem"
                aria-haspopup="dialog"
                @click="openPdfDialog"
              >
                <UIcon name="i-heroicons-arrow-down-tray" class="size-[1.125rem]" aria-hidden="true" />
                {{ t('poem.savePdf') }}
              </button>
              <button
                type="button"
                class="poem-action"
                :disabled="!poem"
                @click="shareViaWhatsApp"
              >
                <svg class="size-[1.125rem] shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                {{ t('poem.shareWhatsApp') }}
              </button>
              <button
                type="button"
                class="poem-action"
                :disabled="!poem"
                @click="shareViaEmail"
              >
                <UIcon name="i-heroicons-envelope" class="size-[1.125rem]" aria-hidden="true" />
                {{ t('poem.shareEmail') }}
              </button>
              <button
                type="button"
                class="poem-action"
                :disabled="!poem"
                @click="shareViaFacebook"
              >
                <svg class="size-[1.125rem] shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                {{ t('poem.shareFacebook') }}
              </button>
            </div>

            <p
              v-if="poem && !isLoading && !error && !isRateLimitError && !isPaid && !paymentsUnavailable && remainingFreePoems === 0"
              class="text-sm text-[#5c0f26]"
            >
              {{ t('poem.freeComplete') }}
            </p>
            <p v-if="shareUrl && !isLoading" class="text-sm text-[#5c0f26]">
              {{ t('poem.linkPrivacy') }}
            </p>

            <!-- Earlier poems (on-device history) -->
            <button
              v-if="historyEntries.length"
              type="button"
              class="self-start -ml-1 inline-flex items-center gap-1.5 min-h-11 px-1 text-sm font-bold text-[#8b1538] underline decoration-[#d4a853] underline-offset-4 cursor-pointer"
              @click="showHistory = true"
            >
              <UIcon name="i-heroicons-book-open" class="size-4" aria-hidden="true" />
              {{ t('history.previous') }} ({{ historyEntries.length }})
            </button>
          </section>
        </div>
      </div>
    </section>

    <!-- Example poems in every style -->
    <ExamplePoems @start="startFromExamples" />

    <!-- Sinterklaas video message -->
    <section class="container mx-auto px-6 py-12 relative z-10">
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
          <NuxtLink
            to="/voorbeelden"
            class="inline-flex items-center min-h-11 px-4 rounded-md border-2 border-[#d4a853] text-[#f4cd60] font-bold hover:bg-[#d4a853]/15"
          >
            {{ t('footer.examples') }}
          </NuxtLink>
          <NuxtLink
            to="/lootjes"
            class="inline-flex items-center min-h-11 px-4 rounded-md border-2 border-[#d4a853] text-[#f4cd60] font-bold hover:bg-[#d4a853]/15"
          >
            {{ t('footer.lootjes') }}
          </NuxtLink>
          <NuxtLink
            to="/privacy"
            class="inline-flex items-center min-h-11 px-4 rounded-md border-2 border-[#d4a853] text-[#f4cd60] font-bold hover:bg-[#d4a853]/15"
          >
            {{ t('footer.privacy') }}
          </NuxtLink>
          <NuxtLink
            to="/voorwaarden"
            class="inline-flex items-center min-h-11 px-4 rounded-md border-2 border-[#d4a853] text-[#f4cd60] font-bold hover:bg-[#d4a853]/15"
          >
            {{ t('footer.terms') }}
          </NuxtLink>
          <UButton
            as="a"
            href="mailto:patrick@sintgpt.com"
            size="lg"
            @click="track('Contact')"
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
      <PaymentModal v-model="showPaymentModal" :trigger="paymentTrigger" @restored="paymentStatus = 'success'" @checkout="saveFormForCheckout" />
      <PdfDesignDialog v-model="pdfDialogOpen" :busy="isSavingPdf" :failed="pdfFailed" @save="savePoemPdf" />
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
  border-radius: 10px;
  border: 2px solid #d4a853;
  background: transparent;
  color: #f4cd60;
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: background-color 150ms ease-out;
}
@media (hover: hover) {
  .history-trigger:hover {
    background: rgb(212 168 83 / 0.15);
  }
}

/* The three numbered steps of the form */
.form-step {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 0;
  padding: 1.5rem;
  border: 1px solid #e6d5b0;
  border-radius: 18px;
  background: #fffdf7;
}
@media (max-width: 40rem) {
  .form-step {
    padding: 1.25rem 1rem;
  }
}
/* Floating the legend keeps it inside the padding of the fieldset. */
.form-step-legend {
  float: left;
  width: 100%;
  padding: 0;
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.375rem;
  line-height: 1.2;
  color: #3d0716;
}
.step-number {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  background: #5c0f26;
  color: #f4cd60;
  font-size: 1.125rem;
}
.field-label {
  display: block;
  margin-bottom: 0.375rem;
  padding: 0;
  font-weight: 700;
  font-size: 0.9375rem;
  color: #8b1538;
}

/* A plain radio button with its label */
.radio-plain {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  min-height: 2.75rem;
  font-weight: 500;
  font-size: 1.0625rem;
  color: #3d0716;
  cursor: pointer;
}
.radio-plain input {
  flex: none;
  width: 1.25rem;
  height: 1.25rem;
  margin: 0;
  accent-color: #8b1538;
  cursor: pointer;
}
.radio-plain input:focus-visible {
  outline: 2px solid #8b1538;
  outline-offset: 2px;
}

/* A radio button drawn as a button. Selected is filled dark, not only a
   different hue. */
.choice {
  position: relative;
  display: block;
  cursor: pointer;
}
.choice input {
  position: absolute;
  inset: 0;
  opacity: 0;
  margin: 0;
  cursor: pointer;
}
.choice > span {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  min-height: 2.75rem;
  padding: 0 0.75rem;
  border: 1.5px solid #d9c49a;
  border-radius: 10px;
  background: #fff;
  font-weight: 700;
  font-size: 0.9375rem;
  color: #8b1538;
  text-align: center;
  transition-property: background-color, border-color, color;
  transition-duration: 150ms;
  transition-timing-function: ease-out;
}
.choice input:checked + span {
  background: #5c0f26;
  border-color: #5c0f26;
  color: #f4cd60;
}
.choice input:focus-visible + span {
  outline: 2px solid #8b1538;
  outline-offset: 2px;
}
.choice input:disabled + span {
  cursor: not-allowed;
  opacity: 0.7;
}

/* The poem as a letter with a wax seal */
.poem-letter {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 2.75rem 2.5rem 2.5rem;
  background: #fffaf0;
  border: 1px solid #e6d5b0;
  border-radius: 6px;
  box-shadow:
    0 1px 2px rgb(61 7 22 / 0.08),
    0 24px 48px -20px rgb(61 7 22 / 0.35);
}
@media (max-width: 40rem) {
  .poem-letter {
    padding: 2.5rem 1.25rem 1.75rem;
  }
}
.wax-seal {
  position: absolute;
  top: -1.375rem;
  inset-inline-end: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.75rem;
  height: 3.75rem;
  border-radius: 50%;
  background: #a3123f;
  box-shadow:
    inset 0 -4px 8px rgb(0 0 0 / 0.25),
    0 4px 10px rgb(61 7 22 / 0.35);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.75rem;
  color: #f4b6c4;
}

/* A wrapped line hangs under its verse line, so each verse stays recognizable. */
.poem-line {
  display: block;
  min-height: 1lh;
  padding-inline-start: 0.9em;
  text-indent: -0.9em;
}
/* The drop cap needs a plain first line. */
.poem-line:first-child {
  padding-inline-start: 0;
  text-indent: 0;
}
/* Shows that the poem is still being written. */
.stream-caret {
  display: inline-block;
  width: 0.09em;
  height: 1em;
  margin-inline-start: 0.08em;
  vertical-align: -0.12em;
  background: #8b1538;
}
@media (prefers-reduced-motion: no-preference) {
  .stream-caret {
    animation: caret-blink 1s steps(2, jump-none) infinite;
  }
}
@keyframes caret-blink {
  from { opacity: 1; }
  to { opacity: 0.25; }
}

/* Buttons under the poem */
.poem-action {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  padding: 0 0.875rem;
  border: 1.5px solid #d9c49a;
  border-radius: 10px;
  background: #fff;
  color: #8b1538;
  font-weight: 700;
  font-size: 0.9375rem;
  text-align: start;
  cursor: pointer;
  transition-property: background-color, border-color, scale;
  transition-duration: 150ms;
  transition-timing-function: ease-out;
}
.poem-action-main {
  justify-content: center;
  min-height: 3.25rem;
  border: 2px solid #8b1538;
  background: #fffaf0;
  font-size: 1.0625rem;
}
@media (hover: hover) {
  .poem-action:enabled:hover {
    background: #fdf3dc;
    border-color: #8b1538;
  }
}
.poem-action:enabled:active {
  scale: 0.96;
}
.poem-action:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
.poem-action:focus-visible {
  outline: 2px solid #8b1538;
  outline-offset: 2px;
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

/* Days until pakjesavond, above the hero title */
.countdown {
  padding: 0.5rem 1rem;
  border: 2px solid #d4a853;
  border-radius: 12px;
  background: rgb(212 168 83 / 0.12);
  color: #f4cd60;
  font-weight: 700;
  font-size: 1.0625rem;
  line-height: 1.4;
}

/* Hero buttons */
.hero-action {
  min-height: 3rem;
  border-radius: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  /* The two buttons use different fonts, which sit at different heights in
     their line box. Centre on the capitals instead, so both labels look
     centred and their baselines line up. Browsers without text-box keep the
     old look. */
  text-box: trim-both cap alphabetic;
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
