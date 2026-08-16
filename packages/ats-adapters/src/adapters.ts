import { AtsKind } from "./detectAts";

export interface AtsAdapterConfig {
  kind: AtsKind;
  containerSelectors: string[];
  submitSelectors: string[];
}

export const ATS_ADAPTERS: Record<AtsKind, AtsAdapterConfig> = {
  greenhouse: {
    kind: "greenhouse",
    containerSelectors: ["#application_form", "#application", "form"],
    submitSelectors: ["#submit_app", "input[type='submit']", "button[type='submit']"],
  },
  lever: {
    kind: "lever",
    containerSelectors: [".application-form", "form"],
    submitSelectors: [".postings-btn", "button[type='submit']", "input[type='submit']"],
  },
  ashby: {
    kind: "ashby",
    containerSelectors: ["form", "[class*='Ashby']"],
    submitSelectors: ["button[type='submit']", "button:has-text('Submit Application')"],
  },
  workday: {
    kind: "workday",
    containerSelectors: ["[data-automation-id='jobApplicationPage']", "form"],
    submitSelectors: [
      "button[data-automation-id='submit-button']",
      "button[data-automation-id='bottom-navigation-next-button']",
      "button[type='submit']",
    ],
  },
  smartrecruiters: {
    kind: "smartrecruiters",
    containerSelectors: ["form", "#application-form"],
    submitSelectors: ["button[type='submit']", "#submit-btn"],
  },
  icims: {
    kind: "icims",
    containerSelectors: ["form", "iframe"],
    submitSelectors: ["input[type='submit']", "button[type='submit']"],
  },
  generic: {
    kind: "generic",
    containerSelectors: ["form", "main", "body"],
    submitSelectors: [
      "button[type='submit']",
      "input[type='submit']",
      "button:has-text('Submit')",
      "button:has-text('Submit Application')",
      "button:has-text('Apply')",
    ],
  },
};

export function getAtsAdapter(kind: AtsKind): AtsAdapterConfig {
  return ATS_ADAPTERS[kind] ?? ATS_ADAPTERS.generic;
}
