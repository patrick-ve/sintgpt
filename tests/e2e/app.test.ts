import { fileURLToPath } from 'node:url';
import { createPage as createNuxtPage, fetch, setup, url } from '@nuxt/test-utils/e2e';
import { Webhook } from 'standardwebhooks';
import { describe, expect, it } from 'vitest';
import { OG_IMAGES } from '../../scripts/og-images';
import { VUE_MARKER } from '../../scripts/strip-comments';
import { signAccessToken, signLegacyAccessToken } from '../../server/utils/paymentAccess';
import type { TierId } from '../../utils/pricingTiers';
import { signPoemShare } from '../../server/utils/poemShare';
import { encodePoem, encodeText } from '../../utils/poemLink';
import { readPoemStream } from '../../utils/poemStream';

// Builds the app in production mode, starts the real Nitro server and
// launches a headless browser for the UI tests.
await setup({
  rootDir: fileURLToPath(new URL('../..', import.meta.url)),
  build: true,
  server: true,
  browser: true,
});

/**
 * Every test page skips the home page video. Its request stays open in the
 * test browser, so `networkidle` waited about 15 s on each page; with ~40
 * such waits that was most of the suite's 13 minutes. No test plays it.
 */
async function createPage(path?: string, options?: Parameters<typeof createNuxtPage>[1]) {
  const page = await createNuxtPage(undefined, options);
  await page.route('**/*.mp4', route => route.abort());
  // test-utils' own goto waits for hydration with this value.
  if (path) await page.goto(url(path), options?.javaScriptEnabled === false ? {} : { waitUntil: 'hydration' as never });
  return page;
}

const hasGatewayKey = Boolean(
  process.env.NUXT_AI_GATEWAY_API_KEY || process.env.AI_GATEWAY_API_KEY,
);

const POEM_ACTIONS = [
  'Herschrijf dit gedicht',
  'Kopieer link',
  'Kopieer gedicht',
  'Opslaan als PDF',
  'Deel op WhatsApp',
  'Verstuur via e-mail',
  'Deel op Facebook',
];

const VALID_POEM_REQUEST = {
  name: 'Sanne',
  style: 'funny',
  rhymeScheme: 'AABB',
  lines: 8,
  language: 'dutch',
};

/** A poem as the UI message stream that /api/poem/generate sends. */
function poemStream(poem: string, share?: Record<string, string>): string {
  return poem.match(/\S+\s*/g)!
    .map(delta => `data: ${JSON.stringify({ type: 'text-delta', id: '0', delta })}\n\n`)
    .join('')
    + (share ? `data: ${JSON.stringify({ type: 'data-share', data: share })}\n\n` : '')
    + 'data: [DONE]\n\n';
}

/** A share as the server signs it. The page only passes it on; mocked routes do not check it. */
const TEST_SHARE = { s: 'dGVzdA', l: 'nl', d: 'ZGlnZXN0', sig: 'c2ln' };

type TestPage = Awaited<ReturnType<typeof createPage>>;

/** Payments work in the browser, whatever Dodo key this environment has, and every tier is on sale. */
function paymentsWork(page: TestPage, available = true) {
  return page.route('**/api/payment/status', route =>
    route.fulfill({ json: { available, tiers: ['drie', 'gezin', 'familie'] } }));
}

/** A signed access cookie value for a buyer of `tier`. */
function buyerToken(paymentId: string, tier: TierId = 'gezin') {
  return signAccessToken({ paymentId, tier, expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 }, 'e2e-access-secret');
}

// The endpoint rate-limits per client IP, so each case uses its own IP.
function postPoem(body: unknown, ip: string) {
  return fetch('/api/poem/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip },
    body: JSON.stringify(body),
  });
}

describe('contact page', () => {
  it('renders the form with its own canonical address, linked from the footer', async () => {
    const res = await fetch('/contact');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('<link rel="canonical" href="https://sintgpt.com/contact"');
    expect(html).toMatch(/<h1[^>]*>\s*Neem contact op\s*<\/h1>/);
    expect(html).toContain('name="website"');
    expect(await (await fetch('/')).text()).toContain('href="/contact"');
    expect(await (await fetch('/lootjes')).text()).toContain('href="/contact"');
  });

  it('answers 503 without Turnstile and Telegram, so the page offers the e-mail address', async () => {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'help', email: 'a@b.nl', message: 'Een testbericht.', locale: 'nl', elapsed: 30, turnstile: 'x' }),
    });
    expect(res.status).toBe(503);
    expect((await res.json()).data.reason).toBe('unavailable');
  });
});

describe('privacy and terms', () => {
  it.each([
    ['/privacy', 'Privacyverklaring'],
    ['/voorwaarden', 'Voorwaarden'],
  ])('renders %s with its own canonical address', async (path, title) => {
    const res = await fetch(path);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain(`<link rel="canonical" href="https://sintgpt.com${path}"`);
    expect(html).toMatch(new RegExp(`<h1[^>]*>\\s*${title}\\s*</h1>`));
  });

  it('states the same limits and storage times as the code', async () => {
    const privacy = await (await fetch('/privacy')).text();
    const terms = await (await fetch('/voorwaarden')).text();
    expect(privacy).toContain('90 dagen');
    expect(privacy).toContain('24 uur');
    expect(privacy).toContain('100 gedichten per dag');
    expect(terms).toContain('1 gratis gedicht per 24 uur');
    expect(terms).toContain('1 keer gratis laten herschrijven met een wens');
    expect(privacy).toContain('hooguit 2 uur bij Cloudflare (Workers KV)');
    expect(terms).toContain('100 gedichten per 24 uur');
    expect(terms).toContain('€4,99');
    expect(terms).toContain('€3,99');
    expect(terms).toContain('€12,99');
    expect(terms).toContain('tot en met de eerstvolgende pakjesavond');
    expect(privacy).toContain('verdwijnt na pakjesavond');
  });

  it('names the contact form, Telegram and Turnstile', async () => {
    const privacy = await (await fetch('/privacy')).text();
    expect(privacy).toContain('contactformulier');
    expect(privacy).toContain('Telegram');
    expect(privacy).toContain('Cloudflare Turnstile');
    expect(privacy).toContain('hooguit 5 berichten per dag');
  });

  it('links to both from the home page and the blog', async () => {
    for (const path of ['/', '/blog']) {
      const html = await (await fetch(path)).text();
      expect(html, path).toContain('href="/privacy"');
      expect(html, path).toContain('href="/voorwaarden"');
    }
  });

  it('shows no cookie notice, because the site sets no tracking cookies', async () => {
    const page = await createPage('/');
    await page.mouse.wheel(0, 800);
    await page.waitForTimeout(500);
    expect(await page.getByText('Pepernootje erbij?').count()).toBe(0);
    await page.close();
  }, 30_000);
});

describe('pages', () => {
  it('renders the home page with SEO meta', async () => {
    const res = await fetch('/');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('SintGPT');
    expect(html).toMatch(/<meta name="description" content="[^"]+"/);
  });

  it.each([
    '/blog',
    '/blog/sinterklaas-tradities',
    '/blog/grappige-sinterklaasgedichten-tips',
    '/blog/hoe-schrijf-je-het-perfecte-sinterklaasgedicht',
  ])('renders %s', async (path) => {
    const res = await fetch(path);
    expect(res.status).toBe(200);
  });
});

describe('Open Graph images', () => {
  it.each([
    ['/', 'home'],
    ['/blog', 'blog'],
    ['/blog/sinterklaas-tradities', 'blog-sinterklaas-tradities'],
    ['/blog/grappige-sinterklaasgedichten-tips', 'blog-grappige-sinterklaasgedichten-tips'],
    ['/blog/hoe-schrijf-je-het-perfecte-sinterklaasgedicht', 'blog-hoe-schrijf-je-het-perfecte-sinterklaasgedicht'],
  ])('%s has absolute, sized og:image tags for %s.jpg', async (path, name) => {
    const html = await (await fetch(path)).text();
    const meta = (prop: string) =>
      html.match(new RegExp(`<meta (?:property|name)="${prop}" content="([^"]*)"`))?.[1];

    const image = meta('og:image');
    expect(image).toMatch(new RegExp(`^https?://[^/]+/og/${name}\\.jpg$`));
    expect(meta('og:image:width')).toBe('1200');
    expect(meta('og:image:height')).toBe('630');
    expect(meta('og:image:type')).toBe('image/jpeg');
    expect(meta('og:image:alt')).toBeTruthy();
    expect(meta('og:url')).toMatch(/^https?:\/\//);
    expect(meta('twitter:card')).toBe('summary_large_image');
    expect(meta('twitter:image')).toBe(image);

    // The image itself is served as a 1200x630 JPEG.
    const res = await fetch(new URL(image!).pathname);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('image/jpeg');
  });

  it('has a generated image for every spec', async () => {
    for (const { name } of OG_IMAGES) {
      expect((await fetch(`/og/${name}.jpg`)).status).toBe(200);
    }
  });
});

describe('poem history drawer (mobile)', () => {
  it('lists saved poems, opens one and deletes one', async () => {
    const page = await createPage('/', { viewport: { width: 390, height: 844 } });

    // Seed two poems plus one corrupt entry that must be ignored.
    await page.evaluate(() => {
      localStorage.setItem('sintgpt-poem-history', JSON.stringify([
        {
          id: 'a', recipient: 'Sanne', createdAt: Date.now(),
          poem: 'Lieve Sanne, hier is je gedicht,\nmet een glimlach op je gezicht.',
          style: 'funny', rhymeScheme: 'AABB', language: 'dutch', lines: 8,
        },
        {
          id: 'b', recipient: 'oma Truus', createdAt: Date.now() - 60_000,
          poem: 'Lieve oma Truus, u bent een schat,\nmet appeltaart en een warme kat.',
          style: 'classic', rhymeScheme: 'ABAB', language: 'dutch', lines: 8,
        },
        { broken: true },
      ]));
    });
    await page.goto(url('/'), { waitUntil: 'hydration' });

    const trigger = page.getByRole('button', { name: 'Mijn gedichten' });
    await expect(trigger.textContent()).resolves.toContain('2');
    await trigger.click();

    const drawer = page.getByRole('dialog');
    await drawer.getByText('Gedicht voor Sanne').waitFor();
    await drawer.getByText('Gedicht voor oma Truus').click();

    // The drawer closes and the older poem is shown under its own title.
    await drawer.waitFor({ state: 'detached' });
    await page.getByRole('heading', { name: 'Gedicht voor oma Truus' }).waitFor();
    await page.getByText('Lieve oma Truus, u bent een schat').first().waitFor();

    // Delete Sanne from the drawer.
    await page.getByRole('button', { name: /Eerdere gedichten/ }).click();
    await page.getByRole('button', { name: 'Verwijder gedicht voor Sanne' }).click();
    await page.getByRole('dialog').getByText('Gedicht voor Sanne').waitFor({ state: 'detached' });

    const stored = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('sintgpt-poem-history') || '[]'));
    expect(stored.map((e: { recipient: string }) => e.recipient)).toEqual(['oma Truus']);

    // No horizontal scrolling on a phone-sized screen.
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);

    await page.close();
  });
});

describe('home page UI', () => {
  it('loads the Sinterklaas font pairing on the right elements', async () => {
    const page = await createPage('/');
    const fonts = await page.evaluate(async () => {
      await document.fonts.ready;
      const family = (selector: string) =>
        getComputedStyle(document.querySelector(selector)!).fontFamily.split(',')[0]!.replace(/"/g, '');
      return {
        heading: family('h1 span'),
        label: family('label[for="poem-name"]'),
        poem: family('.poem-text'),
        loaded: [
          document.fonts.check('700 32px Texturina'),
          document.fonts.check('400 20px Alegreya'),
          document.fonts.check('700 16px "Alegreya Sans"'),
        ],
      };
    });
    expect(fonts).toEqual({
      heading: 'Texturina',
      label: 'Alegreya Sans',
      poem: 'Alegreya',
      loaded: [true, true, true],
    });
    await page.close();
  });

  it('explains an empty name on submit and moves focus to the field', async () => {
    const page = await createPage('/');
    await page.locator('#poem-form button[type=submit]').click();
    await page.locator('#poem-name-error').waitFor();
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('poem-name');
    expect(await page.locator('#poem-name').getAttribute('aria-invalid')).toBe('true');
    await page.close();
  });

  it('reveals a streamed poem gradually and offers sharing when it is done', async () => {
    const lines = Array.from({ length: 12 }, (_, i) => `Regel ${i + 1} van het gedicht voor de Sint,`);
    const poem = lines.join('\n');
    const words = poem.match(/\S+\s*/g)!;
    const sse = words
      .map(delta => `data: ${JSON.stringify({ type: 'text-delta', id: '0', delta })}\n\n`)
      .join('') + 'data: [DONE]\n\n';

    const page = await createPage();
    await page.route('**/api/poem/generate', route =>
      route.fulfill({ status: 200, contentType: 'text/event-stream', body: sse }));
    await page.goto(url('/'), { waitUntil: 'networkidle' });

    await page.fill('#poem-name', 'Oma Truus');
    await page.locator('#poem-form button[type=submit]').click();

    // While it streams: partial text, a caret and no share buttons yet.
    const text = page.locator('.poem-letter .poem-text');
    await page.locator('.stream-caret').waitFor();
    const partial = await text.innerText();
    expect(partial.length).toBeLessThan(poem.length);
    expect(poem.startsWith(partial)).toBe(true);
    expect(await page.getByRole('button', { name: 'Kopieer gedicht' }).count()).toBe(0);

    // When it is done: the whole poem, no caret, sharing available.
    await page.getByRole('button', { name: 'Kopieer gedicht' }).waitFor({ timeout: 15_000 });
    expect(await page.locator('.stream-caret').count()).toBe(0);
    expect((await text.innerText()).trim()).toBe(poem);
    await page.close();
  }, 30_000);

  it('shows a sample poem without any action before the visitor has one', async () => {
    const page = await createPage('/');
    await page.getByRole('heading', { name: 'Gedicht voor Peter' }).waitFor();
    await page.getByText('Beste Peter, wat zien we jou toch graag').waitFor();
    for (const name of [...POEM_ACTIONS, 'Nieuw gedicht']) {
      expect(await page.getByRole('button', { name }).count(), name).toBe(0);
    }
    await page.close();
  });
});

describe('poem form', () => {
  it('sends every detail from the three steps', async () => {
    const page = await createPage();
    let sent: Record<string, unknown> | undefined;
    await page.route('**/api/poem/generate', (route) => {
      sent = route.request().postDataJSON();
      return route.fulfill({ status: 200, contentType: 'text/event-stream', body: poemStream('Een gedicht.') });
    });
    await page.goto(url('/'), { waitUntil: 'networkidle' });

    await page.fill('#poem-name', 'Opa Kees');
    await page.fill('#poem-present', 'een hengel');
    await page.getByRole('radio', { name: 'Houd het geheim' }).check();
    await page.fill('#poem-facts', 'Vist elke zondag.');
    await page.getByRole('radio', { name: /Roast/ }).check();
    await page.getByRole('radio', { name: 'ABAB' }).check();
    await page.getByRole('radio', { name: /Engels/ }).check();
    await page.locator('#poem-lines').fill('16');
    await page.locator('.form-more summary').click();
    await page.fill('#poem-written-by', 'zijn kleinzoon');
    await page.fill('#poem-audience', 'familie');
    await page.locator('#poem-form button[type=submit]').click();

    await expect.poll(() => sent).toBeDefined();
    expect(sent).toEqual({
      name: 'Opa Kees',
      present: 'een hengel',
      revealPresent: false,
      funFacts: 'Vist elke zondag.',
      writtenBy: 'zijn kleinzoon',
      writtenForAudience: 'familie',
      style: 'roast',
      rhymeScheme: 'ABAB',
      lines: 16,
      language: 'english',
      greeting: true,
      regenerate: false,
      // One ID per poem, so a retry after a dropped connection does not count.
      attempt: expect.stringMatching(/^[A-Za-z0-9-]{8,64}$/),
      retry: false,
    });
    await page.close();
  }, 30_000);

  it('asks again with the same attempt when the connection drops, and shows the poem', async () => {
    const page = await createPage();
    const sent: Record<string, unknown>[] = [];
    await page.route('**/api/poem/generate', (route) => {
      sent.push(route.request().postDataJSON());
      return sent.length === 1
        ? route.abort('internetdisconnected')
        : route.fulfill({ status: 200, contentType: 'text/event-stream', body: poemStream('Het tweede gedicht.') });
    });
    await page.goto(url('/'), { waitUntil: 'networkidle' });
    await page.fill('#poem-name', 'Sanne');
    await page.locator('#poem-form button[type=submit]').click();

    await page.getByText('De verbinding viel even weg').waitFor();
    await page.getByText('Het tweede gedicht.').waitFor();
    expect(sent).toHaveLength(2);
    expect(sent[1]!.attempt).toBe(sent[0]!.attempt);
    expect([sent[0]!.retry, sent[1]!.retry]).toEqual([false, true]);
    expect(await page.getByText('De verbinding viel even weg').count()).toBe(0);
    await page.close();
  }, 30_000);

  it('stops after 2 retries, and the next try is a retry of the same poem', async () => {
    const page = await createPage();
    const sent: Record<string, unknown>[] = [];
    await page.route('**/api/poem/generate', (route) => {
      sent.push(route.request().postDataJSON());
      return sent.length <= 3
        ? route.abort('internetdisconnected')
        : route.fulfill({ status: 200, contentType: 'text/event-stream', body: poemStream('Eindelijk een gedicht.') });
    });
    await page.goto(url('/'), { waitUntil: 'networkidle' });
    await page.fill('#poem-name', 'Sanne');
    await page.locator('#poem-form button[type=submit]').click();

    await page.getByText('De verbinding viel weg. Controleer je internet').waitFor({ timeout: 15_000 });
    expect(sent).toHaveLength(3);
    await page.locator('#poem-form button[type=submit]').click();
    await page.getByText('Eindelijk een gedicht.').waitFor();
    expect(new Set(sent.map(body => body.attempt)).size).toBe(1);
    expect(sent.map(body => body.retry)).toEqual([false, true, true, true]);
    await page.close();
  }, 40_000);

  it('adds "Lieve <name>," and "Van Sint & Piet" unless the visitor turns them off', async () => {
    const page = await createPage();
    let sent: Record<string, unknown> | undefined;
    await page.route('**/api/poem/generate', (route) => {
      sent = route.request().postDataJSON();
      return route.fulfill({ status: 200, contentType: 'text/event-stream', body: poemStream('Lieve Patrick,\n\nEen gedicht.\n\nVan Sint & Piet') });
    });
    await page.goto(url('/'), { waitUntil: 'networkidle' });

    const toggle = page.getByRole('switch', { name: 'Aanhef en ondertekening' });
    expect(await toggle.isChecked()).toBe(true);
    await page.fill('#poem-name', 'Patrick');
    expect(await page.locator('#poem-greeting-help').textContent()).toContain('Lieve Patrick, … Van Sint & Piet');

    await page.locator('#poem-form button[type=submit]').click();
    await expect.poll(() => sent?.greeting).toBe(true);
    await page.locator('.poem-signature', { hasText: 'Van Sint & Piet' }).waitFor();

    // Off: the next poem is only the poem.
    await toggle.press('Space');
    expect(await toggle.isChecked()).toBe(false);
    expect(await page.locator('#poem-greeting-help').textContent()).toContain('zonder aanhef en ondertekening');
    await page.close();
  }, 30_000);

  it('uses real radio buttons that work with the keyboard', async () => {
    const page = await createPage('/');
    // The present choice shows the radio circles themselves.
    const reveal = page.getByRole('radio', { name: 'Noem het cadeau' });
    expect(await reveal.isChecked()).toBe(true);
    expect(await reveal.evaluate(el => getComputedStyle(el).opacity)).toBe('1');

    // The style buttons are radios too: arrow keys move the choice, in the
    // order the buttons show (Grappig, Pikant, Roast on the first row).
    const funny = page.getByRole('radio', { name: /Grappig/ });
    await funny.focus();
    await page.keyboard.press('ArrowRight');
    expect(await page.getByRole('radio', { name: /Pikant/ }).isChecked()).toBe(true);
    expect(await funny.isChecked()).toBe(false);
    await page.close();
  });

  it('shows the poem styles with their emoji, in two rows of three', async () => {
    const page = await createPage('/');
    const styles = [
      ['😄', 'Grappig'], ['🌶️', 'Pikant'], ['🔥', 'Roast'],
      ['📜', 'Klassiek'], ['😏', 'Ironisch'], ['🎩', 'Ouderwets'],
    ];
    const labels = page.locator('.style-choices label');
    for (const [index, [emoji, name]] of styles.entries()) {
      // The emoji shows, but the radio is called by its name only.
      expect(await page.getByRole('radio', { name, exact: true }).count(), name).toBe(1);
      expect((await labels.nth(index).innerText()).replace(/\s+/g, ' ').trim()).toBe(`${emoji} ${name}`);
    }
    await page.close();
  });

  it('fixes a limerick at 5 lines and brings the chosen length back after it', async () => {
    const page = await createPage('/');
    const slider = page.locator('#poem-lines');
    expect(await slider.getAttribute('max')).toBe('40');
    await slider.fill('20');
    await page.getByRole('radio', { name: 'Limerick' }).check();
    expect(await slider.isDisabled()).toBe(true);
    expect(await slider.inputValue()).toBe('5');
    await page.getByText('Limericks zijn altijd 5 regels').waitFor();
    await page.getByRole('radio', { name: 'AABB' }).check();
    expect(await slider.isEnabled()).toBe(true);
    expect(await slider.inputValue()).toBe('20');
    await page.close();
  });
});

describe('poem area states', () => {
  async function submitWith(response: { status: number; json?: unknown; body?: string }) {
    const page = await createPage();
    await page.route('**/api/poem/generate', route => route.fulfill(
      response.json
        ? { status: response.status, json: response.json }
        : { status: response.status, contentType: 'text/event-stream', body: response.body },
    ));
    await page.goto(url('/'), { waitUntil: 'networkidle' });
    await page.fill('#poem-name', 'Oma Truus');
    await page.locator('#poem-form button[type=submit]').click();
    return page;
  }

  it('offers to keep writing when the server limit is reached', async () => {
    // The page then tries a preview; the Node build has no KV, so it shows the limit.
    const page = await submitWith({ status: 429, json: { statusMessage: 'limit' } });
    await page.getByRole('heading', { name: 'Het gratis gedicht is al gebruikt' }).waitFor();
    await page.getByText('Op deze internetverbinding is de afgelopen 24 uur al een gratis gedicht geschreven.').waitFor();
    await page.getByRole('button', { name: 'Kies hoe je verder schrijft' }).click();
    await page.locator('dialog[open]').waitFor();
    expect(await page.getByRole('button', { name: 'Herschrijf dit gedicht' }).count()).toBe(0);
    await page.close();
  }, 30_000);

  it('asks to wait after a quick repeat, without the upgrade offer', async () => {
    const page = await submitWith({
      status: 429,
      json: { statusCode: 429, data: { reason: 'debounce', retryAfterSeconds: 7 } },
    });
    await page.getByText('over 7 seconden').waitFor();
    expect(await page.getByRole('heading', { name: /Je gratis gedicht is klaar/ }).count()).toBe(0);
    await page.close();
  }, 30_000);

  it('tells a buyer about the daily maximum, without the upgrade offer', async () => {
    const page = await submitWith({
      status: 429,
      json: { statusCode: 429, data: { reason: 'fair-use', retryAfterSeconds: 3600 } },
    });
    await page.getByText('100 gedichten gemaakt').waitFor();
    expect(await page.getByRole('button', { name: /Schrijf verder voor/ }).count()).toBe(0);
    await page.close();
  }, 30_000);

  it('explains a failure and hides the actions', async () => {
    const page = await submitWith({ status: 500, json: { statusMessage: 'Gateway is stuk' } });
    await page.getByText('Gateway is stuk').waitFor();
    expect(await page.getByRole('button', { name: 'Kopieer gedicht' }).count()).toBe(0);
    // The visitor can try again: the form is enabled.
    expect(await page.locator('#poem-name').isEnabled()).toBe(true);
    await page.close();
  }, 30_000);

  it('shows an error sent inside the stream instead of an empty poem', async () => {
    const body = `data: ${JSON.stringify({ type: 'error', errorText: 'Model overloaded' })}\n\ndata: [DONE]\n\n`;
    const page = await submitWith({ status: 200, body });
    await page.getByText('Model overloaded').waitFor();
    expect(await page.locator('.poem-letter pre.poem-text').count()).toBe(0);
    await page.close();
  }, 30_000);

  it('saves the poem with its title and enables every action', async () => {
    const page = await submitWith({ status: 200, body: poemStream('Lieve oma Truus,\nu bent een schat.') });
    await page.getByRole('heading', { name: 'Gedicht voor Oma Truus' }).waitFor();
    await page.getByRole('button', { name: 'Kopieer gedicht' }).waitFor({ timeout: 15_000 });
    // No share link without a signed poem, so that button is gone.
    for (const name of POEM_ACTIONS.filter(n => n !== 'Kopieer link')) {
      expect(await page.getByRole('button', { name }).isEnabled(), name).toBe(true);
    }
    // The free poem is complete: sharing, copying and the PDF all work for it.
    await page.getByText('Dit gratis gedicht is helemaal van jou').waitFor();
    const history = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('sintgpt-poem-history') || '[]'));
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ recipient: 'Oma Truus', style: 'funny', lines: 12 });
    await page.close();
  }, 30_000);
});

describe('Herschrijf dit gedicht', () => {
  async function paidPage() {
    const page = await createPage();
    const token = await buyerToken('pay_x');
    await page.context().addCookies([{ name: 'sintgpt-access', value: token, url: url('/') }]);
    return page;
  }

  it('asks the server for a rewrite with the details of the poem on screen', async () => {
    const page = await paidPage();
    const sent: Array<Record<string, unknown>> = [];
    await page.route('**/api/poem/generate', (route) => {
      sent.push(route.request().postDataJSON());
      const poem = sent.length === 1 ? 'Eerste versie voor Sanne.' : 'Tweede versie voor Sanne.';
      return route.fulfill({ status: 200, contentType: 'text/event-stream', body: poemStream(poem) });
    });
    await page.goto(url('/'), { waitUntil: 'networkidle' });
    await page.getByText('Je schrijft zoveel gedichten als je wilt.').waitFor();

    await page.fill('#poem-name', 'Sanne');
    await page.getByRole('radio', { name: /Klassiek/ }).check();
    await page.locator('#poem-form button[type=submit]').click();
    await page.getByText('Eerste versie voor Sanne.').waitFor({ timeout: 15_000 });

    // Changing the form afterwards does not change the rewrite.
    await page.fill('#poem-name', 'Iemand anders');
    await page.getByRole('radio', { name: /Roast/ }).check();
    await page.getByRole('button', { name: 'Herschrijf dit gedicht' }).click();
    await page.getByText('Tweede versie voor Sanne.').waitFor({ timeout: 15_000 });

    expect(sent).toHaveLength(2);
    expect(sent[0]).toMatchObject({ name: 'Sanne', style: 'classic', regenerate: false });
    expect(sent[1]).toMatchObject({ name: 'Sanne', style: 'classic', regenerate: true });
    await page.getByRole('heading', { name: 'Gedicht voor Sanne' }).waitFor();

    // Both versions are in the history.
    const history = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('sintgpt-poem-history') || '[]'));
    expect(history.map((e: { poem: string }) => e.poem)).toEqual([
      'Tweede versie voor Sanne.',
      'Eerste versie voor Sanne.',
    ]);
    await page.close();
  }, 45_000);

  it('opens the payment window after the free poem, without asking the server', async () => {
    const page = await createPage();
    await paymentsWork(page);
    let calls = 0;
    await page.route('**/api/poem/generate', (route) => {
      calls++;
      return route.fulfill({ status: 200, contentType: 'text/event-stream', body: poemStream('Gratis gedicht.') });
    });
    await page.goto(url('/'), { waitUntil: 'networkidle' });
    await page.fill('#poem-name', 'Sanne');
    await page.locator('#poem-form button[type=submit]').click();
    await page.getByText('Gratis gedicht.').waitFor({ timeout: 15_000 });

    await page.getByRole('button', { name: 'Herschrijf dit gedicht' }).click();
    await page.locator('dialog[open] .pay-button').waitFor();
    expect(calls).toBe(1);
    await page.close();
  }, 30_000);

  it('is not offered for a poem from the history, which has no details', async () => {
    const page = await createPage();
    await page.addInitScript(() => {
      localStorage.setItem('sintgpt-poem-history', JSON.stringify([{
        id: 'a', recipient: 'Sanne', createdAt: Date.now(),
        poem: 'Lieve Sanne, hier is je gedicht.',
        style: 'funny', rhymeScheme: 'AABB', language: 'dutch', lines: 8,
      }]));
    });
    await page.goto(url('/'), { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Eerdere gedichten/ }).click();
    await page.getByRole('dialog').getByText('Gedicht voor Sanne').click();
    await page.getByRole('heading', { name: 'Gedicht voor Sanne' }).waitFor();
    expect(await page.getByRole('button', { name: 'Herschrijf dit gedicht' }).count()).toBe(0);
    expect(await page.getByRole('button', { name: 'Kopieer gedicht' }).isEnabled()).toBe(true);
    await page.close();
  }, 30_000);
});

describe('home page layout', () => {
  it.each([320, 390, 768, 1280])('has no horizontal scrolling at %ipx wide', async (width) => {
    const page = await createPage();
    await page.setViewportSize({ width, height: 900 });
    await page.goto(url('/'), { waitUntil: 'networkidle' });
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await page.close();
  }, 30_000);

  it('loads the hero photo with a description', async () => {
    const page = await createPage('/');
    const photo = page.locator('figure img');
    await photo.waitFor();
    expect(await photo.getAttribute('alt')).toBeTruthy();
    await expect.poll(() => photo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth)).toBeGreaterThan(0);
    await page.close();
  });

  it('scrolls to the form and the questions from the hero buttons', async () => {
    const page = await createPage('/');
    await page.getByRole('button', { name: 'Begin met rijmen' }).click();
    await expect.poll(() => page.evaluate(() =>
      Math.round(document.getElementById('poem-form')!.getBoundingClientRect().top))).toBeLessThan(80);
    await page.getByRole('button', { name: 'Hoe werkt het?' }).click();
    await expect.poll(() => page.evaluate(() =>
      Math.round(document.getElementById('faq-section')!.getBoundingClientRect().top))).toBeLessThan(80);
    await page.close();
  });

  it('gives every button an accessible name', async () => {
    const page = await createPage('/');
    const unnamed = await page.evaluate(() =>
      [...document.querySelectorAll('button, a[href], input, select, textarea')]
        .filter((el) => {
          const element = el as HTMLElement;
          if (element.closest('[aria-hidden="true"]') || element.getAttribute('type') === 'hidden') return false;
          const labelled = element.getAttribute('aria-label') || element.getAttribute('aria-labelledby')
            || (element.id && document.querySelector(`label[for="${element.id}"]`))
            || element.closest('label') || element.textContent?.trim() || element.getAttribute('title');
          return !labelled;
        })
        .map(el => el.outerHTML.slice(0, 80)));
    expect(unnamed).toEqual([]);
    await page.close();
  });
});

describe('comments in the page', () => {
  it('sends HTML without comments, apart from the markers Vue needs', async () => {
    const html = await (await fetch('/')).text();
    const comments = (html.match(/<!--[\s\S]*?-->/g) ?? []).filter(c => !VUE_MARKER.test(c));
    expect(comments).toEqual([]);
  });
});

describe('honest claims', () => {
  it('shows no invented rating, counter or testimonials and the real price', async () => {
    const html = await (await fetch('/')).text();
    expect(html).not.toContain('aggregateRating');
    expect(html).not.toContain('28.912');
    expect(html).not.toContain('blije hulpsinterklazen');
    expect(html).toMatch(/"price":\s*"4\.99"/);
  });
});

describe('restoring access', () => {
  async function openPaymentModal() {
    const page = await createPage();
    await paymentsWork(page);
    await page.addInitScript(() => {
      localStorage.setItem('sinterklaas-payment', JSON.stringify({ poemCount: 1 }));
    });
    await page.goto(url('/'), { waitUntil: 'networkidle' });
    await page.fill('#poem-name', 'Oma Truus');
    await page.locator('#poem-form button[type=submit]').click();
    await page.locator('dialog[open] .restore summary').click();
    return page;
  }

  it('keeps the pay button reachable on a short phone screen', async () => {
    const page = await createPage();
    await page.setViewportSize({ width: 320, height: 568 });
    await paymentsWork(page);
    await page.addInitScript(() => {
      localStorage.setItem('sinterklaas-payment', JSON.stringify({ poemCount: 1 }));
    });
    await page.goto(url('/'), { waitUntil: 'networkidle' });
    await page.fill('#poem-name', 'Oma');
    await page.locator('#poem-form button[type=submit]').click();
    const button = page.locator('dialog[open] .pay-button');
    await button.scrollIntoViewIfNeeded();
    const box = (await button.boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(568);
    await page.close();
  }, 30_000);

  it('rejects an invalid ID without asking the server', async () => {
    const page = await openPaymentModal();
    let calls = 0;
    await page.route('**/api/payment/claim-access', (route) => {
      calls++;
      return route.abort();
    });
    await page.fill('#restore-payment-id', 'hallo');
    await page.locator('.restore-submit').click();
    await page.locator('.restore-error').waitFor();
    expect(calls).toBe(0);
    await page.close();
  }, 30_000);

  it('explains when the server finds no payment', async () => {
    const page = await openPaymentModal();
    await page.route('**/api/payment/claim-access', route =>
      route.fulfill({ json: { status: 'denied' } }));
    await page.fill('#restore-payment-id', 'pay_unknown');
    await page.locator('.restore-submit').click();
    await page.locator('.restore-error').waitFor();
    expect(await page.locator('dialog[open]').count()).toBe(1);
    await page.close();
  }, 30_000);

  it('closes the window and confirms when the payment is valid', async () => {
    const page = await openPaymentModal();
    await page.route('**/api/payment/claim-access', route =>
      route.fulfill({ json: { status: 'granted' } }));
    await page.fill('#restore-payment-id', 'pay_valid');
    await page.locator('.restore-submit').click();
    await page.getByText('Gelukt! Je kunt verder schrijven').waitFor();
    expect(await page.locator('dialog[open]').count()).toBe(0);
    await page.close();
  }, 30_000);
});

describe('when payments do not work', () => {
  async function pageAfterFreePoem(available: boolean) {
    const page = await createPage();
    await paymentsWork(page, available);
    await page.addInitScript(() =>
      localStorage.setItem('sinterklaas-payment', JSON.stringify({ poemCount: 1 })));
    return page;
  }

  it('shows a clear message instead of a payment error', async () => {
    const page = await pageAfterFreePoem(true);
    await page.route('**/api/payment/create-checkout', route => route.fulfill({
      status: 503,
      json: { statusCode: 503, statusMessage: 'Payments are not available right now', data: { code: 'payments_unavailable' } },
    }));
    await page.goto(url('/'), { waitUntil: 'networkidle' });
    await page.fill('#poem-name', 'Oma Truus');
    await page.locator('#poem-form button[type=submit]').click();
    await page.locator('dialog[open] .pay-button').click();

    await page.locator('dialog[open] .unavailable-title').getByText('Betalen lukt nu even niet').waitFor();
    expect(await page.locator('.error-banner').count()).toBe(0);
    expect(await page.getByText(/Payment API|403/).count()).toBe(0);

    // The visitor can go on with a free poem.
    await page.getByRole('button', { name: 'Verder met een gratis gedicht' }).click();
    await page.locator('dialog[open]').waitFor({ state: 'detached' });
    await page.close();
  }, 30_000);

  it('lets visitors make free poems up to the daily limit', async () => {
    const page = await pageAfterFreePoem(false);
    await page.route('**/api/poem/generate', route => route.fulfill({
      status: 200, contentType: 'text/event-stream', body: poemStream('Nog een gratis gedicht.'),
    }));
    await page.goto(url('/'), { waitUntil: 'networkidle' });
    await page.fill('#poem-name', 'Oma Truus');
    await page.locator('#poem-form button[type=submit]').click();

    await page.getByText('Nog een gratis gedicht.').waitFor({ timeout: 15_000 });
    expect(await page.locator('dialog[open]').count()).toBe(0);
    await page.locator('#poem-form').getByText('vandaag tot 3 gedichten gratis maken').waitFor();
    await page.close();
  }, 30_000);

  it('does not offer payment at the daily limit', async () => {
    const page = await pageAfterFreePoem(false);
    await page.route('**/api/poem/generate', route => route.fulfill({
      status: 429, json: { statusCode: 429, data: { reason: 'limit', retryAfterSeconds: 3600 } },
    }));
    await page.goto(url('/'), { waitUntil: 'networkidle' });
    await page.fill('#poem-name', 'Oma Truus');
    await page.locator('#poem-form button[type=submit]').click();

    await page.getByRole('heading', { name: 'Je hebt de gratis gedichten van vandaag gebruikt' }).waitFor();
    expect(await page.getByRole('button', { name: /Schrijf verder voor/ }).count()).toBe(0);
    await page.close();
  }, 30_000);

  it('reports whether a checkout can work, without caching', async () => {
    const res = await fetch('/api/payment/status');
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(typeof ((await res.json()) as { available: unknown }).available).toBe('boolean');
  });
});

describe('SEO', () => {
  it('gives the home page one canonical address, a short title and one h1', async () => {
    const html = await (await fetch('/')).text();
    expect(html.match(/rel="canonical"/g)).toHaveLength(1);
    expect(html).toContain('<link rel="canonical" href="https://sintgpt.com/"');
    expect(html).not.toContain('hreflang');
    expect(html).not.toContain('name="keywords"');
    const title = html.match(/<title>([^<]*)<\/title>/)![1]!;
    expect(title.length).toBeLessThanOrEqual(60);
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toContain('href="/blog"');
  });

  it.each([
    'hoe-schrijf-je-het-perfecte-sinterklaasgedicht',
    'grappige-sinterklaasgedichten-tips',
    'sinterklaas-tradities',
  ])('gives the article %s one h1 and its own canonical address', async (slug) => {
    const html = await (await fetch(`/blog/${slug}`)).text();
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toContain(`<link rel="canonical" href="https://sintgpt.com/blog/${slug}"`);
    expect(html.match(/rel="canonical"/g)).toHaveLength(1);
  });

  it('gives each article an Article and a breadcrumb, and links to related posts and the examples', async () => {
    const html = await (await fetch('/blog/rijm-en-ritme-sinterklaasgedicht')).text();
    expect(html).toContain('"@type":"Article"');
    expect(html).toContain('"@type":"BreadcrumbList"');
    expect(html).toContain('"inLanguage":"nl"');
    expect(html).toContain('Lees ook');
    expect(html).toContain('href="/blog/hoe-schrijf-je-het-perfecte-sinterklaasgedicht"');
    expect(html).toContain('href="/voorbeelden"');
  });

  it('shows the update date when a post changed after it came out', async () => {
    const html = await (await fetch('/blog/hoe-schrijf-je-het-perfecte-sinterklaasgedicht')).text();
    expect(html).toContain('bijgewerkt');
    expect(html).toContain('datetime="2026-11-12"');
  });

  it('lists every post on /blog with its title as the link text', async () => {
    const html = await (await fetch('/blog')).text();
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toContain('"@type":"Blog"');
    expect(html).not.toContain('<img');
    expect(html).toMatch(/<a[^>]*href="\/blog\/lootjes-trekken-tips"[^>]*>Lootjes trekken voor Sinterklaas: regels, tips en valkuilen<\/a>/);
  });

  it('links the home page to blog posts', async () => {
    const html = await (await fetch('/')).text();
    expect(html).toContain('href="/blog/rijm-en-ritme-sinterklaasgedicht"');
  });

  it.each([
    ['/blog/', '/blog'],
    ['/BLOG', '/blog'],
    ['/Voorbeelden/?a=1', '/voorbeelden?a=1'],
  ])('redirects %s to %s', async (from, to) => {
    const res = await fetch(from, { redirect: 'manual' });
    expect(res.status).toBe(301);
    expect(new URL(res.headers.get('location')!).pathname + new URL(res.headers.get('location')!).search).toBe(to);
  });

  it('gives a 404 page with links that work without JavaScript', async () => {
    // A browser asks for HTML; without that, Nuxt answers with a JSON error.
    const res = await fetch('/bestaat-niet', { headers: { accept: 'text/html' } });
    expect(res.status).toBe(404);
    const html = await res.text();
    for (const path of ['/', '/voorbeelden', '/blog', '/lootjes']) expect(html).toContain(`href="${path}"`);
  });

  it('explains the lootjes page and links it to the blog', async () => {
    const html = await (await fetch('/lootjes')).text();
    expect(html).toContain('Vragen over lootjes trekken');
    expect(html).toContain('"@type":"FAQPage"');
    expect(html).toContain('href="/blog/lootjes-trekken-tips"');
    expect(html).toContain('og/lootjes.jpg');
  });
});

describe('poem links', () => {
  const POEM = 'Sint zag oma Truus, zo lief en zo fijn,\nzij bakt elke zondag, heel klein.\n\nHaar taart is een feest,\nvoor mens en voor beest.';

  async function shareQuery() {
    const share = await signPoemShare(POEM, 'nl', 'e2e-access-secret');
    return new URLSearchParams({ s: share.s, l: share.l, d: share.d, sig: share.sig }).toString();
  }

  it('sends apps a preview with the opening lines, without any JavaScript', async () => {
    const res = await fetch(`/gedicht?${await shareQuery()}`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toMatch(/property="og:image" content="[^"]*\/gedicht\/preview\.png\?/);
    expect(html).toContain('Sint zag oma Truus');
    expect(html).toContain('noindex');
  });

  it('draws the share image', async () => {
    const res = await fetch(`/gedicht/preview.png?${await shareQuery()}`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect([...bytes.slice(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]);
    expect(bytes.length).toBeLessThan(600 * 1024);
  }, 30_000);

  it('draws the Sint of the poem style in the share image, and the usual Sint for a style it did not sign', async () => {
    const share = await signPoemShare(POEM, 'nl', 'e2e-access-secret', 'roast');
    const image = async (st?: string) => {
      const query = new URLSearchParams({ s: share.s, l: share.l, d: share.d, sig: share.sig, ...(st ? { st } : {}) });
      const res = await fetch(`/gedicht/preview.png?${query}`);
      expect(res.status).toBe(200);
      return Buffer.from(await res.arrayBuffer());
    };
    const usual = await image();
    const roast = await image(share.st);
    expect([...roast.subarray(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]);
    expect(roast.length).toBeLessThan(600 * 1024);
    expect(roast.equals(usual)).toBe(false);
    // Another style under the roast tag, and a made-up tag: the usual photo.
    expect((await image(share.st!.replace('roast', 'spicy'))).equals(usual)).toBe(true);
    expect((await image('roast.made-up-tag')).equals(usual)).toBe(true);

    // The page of the link hands the style to the image.
    const html = await (await fetch(`/gedicht?${new URLSearchParams({ ...share })}`)).text();
    expect(html).toMatch(/property="og:image" content="[^"]*\/gedicht\/preview\.png\?[^"]*st=roast\.[A-Za-z0-9_-]{16}/);
  }, 60_000);

  it('refuses a forged link and a forged image', async () => {
    const query = (await shareQuery()).replace(/s=[^&]+/, `s=${encodeText('Lelijke tekst')}`);
    expect((await fetch(`/gedicht?${query}`)).status).toBe(404);
    expect((await fetch(`/gedicht/preview.png?${query}`)).status).toBe(404);
  });

  it('shows the whole poem from the link', async () => {
    const page = await createPage();
    await page.goto(url(`/gedicht?${await shareQuery()}#${await encodePoem(POEM)}`), { waitUntil: 'networkidle' });
    await page.getByText('voor mens en voor beest').waitFor();
    await page.close();
  }, 30_000);

  it('hides text that does not match the signed poem', async () => {
    const page = await createPage();
    await page.goto(url(`/gedicht?${await shareQuery()}#${await encodePoem('Koop nu op evil.example')}`), { waitUntil: 'networkidle' });
    await page.getByText('niet worden gecontroleerd').waitFor();
    expect(await page.getByText('evil.example').count()).toBe(0);
    await page.close();
  }, 30_000);

  it('offers a link for a generated poem and sharing still works without one', async () => {
    const share = await signPoemShare(POEM, 'nl', 'e2e-access-secret');
    const chunks = POEM.match(/\S+\s*/g)!.map(delta => ({ type: 'text-delta', id: '0', delta }));
    const sse = [...chunks, { type: 'data-share', data: share }]
      .map(chunk => `data: ${JSON.stringify(chunk)}\n\n`).join('') + 'data: [DONE]\n\n';

    const page = await createPage();
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.route('**/api/poem/generate', route =>
      route.fulfill({ status: 200, contentType: 'text/event-stream', body: sse }));
    await page.goto(url('/'), { waitUntil: 'networkidle' });
    await page.fill('#poem-name', 'Oma Truus');
    await page.locator('#poem-form button[type=submit]').click();

    // This build has no KV, so the browser falls back to the long link.
    await page.getByRole('button', { name: 'Kopieer link' }).click({ timeout: 15_000 });
    await page.getByRole('button', { name: 'Link gekopieerd!' }).waitFor();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain('/gedicht?s=');
    expect(copied).toContain('#d');

    await page.goto(copied, { waitUntil: 'networkidle' });
    await page.getByText('voor mens en voor beest').waitFor();
    await page.close();
  }, 45_000);

  it('copies the poem as plain text and as HTML', async () => {
    const chunks = POEM.match(/\S+\s*/g)!.map(delta => ({ type: 'text-delta', id: '0', delta }));
    const sse = chunks.map(chunk => `data: ${JSON.stringify(chunk)}\n\n`).join('') + 'data: [DONE]\n\n';
    const page = await createPage();
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.route('**/api/poem/generate', route =>
      route.fulfill({ status: 200, contentType: 'text/event-stream', body: sse }));
    await page.goto(url('/'), { waitUntil: 'networkidle' });
    await page.fill('#poem-name', 'Oma Truus');
    await page.locator('#poem-form button[type=submit]').click();
    await page.getByRole('button', { name: 'Kopieer gedicht' }).click({ timeout: 15_000 });
    await page.getByRole('button', { name: 'Gekopieerd!' }).waitFor();

    const copied = await page.evaluate(async () => {
      const [item] = await navigator.clipboard.read();
      return {
        types: item!.types,
        text: await (await item!.getType('text/plain')).text(),
        html: await (await item!.getType('text/html')).text(),
      };
    });
    expect(copied.text).toBe(POEM);
    expect(copied.html).toContain('<h2>Gedicht voor Oma Truus</h2>');
    expect(copied.html).toContain('zo lief en zo fijn,<br>zij bakt');
    expect(copied.html).toContain('</p><p>Haar taart is een feest,');
    await page.close();
  }, 45_000);

  it('saves a generated poem as a PDF', async () => {
    const chunks = POEM.match(/\S+\s*/g)!.map(delta => ({ type: 'text-delta', id: '0', delta }));
    const sse = chunks.map(chunk => `data: ${JSON.stringify(chunk)}\n\n`).join('') + 'data: [DONE]\n\n';

    const page = await createPage();
    await page.route('**/api/poem/generate', route =>
      route.fulfill({ status: 200, contentType: 'text/event-stream', body: sse }));
    await page.goto(url('/'), { waitUntil: 'networkidle' });
    await page.fill('#poem-name', 'Oma Truus');
    await page.locator('#poem-form button[type=submit]').click();

    const button = page.getByRole('button', { name: 'Opslaan als PDF' });
    await button.waitFor({ timeout: 15_000 });
    await button.click();
    const dialog = page.getByRole('dialog', { name: 'Kies een ontwerp' });
    await dialog.waitFor();
    // The radio is visually hidden; people click its picture or name.
    await dialog.getByText('Schoolschrift', { exact: true }).click();
    expect(await dialog.getByRole('radio', { name: /Schoolschrift/ }).isChecked()).toBe(true);
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      dialog.getByRole('button', { name: 'PDF opslaan' }).click(),
    ]);
    expect(download.suggestedFilename()).toBe('sinterklaasgedicht-oma-truus-sintgpt.com.pdf');
    await dialog.waitFor({ state: 'hidden' });

    const stream = await download.createReadStream();
    const chunksRead: Buffer[] = [];
    for await (const chunk of stream) chunksRead.push(chunk as Buffer);
    expect(Buffer.concat(chunksRead).subarray(0, 5).toString()).toBe('%PDF-');
    await page.close();
  }, 45_000);
});

describe('short poem links', () => {
  it('answers 404 for an unknown link', async () => {
    const res = await fetch('/g/abcdefghij');
    expect(res.status).toBe(404);
  });

  it('reports that storage is not available in this build', async () => {
    const res = await fetch('/api/share/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ share: {}, poem: 'x' }),
    });
    expect(res.status).toBe(503);
  });
});

describe('paywall', () => {
  const hasDodoKey = Boolean(process.env.NUXT_DODO_PAYMENTS_API_KEY);

  async function hasAccess(cookie?: string) {
    const res = await fetch('/api/payment/check-access', {
      headers: cookie ? { cookie } : {},
    });
    return ((await res.json()) as { hasAccess: boolean }).hasAccess;
  }

  it('gives no access without a cookie', async () => {
    expect(await hasAccess()).toBe(false);
  });

  it.each([
    'sintgpt-abc=true',
    'sintgpt-access=true',
    'sintgpt-access=v1.pay_x.9999999999.deadbeef',
  ])('gives no access with the forged cookie %s', async (cookie) => {
    expect(await hasAccess(cookie)).toBe(false);
  });

  it('gives access with a correctly signed cookie', async () => {
    const token = await buyerToken('pay_x');
    expect(await hasAccess(`sintgpt-access=${token}`)).toBe(true);
  });

  it('has removed the open endpoint that handed out access', async () => {
    const res = await fetch('/api/payment/set-access-cookie', { method: 'POST' });
    expect(res.status).toBe(404);
  });

  it('rejects a malformed payment ID', async () => {
    const res = await fetch('/api/payment/claim-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId: '../../products' }),
    });
    // 503 when the environment has no Dodo key.
    expect(res.status).toBe(hasDodoKey ? 400 : 503);
  });

  it.skipIf(!hasDodoKey)('denies an unknown payment and sets no cookie', async () => {
    const res = await fetch('/api/payment/claim-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId: 'pay_doesnotexist' }),
    });
    expect(await res.json()).toEqual({ status: 'denied' });
    expect(res.headers.get('set-cookie')).toBeNull();
  }, 30_000);

  it('does not unlock the page through the old success URL', async () => {
    const page = await createPage('/?payment=success&status=succeeded');
    await page.waitForTimeout(500);
    const cookies = await page.context().cookies();
    expect(cookies.filter(c => c.name.startsWith('sintgpt-'))).toEqual([]);
    await page.close();
  });
});

describe('POST /api/webhooks/dodo-payments', () => {
  const secret = 'whsec_ZTJlLXdlYmhvb2stc2VjcmV0';
  const body = JSON.stringify({
    type: 'payment.succeeded',
    data: { payment_id: 'pay_x' },
  });

  function postWebhook(signature: string, timestamp: Date) {
    return fetch('/api/webhooks/dodo-payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'webhook-id': 'msg_1',
        'webhook-timestamp': String(Math.floor(timestamp.getTime() / 1000)),
        'webhook-signature': signature,
      },
      body,
    });
  }

  it('rejects an event without signature headers', async () => {
    const res = await fetch('/api/webhooks/dodo-payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    expect(res.status).toBe(400);
  });

  it('rejects an event with a wrong signature', async () => {
    const res = await postWebhook('v1,d3Jvbmc=', new Date());
    expect(res.status).toBe(401);
  });

  it('accepts a correctly signed event', async () => {
    const now = new Date();
    const signature = new Webhook(secret).sign('msg_1', now, body);
    const res = await postWebhook(signature, now);
    expect(res.status).toBe(200);
  });
});

describe('POST /api/poem/generate', () => {
  it('rejects an invalid request with 400', async () => {
    const res = await postPoem({ name: '' }, '10.0.0.1');
    expect(res.status).toBe(400);
  });

  it('debounces a second request from the same IP with 429 and says when to retry', async () => {
    await postPoem({ name: '' }, '10.0.0.2');
    const res = await postPoem({ name: '' }, '10.0.0.2');
    expect(res.status).toBe(429);
    expect(((await res.json()) as { data: { reason: string } }).data.reason).toBe('debounce');
    const retryAfter = Number(res.headers.get('retry-after'));
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(10);
  });

  it('allows the free poems per IP a day, also when they are invalid', async () => {
    // Each request counts before validation, so junk cannot be used to probe
    // for free. 1 a day while payments work (a private window gets nothing
    // extra), 3 while they do not. The debounce is 10 s.
    const { available } = (await (await fetch('/api/payment/status')).json()) as { available: boolean };
    const free = available ? 1 : 3;
    const ip = '10.0.0.9';
    const statuses: number[] = [];
    let last: Response | undefined;
    for (let i = 0; i <= free; i++) {
      last = await postPoem({ name: '' }, ip);
      statuses.push(last.status);
      if (i < free) await new Promise(resolve => setTimeout(resolve, 10_100));
    }
    expect(statuses).toEqual([...Array(free).fill(400), 429]);
    expect(((await last!.json()) as { data: { reason: string } }).data.reason).toBe('limit');

    // A buyer on the same connection counts per payment, not per IP.
    const token = await buyerToken('pay_same_ip');
    const buyer = await fetch('/api/poem/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip, cookie: `sintgpt-access=${token}` },
      body: JSON.stringify({ name: '' }),
    });
    expect(buyer.status).toBe(400);
  }, 60_000);

  it('does not count a retry of the same attempt after a dropped connection', async () => {
    const ip = '10.0.0.77';
    const first = await postPoem({ name: '', attempt: 'attempt-e2e-1', retry: false }, ip);
    expect(first.status).toBe(400);
    // Within the 10 s wait and over the free limit, the retry still passes.
    const retry = await postPoem({ name: '', attempt: 'attempt-e2e-1', retry: true }, ip);
    expect(retry.status).toBe(400);
    // Another attempt is a new poem: too soon, and over the free limit.
    const other = await postPoem({ name: '', attempt: 'attempt-e2e-2', retry: true }, ip);
    expect(other.status).toBe(429);
  });

  it('rejects a regenerate flag that is not a boolean', async () => {
    const res = await postPoem({ ...VALID_POEM_REQUEST, regenerate: 'yes' }, '10.0.0.4');
    expect(res.status).toBe(400);
  });

  it('counts a buyer per payment, separately from other buyers on the same IP', async () => {
    const asBuyer = async (paymentId: string) => fetch('/api/poem/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '10.0.0.5',
        cookie: `sintgpt-access=${await buyerToken(paymentId)}`,
      },
      body: JSON.stringify({ name: '' }),
    });
    expect((await asBuyer('pay_x')).status).toBe(400);
    // A fast repeat waits, like for everyone.
    const repeat = await asBuyer('pay_x');
    expect(repeat.status).toBe(429);
    expect(((await repeat.json()) as { data: { reason: string } }).data.reason).toBe('debounce');
    // Another buyer, and a free visitor, on the same IP are not affected.
    expect((await asBuyer('pay_y')).status).toBe(400);
    expect((await postPoem({ name: '' }, '10.0.0.5')).status).toBe(400);
  });

  it.skipIf(!hasGatewayKey)(
    'streams a poem from Gemini via AI Gateway',
    async () => {
      const lines = 8;
      const res = await postPoem(
        {
          name: 'Sanne',
          present: 'warme sokken',
          style: 'funny',
          rhymeScheme: 'AABB',
          lines,
          language: 'dutch',
        },
        '10.0.0.3',
      );

      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('text/event-stream');

      // Read it exactly like the browser does.
      let poem = '';
      await readPoemStream(res.body!, (delta) => {
        poem += delta;
      });
      poem = poem.trim();

      const verses = poem.split('\n').filter(l => l.trim() !== '');
      console.log(`\n--- poem (${verses.length} lines) ---\n${poem}\n---`);

      expect(poem).toMatch(/Sanne/i);
      // The model should roughly honour the requested length.
      expect(verses.length).toBeGreaterThanOrEqual(lines - 2);
      expect(verses.length).toBeLessThanOrEqual(lines + 4);
      // Guards against degenerate output (one huge rambling block).
      expect(Math.max(...verses.map(v => v.length))).toBeLessThan(160);
    },
  );
});

describe('keeping the form during payment', () => {
  it('shows the next step, keeps the form and writes the poem after paying', async () => {
    const page = await createPage();
    await paymentsWork(page);
    await page.addInitScript(() => {
      if (!sessionStorage.getItem('started')) {
        sessionStorage.setItem('started', '1');
        localStorage.setItem('sinterklaas-payment', JSON.stringify({ poemCount: 1 }));
      }
    });
    await page.route('**/api/payment/create-checkout', route =>
      route.fulfill({ json: { checkoutUrl: url('/?payment_id=pay_ok&status=succeeded') } }));
    await page.route('**/api/payment/claim-access', route =>
      route.fulfill({ json: { status: 'granted' } }));
    // The check on page load left before the claim set the cookie, and answers
    // after it: its "no access" must not take the payment away again.
    await page.route('**/api/payment/check-access', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      return route.continue();
    });
    const requests: Record<string, unknown>[] = [];
    await page.route('**/api/poem/generate', (route) => {
      requests.push(route.request().postDataJSON());
      return route.fulfill({ status: 200, contentType: 'text/event-stream', body: poemStream('Een nieuw gedicht.') });
    });

    await page.goto(url('/'), { waitUntil: 'networkidle' });
    await page.fill('#poem-name', 'Oma Truus');
    await page.fill('#poem-present', 'warme sokken');
    await page.locator('#poem-form button[type=submit]').click();

    // The payment window shows the next step and the three tiers, Gezin
    // selected, without the name from the form.
    const dialog = page.locator('dialog[open]');
    await dialog.getByText('na het betalen schrijf je meteen verder').waitFor();
    await dialog.getByText('Bij 5 gedichten minder dan €1 per gedicht').waitFor();
    expect(await dialog.textContent()).not.toContain('Oma Truus');
    expect(await dialog.locator('input[value=gezin]').isChecked()).toBe(true);
    // The check that the page after the payment sends on load.
    const lateCheck = page.waitForResponse(response => response.url().includes('/api/payment/check-access'));
    await dialog.getByRole('button', { name: 'Verder met Gezin · €4,99' }).click();

    await page.getByText('Gelukt! Je kunt verder schrijven').waitFor({ timeout: 15_000 });
    await lateCheck;
    await page.getByText('Wat je invulde, staat nog in het formulier.').waitFor();
    expect(await page.inputValue('#poem-name')).toBe('Oma Truus');
    expect(await page.inputValue('#poem-present')).toBe('warme sokken');
    // Used once, then gone.
    expect(await page.evaluate(() => localStorage.getItem('sintgpt-form-draft'))).toBeNull();

    await page.getByRole('button', { name: 'Schrijf het gedicht' }).click();
    await page.getByText('Een nieuw gedicht.').waitFor({ timeout: 15_000 });
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({ name: 'Oma Truus', present: 'warme sokken' });
    await page.close();
  }, 45_000);

  it('does not fill in the form on a normal visit', async () => {
    const page = await createPage();
    await page.addInitScript(() => {
      localStorage.setItem('sintgpt-form-draft', JSON.stringify({ savedAt: Date.now(), form: { name: 'Oud' } }));
    });
    await page.goto(url('/'), { waitUntil: 'networkidle' });
    expect(await page.inputValue('#poem-name')).toBe('');
    expect(await page.evaluate(() => localStorage.getItem('sintgpt-form-draft'))).toBeNull();
    await page.close();
  }, 30_000);
});

describe('days until pakjesavond', () => {
  async function homeAt(time: string) {
    const page = await createPage();
    await page.clock.setFixedTime(new Date(time));
    await page.goto(url('/'), { waitUntil: 'networkidle' });
    return page;
  }

  it('counts the days in the hero', async () => {
    const page = await homeAt('2026-11-20T10:00:00+01:00');
    await page.locator('.countdown').getByText('Nog 15 dagen tot pakjesavond').waitFor();
    // The FAQ also says it takes about a minute; the hint belongs only in the countdown.
    expect(await page.locator('.countdown').getByText('Op het laatste moment?').count()).toBe(0);
    await page.close();
  }, 30_000);

  it('adds the time hint close to the date', async () => {
    const page = await homeAt('2026-12-04T10:00:00+01:00');
    await page.locator('.countdown').getByText('Morgen is het pakjesavond').waitFor();
    await page.locator('.countdown').getByText('Op het laatste moment? In ongeveer een minuut heb je een gedicht.').waitFor();
    await page.close();
  }, 30_000);

  it('shows nothing after pakjesavond', async () => {
    const page = await homeAt('2026-12-06T10:00:00+01:00');
    await page.locator('.countdown').waitFor({ state: 'detached' });
    await page.close();
  }, 30_000);
});

describe('example poems', () => {
  it('compares ChatGPT and SintGPT per style on the home page', async () => {
    const page = await createPage();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(url('/'), { waitUntil: 'networkidle' });
    const section = page.locator('section[aria-labelledby="examples-title"]');
    await section.getByRole('heading', { name: 'Gedicht voor Opa Kees' }).waitFor();
    // Wide screens show both poems; the ChatGPT poem answers the same request.
    const chatgpt = section.getByRole('article', { name: 'Gedicht van ChatGPT' });
    await chatgpt.getByText('Schrijf een grappig sinterklaasgedicht voor Opa Kees.').waitFor();
    expect(await chatgpt.locator('.chatgpt-fault').count()).toBeGreaterThan(0);
    await section.getByRole('button', { name: /Roast/ }).click();
    await section.getByRole('heading', { name: 'Gedicht voor Daan', exact: true }).waitFor();
    await chatgpt.getByText(/roast sinterklaasgedicht voor Daan/).waitFor();
    expect(await section.getByRole('button', { name: /Roast/ }).getAttribute('aria-pressed')).toBe('true');
    await page.close();
  }, 30_000);

  it('shows one poem at a time on a phone', async () => {
    const page = await createPage('/', { viewport: { width: 390, height: 844 } });
    const section = page.locator('section[aria-labelledby="examples-title"]');
    const chatgpt = section.getByRole('article', { name: 'Gedicht van ChatGPT' });
    const sintgpt = section.getByRole('heading', { name: 'Gedicht voor Opa Kees' });
    await chatgpt.waitFor();
    expect(await sintgpt.isVisible()).toBe(false);
    await section.getByRole('button', { name: 'Lees het gedicht van SintGPT' }).click();
    await sintgpt.waitFor();
    expect(await chatgpt.isVisible()).toBe(false);
    expect(await section.getByRole('button', { name: 'SintGPT', exact: true }).getAttribute('aria-pressed')).toBe('true');
    await page.close();
  }, 30_000);

  it('lists every example on /voorbeelden', async () => {
    const res = await fetch('/voorbeelden');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('<link rel="canonical" href="https://sintgpt.com/voorbeelden"');
    for (const name of ['Opa Kees', 'Lotte', 'Mark', 'Tante Els', 'Daan', 'Jeroen', 'Buurman Gerrit', 'Emma']) {
      expect(html, name).toContain(`Gedicht voor ${name}`);
    }
    // Each example is a picture of its PDF that turns over to what the Sint knew,
    // with the poem as text for search engines and small screens.
    expect(html).toContain('/pdf/examples/opa-kees-560.webp');
    expect(html).toContain('Wat wist de Sint?');
    expect(html).toContain('Met deze verrekijker mis je geen vogel op de grond!');
    expect(html).not.toMatch(/gemini|openai/i);
  });
});

describe('lootjes trekken', () => {
  it('renders the page with its own canonical address', async () => {
    const res = await fetch('/lootjes');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('<link rel="canonical" href="https://sintgpt.com/lootjes"');
    expect(html).toMatch(/<h1[^>]*>\s*Lootjes trekken voor Sinterklaas\s*<\/h1>/);
  });

  it('asks for at least three names', async () => {
    const page = await createPage();
    await page.goto(url('/lootjes'), { waitUntil: 'networkidle' });
    await page.fill('#lootjes-names', 'Sanne\nDaan');
    await page.getByRole('button', { name: 'Trek lootjes' }).click();
    await page.getByText('Vul minstens 3 namen in.').waitFor();
    expect(await page.locator('#lootjes-names').getAttribute('aria-invalid')).toBe('true');
    await page.close();
  }, 30_000);

  it('lets each person see only their own lootje, and keeps the draw after a reload', async () => {
    const page = await createPage();
    await page.goto(url('/lootjes'), { waitUntil: 'networkidle' });
    await page.fill('#lootjes-names', 'Sanne\nDaan\nOpa Kees');
    await page.getByRole('button', { name: 'Trek lootjes' }).click();
    await page.getByText('Geef de telefoon door. Tik op je eigen naam.').waitFor();

    await page.getByRole('button', { name: 'Sanne' }).click();
    await page.getByText('Sanne, jij hebt het lootje van').waitFor();
    const drawn = (await page.locator('#lootjes-reveal').textContent())!.trim();
    expect(['Daan', 'Opa Kees']).toContain(drawn);
    await page.getByRole('button', { name: 'Verberg en geef door' }).click();
    await page.getByText('1 van de 3 hebben hun lootje gezien.').waitFor();

    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Sanne' }).click();
    expect((await page.locator('#lootjes-reveal').textContent())!.trim()).toBe(drawn);
    await page.getByRole('button', { name: 'Verberg en geef door' }).click();

    // A new draw needs a second click, so nobody starts one by accident.
    await page.getByRole('button', { name: 'Nieuwe trekking' }).click();
    await page.getByRole('button', { name: 'Ja, trek opnieuw' }).click();
    expect(await page.inputValue('#lootjes-names')).toBe('Sanne\nDaan\nOpa Kees');
    await page.close();
  }, 45_000);
});

describe('blog', () => {
  it.each([
    'rijm-en-ritme-sinterklaasgedicht',
    'lootjes-trekken-tips',
    'surprise-maken-ideeen',
    'roast-sinterklaasgedicht-zonder-te-kwetsen',
    'sinterklaas-op-het-werk',
  ])('renders /blog/%s without naming the AI model', async (slug) => {
    const res = await fetch(`/blog/${slug}`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain(`<link rel="canonical" href="https://sintgpt.com/blog/${slug}"`);
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).not.toMatch(/gemini|openai|gpt-\d/i);
    const index = await (await fetch('/blog')).text();
    expect(index).toContain(`href="/blog/${slug}"`);
  });

  it('lists the new pages in the sitemap', async () => {
    const sitemap = await (await fetch('/sitemap.xml')).text();
    for (const path of ['/voorbeelden', '/lootjes', '/blog/lootjes-trekken-tips']) {
      expect(sitemap, path).toContain(`<loc>https://sintgpt.com${path}</loc>`);
    }
  });
});

describe('analytics', () => {
  it('loads no third-party analytics script', async () => {
    const html = await (await fetch('/')).text();
    expect(html).not.toMatch(/umami/i);
  });

  it('accepts a known browser event and refuses anything else', async () => {
    const send = (body: unknown) => fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    expect((await send({ name: 'Save as PDF', path: '/', locale: 'nl' })).status).toBe(204);
    expect((await send({ name: 'Generate poem' })).status).toBe(400);
    expect((await send({ name: 'Show example', detail: 'Lieve Sanne, je bent een schat!' })).status).toBe(400);
    expect((await send('not json')).status).toBe(400);
  });

  it('sends a page view and a lootjes event from the browser', async () => {
    const page = await createPage();
    const events: Record<string, unknown>[] = [];
    // Chromium shows a beacon's body only to a routed request.
    await page.route('**/api/events', route => route.continue());
    page.on('request', (request) => {
      if (request.url().endsWith('/api/events')) events.push(JSON.parse(request.postData() ?? '{}'));
    });
    await page.goto(url('/lootjes'), { waitUntil: 'networkidle' });
    await page.fill('#lootjes-names', 'Sanne\nDaan\nOpa Kees');
    await page.getByRole('button', { name: 'Trek lootjes' }).click();
    await expect.poll(() => events.map(event => event.name)).toEqual(
      expect.arrayContaining(['Page view', 'Draw lootjes']),
    );
    expect(events.find(event => event.name === 'Page view')).toMatchObject({ path: '/lootjes', locale: 'nl' });
    expect(events.find(event => event.name === 'Draw lootjes')).toMatchObject({ value: 3 });
    // Names never leave the device, also not as analytics.
    expect(JSON.stringify(events)).not.toContain('Opa Kees');
    await page.close();
  }, 30_000);
});

describe('analytics funnel events', () => {
  async function collectEvents(page: TestPage) {
    const events: Record<string, unknown>[] = [];
    // Chromium shows a beacon's body only to a routed request.
    await page.route('**/api/events', route => route.continue());
    page.on('request', (request) => {
      if (request.url().endsWith('/api/events')) events.push(JSON.parse(request.postData() ?? '{}'));
    });
    return events;
  }
  const named = (events: Record<string, unknown>[], name: string) => events.filter(event => event.name === name);

  it('reports why the payment window opened and how it was closed', async () => {
    const page = await createPage();
    await paymentsWork(page);
    await page.addInitScript(() => {
      localStorage.setItem('sinterklaas-payment', JSON.stringify({ poemCount: 1 }));
    });
    const events = await collectEvents(page);
    await page.goto(url('/'), { waitUntil: 'networkidle' });
    await page.fill('#poem-name', 'Oma Truus');
    await page.locator('#poem-form button[type=submit]').click();
    await page.locator('dialog[open]').waitFor();
    await page.keyboard.press('Escape');
    await page.locator('dialog[open]').waitFor({ state: 'detached' });

    await expect.poll(() => named(events, 'Close payment modal')).toHaveLength(1);
    expect(named(events, 'Form started')).toHaveLength(1);
    expect(named(events, 'No poems left')).toHaveLength(1);
    expect(named(events, 'No poems left')[0]).toMatchObject({ detail: 'free:submit' });
    expect(named(events, 'Show payment modal')[0]).toMatchObject({ detail: 'submit' });
    expect(named(events, 'Close payment modal')[0]).toMatchObject({ detail: 'escape' });
    expect(JSON.stringify(events)).not.toContain('Oma Truus');
    await page.close();
  }, 30_000);

  it('counts a finished poem and where the writer came from', async () => {
    const page = await createPage();
    await page.route('**/api/poem/generate', route =>
      route.fulfill({ status: 200, contentType: 'text/event-stream', body: poemStream('Een gedicht.') }));
    const events = await collectEvents(page);
    await page.goto(url('/?utm_source=Newsletter&utm_campaign=sint-2026&utm_medium=<b>'), { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Begin met rijmen' }).click();
    await page.fill('#poem-name', 'Sanne');
    await page.locator('#poem-form button[type=submit]').click();
    await page.getByText('Een gedicht.').waitFor({ timeout: 15_000 });

    await expect.poll(() => named(events, 'Poem ready')).toHaveLength(1);
    // Tags in lower case; one that is not a tag is dropped.
    expect(named(events, 'Page view')[0]).toMatchObject({ path: '/', source: 'newsletter', campaign: 'sint-2026' });
    expect(named(events, 'Page view')[0]).not.toHaveProperty('medium');
    expect(named(events, 'Scroll to poem form')[0]).toMatchObject({ detail: 'hero' });
    expect(named(events, 'Poem ready')[0]).toMatchObject({ detail: 'new', value: 1 });
    await page.close();
  }, 30_000);

  it('records which blog post sends a writer to the form', async () => {
    const page = await createPage();
    const events = await collectEvents(page);
    await page.goto(url('/blog/lootjes-trekken-tips'), { waitUntil: 'networkidle' });
    await page.locator('[data-cta="blog:lootjes-trekken-tips"]').click();
    await page.waitForURL(url('/'));
    await expect.poll(() => named(events, 'Go to poem form')).toEqual([
      expect.objectContaining({ detail: 'blog:lootjes-trekken-tips' }),
    ]);
    await page.close();
  }, 30_000);

  it('sends no events from a browser marked with ?intern=1, until ?intern=0', async () => {
    const page = await createPage();
    const events = await collectEvents(page);
    await page.goto(url('/?intern=1&utm_source=test'), { waitUntil: 'networkidle' });
    expect(new URL(page.url()).search).toBe('?utm_source=test');
    const cookies = await page.context().cookies();
    expect(cookies.find(cookie => cookie.name === 'sintgpt-intern')?.value).toBe('1');
    await page.goto(url('/lootjes'), { waitUntil: 'networkidle' });
    expect(events).toEqual([]);

    await page.goto(url('/?intern=0'), { waitUntil: 'load' });
    await expect.poll(() => new URL(page.url()).search).toBe('');
    expect((await page.context().cookies()).some(cookie => cookie.name === 'sintgpt-intern')).toBe(false);
    await expect.poll(() => named(events, 'Page view')).toHaveLength(1);
    await page.close();
  }, 30_000);

  it('chooses the style from ?stijl= and removes it from the address', async () => {
    const page = await createPage();
    await page.goto(url('/?stijl=roast&utm_source=test#poem-form'), { waitUntil: 'load' });
    await expect.poll(() => new URL(page.url()).search).toBe('?utm_source=test');
    expect(new URL(page.url()).hash).toBe('#poem-form');
    const checked = () => page.evaluate(() =>
      (document.querySelector('input[name="poem-style"]:checked') as HTMLInputElement | null)?.value);
    expect(await checked()).toBe('roast');

    await page.goto(url('/?stijl=onbekend'), { waitUntil: 'load' });
    await expect.poll(() => new URL(page.url()).search).toBe('');
    expect(await checked()).toBe('funny');
    await page.close();
  }, 30_000);

  /** A phone with the share sheet; each call takes the next outcome ('ok' or an error name). */
  async function phoneWithShareSheet(outcomes: string[]) {
    const page = await createPage(undefined, { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    await page.addInitScript((list: string[]) => {
      const w = window as unknown as { shares: ShareData[] };
      w.shares = [];
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: async (data: ShareData) => {
          w.shares.push(data);
          const outcome = list.shift() ?? 'ok';
          if (outcome !== 'ok') throw new DOMException('test', outcome);
        },
      });
      Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
    }, outcomes);
    const poem = 'De Sint zag oma Truus met een taart op het plein,\nzij at hem alleen op, want hij was nogal klein.';
    const share = await signPoemShare(poem, 'nl', 'e2e-access-secret');
    const chunks = poem.match(/\S+\s*/g)!.map(delta => ({ type: 'text-delta', id: '0', delta }));
    const sse = [...chunks, { type: 'data-share', data: share }]
      .map(chunk => `data: ${JSON.stringify(chunk)}\n\n`).join('') + 'data: [DONE]\n\n';
    await page.route('**/api/poem/generate', route =>
      route.fulfill({ status: 200, contentType: 'text/event-stream', body: sse }));
    const events = await collectEvents(page);
    await page.goto(url('/'), { waitUntil: 'networkidle' });
    await page.fill('#poem-name', 'Oma Truus');
    await page.locator('#poem-form button[type=submit]').click();
    await page.getByRole('button', { name: 'Kopieer gedicht' }).waitFor({ timeout: 15_000 });
    const shares = () => page.evaluate(() => (window as unknown as { shares: ShareData[] }).shares);
    return { page, events, shares };
  }

  it('shares a poem through the share sheet on a phone', async () => {
    const { page, events, shares } = await phoneWithShareSheet(['AbortError', 'ok']);
    for (const name of ['Deel op WhatsApp', 'Verstuur via e-mail', 'Deel op Facebook']) {
      expect(await page.getByRole('button', { name }).count(), name).toBe(0);
    }
    const button = page.getByRole('button', { name: 'Deel gedicht' });
    await button.click();
    await expect.poll(() => named(events, 'Shared via share sheet')).toHaveLength(1);
    await button.click();
    await expect.poll(() => named(events, 'Shared via share sheet')).toHaveLength(2);

    expect(named(events, 'Shared via share sheet').map(event => event.detail)).toEqual(['cancelled', 'done']);
    const [first] = await shares();
    // This build has no KV, so the sheet gets the long link.
    expect(first).toMatchObject({ title: 'Gedicht voor Oma Truus', text: 'Gedicht voor Oma Truus' });
    expect(first?.url).toContain('/gedicht?s=');
    expect(JSON.stringify(events)).not.toContain('Oma Truus');
    await page.close();
  }, 45_000);

  it('shares the PDF through the share sheet on a phone', async () => {
    const { page, events, shares } = await phoneWithShareSheet(['ok']);
    await page.getByRole('button', { name: 'Opslaan als PDF' }).click();
    const dialog = page.getByRole('dialog', { name: 'Kies een ontwerp' });
    await dialog.waitFor();
    await dialog.getByText('Schoolschrift', { exact: true }).click();
    expect(await dialog.getByRole('button', { name: 'Downloaden' }).count()).toBe(1);
    await dialog.getByRole('button', { name: 'Deel PDF' }).click();
    await dialog.waitFor({ state: 'hidden' });

    await expect.poll(() => named(events, 'Share PDF').map(event => event.detail)).toEqual(['schoolschrift:done']);
    const shared = await page.evaluate(async () => {
      const data = (window as unknown as { shares: ShareData[] }).shares[0];
      const file = data?.files?.[0];
      return file && { name: file.name, type: file.type, start: await file.slice(0, 5).text() };
    });
    expect(shared).toEqual({ name: 'sinterklaasgedicht-oma-truus-sintgpt.com.pdf', type: 'application/pdf', start: '%PDF-' });
    expect(await shares()).toHaveLength(1);
    await page.close();
  }, 45_000);

  it('asks for a second tap when the browser refuses the sheet after the wait', async () => {
    const { page, events, shares } = await phoneWithShareSheet(['NotAllowedError', 'ok']);
    await page.getByRole('button', { name: 'Deel gedicht' }).click();
    const again = page.getByRole('button', { name: 'Tik nog eens om te delen' });
    await again.waitFor();
    await again.click();
    await page.getByRole('button', { name: 'Deel gedicht' }).waitFor();
    await expect.poll(() => named(events, 'Shared via share sheet').map(event => event.detail))
      .toEqual(['refused', 'done']);
    expect(await shares()).toHaveLength(2);
    await page.close();
  }, 45_000);
});

describe('free rewrite and write first, then pay', () => {
  it('lets a free visitor rewrite the free poem once, with a wish', async () => {
    const page = await createPage();
    await paymentsWork(page);
    const sent: Array<Record<string, unknown>> = [];
    await page.route('**/api/poem/generate', (route) => {
      sent.push(route.request().postDataJSON());
      const poem = sent.length === 1 ? 'Eerste gratis versie.' : 'Kortere versie.';
      return route.fulfill({ status: 200, contentType: 'text/event-stream', body: poemStream(poem, TEST_SHARE) });
    });
    await page.goto(url('/'), { waitUntil: 'networkidle' });
    await page.fill('#poem-name', 'Sanne');
    await page.locator('#poem-form button[type=submit]').click();
    await page.getByText('Eerste gratis versie.').waitFor({ timeout: 15_000 });

    // Without a wish, the button asks for one first.
    await page.getByRole('button', { name: 'Herschrijf gratis met een wens' }).click();
    await page.getByText('Je mag je gedicht 1 keer gratis laten herschrijven met een wens.').waitFor();
    expect(sent).toHaveLength(1);
    await page.fill('#rewrite-hint-input', 'korter');
    await page.getByRole('button', { name: 'Herschrijf met deze wens' }).click();
    await page.getByText('Kortere versie.').waitFor({ timeout: 15_000 });
    expect(sent[1]).toMatchObject({
      regenerate: true,
      rewriteHint: 'korter',
      previousPoem: 'Eerste gratis versie.',
      previousShare: TEST_SHARE,
    });

    // Used: the next rewrite opens the payment window.
    await page.getByRole('button', { name: 'Herschrijf dit gedicht' }).click();
    await page.locator('dialog[open] .pay-button').waitFor();
    expect(sent).toHaveLength(2);
    await page.close();
  }, 45_000);

  it('writes a new poem for a free visitor without poems left, and shows only its start', async () => {
    const page = await createPage();
    await paymentsWork(page);
    await page.addInitScript(() => {
      localStorage.setItem('sinterklaas-payment', JSON.stringify({ poemCount: 1 }));
    });
    const sent: unknown[] = [];
    await page.route('**/api/poem/preview', async (route) => {
      sent.push(route.request().postDataJSON());
      // The slower model: long enough to see the writing animation.
      await new Promise(resolve => setTimeout(resolve, 1500));
      return route.fulfill({ json: {
        id: 'abcdefghijklmnopqrstuv',
        shown: ['Lieve Sanne,', '', 'Regel een van het gedicht,', 'Regel twee rijmt erop.'],
        hidden: [30, 28, 0, 31, 29, 0, 15],
        expiresAt: Date.now() + 2 * 60 * 60 * 1000,
      } });
    });
    await page.goto(url('/'), { waitUntil: 'networkidle' });
    await page.fill('#poem-name', 'Sanne');
    // Every poem, the preview too, comes from Gemini 3.1 Pro: about a minute.
    await page.locator('#poem-form').getByText('Klaar in ongeveer een minuut.').waitFor();
    await page.locator('#poem-form button[type=submit]').click();
    await page.getByText('De Sint schrijft zorgvuldig. Meestal is het gedicht in ongeveer een minuut klaar.').waitFor();
    await page.getByText('Regel twee rijmt erop.').waitFor({ timeout: 15_000 });
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ name: 'Sanne' });
    expect(await page.locator('.preview-bar').count()).toBe(7);

    await page.getByRole('button', { name: 'Lees het hele gedicht' }).click();
    await page.locator('dialog[open]').getByText('Je nieuwe gedicht is al geschreven en staat voor je klaar').waitFor();
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('sintgpt-poem-preview') || 'null'));
    expect(stored).toMatchObject({ id: 'abcdefghijklmnopqrstuv', recipient: 'Sanne' });
    await page.close();
  }, 45_000);

  it('writes the preview at once when only the server knew the free poem was used', async () => {
    const page = await createPage();
    await paymentsWork(page);
    let generateCalls = 0;
    await page.route('**/api/poem/generate', (route) => {
      generateCalls += 1;
      return route.fulfill({ status: 429, json: { statusCode: 429, data: { reason: 'limit', retryAfterSeconds: 3600 } } });
    });
    const sent: unknown[] = [];
    await page.route('**/api/poem/preview', (route) => {
      sent.push(route.request().postDataJSON());
      return route.fulfill({ json: {
        id: 'abcdefghijklmnopqrstuv',
        shown: ['Lieve Sanne,', '', 'Regel een van het gedicht,', 'Regel twee rijmt erop.'],
        hidden: [30, 28, 0, 31],
        expiresAt: Date.now() + 2 * 60 * 60 * 1000,
      } });
    });
    // A fresh browser: the page thinks the free poem is still there.
    await page.goto(url('/'), { waitUntil: 'networkidle' });
    await page.fill('#poem-name', 'Sanne');
    await page.locator('#poem-form button[type=submit]').click();

    await page.getByText('Regel twee rijmt erop.').waitFor({ timeout: 15_000 });
    expect(generateCalls).toBe(1);
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ name: 'Sanne' });
    expect(await page.getByRole('heading', { name: 'Het gratis gedicht is al gebruikt' }).count()).toBe(0);
    await page.getByRole('button', { name: 'Lees het hele gedicht' }).waitFor();
    // The page now knows the free poem is used.
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('sinterklaas-payment') || 'null'));
    expect(stored).toMatchObject({ poemCount: 1 });
    await page.locator('#poem-form').getByText('Klaar in ongeveer een minuut.').waitFor();
    await page.close();
  }, 45_000);

  it('opens the payment window as before when no preview can be written', async () => {
    const page = await createPage();
    await paymentsWork(page);
    await page.addInitScript(() => {
      localStorage.setItem('sinterklaas-payment', JSON.stringify({ poemCount: 1 }));
    });
    await page.route('**/api/poem/preview', route =>
      route.fulfill({ status: 429, json: { data: { reason: 'limit' } } }));
    await page.goto(url('/'), { waitUntil: 'networkidle' });
    await page.fill('#poem-name', 'Sanne');
    await page.locator('#poem-form button[type=submit]').click();
    await page.locator('dialog[open]').getByText('Je eerste gedicht kreeg je van de Sint.').waitFor();
    await page.close();
  }, 30_000);

  it('opens the poem written before payment once the visitor has paid', async () => {
    const page = await createPage();
    await page.context().addCookies([{ name: 'sintgpt-access', value: await buyerToken('pay_preview'), url: url('/') }]);
    await page.addInitScript(() => {
      if (sessionStorage.getItem('seeded')) return;
      sessionStorage.setItem('seeded', '1');
      localStorage.setItem('sintgpt-poem-preview', JSON.stringify({
        id: 'abcdefghijklmnopqrstuv',
        shown: ['Lieve Sanne,', '', 'Regel een.'],
        hidden: [20, 0, 12],
        expiresAt: Date.now() + 60 * 60 * 1000,
        recipient: 'Sanne',
      }));
    });
    const unlocks: unknown[] = [];
    await page.route('**/api/poem/unlock', (route) => {
      unlocks.push(route.request().postDataJSON());
      return route.fulfill({ json: {
        poem: 'Lieve Sanne,\n\nHet hele gedicht.\n\nVan Sint & Piet',
        share: null,
        style: 'funny',
        rhymeScheme: 'AABB',
        language: 'dutch',
        lines: 8,
      } });
    });
    await page.goto(url('/'), { waitUntil: 'networkidle' });
    await page.getByText('Het hele gedicht.').waitFor({ timeout: 15_000 });
    expect(unlocks).toEqual([{ id: 'abcdefghijklmnopqrstuv' }]);
    const state = await page.evaluate(() => ({
      preview: localStorage.getItem('sintgpt-poem-preview'),
      history: JSON.parse(localStorage.getItem('sintgpt-poem-history') || '[]'),
    }));
    expect(state.preview).toBeNull();
    expect(state.history[0]).toMatchObject({ recipient: 'Sanne', poem: 'Lieve Sanne,\n\nHet hele gedicht.\n\nVan Sint & Piet' });
    await page.close();
  }, 45_000);
});

describe('pricing tiers', () => {
  /** A free visitor who used the free poem, at the payment window. */
  async function freeVisitorAtPaywall() {
    const page = await createPage();
    await paymentsWork(page);
    await page.addInitScript(() => {
      localStorage.setItem('sinterklaas-payment', JSON.stringify({ poemCount: 1 }));
    });
    await page.goto(url('/'), { waitUntil: 'networkidle' });
    await page.fill('#poem-name', 'Sanne');
    await page.locator('#poem-form button[type=submit]').click();
    const dialog = page.locator('dialog[open]');
    await dialog.locator('.tier').first().waitFor();
    return { page, dialog };
  }

  it('shows three tiers with Gezin recommended and selected, and sends the chosen tier', async () => {
    const { page, dialog } = await freeVisitorAtPaywall();
    expect(await dialog.locator('.tier').count()).toBe(3);
    expect(await dialog.locator('[data-tier=gezin] .tier-badge').textContent()).toContain('Aanbevolen');
    expect(await dialog.locator('input[value=gezin]').isChecked()).toBe(true);
    await dialog.getByText('€1,33 per gedicht').waitFor();
    // No popularity claim without data.
    expect(await dialog.textContent()).not.toMatch(/meest gekozen|populair/i);

    // The small tier says what the step up costs.
    await dialog.locator('[data-tier=drie]').click();
    await dialog.getByText('Voor €1 meer schrijf je met Gezin zoveel gedichten als je wilt.').waitFor();

    const bodies: unknown[] = [];
    await page.route('**/api/payment/create-checkout', (route) => {
      bodies.push(route.request().postDataJSON());
      return route.fulfill({ status: 503, json: { data: { code: 'payments_unavailable' } } });
    });
    await dialog.getByRole('button', { name: 'Verder met 3 gedichten · €3,99' }).click();
    await expect.poll(() => bodies).toEqual([{ tier: 'drie' }]);
    await page.close();
  }, 30_000);

  it('shows Gezin at €4,99 with the days to pakjesavond and no struck-through price', async () => {
    const page = await createPage();
    await page.clock.setFixedTime(new Date('2026-11-27T10:00:00+01:00'));
    await paymentsWork(page);
    await page.addInitScript(() => {
      localStorage.setItem('sinterklaas-payment', JSON.stringify({ poemCount: 1 }));
    });
    await page.goto(url('/'), { waitUntil: 'networkidle' });
    await page.fill('#poem-name', 'Sanne');
    await page.locator('#poem-form button[type=submit]').click();
    const dialog = page.locator('dialog[open]');
    const gezin = dialog.locator('[data-tier=gezin]');
    await gezin.getByText('€4,99').waitFor();
    await gezin.getByText('Bij 5 gedichten minder dan €1 per gedicht').waitFor();
    await dialog.getByText('Nog 8 dagen tot pakjesavond').waitFor();
    // Reciprocity: the free poem was a gift.
    await dialog.getByText('Je eerste gedicht kreeg je van de Sint.').waitFor();
    // Never a struck-through "old" price, never a made-up stock bar.
    expect(await dialog.locator('s, del, strike, .tier-stock').count()).toBe(0);
    await dialog.getByRole('button', { name: 'Verder met Gezin · €4,99' }).waitFor();
    await dialog.locator('[data-tier=drie]').click();
    await dialog.getByText('Voor €1 meer schrijf je met Gezin zoveel gedichten als je wilt.').waitFor();
    await page.close();
  }, 30_000);

  it('opens with Hele familie selected for a locked surprise or PDF design', async () => {
    const page = await createPage();
    await paymentsWork(page);
    await page.route('**/api/poem/generate', route =>
      route.fulfill({ status: 200, contentType: 'text/event-stream', body: poemStream('Een gratis gedicht.') }));
    await page.goto(url('/'), { waitUntil: 'networkidle' });
    await page.fill('#poem-name', 'Sanne');
    await page.locator('#poem-form button[type=submit]').click();
    await page.getByText('Een gratis gedicht.').waitFor({ timeout: 15_000 });

    await page.getByRole('button', { name: /Bedenk een surprise/ }).click();
    const dialog = page.locator('dialog[open]');
    await dialog.getByText('Surprise-ideeën bij je gedicht horen bij Hele familie.').waitFor();
    expect(await dialog.locator('input[value=familie]').isChecked()).toBe(true);
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: 'Opslaan als PDF' }).click();
    await page.locator('dialog[open]').getByText('Goudfolie').click();
    await page.locator('dialog[open]').getByRole('button', { name: 'Bekijk Hele familie' }).click();
    await page.locator('dialog[open]').getByText('Dit PDF-ontwerp hoort bij Hele familie.').waitFor();
    expect(await page.locator('dialog[open] input[value=familie]').isChecked()).toBe(true);
    await page.close();
  }, 45_000);

  it('offers a Drie buyer the tiers above, not a rewrite', async () => {
    const page = await createPage();
    await paymentsWork(page);
    await page.context().addCookies([{ name: 'sintgpt-access', value: await buyerToken('pay_drie_ui', 'drie'), url: url('/') }]);
    let calls = 0;
    await page.route('**/api/poem/generate', (route) => {
      calls++;
      return route.fulfill({ status: 200, contentType: 'text/event-stream', body: poemStream('Een Drie gedicht.') });
    });
    await page.goto(url('/'), { waitUntil: 'networkidle' });
    await page.getByText('Je kunt nog 3 gedichten schrijven.').waitFor();
    await page.fill('#poem-name', 'Sanne');
    await page.locator('#poem-form button[type=submit]').click();
    await page.getByText('Een Drie gedicht.').waitFor({ timeout: 15_000 });

    await page.getByRole('button', { name: 'Herschrijf dit gedicht' }).click();
    const dialog = page.locator('dialog[open]');
    await dialog.getByText('Gedichten herschrijven met AI zit in Gezin en Hele familie.').waitFor();
    expect(await dialog.locator('[data-tier=drie]').textContent()).toContain('Dit heb je al');
    expect(await dialog.locator('input[value=drie]').isDisabled()).toBe(true);
    expect(await dialog.locator('input[value=gezin]').isChecked()).toBe(true);
    expect(calls).toBe(1);
    await page.close();
  }, 45_000);

  it('counts 3 poems for Drie, refuses its rewrites, and says what is left', async () => {
    const cookie = `sintgpt-access=${await buyerToken('pay_drie_api', 'drie')}`;
    const post = (body: unknown) => fetch('/api/poem/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.0.0.9', cookie },
      body: JSON.stringify(body),
    });
    const left = async () => ((await (await fetch('/api/payment/check-access', { headers: { cookie } })).json()) as { tier: string; poemsLeft: number });

    expect(await left()).toMatchObject({ tier: 'drie', poemsLeft: 3 });
    // A rewrite is refused before it counts.
    const rewrite = await post({ ...VALID_POEM_REQUEST, regenerate: true });
    expect(rewrite.status).toBe(403);
    expect((await left()).poemsLeft).toBe(3);

    // Requests count before validation, so empty ones use up the poems.
    const statuses: number[] = [];
    let last: Response | undefined;
    for (let i = 0; i < 4; i++) {
      last = await post({ name: '' });
      statuses.push(last.status);
      if (i < 3) await new Promise(resolve => setTimeout(resolve, 10_100));
    }
    expect(statuses).toEqual([400, 400, 400, 429]);
    expect(((await last!.json()) as { data: { reason: string } }).data.reason).toBe('credits');
    expect((await left()).poemsLeft).toBe(0);
  }, 60_000);

  it('reads a cookie from before the tiers as Gezin', async () => {
    const cookie = `sintgpt-access=${await signLegacyAccessToken('pay_legacy', 'e2e-access-secret')}`;
    const res = await fetch('/api/payment/check-access', { headers: { cookie } });
    expect(await res.json()).toMatchObject({ hasAccess: true, tier: 'gezin', poemsLeft: null });
  });

  it('keeps surprise ideas for Hele familie', async () => {
    const ask = async (tier: TierId) => fetch('/api/poem/surprise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: `sintgpt-access=${await buyerToken(`pay_surprise_${tier}`, tier)}` },
      body: JSON.stringify({ name: '' }),
    });
    expect((await fetch('/api/poem/surprise', { method: 'POST', body: '{}' })).status).toBe(403);
    expect((await ask('gezin')).status).toBe(403);
    // Hele familie gets past the tier check; the empty name stops it before the AI.
    expect((await ask('familie')).status).toBe(400);
  });

  it('sells only tiers with a product, and never takes a product ID from the browser', async () => {
    const status = (await (await fetch('/api/payment/status')).json()) as { tiers: string[] };
    expect(status.tiers).toContain('gezin');
    const res = await fetch('/api/payment/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier: 'pdt_anything' }),
    });
    expect([400, 503]).toContain(res.status);
  });
});

describe('gift links', () => {
  it('gives Hele familie through ?cadeau= and removes the code from the address', async () => {
    const page = await createPage();
    await page.goto(url('/?cadeau=e2e-gift-code-0123456789'), { waitUntil: 'networkidle' });
    await page.getByText('Je hebt Hele familie cadeau gekregen').waitFor();
    expect(page.url()).not.toContain('cadeau');
    const access = await page.evaluate(() => window.fetch('/api/payment/check-access').then(res => res.json()));
    expect(access).toMatchObject({ hasAccess: true, tier: 'familie' });
    await page.close();
  }, 30_000);

  it('gives Hele familie until pakjesavond through a season code, and keeps the utm tags', async () => {
    const page = await createPage();
    await page.goto(url('/?cadeau=e2e-season-code-0123456789&utm_campaign=kopers-2025'), { waitUntil: 'networkidle' });
    await page.getByText('Je hebt Hele familie cadeau gekregen').waitFor();
    await page.getByText('Schrijf zoveel gedichten als je wilt, tot en met pakjesavond').waitFor();
    expect(page.url()).not.toContain('cadeau');
    expect(page.url()).toContain('utm_campaign=kopers-2025');
    const access = await page.evaluate(() => window.fetch('/api/payment/check-access').then(res => res.json()));
    expect(access).toMatchObject({ hasAccess: true, tier: 'familie' });
    expect(access.expiresAt).toBeLessThanOrEqual(Date.now() + 366 * 24 * 60 * 60 * 1000);
    await page.close();
  }, 30_000);

  it('lets a season code work in 3 browsers, not in a 4th', async () => {
    const claim = async () => {
      const page = await createPage();
      await page.goto(url('/?cadeau=e2e-season-full-0123456789'), { waitUntil: 'networkidle' });
      return page;
    };
    for (let browser = 1; browser <= 3; browser++) {
      const page = await claim();
      await page.getByText('Je hebt Hele familie cadeau gekregen').waitFor();
      // The same browser opening the link again takes no extra place.
      if (browser === 1) {
        await page.goto(url('/?cadeau=e2e-season-full-0123456789'), { waitUntil: 'networkidle' });
        await page.getByText('Je hebt Hele familie cadeau gekregen').waitFor();
      }
      await page.close();
    }
    const fourth = await claim();
    await fourth.getByText('Deze cadeaulink is al in gebruik').waitFor();
    const access = await fourth.evaluate(() => window.fetch('/api/payment/check-access').then(res => res.json()));
    expect(access).toMatchObject({ hasAccess: false });
    await fourth.close();
  }, 60_000);

  it('explains a wrong code and gives no access', async () => {
    const page = await createPage();
    await page.goto(url('/?cadeau=not-the-right-code-123'), { waitUntil: 'networkidle' });
    await page.getByText('Deze cadeaulink werkt niet').waitFor();
    const access = await page.evaluate(() => window.fetch('/api/payment/check-access').then(res => res.json()));
    expect(access).toMatchObject({ hasAccess: false });
    await page.close();
  }, 30_000);
});
