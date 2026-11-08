// Long prompts cost money. The form and the API use the same limits.
export const POEM_INPUT_LIMITS = {
  name: 100,
  present: 200,
  funFacts: 2000,
  writtenBy: 200,
  writtenForAudience: 200,
} as const;
