// Dutch calendar days for the analytics scripts and the poem counter: they count
// days as the site owner sees them, in Europe/Amsterdam, whatever the machine's zone.

const TZ = 'Europe/Amsterdam';

const wallClock = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

/** The Dutch wall-clock time of `at`, written as if it were UTC. */
function dutchWallClock(at: number): number {
  const parts = Object.fromEntries(wallClock.formatToParts(at).map(part => [part.type, part.value]));
  return Date.UTC(+parts.year!, +parts.month! - 1, +parts.day!, +parts.hour!, +parts.minute!, +parts.second!);
}

/** The start (00:00 in the Netherlands) of the Dutch calendar day `daysAgo` days before `now`. */
export function dutchDayStart(now: Date, daysAgo = 0): Date {
  const wall = new Date(dutchWallClock(now.getTime()));
  const midnight = Date.UTC(wall.getUTCFullYear(), wall.getUTCMonth(), wall.getUTCDate() - daysAgo);
  // Clocks change at 02:00 or 03:00, so the offset at midnight is the offset of that whole night.
  const offset = dutchWallClock(midnight) - midnight;
  return new Date(midnight - offset);
}

/** An Analytics Engine SQL timestamp: `YYYY-MM-DD HH:MM:SS` in UTC. */
export function sqlTimestamp(at: Date): string {
  return at.toISOString().slice(0, 19).replace('T', ' ');
}

/** `HH:MM` in Dutch time. */
export function dutchTime(at: Date): string {
  return new Intl.DateTimeFormat('nl-NL', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(at);
}
