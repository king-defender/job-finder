export { BrowserSession } from "./session";
export { detectFormFields } from "./detectFields";
export { classifyField } from "./classify";
export { buildFillPlan, FILLABLE_TYPES } from "./mapToProfile";
export { applyFillPlan } from "./fill";
export type { FillOutcome } from "./fill";
export { detectCaptcha } from "./detectCaptcha";
export type { DetectedField, FieldClassification, FieldCategory, FillPlanEntry, FieldInputType } from "./types";
