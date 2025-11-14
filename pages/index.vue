<script setup lang="ts">
const { generatePoem, isLoading, error, poem } = usePoemGenerator();
const { t, locale, setLocale } = useI18n();

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

const handleSubmit = async () => {
  await generatePoem(formData.value);
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
});
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-b from-black via-blue-950 to-gray-900"
  >
    <!-- Header -->
    <header class="bg-red-900 text-white shadow-lg">
      <div class="container mx-auto px-6 py-8 text-[rgb(244,205,96)]">
        <div
          class="flex flex-col md:flex-row md:items-center md:justify-between w-full gap-4 md:gap-8"
        >
          <!-- Left: Heading -->
          <div class="flex-shrink-0">
            <h1 class="text-3xl md:text-5xl font-bold">
              {{ t('header.title') }}
            </h1>
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

    <!-- Main Content -->
    <main class="container mx-auto px-6 pb-12 py-12">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Form Section -->
        <section class="bg-white rounded-2xl shadow-xl p-4 md:p-8">
          <h2 class="text-2xl font-semibold text-gray-800 mb-6">
            {{ t('form.title') }}
          </h2>

          <form @submit.prevent="handleSubmit" class="space-y-6">
            <!-- Recipient Name -->
            <div>
              <label
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                {{ t('form.name.label')
                }}<span class="text-red-500">{{
                  t('form.required')
                }}</span>
              </label>

              <UInput
                v-model="formData.name"
                :placeholder="t('form.name.placeholder')"
                size="xl"
                :disabled="isLoading"
                class="w-full"
              />
            </div>

            <!-- Present -->
            <div>
              <label
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                {{ t('form.present.label') }}
              </label>
              <UInput
                v-model="formData.present"
                :placeholder="t('form.present.placeholder')"
                size="xl"
                :disabled="isLoading"
                class="w-full"
              />
            </div>

            <!-- Reveal Present -->
            <div>
              <label
                class="block text-sm font-medium text-gray-700 mb-2"
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
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                {{ t('form.funFacts.label') }}
              </label>
              <UTextarea
                v-model="formData.funFacts"
                :placeholder="t('form.funFacts.placeholder')"
                :rows="5"
                size="xl"
                :disabled="isLoading"
                class="w-full"
              />
              <p class="text-xs text-gray-500 mt-1">
                {{ t('form.funFacts.help') }}
              </p>
            </div>

            <!-- Style -->
            <div>
              <label
                class="block text-sm font-medium text-gray-700 mb-3"
              >
                {{ t('form.style.label') }}
                <span class="text-red-500">{{
                  t('form.required')
                }}</span>
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
                  <span class="ml-2 text-sm text-gray-700">{{
                    option.label
                  }}</span>
                </label>
              </div>
            </div>

            <!-- Rhyme Scheme -->
            <div>
              <label
                class="block text-sm font-medium text-gray-700 mb-3"
              >
                {{ t('form.rhymeScheme.label') }}
                <span class="text-red-500">{{
                  t('form.required')
                }}</span>
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
                  <span class="ml-2 text-sm text-gray-700">{{
                    option.label
                  }}</span>
                </label>
              </div>
            </div>

            <!-- Language -->
            <div>
              <label
                class="block text-sm font-medium text-gray-700 mb-3"
              >
                {{ t('form.language.label') }}
                <span class="text-red-500">{{
                  t('form.required')
                }}</span>
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
                  <span class="ml-2 text-sm text-gray-700">{{
                    option.label
                  }}</span>
                </label>
              </div>
            </div>

            <!-- Number of Lines Slider -->
            <div>
              <label
                class="block text-sm font-medium text-gray-700 mb-2"
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
                class="flex justify-between text-xs text-gray-500 mt-1"
              >
                <span>{{ sliderMin }} {{ t('form.lines.min') }}</span>
                <span>{{ sliderMax }} {{ t('form.lines.max') }}</span>
              </div>
              <p v-if="isLimerick" class="text-xs text-gray-500 mt-2">
                {{ t('form.lines.limerickNote') }}
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
        <section class="bg-white rounded-2xl shadow-xl p-4 md:p-8">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-semibold text-gray-800">
              {{ poemTitle }}
            </h2>
            <UButton
              v-if="poem"
              icon="i-heroicons-clipboard-document"
              size="sm"
              :color="copySuccess ? 'success' : 'neutral'"
              @click="copyToClipboard"
              data-umami-event="Copy to clipboard"
            >
              {{ copySuccess ? t('poem.copied') : t('poem.copy') }}
            </UButton>
          </div>

          <!-- Loading State -->
          <div v-if="isLoading" class="prose prose-lg max-w-none">
            <div class="poem-parchment">
              <div class="animate-pulse space-y-3">
                <div
                  v-for="index in formData.lines"
                  :key="index"
                  class="h-3 rounded bg-gray-300"
                  :class="{
                    'w-11/12': index % 4 === 1,
                    'w-10/12': index % 4 === 2,
                    'w-full': index % 4 === 3,
                    'w-9/12': index % 4 === 0,
                    'mb-6': index % 4 === 0,
                  }"
                />
              </div>
            </div>
            <p class="text-center text-gray-500 mt-4">
              {{ t('poem.loading') }}
            </p>
          </div>

          <!-- Error State -->
          <UAlert
            v-else-if="error"
            color="warning"
            variant="soft"
            :title="t('poem.error')"
            :description="error"
            icon="i-heroicons-exclamation-triangle"
          />

          <!-- Poem Display -->
          <div v-else-if="poem" class="prose prose-lg max-w-none">
            <div class="poem-parchment">
              <pre class="poem-text has-dropcap">{{ poem }}</pre>
            </div>
          </div>

          <!-- Empty State -->
          <div
            v-else
            class="flex flex-col items-center justify-center h-96 text-gray-400"
          >
            <svg
              class="w-24 h-24 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p class="text-lg">
              {{ t('poem.empty') }}
            </p>
          </div>
        </section>
      </div>
    </main>

    <!-- Footer -->
    <footer class="bg-transparent mt-12">
      <div
        class="container mx-auto px-6 py-6 text-center text-gray-400"
      >
        <p>
          {{
            t('footer.copyright').replace(
              '{year}',
              new Date().getFullYear().toString()
            )
          }}
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel&family=Cinzel+Decorative&family=IM+Fell+DW+Pica+SC&family=IM+Fell+DW+Pica:ital@0;1&display=swap');

input[type='range']::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  background: #dc2626;
  cursor: pointer;
  border-radius: 50%;
}

input[type='range']::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: #dc2626;
  cursor: pointer;
  border-radius: 50%;
  border: none;
}

.poem-parchment {
  background-color: #fff3c9;
  padding: 2rem;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.poem-text {
  font-family: 'IM Fell DW Pica', serif;
  white-space: pre-wrap;
  color: #000000;
  line-height: 1.8;
  margin: 0;
  font-size: 1.25crem;
}

.poem-text.has-dropcap::first-letter {
  font-family: 'IM Fell DW Pica SC', serif;
  float: left;
  font-size: 4rem;
  line-height: 0.65;
  margin: 0.1em 0.1em 0.2em 0;
  color: #8b0000;
}
</style>
