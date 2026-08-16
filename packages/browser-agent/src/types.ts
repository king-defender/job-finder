export type FieldInputType =
  | "text"
  | "email"
  | "tel"
  | "textarea"
  | "select"
  | "checkbox"
  | "radio"
  | "file"
  | "unknown";

export interface DetectedField {
  /** CSS selector targeting a `data-job-agent-field` attribute this package stamped onto the element. Only valid for the page it was detected on. */
  selector: string;
  label: string;
  inputType: FieldInputType;
  required: boolean;
}

export type FieldCategory = "green" | "yellow" | "red" | "unknown";

export interface FieldClassification {
  category: FieldCategory;
  /** Which CandidateProfile/preferences path this maps to, for green/yellow fields — informational, not used programmatically outside classify.ts. */
  profileKey?: string;
}

export interface FillPlanEntry {
  field: DetectedField;
  classification: FieldClassification;
  /** Value to fill, or null if this field is being left for the human (red, unknown, or unsupported input type). */
  value: string | null;
  skippedReason?: string;
}
