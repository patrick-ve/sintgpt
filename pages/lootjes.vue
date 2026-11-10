<script setup lang="ts">
import { checkNames, drawLootjes, parseNames, type NamesProblem } from '~/utils/lootjes';

const { t } = useI18n();
const { track } = useAnalytics();

// Search engines see the Dutch text, like on every other page.
useSeoMeta({
  title: () => t('lootjes.seoTitle'),
  description: () => t('lootjes.description'),
  ogTitle: () => t('lootjes.title'),
  ogDescription: () => t('lootjes.description'),
});
useOgImage('lootjes', 'Lootjes trekken voor Sinterklaas op SintGPT');
useHead({
  link: [{ rel: 'canonical', href: 'https://sintgpt.com/lootjes' }],
  script: [
    {
      type: 'application/ld+json',
      // Dutch, like the server-rendered page that search engines read.
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebApplication',
            name: 'Lootjes trekken op SintGPT',
            url: 'https://sintgpt.com/lootjes',
            description: t('lootjes.description'),
            applicationCategory: 'UtilitiesApplication',
            operatingSystem: 'Web Browser',
            inLanguage: 'nl',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
          },
          {
            '@type': 'FAQPage',
            mainEntity: (t('lootjes.faq') as { question: string; answer: string }[]).map(item => ({
              '@type': 'Question',
              name: item.question,
              acceptedAnswer: { '@type': 'Answer', text: item.answer },
            })),
          },
        ],
      }),
    },
  ],
});

// The draw stays in this browser, so a reload or a locked phone does not
// change who drew whom. The privacy page says so.
const STORAGE_KEY = 'sintgpt-lootjes';

interface SavedDraw {
  names: string[];
  draw: Record<string, string>;
  seen: string[];
}

const namesText = ref('');
const problem = ref<NamesProblem | null>(null);
const saved = ref<SavedDraw | null>(null);
const revealed = ref<string | null>(null);
const confirmingAgain = ref(false);

onMounted(() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) saved.value = JSON.parse(raw) as SavedDraw;
  } catch {
    saved.value = null;
  }
});

const persist = () => {
  try {
    if (saved.value) localStorage.setItem(STORAGE_KEY, JSON.stringify(saved.value));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Blocked storage: the draw still works until the page closes.
  }
};

const draw = () => {
  const names = parseNames(namesText.value);
  problem.value = checkNames(names);
  if (problem.value) {
    nextTick(() => document.getElementById('lootjes-names')?.focus());
    return;
  }
  saved.value = { names, draw: drawLootjes(names), seen: [] };
  persist();
  track('Draw lootjes', { value: names.length });
  nextTick(() => document.getElementById('lootjes-pass')?.focus());
};

const reveal = (name: string) => {
  revealed.value = name;
  nextTick(() => document.getElementById('lootjes-reveal')?.focus());
};

const hide = () => {
  const name = revealed.value;
  revealed.value = null;
  if (saved.value && name && !saved.value.seen.includes(name)) {
    saved.value = { ...saved.value, seen: [...saved.value.seen, name] };
    persist();
  }
  nextTick(() => document.getElementById('lootjes-pass')?.focus());
};

const startAgain = () => {
  namesText.value = saved.value?.names.join('\n') ?? '';
  saved.value = null;
  revealed.value = null;
  confirmingAgain.value = false;
  persist();
  nextTick(() => document.getElementById('lootjes-names')?.focus());
};
</script>

<template>
  <div class="min-h-screen bg-[#fdf6e3]">
    <header class="bg-[#3d0716] border-t-[6px] border-[#d4a853]">
      <div class="mx-auto max-w-[1240px] px-4 sm:px-6 py-5">
        <NuxtLink to="/" class="font-display font-bold text-3xl md:text-[2rem] leading-none text-[#f4cd60]">
          {{ t('header.title') }}
        </NuxtLink>
      </div>
    </header>

    <main class="mx-auto max-w-[40rem] px-4 sm:px-6 py-10 md:py-14 text-[#3b2a1f]">
      <NuxtLink to="/" class="back-link">← {{ t('legal.back') }}</NuxtLink>

      <h1 class="mt-6 font-display font-bold text-4xl md:text-5xl leading-tight text-[#8b1538] text-balance">
        {{ t('lootjes.title') }}
      </h1>
      <p class="mt-4 font-text text-lg leading-relaxed text-pretty">{{ t('lootjes.intro') }}</p>

      <!-- 1. Names -->
      <form v-if="!saved" novalidate class="mt-8 flex flex-col gap-3" @submit.prevent="draw">
        <label for="lootjes-names" class="font-bold text-[#5c0f26]">{{ t('lootjes.namesLabel') }}</label>
        <textarea
          id="lootjes-names"
          v-model="namesText"
          rows="8"
          class="names-input"
          :placeholder="t('lootjes.placeholder')"
          autocomplete="off"
          autocapitalize="words"
          :aria-invalid="problem ? true : undefined"
          aria-describedby="lootjes-names-help"
          @input="problem = null"
        />
        <p
          id="lootjes-names-help"
          class="text-[0.9375rem]"
          :class="problem ? 'font-bold text-[#a3123f]' : 'text-[#5c0f26]'"
        >
          {{ problem ? t(`lootjes.${problem}`) : t('lootjes.namesHelp') }}
        </p>
        <button type="submit" class="btn-festive self-start min-h-12 px-8 text-xl">
          {{ t('lootjes.draw') }}
        </button>
      </form>

      <!-- 2. Pass the phone round -->
      <section v-else class="mt-8 flex flex-col gap-5">
        <div v-if="revealed" class="reveal" role="status">
          <p class="text-lg">{{ t('lootjes.youDrew', { name: revealed }) }}</p>
          <p id="lootjes-reveal" tabindex="-1" class="font-display font-bold text-4xl md:text-5xl text-[#8b1538] break-words">
            {{ saved.draw[revealed] }}
          </p>
          <button type="button" class="btn-festive min-h-12 px-6 text-lg" @click="hide">
            {{ t('lootjes.hide') }}
          </button>
        </div>

        <template v-else>
          <h2 id="lootjes-pass" tabindex="-1" class="font-display font-bold text-2xl text-[#8b1538]">
            {{ t('lootjes.pass') }}
          </h2>
          <ul class="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-2">
            <li v-for="name in saved.names" :key="name">
              <button type="button" class="name-button" @click="reveal(name)">
                <span class="break-words">{{ name }}</span>
                <span v-if="saved.seen.includes(name)" class="seen">
                  <UIcon name="i-heroicons-check" class="size-4" aria-hidden="true" />
                  {{ t('lootjes.seen') }}
                </span>
              </button>
            </li>
          </ul>
          <p class="text-[0.9375rem] text-[#5c0f26]">
            {{ t('lootjes.progress', { seen: saved.seen.length, total: saved.names.length }) }}
          </p>

          <div v-if="confirmingAgain" class="flex flex-wrap items-center gap-3" role="alert">
            <p class="w-full font-bold text-[#5c0f26]">{{ t('lootjes.confirmAgain') }}</p>
            <button type="button" class="again-button" @click="startAgain">{{ t('lootjes.confirmYes') }}</button>
            <button type="button" class="again-button" @click="confirmingAgain = false">{{ t('lootjes.cancel') }}</button>
          </div>
          <button v-else type="button" class="again-button self-start" @click="confirmingAgain = true">
            {{ t('lootjes.again') }}
          </button>
        </template>
      </section>

      <p class="mt-6 text-sm text-[#6b5545]">{{ t('lootjes.privacy') }}</p>

      <section aria-labelledby="lootjes-how" class="mt-12">
        <h2 id="lootjes-how" class="font-display font-bold text-2xl text-[#8b1538]">{{ t('lootjes.howTitle') }}</h2>
        <ol class="mt-4 flex flex-col gap-2 list-decimal pl-6 font-text text-lg leading-relaxed marker:font-bold marker:text-[#8b1538]">
          <li v-for="(step, index) in t('lootjes.steps')" :key="index">{{ step }}</li>
        </ol>
      </section>

      <section aria-labelledby="lootjes-faq" class="mt-12">
        <h2 id="lootjes-faq" class="font-display font-bold text-2xl text-[#8b1538]">{{ t('lootjes.faqTitle') }}</h2>
        <div class="mt-4 flex flex-col gap-5">
          <div v-for="(item, index) in t('lootjes.faq')" :key="index">
            <h3 class="font-bold text-lg text-[#5c0f26]">{{ item.question }}</h3>
            <p class="mt-1 font-text text-lg leading-relaxed text-pretty">{{ item.answer }}</p>
          </div>
        </div>
        <p class="mt-6 font-text text-lg leading-relaxed">
          {{ t('lootjes.moreTips') }}
          <NuxtLink to="/blog/lootjes-trekken-tips" class="inline-link">{{ t('lootjes.moreTipsLink') }}</NuxtLink>.
        </p>
      </section>

      <div class="mt-12 flex flex-col items-start gap-4 rounded-xl border-2 border-[#d4a853] bg-white/70 p-6">
        <h2 class="font-display font-bold text-2xl text-[#8b1538]">{{ t('lootjes.ctaTitle') }}</h2>
        <p class="font-text text-lg">{{ t('examples.ctaText') }}</p>
        <NuxtLink to="/#poem-form" data-cta="lootjes" class="btn-festive inline-flex items-center min-h-12 px-6 text-lg">
          {{ t('lootjes.cta') }}
        </NuxtLink>
        <NuxtLink to="/voorbeelden" class="inline-link">{{ t('examples.more') }}</NuxtLink>
      </div>
    </main>
    <SiteLinks />
  </div>
</template>

<style scoped>
.back-link {
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
  font-weight: 700;
  color: #8b1538;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.inline-link {
  font-weight: 700;
  color: #8b1538;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.names-input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: #fff;
  border: 2px solid #a08850;
  border-radius: 10px;
  font-size: 1rem;
  line-height: 1.5;
  color: #3d0716;
}
.names-input:focus-visible {
  outline: 3px solid #8b1538;
  outline-offset: 1px;
  border-color: #8b1538;
}

.name-button {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  width: 100%;
  min-height: 3.5rem;
  padding: 0.75rem 1rem;
  border: 2px solid #a08850;
  border-radius: 12px;
  background: #fff;
  color: #3d0716;
  font-weight: 700;
  font-size: 1.125rem;
  text-align: start;
  cursor: pointer;
}
@media (hover: hover) {
  .name-button:hover {
    border-color: #8b1538;
  }
}
.name-button:focus-visible,
.again-button:focus-visible {
  outline: 3px solid #8b1538;
  outline-offset: 2px;
}
.seen {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 400;
  color: #2f6b3a;
}

.reveal {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.5rem;
  border: 2px solid #d4a853;
  border-radius: 12px;
  background: #fffaf0;
}
.reveal p:focus {
  outline: none;
}

.again-button {
  min-height: 2.75rem;
  padding: 0 1rem;
  border: 2px solid #a08850;
  border-radius: 10px;
  background: transparent;
  color: #5c0f26;
  font-weight: 700;
  cursor: pointer;
}
</style>
