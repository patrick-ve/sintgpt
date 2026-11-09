// Days until pakjesavond (5 December), counted in Dutch calendar days, so the
// page agrees with the visitor's calendar whatever time zone the server uses.

/** Shown from about the first week of October until 5 December. */
export const COUNTDOWN_FROM_DAYS = 60;
/** From this many days before, the page adds that a poem takes 30 seconds. */
export const HURRY_FROM_DAYS = 3;

export interface PakjesavondCountdown {
  days: number;
  hurry: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** The calendar date in the Netherlands, as UTC midnight of that date. */
function dutchDate(now: Date): number {
  const [year, month, day] = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Amsterdam',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(now)
    .split('-')
    .map(Number);
  return Date.UTC(year!, month! - 1, day!);
}

/** Null outside the season and after 5 December. */
export function pakjesavondCountdown(now: Date): PakjesavondCountdown | null {
  const today = dutchDate(now);
  const year = new Date(today).getUTCFullYear();
  const days = Math.round((Date.UTC(year, 11, 5) - today) / DAY_MS);
  if (days < 0 || days > COUNTDOWN_FROM_DAYS) return null;
  return { days, hurry: days <= HURRY_FROM_DAYS };
}
