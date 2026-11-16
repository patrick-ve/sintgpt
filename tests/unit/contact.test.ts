import { describe, expect, it, vi } from 'vitest';
import {
  CONTACT_MIN_SECONDS,
  ContactRequestSchema,
  contactFromPath,
  contactMessage,
  contactTrap,
  verifyTurnstile,
  type ContactRequest,
} from '../../server/utils/contact';
import { ALERT_ERROR_EVENTS } from '../../server/utils/alerts';
import { SERVER_EVENTS } from '../../utils/analyticsEvents';
import { looksLikeEmail } from '../../utils/contactForm';

const valid = {
  topic: 'help',
  email: ' sanne@voorbeeld.nl ',
  message: '  Ik heb betaald maar zie geen gedichten meer.  ',
  locale: 'nl',
  from: '/lootjes',
  website: '',
  elapsed: 40,
  turnstile: 'token',
};

describe('ContactRequestSchema', () => {
  it('accepts a real message and trims it', () => {
    const parsed = ContactRequestSchema.parse(valid);
    expect(parsed.email).toBe('sanne@voorbeeld.nl');
    expect(parsed.message).toBe('Ik heb betaald maar zie geen gedichten meer.');
  });

  it('refuses a bad address, a short or long message, an unknown topic and a missing token', () => {
    for (const change of [
      { email: 'sanne' },
      { email: `${'a'.repeat(250)}@x.nl` },
      { message: 'Hoi!' },
      { message: 'x'.repeat(2001) },
      { topic: 'spam' },
      { turnstile: '' },
      { locale: 'de' },
    ]) {
      expect(ContactRequestSchema.safeParse({ ...valid, ...change }).success, JSON.stringify(change)).toBe(false);
    }
  });
});

describe('contactTrap', () => {
  it('catches a filled honeypot and a form sent too fast', () => {
    expect(contactTrap({ website: 'https://spam.example', elapsed: 40 })).toBe('honeypot');
    expect(contactTrap({ website: '', elapsed: CONTACT_MIN_SECONDS - 1 })).toBe('too fast');
    expect(contactTrap({ website: '', elapsed: CONTACT_MIN_SECONDS })).toBeNull();
    expect(contactTrap({ elapsed: 120 })).toBeNull();
  });
});

describe('contactMessage', () => {
  const request = ContactRequestSchema.parse(valid) as ContactRequest;

  it('gives the topic, the address, the tier, the language and the page, then the message', () => {
    expect(contactMessage(request, { tier: 'gezin' })).toBe(
      '🆘 Hulp via sintgpt.com/contact\n'
      + 'Van: sanne@voorbeeld.nl\n'
      + 'Tier: gezin · Taal: nl · Pagina: /lootjes\n'
      + '\n'
      + 'Ik heb betaald maar zie geen gedichten meer.',
    );
    expect(contactMessage({ ...request, from: undefined }, { tier: null })).toContain('Tier: gratis · Taal: nl\n');
  });

  it('takes only a path of this site as the page, without a short link ID', () => {
    expect(contactFromPath('/g/AbC123xyz0')).toBe('/g/:id');
    expect(contactFromPath('/blog/rijmwoorden-sinterklaas')).toBe('/blog/rijmwoorden-sinterklaas');
    expect(contactFromPath('https://evil.example')).toBe('');
    expect(contactFromPath('/a b')).toBe('');
    expect(contactFromPath(undefined)).toBe('');
  });
});

describe('verifyTurnstile', () => {
  const answer = (body: object, status = 200) =>
    vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

  it('sends the secret, the token and the IP to Cloudflare', async () => {
    const fetcher = answer({ success: true, action: 'contact' });
    expect(await verifyTurnstile('secret', 'token', '203.0.113.9', fetcher)).toBe(true);
    const [url, init] = (fetcher as unknown as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');
    expect(String(init.body)).toBe('secret=secret&response=token&remoteip=203.0.113.9');
  });

  it('refuses a failed token and a token made for another form', async () => {
    expect(await verifyTurnstile('s', 't', undefined, answer({ success: false, 'error-codes': ['timeout-or-duplicate'] }))).toBe(false);
    expect(await verifyTurnstile('s', 't', undefined, answer({ success: true, action: 'login' }))).toBe(false);
    // Cloudflare's test keys answer without an action.
    expect(await verifyTurnstile('s', 't', undefined, answer({ success: true }))).toBe(true);
  });

  it('throws when Cloudflare does not answer', async () => {
    await expect(verifyTurnstile('s', 't', undefined, answer({}, 500))).rejects.toThrow('Turnstile answered 500');
  });
});

describe('contact events', () => {
  it('are server events, and a message that was not sent is an alert', () => {
    for (const name of ['Contact sent', 'Contact refused', 'Contact failed']) {
      expect(SERVER_EVENTS as readonly string[]).toContain(name);
    }
    expect(ALERT_ERROR_EVENTS as readonly string[]).toContain('Contact failed');
  });
});

describe('looksLikeEmail', () => {
  it('lets the page catch typing mistakes before the server does', () => {
    expect(looksLikeEmail(' sanne@voorbeeld.nl ')).toBe(true);
    expect(looksLikeEmail('sanne@voorbeeld')).toBe(false);
    expect(looksLikeEmail('sanne voorbeeld.nl')).toBe(false);
  });
});
