// The three things a visitor can buy after the free poem. The page, the
// server and the legal texts all read from here, so keep the locales
// (payment.tiers, legal.terms) in line with these numbers.
//
// Gezin is the recommended tier: the small tier makes it look like good value
// ("voor €3 meer schrijf je zoveel gedichten als je wilt"), the large tier
// makes its price look modest. Every tier is a real offer.

export const TIER_IDS = ['drie', 'gezin', 'familie'] as const;
export type TierId = (typeof TIER_IDS)[number];

/** Highlighted and selected by default. Never call it "most chosen" without data. */
export const RECOMMENDED_TIER: TierId = 'gezin';

export type TierValidity =
  | { kind: 'days'; days: number }
  /** Until the end of pakjesavond; 2 seasons is this one and the next. */
  | { kind: 'pakjesavond'; seasons: number };

export interface Tier {
  id: TierId;
  /** Including VAT. */
  priceCents: number;
  /** Poems in total, or null for as many as the daily cap allows. */
  poems: number | null;
  /** "Herschrijf dit gedicht" with the larger model. */
  rewrites: boolean;
  /** The PDF designs in EXTRA_PDF_DESIGN_IDS. */
  extraDesigns: boolean;
  /** Surprise ideas for the poem on screen. */
  surpriseIdeas: boolean;
  validity: TierValidity;
}

export const TIERS: Record<TierId, Tier> = {
  drie: {
    id: 'drie',
    priceCents: 399,
    poems: 3,
    rewrites: false,
    extraDesigns: false,
    surpriseIdeas: false,
    validity: { kind: 'pakjesavond', seasons: 1 },
  },
  gezin: {
    id: 'gezin',
    priceCents: 699,
    poems: null,
    rewrites: true,
    extraDesigns: false,
    surpriseIdeas: false,
    validity: { kind: 'days', days: 365 },
  },
  familie: {
    id: 'familie',
    priceCents: 1299,
    poems: null,
    rewrites: true,
    extraDesigns: true,
    surpriseIdeas: true,
    validity: { kind: 'pakjesavond', seasons: 2 },
  },
};

export function isTierId(value: unknown): value is TierId {
  return typeof value === 'string' && (TIER_IDS as readonly string[]).includes(value);
}

/** Tiers in order of price; a visitor can only move up. */
export function tiersAbove(tier: TierId | null): TierId[] {
  if (!tier) return [...TIER_IDS];
  return TIER_IDS.slice(TIER_IDS.indexOf(tier) + 1);
}

/** "€6,99" in Dutch, "€6.99" in English. */
export function formatPrice(cents: number, locale: 'nl' | 'en' = 'nl'): string {
  const amount = (cents / 100).toFixed(2);
  return `€${locale === 'nl' ? amount.replace('.', ',') : amount}`;
}

/** The price per poem, rounded up to whole cents, so the page never claims too little. */
export function pricePerPoemCents(tier: Tier): number | null {
  return tier.poems ? Math.ceil(tier.priceCents / tier.poems) : null;
}

/**
 * The end of pakjesavond: midnight after 5 December in the Netherlands, which
 * is 23:00 UTC (December is always winter time). `seasons` 1 is the first
 * pakjesavond that has not ended at `from`, 2 the one after it.
 */
export function pakjesavondEnd(from: Date, seasons = 1): Date {
  const year = from.getUTCFullYear();
  const thisYear = Date.UTC(year, 11, 5, 23);
  const first = from.getTime() < thisYear ? year : year + 1;
  return new Date(Date.UTC(first + seasons - 1, 11, 5, 23));
}

/** When access from a payment made at `paidAt` ends. */
export function accessExpiry(tier: TierId, paidAt: Date): Date {
  const { validity } = TIERS[tier];
  if (validity.kind === 'days') return new Date(paidAt.getTime() + validity.days * 24 * 60 * 60 * 1000);
  return pakjesavondEnd(paidAt, validity.seasons);
}

/** Fills in {season} and {nextSeason} in tier texts: the years of the next two pakjesavonden. */
export function fillSeasons(text: string, now = new Date()): string {
  return text
    .replace('{season}', String(pakjesavondEnd(now).getUTCFullYear()))
    .replace('{nextSeason}', String(pakjesavondEnd(now, 2).getUTCFullYear()));
}
