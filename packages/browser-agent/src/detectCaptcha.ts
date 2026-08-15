import { Page } from "playwright";

/**
 * Common CAPTCHA widget markers. This never attempts to solve anything — it
 * only flags presence so the human already reviewing the open tab knows to
 * look for it, rather than assuming "needs_review" means the form is fully
 * ready to submit.
 */
const CAPTCHA_SELECTORS = [
  'iframe[src*="recaptcha"]',
  'iframe[src*="hcaptcha"]',
  ".g-recaptcha",
  "#h-captcha",
  '[data-sitekey]',
  'div[class*="captcha" i]',
];

export async function detectCaptcha(page: Page): Promise<boolean> {
  for (const selector of CAPTCHA_SELECTORS) {
    const count = await page.locator(selector).count();
    if (count > 0) return true;
  }
  return false;
}
