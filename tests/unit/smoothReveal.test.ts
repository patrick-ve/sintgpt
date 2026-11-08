import { describe, expect, it } from 'vitest';
import { createSmoothReveal, revealRate } from '../../utils/smoothReveal';

function fakeScheduler(instant = false) {
  let time = 0;
  let pending: (() => void) | null = null;
  return {
    scheduler: {
      now: () => time,
      schedule(callback: () => void) {
        pending = callback;
        return () => {
          pending = null;
        };
      },
      isInstant: () => instant,
    },
    /** Runs animation frames of 16 ms until nothing is pending. */
    run(frames = Infinity) {
      for (let i = 0; i < frames && pending; i++) {
        time += 16;
        const callback = pending;
        pending = null;
        callback();
      }
    },
    get isPending() {
      return pending !== null;
    },
  };
}

describe('revealRate', () => {
  it('has a readable minimum pace and speeds up for a big backlog', () => {
    expect(revealRate(1)).toBe(80);
    expect(revealRate(1000)).toBe(500);
  });
});

describe('createSmoothReveal', () => {
  const poem = 'Sint hoorde dat oma Truus, zo lief en zo fijn,\n'.repeat(10);

  it('reveals a burst of text gradually, in order, and completely', () => {
    const fake = fakeScheduler();
    const seen: string[] = [];
    const reveal = createSmoothReveal(text => seen.push(text), fake.scheduler);

    reveal.push(poem);
    fake.run(5);
    expect(seen.at(-1)!.length).toBeGreaterThan(0);
    expect(seen.at(-1)!.length).toBeLessThan(poem.length / 4);

    fake.run();
    expect(seen.at(-1)).toBe(poem);
    for (let i = 1; i < seen.length; i++) {
      expect(seen[i]!.startsWith(seen[i - 1]!)).toBe(true);
    }
  });

  it('never takes long to finish a typical poem', () => {
    const fake = fakeScheduler();
    let frames = 0;
    const reveal = createSmoothReveal(() => frames++, fake.scheduler);
    reveal.push(poem);
    fake.run();
    // Under 6 seconds of 16 ms frames for about 470 characters.
    expect(frames).toBeLessThan(6000 / 16);
  });

  it('resolves finish only when all text is on screen', async () => {
    const fake = fakeScheduler();
    let text = '';
    const reveal = createSmoothReveal((t) => {
      text = t;
    }, fake.scheduler);
    reveal.push(poem);

    let finished = false;
    const done = reveal.finish().then(() => {
      finished = true;
    });
    await Promise.resolve();
    expect(finished).toBe(false);

    fake.run();
    await done;
    expect(text).toBe(poem);
  });

  it('resolves finish at once when there is nothing to show', async () => {
    const reveal = createSmoothReveal(() => {}, fakeScheduler().scheduler);
    await expect(reveal.finish()).resolves.toBeUndefined();
  });

  it('shows text at once for reduced motion and hidden tabs', () => {
    const fake = fakeScheduler(true);
    let text = '';
    const reveal = createSmoothReveal((t) => {
      text = t;
    }, fake.scheduler);
    reveal.push(poem);
    fake.run(1);
    expect(text).toBe(poem);
  });

  it('never cuts an emoji in half', () => {
    const fake = fakeScheduler();
    const seen: string[] = [];
    const reveal = createSmoothReveal(text => seen.push(text), fake.scheduler);
    reveal.push('🎁'.repeat(200));
    fake.run();
    for (const text of seen) {
      expect(text.length % 2).toBe(0);
    }
  });

  it('stops on cancel and releases a waiting finish', async () => {
    const fake = fakeScheduler();
    const reveal = createSmoothReveal(() => {}, fake.scheduler);
    reveal.push(poem);
    const done = reveal.finish();
    reveal.cancel();
    expect(fake.isPending).toBe(false);
    await expect(done).resolves.toBeUndefined();
  });
});
