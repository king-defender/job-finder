/**
 * Same coarse-normalization approach as dedup.ts (lowercase, strip
 * punctuation, collapse whitespace) applied to form-field labels, so
 * "Expected Salary?" and "expected salary" collide in Answer Memory but two
 * genuinely different questions don't accidentally merge.
 */
export function normalizeQuestion(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
