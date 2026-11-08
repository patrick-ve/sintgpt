// AI models and networks deliver text in bursts. This reveals it at a steady,
// readable pace on the client, so the page looks the same however the chunks
// arrive (Cloudflare, proxies and slow connections can all group them).

/** The slowest pace, in characters per second. */
const BASE_CHARS_PER_SECOND = 80;
/** How far the text may lag behind: a backlog drains in about this time. */
const CATCH_UP_SECONDS = 2;
/** A long pause between frames must not cause a jump. */
const MAX_FRAME_MS = 100;
/** Browsers pause animation frames in background tabs; this keeps going. */
const FALLBACK_TIMER_MS = 250;

export function revealRate(backlog: number): number {
  return Math.max(BASE_CHARS_PER_SECOND, backlog / CATCH_UP_SECONDS);
}

export interface RevealScheduler {
  now: () => number;
  /** Calls `callback` soon. Returns a function that cancels the call. */
  schedule: (callback: () => void) => () => void;
  /** True when text must appear at once (reduced motion, hidden tab). */
  isInstant: () => boolean;
}

function browserScheduler(): RevealScheduler {
  return {
    now: () => performance.now(),
    schedule(callback) {
      const run = () => {
        cancel();
        callback();
      };
      const frame = requestAnimationFrame(run);
      const timer = setTimeout(run, FALLBACK_TIMER_MS);
      const cancel = () => {
        cancelAnimationFrame(frame);
        clearTimeout(timer);
      };
      return cancel;
    },
    isInstant: () =>
      document.hidden
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  };
}

export interface SmoothReveal {
  /** Adds received text. */
  push: (delta: string) => void;
  /** Resolves when all received text is on screen. */
  finish: () => Promise<void>;
  /** Stops at once, for example after an error. */
  cancel: () => void;
}

export function createSmoothReveal(
  apply: (text: string) => void,
  scheduler: RevealScheduler = browserScheduler(),
): SmoothReveal {
  let target = '';
  let shown = 0;
  let carry = 0;
  let lastFrame = 0;
  let cancelFrame: (() => void) | null = null;
  let onDrained: (() => void) | null = null;

  const scheduleTick = () => {
    if (!cancelFrame) cancelFrame = scheduler.schedule(tick);
  };

  function tick() {
    cancelFrame = null;
    const now = scheduler.now();
    const elapsedMs = Math.min(now - lastFrame, MAX_FRAME_MS);
    lastFrame = now;

    let next = target.length;
    if (!scheduler.isInstant()) {
      carry += revealRate(target.length - shown) * (elapsedMs / 1000);
      const step = Math.floor(carry);
      carry -= step;
      next = Math.min(target.length, shown + step);
      // Never cut an emoji (a surrogate pair) in half.
      const lastUnit = target.charCodeAt(next - 1);
      if (next < target.length && lastUnit >= 0xd800 && lastUnit <= 0xdbff) next++;
    }

    if (next !== shown) {
      shown = next;
      apply(target.slice(0, shown));
    }

    if (shown < target.length) scheduleTick();
    else onDrained?.();
  }

  return {
    push(delta) {
      if (!delta) return;
      if (!cancelFrame && shown === target.length) lastFrame = scheduler.now();
      target += delta;
      scheduleTick();
    },
    finish() {
      if (shown === target.length) return Promise.resolve();
      return new Promise((resolve) => {
        onDrained = resolve;
      });
    },
    cancel() {
      cancelFrame?.();
      cancelFrame = null;
      onDrained?.();
      onDrained = null;
    },
  };
}
