import type { Page } from "playwright";
import { getAtsAdapter, AtsKind } from "@job-agent/ats-adapters";

export interface SubmitResult {
  submitted: boolean;
  selectorUsed: string | null;
  error: string | null;
}

export async function submitForm(page: Page, atsKind: AtsKind): Promise<SubmitResult> {
  const adapter = getAtsAdapter(atsKind);

  for (const selector of adapter.submitSelectors) {
    try {
      const button = page.locator(selector).first();
      if ((await button.count()) > 0 && (await button.isVisible())) {
        await button.click();
        await page.waitForTimeout(2000);
        return {
          submitted: true,
          selectorUsed: selector,
          error: null,
        };
      }
    } catch (err) {
      // Continue to next selector if this one failed or was hidden
    }
  }

  return {
    submitted: false,
    selectorUsed: null,
    error: `No clickable submit button found for ATS "${atsKind}".`,
  };
}
