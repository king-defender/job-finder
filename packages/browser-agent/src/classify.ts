import { FieldClassification } from "./types";

/**
 * Classification is keyword-matching against label text, not an LLM call —
 * see PROJECT_PLAN.md's Red-question policy: whether a question is
 * consequential (legal/work-authorization/disability/criminal-history) must
 * be decided deterministically, not by model judgment, local or hosted.
 * Order matters: red is checked first so a label that happens to also
 * contain an innocuous word never slips into green/yellow.
 */

const RED_PATTERNS: RegExp[] = [
  /authoriz(e|ation).*work/i,
  /work.*authoriz/i,
  /sponsor(ship)?/i,
  /visa/i,
  /disab(led|ility)/i,
  /accommodat/i,
  /veteran/i,
  /(criminal|convicted|felony|misdemeanor)/i,
  /background check/i,
  /(gender|race|ethnicity)\b/i,
  /pronoun/i,
];

const GREEN_PATTERNS: [RegExp, string][] = [
  [/first name/i, "name"],
  [/last name/i, "name"],
  [/full name/i, "name"],
  [/^\s*name\s*$/i, "name"],
  [/e-?mail/i, "email"],
  [/phone/i, "phone"],
  [/linkedin/i, "links.linkedin"],
  [/github/i, "links.github"],
  [/portfolio|personal website/i, "links.portfolio"],
  [/current (company|employer)/i, "currentCompany"],
  [/current (role|title|position)/i, "currentRole"],
  [/\b(city|location)\b/i, "location"],
  [/resume|cv\b/i, "documents.resume"],
];

const YELLOW_PATTERNS: [RegExp, string][] = [
  [/(expected|desired) salary|salary expectation/i, "preferences.expectedSalaryMin"],
  [/notice period/i, "preferences.noticePeriodDays"],
  [/willing to relocate|relocation/i, "preferences.relocate"],
  [/remote/i, "preferences.remoteOnly"],
];

export function classifyField(label: string): FieldClassification {
  const text = label.trim();
  if (!text) return { category: "unknown" };

  for (const pattern of RED_PATTERNS) {
    if (pattern.test(text)) return { category: "red" };
  }
  for (const [pattern, profileKey] of GREEN_PATTERNS) {
    if (pattern.test(text)) return { category: "green", profileKey };
  }
  for (const [pattern, profileKey] of YELLOW_PATTERNS) {
    if (pattern.test(text)) return { category: "yellow", profileKey };
  }
  return { category: "unknown" };
}
