/**
 * Best-effort numeric extraction from free-text salary strings ("₹12-16 LPA",
 * "$120k-150k", "1,200,000"). This is deliberately a regex parse, not an LLM
 * call — salary match is a minor scoring input, and a wrong parse should fail
 * toward "unknown" (neutral score) rather than silently misinforming a
 * consequential recommendation.
 *
 * Always returns the lower bound of a detected range as a raw annual figure
 * in the stated currency (unit suffixes are expanded: "LPA" x100000, "k"
 * x1000) — e.g. "12 LPA" -> 1200000, "$120k" -> 120000. Callers must enter
 * CandidatePreferences.expectedSalaryMin in the same raw-annual convention
 * for the comparison in scorer.ts to be meaningful.
 */
export function parseSalaryFigure(text: string): number | null {
  const cleaned = text.replace(/,/g, "");
  const lpaMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*(?:-|to)?\s*(\d+(?:\.\d+)?)?\s*lpa/i);
  if (lpaMatch) {
    return Number(lpaMatch[1]) * 100000;
  }

  const kMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*k\b/i);
  if (kMatch) {
    return Number(kMatch[1]) * 1000;
  }

  const plainMatch = cleaned.match(/(\d{4,})/);
  if (plainMatch) {
    return Number(plainMatch[1]);
  }

  return null;
}
