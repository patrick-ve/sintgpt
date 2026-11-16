// Timing of the steps the writing animation shows while the model reasons,
// before the first text arrives. Measured waits (November 2026): a new poem
// (Gemini 3.7 Flash) gets its first text after about 28 s; a rewrite
// (Gemini 3.1 Pro, medium) after 45 to 100 s. The texts are in the locales
// (`poem.writing.steps`, `poem.writing.rewriteSteps`), one per entry here.

export type WritingKind = 'new' | 'rewrite';

/** Second at which each step starts. The last step waits for a slow answer. */
export const WRITING_STEP_SECONDS: Record<WritingKind, readonly number[]> = {
  new: [0, 5, 11, 18, 25, 33, 50],
  rewrite: [0, 8, 18, 30, 45, 65, 100],
};

/** The usual wait for the first text, in seconds. */
export const EXPECTED_WRITING_SECONDS: Record<WritingKind, number> = {
  new: 30,
  rewrite: 70,
};

export function writingStepIndex(kind: WritingKind, elapsedSeconds: number): number {
  const starts = WRITING_STEP_SECONDS[kind];
  let index = 0;
  for (let i = 0; i < starts.length; i++) {
    if (elapsedSeconds >= starts[i]!) index = i;
  }
  return index;
}

/**
 * How far the bar is, from 0 to 0.95. It reaches about 85% at the usual
 * wait and then slows down, so it never shows "done" before the poem is there.
 */
export function writingProgress(kind: WritingKind, elapsedSeconds: number): number {
  const expected = EXPECTED_WRITING_SECONDS[kind];
  return 0.95 * (1 - Math.exp((-2.3 * Math.max(0, elapsedSeconds)) / expected));
}
