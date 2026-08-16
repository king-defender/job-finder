import { Page } from "playwright";
import { FillPlanEntry } from "./types";

export interface FillOutcome {
  filledCount: number;
  /** Entries that had a planned value but errored on fill (stale selector, site changed, ...) — not the same as entries skipped by design. */
  failed: FillPlanEntry[];
}

export async function applyFillPlan(page: Page, plan: FillPlanEntry[]): Promise<FillOutcome> {
  let filledCount = 0;
  const failed: FillPlanEntry[] = [];

  for (const entry of plan) {
    if (entry.value === null) continue;
    const locator = page.locator(entry.field.selector);
    try {
      if (entry.field.inputType === "file") {
        await locator.setInputFiles(entry.value);
      } else {
        await locator.fill(entry.value);
      }
      filledCount++;
    } catch {
      failed.push(entry);
    }
  }

  return { filledCount, failed };
}
