function normalize(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Same job posted with slightly different casing/whitespace/punctuation across
 * sources (or pasted twice) should collide. This is intentionally coarse —
 * title+company+location, not a fuzzy/semantic match — so it's predictable
 * and doesn't accidentally merge two genuinely different roles.
 */
export function computeDedupKey(title: string, company: string, location: string): string {
  return [normalize(company), normalize(title), normalize(location)].join("::");
}
