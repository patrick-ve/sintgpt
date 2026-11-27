// A link such as /?voor=partner#poem-form starts the fun facts with who the
// poem is for ("Mijn partner. "). The blog posts about one kind of recipient
// use it, so the reader lands in a form that already knows the relation. The
// parameter holds no visitor data, and the page removes it after reading it.

export const RECIPIENT_PARAM = 'voor';

/** The text the fun facts start with, per value in the link. */
export const RECIPIENT_PRESETS: Record<string, string> = {
  partner: 'Mijn partner. ',
  kind: 'Mijn kind. ',
  grootouder: 'Mijn opa of oma. ',
  ouder: 'Mijn vader of moeder. ',
  leerkracht: 'Onze juf of meester. ',
  collega: 'Mijn collega. ',
};

/** The start of the fun facts a `?voor=` value asks for, or null for a missing or unknown value. */
export function recipientFromQuery(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const key = value.toLowerCase();
  return Object.hasOwn(RECIPIENT_PRESETS, key) ? RECIPIENT_PRESETS[key]! : null;
}
