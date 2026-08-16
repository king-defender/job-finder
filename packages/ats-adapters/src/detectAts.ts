export type AtsKind =
  | "greenhouse"
  | "lever"
  | "workday"
  | "ashby"
  | "smartrecruiters"
  | "icims"
  | "generic";

const HOST_PATTERNS: [RegExp, AtsKind][] = [
  [/greenhouse\.io$/i, "greenhouse"],
  [/lever\.co$/i, "lever"],
  [/myworkdayjobs\.com$/i, "workday"],
  [/ashbyhq\.com$/i, "ashby"],
  [/smartrecruiters\.com$/i, "smartrecruiters"],
  [/icims\.com$/i, "icims"],
];

/**
 * URL-pattern detection only, for reporting/tuning (Application.atsDetected)
 * — not currently used to scope form detection. PROJECT_PLAN.md's principle
 * is "generic form understanding over per-site scripts, adapters as a thin
 * layer" — and until there's a real posting to verify a selector against, a
 * guessed ATS-specific container selector risks silently matching zero
 * fields, which is worse than scanning the whole page. browser-agent's
 * detectFormFields() runs unscoped for every ATS including Greenhouse until
 * real postings are available to verify adapter-specific selectors against.
 */
export function detectAts(url: string): AtsKind {
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    return "generic";
  }

  for (const [pattern, kind] of HOST_PATTERNS) {
    if (pattern.test(host)) return kind;
  }
  return "generic";
}
