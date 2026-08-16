import { chromium, BrowserContext, Page } from "playwright";
import { join } from "node:path";
import { homedir } from "node:os";

const DEFAULT_USER_DATA_DIR = join(homedir(), ".job-agent", "browser-profile");

/**
 * Wraps a Playwright persistent context. Persistent = a real profile
 * directory, so a login done once (some ATSs require a candidate account)
 * survives across runs without re-authenticating each time.
 */
export class BrowserSession {
  private context: BrowserContext | null = null;

  constructor(private readonly userDataDir: string = DEFAULT_USER_DATA_DIR) {}

  /**
   * Headed (visible), not headless — Copilot mode means a human reviews and
   * submits the filled form themselves, in the same window the agent just
   * filled. Headless would leave nothing for them to look at.
   */
  async open(): Promise<BrowserContext> {
    if (this.context) return this.context;
    this.context = await chromium.launchPersistentContext(this.userDataDir, {
      headless: false,
    });
    return this.context;
  }

  async newPage(): Promise<Page> {
    const context = await this.open();
    return context.newPage();
  }

  /** Only for aborting a failed run — a successful fill leaves the browser open for manual review. */
  async closeWithoutReview(): Promise<void> {
    await this.context?.close();
    this.context = null;
  }
}
