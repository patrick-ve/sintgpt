<script setup lang="ts">
import {
  CONTACT_EMAIL,
  CONTACT_LIMITS,
  CONTACT_TOPICS,
  TURNSTILE_ACTION,
  TURNSTILE_TEST_SITE_KEY,
  looksLikeEmail,
  type ContactErrorReason,
  type ContactTopic,
} from '~/utils/contactForm';

interface TurnstileApi {
  render(element: HTMLElement, options: Record<string, unknown>): string;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const { t, locale } = useI18n();
const { track } = useAnalytics();
const config = useRuntimeConfig();

// Search engines see the Dutch text, like on every other page.
useSeoMeta({
  title: () => t('contact.seoTitle'),
  description: () => t('contact.description'),
  ogTitle: () => t('contact.title'),
  ogDescription: () => t('contact.description'),
});
useOgImage('home', 'SintGPT');
useHead({
  link: [{ rel: 'canonical', href: 'https://sintgpt.com/contact' }],
});

const siteKey = config.public.turnstileSiteKey || (import.meta.dev ? TURNSTILE_TEST_SITE_KEY : '');

const topic = ref<ContactTopic>('help');
const email = ref('');
const message = ref('');
/** The honeypot: hidden from people. */
const website = ref('');

const emailInvalid = ref(false);
const messageTooShort = ref(false);
const status = ref<'idle' | 'checking' | 'sending' | 'sent'>('idle');
const error = ref<ContactErrorReason | null>(null);
const sentTo = ref('');

const turnstileBox = ref<HTMLElement | null>(null);
const token = ref('');
const turnstileBroken = ref(false);
let widgetId: string | undefined;
let openedAt = 0;
let from = '';

const messageLength = computed(() => message.value.trim().length);
const busy = computed(() => status.value === 'checking' || status.value === 'sending');

/** The page before this one: Vue Router keeps it in history.state; a first load has the referrer. */
function previousPath(): string {
  const back = (window.history.state as { back?: unknown } | null)?.back;
  if (typeof back === 'string') return back.split(/[?#]/)[0] ?? '';
  try {
    const referrer = new URL(document.referrer);
    return referrer.host === window.location.host ? referrer.pathname : '';
  } catch {
    return '';
  }
}

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile missing')));
    script.onerror = () => reject(new Error('Turnstile did not load'));
    document.head.appendChild(script);
  });
}

onMounted(async () => {
  openedAt = Date.now();
  from = previousPath();
  if (!siteKey) {
    turnstileBroken.value = true;
    return;
  }
  try {
    const turnstile = await loadTurnstile();
    if (!turnstileBox.value) return;
    widgetId = turnstile.render(turnstileBox.value, {
      sitekey: siteKey,
      action: TURNSTILE_ACTION,
      language: locale.value,
      // Invisible unless Cloudflare wants the visitor to tick a box.
      appearance: 'interaction-only',
      callback: (value: string) => {
        token.value = value;
        if (status.value === 'checking') send();
      },
      'expired-callback': () => {
        token.value = '';
      },
      'error-callback': () => {
        token.value = '';
        if (status.value === 'checking') fail('captcha');
      },
    });
  } catch {
    turnstileBroken.value = true;
  }
});

onBeforeUnmount(() => {
  if (widgetId) window.turnstile?.remove(widgetId);
});

function fail(reason: ContactErrorReason) {
  status.value = 'idle';
  error.value = reason;
  // A token works once; the next try needs a new one.
  token.value = '';
  if (widgetId) window.turnstile?.reset(widgetId);
  nextTick(() => document.getElementById('contact-error')?.focus());
}

function submit() {
  if (busy.value) return;
  error.value = null;
  emailInvalid.value = !looksLikeEmail(email.value);
  messageTooShort.value = messageLength.value < CONTACT_LIMITS.messageMin;
  if (emailInvalid.value || messageTooShort.value) {
    nextTick(() => document.getElementById(emailInvalid.value ? 'contact-email' : 'contact-message')?.focus());
    return;
  }
  if (turnstileBroken.value) {
    fail('unavailable');
    return;
  }
  if (!token.value) {
    // Turnstile is still busy; its callback sends the message.
    status.value = 'checking';
    return;
  }
  send();
}

async function send() {
  status.value = 'sending';
  try {
    await $fetch('/api/contact', {
      method: 'POST',
      body: {
        topic: topic.value,
        email: email.value.trim(),
        message: message.value.trim(),
        locale: locale.value,
        from,
        website: website.value,
        elapsed: Math.round((Date.now() - openedAt) / 1000),
        turnstile: token.value,
      },
    });
    sentTo.value = email.value.trim();
    message.value = '';
    status.value = 'sent';
    token.value = '';
    if (widgetId) window.turnstile?.reset(widgetId);
    nextTick(() => document.getElementById('contact-sent')?.focus());
  } catch (err: any) {
    const reason = err?.data?.data?.reason;
    fail(reason === 'captcha' || reason === 'debounce' || reason === 'limit' ? reason : 'unavailable');
  }
}

function writeAnother() {
  status.value = 'idle';
  openedAt = Date.now();
  nextTick(() => document.getElementById('contact-message')?.focus());
}
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
        {{ t('contact.title') }}
      </h1>
      <p class="mt-4 font-text text-lg leading-relaxed text-pretty">{{ t('contact.intro') }}</p>

      <section aria-labelledby="contact-quick" class="mt-10">
        <h2 id="contact-quick" class="font-display font-bold text-2xl text-[#8b1538]">{{ t('contact.quickTitle') }}</h2>
        <div class="mt-4 flex flex-col gap-2">
          <details v-for="(item, index) in t('contact.quick')" :key="index" class="quick">
            <summary>{{ item.question }}</summary>
            <p class="mt-2 font-text text-lg leading-relaxed text-pretty">{{ item.answer }}</p>
          </details>
        </div>
      </section>

      <section aria-labelledby="contact-form-title" class="mt-12">
        <h2 id="contact-form-title" class="font-display font-bold text-2xl text-[#8b1538]">{{ t('contact.formTitle') }}</h2>

        <div v-if="status === 'sent'" class="sent mt-4" role="status">
          <p id="contact-sent" tabindex="-1" class="font-display font-bold text-2xl text-[#2f6b3a]">
            {{ t('contact.sentTitle') }}
          </p>
          <p class="font-text text-lg">{{ t('contact.sentText', { email: sentTo }) }}</p>
          <button type="button" class="again-button" @click="writeAnother">{{ t('contact.another') }}</button>
        </div>

        <form v-show="status !== 'sent'" novalidate class="mt-4 flex flex-col gap-5" @submit.prevent="submit">
          <fieldset class="flex flex-col gap-2">
            <legend class="font-bold text-[#5c0f26] mb-2">{{ t('contact.topicLabel') }}</legend>
            <div class="flex flex-wrap gap-2">
              <label v-for="id in CONTACT_TOPICS" :key="id" class="topic" :class="{ 'topic-on': topic === id }">
                <input v-model="topic" type="radio" name="topic" :value="id" class="sr-only" autocomplete="off">
                {{ t(`contact.topics.${id}`) }}
              </label>
            </div>
          </fieldset>

          <div class="flex flex-col gap-2">
            <label for="contact-email" class="font-bold text-[#5c0f26]">{{ t('contact.emailLabel') }}</label>
            <input
              id="contact-email"
              v-model="email"
              type="email"
              name="email"
              class="field"
              autocomplete="email"
              inputmode="email"
              :maxlength="CONTACT_LIMITS.email"
              :aria-invalid="emailInvalid ? true : undefined"
              aria-describedby="contact-email-help"
              @input="emailInvalid = false"
            >
            <p
              id="contact-email-help"
              class="text-[0.9375rem]"
              :class="emailInvalid ? 'font-bold text-[#a3123f]' : 'text-[#5c0f26]'"
            >
              {{ emailInvalid ? t('contact.emailInvalid') : t('contact.emailHelp') }}
            </p>
          </div>

          <div class="flex flex-col gap-2">
            <label for="contact-message" class="font-bold text-[#5c0f26]">{{ t('contact.messageLabel') }}</label>
            <textarea
              id="contact-message"
              v-model="message"
              name="message"
              rows="7"
              class="field"
              :maxlength="CONTACT_LIMITS.messageMax"
              :aria-invalid="messageTooShort ? true : undefined"
              aria-describedby="contact-message-help"
              @input="messageTooShort = false"
            />
            <div class="flex justify-between gap-4 text-[0.9375rem]">
              <p id="contact-message-help" :class="messageTooShort ? 'font-bold text-[#a3123f]' : 'text-[#5c0f26]'">
                {{ messageTooShort ? t('contact.messageTooShort', { min: CONTACT_LIMITS.messageMin }) : t('contact.messageHelp') }}
              </p>
              <span class="shrink-0 tabular-nums text-[#6b5545]" aria-hidden="true">
                {{ t('contact.count', { count: messageLength, max: CONTACT_LIMITS.messageMax }) }}
              </span>
            </div>
          </div>

          <!-- Bots fill every field; people never see this one. -->
          <div class="honeypot" aria-hidden="true">
            <label for="contact-website">{{ t('contact.honeypot') }}</label>
            <input id="contact-website" v-model="website" type="text" name="website" tabindex="-1" autocomplete="off">
          </div>

          <div ref="turnstileBox" />

          <p
            v-if="error"
            id="contact-error"
            tabindex="-1"
            role="alert"
            class="rounded-lg border-2 border-[#a3123f] bg-white p-4 font-bold text-[#a3123f]"
          >
            {{ t(`contact.errors.${error}`, { email: CONTACT_EMAIL }) }}
          </p>

          <div class="flex flex-col items-start gap-2">
            <button type="submit" class="btn-festive min-h-12 px-8 text-xl" :disabled="busy" :aria-busy="busy">
              {{ status === 'sending' ? t('contact.sending') : t('contact.submit') }}
            </button>
            <p v-if="status === 'checking'" class="text-[0.9375rem] text-[#5c0f26]" role="status">
              {{ t('contact.checking') }}
            </p>
          </div>

          <p class="text-sm text-[#6b5545]">
            {{ t('contact.privacy') }}
            <NuxtLink to="/privacy" class="inline-link">{{ t('contact.privacyLink') }}</NuxtLink>.
          </p>
        </form>
      </section>

      <p class="mt-10 font-text text-lg">
        {{ t('contact.mailInstead') }}
        <a :href="`mailto:${CONTACT_EMAIL}`" class="inline-link" @click="track('Contact')">{{ CONTACT_EMAIL }}</a>.
      </p>
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
.quick {
  border: 2px solid #d4a853;
  border-radius: 12px;
  background: #fffaf0;
  padding: 0.75rem 1rem;
}
.quick summary {
  min-height: 2.75rem;
  display: flex;
  align-items: center;
  font-weight: 700;
  color: #5c0f26;
  cursor: pointer;
}
.quick summary:focus-visible {
  outline: 3px solid #8b1538;
  outline-offset: 2px;
}
.field {
  width: 100%;
  padding: 0.75rem 1rem;
  background: #fff;
  border: 2px solid #a08850;
  border-radius: 10px;
  font-size: 1rem;
  line-height: 1.5;
  color: #3d0716;
}
.field:focus-visible {
  outline: 3px solid #8b1538;
  outline-offset: 1px;
  border-color: #8b1538;
}
.field[aria-invalid='true'] {
  border-color: #a3123f;
}
.topic {
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
  padding: 0 1rem;
  border: 2px solid #a08850;
  border-radius: 999px;
  background: #fff;
  color: #3d0716;
  font-weight: 700;
  cursor: pointer;
}
.topic-on {
  border-color: #8b1538;
  background: #8b1538;
  color: #fff;
}
.topic:has(input:focus-visible) {
  outline: 3px solid #8b1538;
  outline-offset: 2px;
}
.honeypot {
  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}
.sent {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.5rem;
  border: 2px solid #d4a853;
  border-radius: 12px;
  background: #fffaf0;
}
.sent p:focus {
  outline: none;
}
#contact-error:focus {
  outline: none;
}
.again-button {
  min-height: 2.75rem;
  padding: 0 1rem;
  border: 2px solid #a08850;
  border-radius: 10px;
  background: #fff;
  color: #3d0716;
  font-weight: 700;
  cursor: pointer;
}
.again-button:focus-visible {
  outline: 3px solid #8b1538;
  outline-offset: 2px;
}
</style>
