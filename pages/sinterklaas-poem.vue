<script setup lang="ts">
import { EXAMPLE_POEMS } from '~/utils/examplePoems';

// The one page in English with its own address (27 Nov 2026). The rest of the
// site switches to English in the browser on the same URLs, so search engines
// only saw Dutch: "sinterklaas poem" and its English variants (about 280
// searches a month in the Netherlands) had no page. The link to the form asks
// for an English poem and English labels (`?lang=en`, read in pages/index.vue).

const PAGE_URL = 'https://sintgpt.com/sinterklaas-poem';
const FORM = '/?lang=en#poem-form';

const example = EXAMPLE_POEMS.find(poem => poem.id === 'emma')!;
const exampleLines = example.poem.split('\n');

const faq = [
  {
    question: 'What is a Sinterklaas poem?',
    answer:
      'On 5 December, pakjesavond, Dutch families give each other presents from Sinterklaas. Each present comes with a poem, signed by the Sint, that someone reads aloud. It teases the receiver kindly about their habits and the year they had, and hints at what is in the wrapping.',
  },
  {
    question: 'Can SintGPT write the poem in English?',
    answer:
      'Yes. Choose English as the language of the poem, and the Sint writes rhyming English lines. The labels of the form can be in English too.',
  },
  {
    question: 'How long does it take?',
    answer: 'About a minute. You fill in a name, a few fun facts and the present, and choose a style.',
  },
  {
    question: 'Is it free?',
    answer:
      'Your first poem is free, with sharing, copying and saving as a PDF included. After that you choose what suits you, with one payment and no subscription.',
  },
  {
    question: 'Can I change the poem?',
    answer:
      'Yes. You can change words yourself, and your free poem may be rewritten once for free, with a wish such as "shorter" or "more about the running shoes".',
  },
];

useSeoMeta({
  title: 'Sinterklaas Poem in English: Have One Written | SintGPT',
  description:
    'Write a Sinterklaas poem in English in about a minute: rhyming, personal and ready to read aloud on pakjesavond. Your first poem is free.',
  ogTitle: 'Sinterklaas poem in English',
  ogDescription: 'A rhyming, personal Sinterklaas poem in English, ready in about a minute.',
  ogLocale: 'en_GB',
});
useOgImage('sinterklaas-poem', 'A Sinterklaas poem in English, written with SintGPT');
useHead({
  htmlAttrs: { lang: 'en' },
  link: [{ rel: 'canonical', href: PAGE_URL }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebPage',
            name: 'Sinterklaas poem in English',
            url: PAGE_URL,
            inLanguage: 'en',
            isPartOf: { '@type': 'WebSite', name: 'SintGPT', url: 'https://sintgpt.com/' },
          },
          {
            '@type': 'FAQPage',
            inLanguage: 'en',
            mainEntity: faq.map(item => ({
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
</script>

<template>
  <div class="en-page min-h-screen">
    <header class="border-b border-[#d9c596]">
      <div class="mx-auto flex max-w-[1120px] items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <NuxtLink to="/" class="en-focus flex min-h-11 items-center gap-2.5 text-[#8b1538]">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">
            <path d="M12 2.5c3.2 3 5 6 5 9.5V20H7v-8c0-3.5 1.8-6.5 5-9.5z" />
            <path d="M12 8v9M9 12.5h6" />
          </svg>
          <span class="font-display text-[26px] font-bold leading-none">SintGPT</span>
        </NuxtLink>
        <NuxtLink
          :to="FORM"
          data-cta="en:sinterklaas-poem:top"
          class="en-focus whitespace-nowrap rounded-md bg-[#8b1538] px-4 py-2.5 font-display font-bold text-[#fff8e7] transition-colors hover:bg-[#6e1030] sm:px-5"
        >
          Write a poem
        </NuxtLink>
      </div>
    </header>

    <main class="mx-auto max-w-[760px] px-4 pb-16 pt-10 sm:px-6">
      <p class="font-sans text-sm font-bold uppercase tracking-[0.12em] text-[#7a5c16]">For pakjesavond, 5 December</p>
      <h1 class="mt-2 font-display text-[2.25rem] font-bold leading-tight text-[#8b1538] text-balance sm:text-5xl">
        Sinterklaas poem in English
      </h1>
      <p class="lead mt-5 font-text text-xl leading-relaxed text-[#2b1b12] text-pretty">
        A Sinterklaas poem rhymes, teases the receiver kindly and hints at the present. SintGPT writes one in English from a
        name, a few fun facts and the present, in about a minute. Your first poem is free.
      </p>
      <div class="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
        <NuxtLink
          :to="FORM"
          data-cta="en:sinterklaas-poem"
          class="en-focus inline-flex min-h-12 items-center rounded-md bg-[#8b1538] px-6 font-display text-lg font-bold text-[#fff8e7] transition-colors hover:bg-[#6e1030]"
        >
          Write your English poem for free →
        </NuxtLink>
        <span class="font-sans text-[#5c4a3a]">Ready in about a minute</span>
      </div>

      <section aria-labelledby="how" class="mt-14">
        <h2 id="how" class="en-h2">How to have your poem written</h2>
        <ol class="mt-4 grid gap-3 font-text text-lg leading-relaxed text-[#2b1b12]">
          <li class="en-step"><strong>Fill in who it is for.</strong> The name, the present and a few fun facts: a habit, a small blunder, something that happened this year.</li>
          <li class="en-step"><strong>Choose the style.</strong> Funny, classic, ironic, old-fashioned, spicy or a roast, with the rhyme scheme and the length you want. Choose English as the language of the poem.</li>
          <li class="en-step"><strong>Read it, share it.</strong> After about a minute the poem is there. Copy it, share it with a link or save it as a PDF to print.</li>
        </ol>
      </section>

      <section aria-labelledby="example" class="mt-14">
        <h2 id="example" class="en-h2">An example: a poem for Emma</h2>
        <p class="mt-3 font-text text-lg leading-relaxed text-[#2b1b12]">
          Emma signed up for a marathon in April, has been on two runs so far and celebrates every run with a large stroopwafel.
          Her present: running shoes. This is the poem SintGPT wrote for her. Emma is made up.
        </p>
        <figure class="en-poem mt-6">
          <pre class="font-text text-lg leading-[1.7] text-[#2b1b12] whitespace-pre-wrap">{{ exampleLines.join('\n') }}</pre>
        </figure>
        <p class="mt-4 font-sans text-[#5c4a3a]">
          More examples, in Dutch, are on the
          <NuxtLink to="/voorbeelden" class="en-link">example poems</NuxtLink> page.
        </p>
      </section>

      <section aria-labelledby="tips" class="mt-14">
        <h2 id="tips" class="en-h2">Tips for a Sinterklaas poem in English</h2>
        <ul class="mt-4 grid gap-2 font-text text-lg leading-relaxed text-[#2b1b12] list-disc ps-6 marker:text-[#b8923c]">
          <li>Give the Sint one real detail per verse. "You love your garden" fits anyone; "your rake spent three nights in the rain" fits one person.</li>
          <li>Keep the teasing kind. The receiver reads the poem aloud to everyone in the room.</li>
          <li>Hint at the present, never name it. The last lines can say it is time to unwrap.</li>
          <li>Guests new to the tradition? Let the first verse explain who Sinterklaas is and why he writes poems.</li>
          <li>Sign it "From Sinterklaas & Pete": the poem is always from the Sint, never from you.</li>
        </ul>
      </section>

      <section aria-labelledby="faq" class="mt-14">
        <h2 id="faq" class="en-h2">Questions</h2>
        <div class="mt-4 grid gap-3">
          <details v-for="item in faq" :key="item.question" class="en-faq">
            <summary class="font-display text-lg font-bold text-[#8b1538]">{{ item.question }}</summary>
            <p class="mt-2 font-text text-lg leading-relaxed text-[#2b1b12]">{{ item.answer }}</p>
          </details>
        </div>
      </section>

      <section class="en-offer mt-14">
        <p class="font-display text-2xl font-bold text-[#fff8e7] text-balance">Write a Sinterklaas poem in English</p>
        <p class="mt-2 font-sans text-lg text-[#f7dfc0]">Ready in about a minute. Your first poem is free.</p>
        <NuxtLink
          :to="FORM"
          data-cta="en:sinterklaas-poem:end"
          class="en-focus-light mt-5 inline-flex min-h-12 items-center rounded-md bg-[#f4cd60] px-6 font-display text-lg font-bold text-[#3d0a19] transition-colors hover:bg-[#ffe08a]"
        >
          Start your poem →
        </NuxtLink>
      </section>

      <p class="mt-10 font-sans text-[#5c4a3a]">
        Prefer Dutch tips? Read
        <NuxtLink to="/blog/sinterklaasgedicht-in-het-engels" lang="nl" class="en-link">Sinterklaasgedicht in het Engels</NuxtLink>
        on the SintGPT blog.
      </p>
    </main>

    <footer class="bg-[#3d0a19] text-[#f7dfc0]">
      <nav aria-label="Footer" class="mx-auto flex max-w-[1120px] flex-wrap gap-x-6 gap-y-1 px-6 pb-12 pt-9 font-medium">
        <NuxtLink to="/" class="en-footer-link">Write a poem</NuxtLink>
        <NuxtLink to="/voorbeelden" class="en-footer-link">Examples</NuxtLink>
        <NuxtLink to="/blog" class="en-footer-link">Blog (Dutch)</NuxtLink>
        <NuxtLink to="/lootjes" class="en-footer-link">Draw names</NuxtLink>
        <NuxtLink to="/privacy" class="en-footer-link">Privacy</NuxtLink>
        <NuxtLink to="/voorwaarden" class="en-footer-link">Terms</NuxtLink>
      </nav>
    </footer>
  </div>
</template>

<style scoped>
.en-page {
  background: #f6ecd4;
}

.en-h2 {
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.25;
  color: #8b1538;
  text-wrap: balance;
}

.en-step {
  padding: 0.875rem 1rem;
  background: #fffbee;
  border: 1px solid #d9c596;
  border-radius: 6px;
}

.en-poem {
  margin-inline: 0;
  padding: 1.25rem 1.5rem;
  background: #fffbee;
  border-block: 2px solid #b8923c;
}

.en-faq {
  padding: 0.75rem 1rem;
  background: #fffbee;
  border: 1px solid #d9c596;
  border-radius: 6px;
}

.en-faq summary {
  min-height: 2.75rem;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.en-offer {
  padding: 1.75rem 1.5rem;
  background: #8b1538;
  border-radius: 8px;
  text-align: center;
}

.en-link {
  color: #8b1538;
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.en-link:hover {
  color: #6e1030;
}

.en-footer-link {
  padding: 10px 0;
  text-decoration: underline;
  text-underline-offset: 4px;
}

.en-footer-link:hover {
  color: #f4cd60;
}

.en-focus:focus-visible,
.en-link:focus-visible,
.en-faq summary:focus-visible {
  outline: 2px solid #8b1538;
  outline-offset: 3px;
  border-radius: 4px;
}

.en-focus-light:focus-visible,
.en-footer-link:focus-visible {
  outline: 2px solid #f4cd60;
  outline-offset: 3px;
  border-radius: 4px;
}
</style>
