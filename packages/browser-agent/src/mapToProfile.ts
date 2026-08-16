import { CandidateProfile } from "@job-agent/shared";
import { classifyField } from "./classify";
import { DetectedField, FillPlanEntry } from "./types";

/**
 * Only text-like inputs are auto-filled in Phase 3. select/checkbox/radio
 * fields need their actual option set to answer correctly (a "notice period"
 * dropdown might offer "Immediate/2 weeks/1 month", not a raw number) —
 * guessing at options generically is a harder, separate problem, deliberately
 * deferred rather than filled with a plausible-looking wrong answer.
 */
export const FILLABLE_TYPES = new Set(["text", "email", "tel", "textarea", "file"]);

function resolveGreenValue(profileKey: string, label: string, profile: CandidateProfile): string | null {
  switch (profileKey) {
    case "name": {
      const parts = profile.name.trim().split(/\s+/);
      if (/first name/i.test(label)) return parts[0] ?? null;
      if (/last name/i.test(label)) return parts.length > 1 ? parts[parts.length - 1] : null;
      return profile.name || null;
    }
    case "email":
      return profile.email || null;
    case "phone":
      return profile.phone || null;
    case "links.linkedin":
      return profile.links.linkedin ?? null;
    case "links.github":
      return profile.links.github ?? null;
    case "links.portfolio":
      return profile.links.portfolio ?? null;
    case "currentCompany":
      return profile.currentCompany || null;
    case "currentRole":
      return profile.currentRole || null;
    case "location":
      return profile.location || null;
    case "documents.resume": {
      const resume = [...profile.documents].reverse().find((d) => d.label === "resume");
      return resume?.storagePath ?? null;
    }
    default:
      return null;
  }
}

function resolveYellowValue(profileKey: string, profile: CandidateProfile): string | null {
  const prefs = profile.preferences;
  switch (profileKey) {
    case "preferences.expectedSalaryMin":
      return prefs.expectedSalaryMin !== null ? String(prefs.expectedSalaryMin) : null;
    case "preferences.noticePeriodDays":
      return prefs.noticePeriodDays !== null ? String(prefs.noticePeriodDays) : null;
    case "preferences.remoteOnly":
      return prefs.remoteOnly ? "Yes" : "No";
    case "preferences.relocate":
      // No dedicated relocation preference stored yet — left for the human rather than guessed.
      return null;
    default:
      return null;
  }
}

export function buildFillPlan(fields: DetectedField[], profile: CandidateProfile): FillPlanEntry[] {
  return fields.map((field) => {
    const classification = classifyField(field.label);

    if (classification.category === "red") {
      return { field, classification, value: null, skippedReason: "sensitive question — never auto-answered" };
    }

    if (!FILLABLE_TYPES.has(field.inputType)) {
      return {
        field,
        classification,
        value: null,
        skippedReason: `${field.inputType} fields aren't auto-filled yet — needs the actual option set`,
      };
    }

    if (classification.category === "green" && classification.profileKey) {
      const value = resolveGreenValue(classification.profileKey, field.label, profile);
      return value !== null
        ? { field, classification, value }
        : { field, classification, value: null, skippedReason: "profile has no value for this field" };
    }

    if (classification.category === "yellow" && classification.profileKey) {
      const value = resolveYellowValue(classification.profileKey, profile);
      return value !== null
        ? { field, classification, value }
        : { field, classification, value: null, skippedReason: "no stored preference for this field" };
    }

    return { field, classification, value: null, skippedReason: "could not classify this field" };
  });
}
