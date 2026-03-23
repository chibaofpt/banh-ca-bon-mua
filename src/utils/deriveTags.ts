/**
 * deriveTags extracts the first two comma-separated phrases from a description.
 * These are used as UI badges/tags on menu cards.
 */
export const deriveTags = (description: string): string[] =>
  description.split(',').slice(0, 2).map((s) => s.trim());
