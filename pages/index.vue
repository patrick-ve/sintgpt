<script setup lang="ts">
const { generatePoem, isLoading, error, poem } = usePoemGenerator();

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

const styleOptions = [
  { value: 'funny', label: '😄 Grappig' },
  { value: 'classic', label: '📜 Klassiek' },
  { value: 'ironic', label: '😏 Ironisch' },
  { value: 'old-fashioned', label: '🎩 Ouderwets' },
];

const rhymeSchemeOptions = [
  { value: 'AABB', label: 'AABB (Rijmparen)' },
  { value: 'ABBA', label: 'ABBA (Omarmend)' },
  { value: 'Limerick', label: 'Limerick' },
];

const languageOptions = [
  { value: 'dutch', label: '🇳🇱 Nederlands' },
  { value: 'english', label: '🇬🇧 Engels' },
];

const revealPresentOptions = [
  { value: true, label: 'Ja, vermeldt het cadeau in het gedicht' },
  {
    value: false,
    label: 'Nee, houd het cadeau geheim (vaag omschrijven)',
  },
];

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

useHead({
  title:
    'SintGPT - Maak gepersonaliseerde Sinterklaasgedichten met AI. Snel, makkelijk en klaar binnen 20 seconden!',
  meta: [
    {
      name: 'description',
      content:
        'SintGPT maakt voor jou een perfect Sinterklaasgedicht. Snel, makkelijk en klaar binnen 20 seconden!',
    },
  ],
});
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-b from-black via-blue-950 to-gray-900"
  >
    <!-- Header -->
    <header class="bg-red-900 text-white shadow-lg">
      <div class="container mx-auto px-6 py-8 text-[rgb(244,205,96)]">
        <div class="flex items-center justify-between w-full gap-8">
          <!-- Left: Heading -->
          <div class="flex-shrink-0">
            <h1 class="text-5xl font-bold">SintGPT</h1>
          </div>

          <!-- Right: Paragraphs -->
          <div class="flex flex-col text-right">
            <p class="font-semibold text-base">
              Maak gepersonaliseerde Sinterklaasgedichten en laat AI
              het rijmen doen.
            </p>

            <p class="font-semibold text-base">
              Snel & makkelijk. Klaar binnen 20 seconden!
            </p>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-6 pb-12 py-12">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Form Section -->
        <section class="bg-white rounded-2xl shadow-xl p-8">
          <h2 class="text-2xl font-semibold text-gray-800 mb-6">
            Details voor het gedicht
          </h2>

          <form @submit.prevent="handleSubmit" class="space-y-6">
            <!-- Recipient Name -->
            <div>
              <label
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                Naam ontvanger<span class="text-red-500">*</span>
              </label>

              <UInput
                v-model="formData.name"
                placeholder="Sint Nicolaas"
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
                Sinterklaascadeau
              </label>
              <UInput
                v-model="formData.present"
                placeholder="Een boek, speelgoed, kookgerei, etc."
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
                Cadeau vermelden?
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
                Leuke weetjes over de ontvanger
              </label>
              <UTextarea
                v-model="formData.funFacts"
                placeholder="Vertel zo uitgebreid mogelijk over hobby's, werk, sport, interesses of andere anekdotes..."
                :rows="5"
                size="xl"
                :disabled="isLoading"
                class="w-full"
              />
              <p class="text-xs text-gray-500 mt-1">
                Deze informatie wordt gebruikt om het gedicht
                persoonlijker te maken
              </p>
            </div>

            <!-- Style -->
            <div>
              <label
                class="block text-sm font-medium text-gray-700 mb-3"
              >
                Gedichtstijl <span class="text-red-500">*</span>
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
                Rijmschema <span class="text-red-500">*</span>
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
                Taal <span class="text-red-500">*</span>
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
                Aantal regels: {{ formData.lines }}
              </label>
              <input
                v-model.number="formData.lines"
                type="range"
                min="8"
                max="40"
                step="4"
                class="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer"
                :disabled="isLoading"
              />
              <div
                class="flex justify-between text-xs text-gray-500 mt-1"
              >
                <span>8 regels</span>
                <span>40 regels</span>
              </div>
            </div>

            <!-- Submit Button -->
            <UButton
              type="submit"
              size="xl"
              block
              :disabled="!isFormValid || isLoading"
              :loading="isLoading"
              class="bg-red-600 hover:bg-red-700"
            >
              {{
                isLoading
                  ? 'Gedicht genereren...'
                  : 'Genereer gedicht'
              }}
            </UButton>
          </form>
        </section>

        <!-- Poem Display Section -->
        <section class="bg-white rounded-2xl shadow-xl p-8">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-semibold text-gray-800">
              Jouw gedicht
            </h2>
            <UButton
              v-if="poem"
              icon="i-heroicons-clipboard-document"
              size="sm"
              :color="copySuccess ? 'green' : 'gray'"
              @click="copyToClipboard"
            >
              {{ copySuccess ? 'Gekopieerd!' : 'Kopieer' }}
            </UButton>
          </div>

          <!-- Loading State -->
          <div
            v-if="isLoading"
            class="flex flex-col items-center justify-center h-96 text-gray-500"
          >
            <div
              class="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mb-4"
            />
            <p class="text-lg">
              Jouw gepersonaliseerde gedicht wordt gemaakt...
            </p>
          </div>

          <!-- Error State -->
          <UAlert
            v-else-if="error"
            color="red"
            variant="soft"
            title="Fout"
            :description="error"
            icon="i-heroicons-exclamation-triangle"
          />

          <!-- Poem Display -->
          <div v-else-if="poem" class="prose prose-lg max-w-none">
            <div
              class="bg-amber-50 rounded-xl p-6 border-2 border-amber-200"
            >
              <pre
                class="whitespace-pre-wrap font-serif text-gray-800 leading-relaxed"
                >{{ poem }}</pre
              >
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
              Vul het formulier in om een gedicht te genereren
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
          Copyright {{ new Date().getFullYear() }} SintGPT. Alle
          rechten voorbehouden.
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
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
</style>
