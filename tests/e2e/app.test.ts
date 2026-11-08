import { fileURLToPath } from 'node:url';
import { createPage, fetch, setup, url } from '@nuxt/test-utils/e2e';
import { Webhook } from 'standardwebhooks';
import { describe, expect, it } from 'vitest';
import { OG_IMAGES } from '../../scripts/og-images';
import { signAccessToken } from '../../server/utils/paymentAccess';
import { readPoemStream } from '../../utils/poemStream';

// Builds the app in production mode, starts the real Nitro server and
// launches a headless browser for the UI tests.
await setup({
  rootDir: fileURLToPath(new URL('../..', import.meta.url)),
  build: true,
  server: true,
  browser: true,
});

const hasGatewayKey = Boolean(
  process.env.NUXT_AI_GATEWAY_API_KEY || process.env.AI_GATEWAY_API_KEY,
);

// The endpoint rate-limits per client IP, so each case uses its own IP.
function postPoem(body: unknown, ip: string) {
  return fetch('/api/poem/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip },
    body: JSON.stringify(body),
  });
}

describe('pages', () => {
  it('renders the home page with SEO meta', async () => {
    const res = await fetch('/');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('SintGPT');
    expect(html).toMatch(/<meta name="keywords" content="[^"]+"/);
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
      localStorage.setItem('cookie_consent', 'accepted');
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
    const token = await signAccessToken('pay_x', 'e2e-access-secret');
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

  it('debounces a second request from the same IP with 429', async () => {
    await postPoem({ name: '' }, '10.0.0.2');
    const res = await postPoem({ name: '' }, '10.0.0.2');
    expect(res.status).toBe(429);
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
