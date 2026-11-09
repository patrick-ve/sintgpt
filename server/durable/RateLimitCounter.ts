import { applyRateLimit, usedInWindow, type RateLimitEntry, type RateLimitRule } from '../utils/rateLimit';

/** The parts of the Durable Object state this class uses. */
export interface CounterState {
  storage: {
    get<T>(key: string): Promise<T | undefined>;
    put<T>(key: string, value: T): Promise<void>;
    deleteAll(): Promise<void>;
    setAlarm(scheduledTime: number): Promise<void>;
  };
}

const ENTRY = 'entry';

/**
 * One Durable Object per IP or per buyer, so every Cloudflare location sees the
 * same count. The Worker sends the rule in the body; nothing outside the Worker
 * can reach this object.
 *
 * The object deletes its own data when the window ends: after a day, or for a
 * Drie payment at the end of pakjesavond. The key is a hash, never the IP
 * address or payment ID itself.
 */
export class RateLimitCounter {
  constructor(private readonly state: CounterState) {}

  async fetch(request: Request): Promise<Response> {
    const now = Date.now();
    // How many poems this window has used, without counting one.
    if (new URL(request.url).pathname === '/peek') {
      return Response.json({ used: usedInWindow(await this.state.storage.get<RateLimitEntry>(ENTRY), now) });
    }
    const rule = (await request.json()) as RateLimitRule;
    // Input gates hold other requests to this object while storage is busy,
    // so this read and write cannot interleave with another check.
    const current = await this.state.storage.get<RateLimitEntry>(ENTRY);
    const { verdict, entry } = applyRateLimit(current, now, rule);
    if (entry) {
      await this.state.storage.put(ENTRY, entry);
      // A new window: delete the data when it ends. An alarm costs a write, so
      // set it once per window, not per request.
      if (entry.count === 1) await this.state.storage.setAlarm(entry.resetTime);
    }
    return Response.json(verdict);
  }

  async alarm(): Promise<void> {
    await this.state.storage.deleteAll();
  }
}
