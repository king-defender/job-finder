import { Application } from "@job-agent/shared";

/**
 * PROJECT_PLAN.md §9's Controlled auto-apply thresholds: match > 85%, zero
 * unknown questions, zero red-flag questions, no CAPTCHA. This module is
 * decision logic only — it answers "would this qualify," nothing in this
 * codebase acts on the answer by actually submitting anything. See §12/§14
 * for why: submission requires the fill mechanism itself to be verified
 * against a real ATS page first, which hasn't happened yet.
 */
export const MATCH_SCORE_THRESHOLD = 85;

export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
}

type EligibilityInput = Pick<Application, "status" | "matchScore" | "unmappedFields" | "captchaDetected">;

export function evaluateEligibility(application: EligibilityInput): EligibilityResult {
  const reasons: string[] = [];

  if (application.status !== "needs_review") {
    reasons.push(`status is "${application.status}", not a completed fill run`);
  }
  if (application.matchScore < MATCH_SCORE_THRESHOLD) {
    reasons.push(`match score ${application.matchScore} is below ${MATCH_SCORE_THRESHOLD}`);
  }
  if (application.unmappedFields.length > 0) {
    reasons.push(`${application.unmappedFields.length} unmapped field(s) — includes any red-classified questions`);
  }
  if (application.captchaDetected) {
    reasons.push("CAPTCHA present on the page");
  }

  return { eligible: reasons.length === 0, reasons };
}
