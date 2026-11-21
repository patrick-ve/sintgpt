// Poem length. The form's slider offers 8 to 40 lines in steps of 4 (stanzas of
// four). A limerick is always one verse of 5 lines: the slider is off, and the
// server writes 5 lines whatever length the request says.
export const POEM_LINES = { min: 8, max: 40, step: 4, default: 12 } as const;
export const LIMERICK_LINES = 5;

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
