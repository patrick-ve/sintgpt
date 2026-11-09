// Lootjes trekken: everyone draws someone else. The draw happens in the
// browser and stays on the device.

export const MIN_LOOTJES_NAMES = 3;
export const MAX_LOOTJES_NAMES = 50;

export type NamesProblem = 'tooFew' | 'tooMany' | 'duplicate';

/** One name per line; empty lines and spaces around a name do not count. */
export function parseNames(text: string): string[] {
  return text
    .split('\n')
    .map(name => name.trim().replace(/\s+/g, ' '))
    .filter(Boolean);
}

export function checkNames(names: string[]): NamesProblem | null {
  if (names.length < MIN_LOOTJES_NAMES) return 'tooFew';
  if (names.length > MAX_LOOTJES_NAMES) return 'tooMany';
  const seen = new Set(names.map(name => name.toLocaleLowerCase('nl')));
  if (seen.size !== names.length) return 'duplicate';
  return null;
}

/** A whole number from 0 up to, not including, `max`. */
export type RandomInt = (max: number) => number;

export const cryptoRandomInt: RandomInt = (max) => {
  // Rejection sampling keeps every value equally likely.
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  const buffer = new Uint32Array(1);
  do crypto.getRandomValues(buffer);
  while (buffer[0]! >= limit);
  return buffer[0]! % max;
};

/**
 * Who draws whom, as giver → receiver. Sattolo's shuffle makes one circle
 * through everyone, so nobody draws themselves and no two people draw each
 * other (with three or more names).
 */
export function drawLootjes(names: string[], randomInt: RandomInt = cryptoRandomInt): Record<string, string> {
  const order = [...names];
  for (let i = order.length - 1; i > 0; i--) {
    const j = randomInt(i);
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  return Object.fromEntries(order.map((giver, i) => [giver, order[(i + 1) % order.length]!]));
}
