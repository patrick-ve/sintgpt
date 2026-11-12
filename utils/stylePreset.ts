// A link such as /?stijl=roast#poem-form opens the form with that style chosen.
// The blog posts about one style use it. The parameter holds no visitor data,
// and the page removes it from the address bar after reading it.

export type PoemStyle = 'funny' | 'classic' | 'ironic' | 'old-fashioned' | 'spicy' | 'roast';

export const STYLE_PARAM = 'stijl';

/** The Dutch word in the link, as the style is called on the page. */
export const STYLE_PRESETS: Record<string, PoemStyle> = {
  grappig: 'funny',
  klassiek: 'classic',
  ironisch: 'ironic',
  ouderwets: 'old-fashioned',
  pikant: 'spicy',
  roast: 'roast',
};

/** The style a `?stijl=` value asks for, or null for a missing or unknown value. */
export function styleFromQuery(value: unknown): PoemStyle | null {
  if (typeof value !== 'string') return null;
  return Object.hasOwn(STYLE_PRESETS, value.toLowerCase()) ? STYLE_PRESETS[value.toLowerCase()]! : null;
}
