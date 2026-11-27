import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { RECIPIENT_PRESETS, recipientFromQuery } from '../../utils/recipientPreset';

describe('recipientFromQuery', () => {
  it('maps a recipient to the start of the fun facts', () => {
    expect(recipientFromQuery('partner')).toBe('Mijn partner. ');
    expect(recipientFromQuery('Kind')).toBe('Mijn kind. ');
    for (const text of Object.values(RECIPIENT_PRESETS)) expect(text).toMatch(/^[A-Z][a-z ]+\. $/);
  });

  it('ignores missing, repeated and unknown values', () => {
    expect(recipientFromQuery(undefined)).toBeNull();
    expect(recipientFromQuery(['partner', 'kind'])).toBeNull();
    expect(recipientFromQuery('constructor')).toBeNull();
    expect(recipientFromQuery('')).toBeNull();
  });

  it('is used by the recipient posts with a known value', () => {
    const posts: Record<string, string> = {
      'sinterklaasgedicht-partner': 'partner',
      'sinterklaasgedicht-voor-kinderen': 'kind',
      'sinterklaasgedicht-opa-oma': 'grootouder',
      'sinterklaasgedicht-papa-mama': 'ouder',
      'sinterklaasgedicht-juf-meester': 'leerkracht',
      'sinterklaas-op-het-werk': 'collega',
    };
    for (const [slug, value] of Object.entries(posts)) {
      const page = readFileSync(new URL(`../../pages/blog/${slug}.vue`, import.meta.url), 'utf8');
      expect(page, slug).toContain(`to="/?voor=${value}#poem-form" data-cta="blog:${slug}:tekst"`);
      expect(recipientFromQuery(value), value).not.toBeNull();
    }
  });
});
