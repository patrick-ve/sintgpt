// Long prompts cost money. The form and the API use the same limits.
export const POEM_INPUT_LIMITS = {
  name: 100,
  present: 200,
  funFacts: 2000,
  writtenBy: 200,
  writtenForAudience: 200,
  /** What the visitor wants changed in a rewrite, such as "korter". */
  rewriteHint: 200,
  /** The poem on screen, sent with a rewrite hint. 50 lines of verse fit easily. */
  previousPoem: 5000,
} as const;
