import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { ApplyRunPayload, UnmappedField } from "@job-agent/shared";
import { BrowserSession, applyFillPlan, buildFillPlan, detectFormFields } from "@job-agent/browser-agent";
import { detectAts } from "@job-agent/ats-adapters";
import { getJob, getProfile, markApplying, reportRunResult } from "./apiClient";

const SCREENSHOT_DIR = join(process.cwd(), "uploads", "screenshots");

/**
 * `session` is shared across every run in this process (see index.ts) rather
 * than one per run — a Playwright persistent context locks its user-data-dir,
 * so a second context on the same dir would fail to launch while a prior
 * run's browser is still sitting open for review. Each run gets its own tab
 * (session.newPage()) in the one long-lived context instead.
 */
export async function runApply(payload: ApplyRunPayload, session: BrowserSession): Promise<void> {
  const { applicationId, jobId } = payload;
  await markApplying(applicationId);

  let page;
  try {
    const [job, profile] = await Promise.all([getJob(jobId), getProfile()]);
    const targetUrl = job.applicationUrl || job.url;
    if (!targetUrl) {
      throw new Error("Job has no application URL or posting URL to open.");
    }

    const ats = detectAts(targetUrl);
    page = await session.newPage();
    await page.goto(targetUrl, { waitUntil: "domcontentloaded" });

    const fields = await detectFormFields(page);
    const plan = buildFillPlan(fields, profile);
    const { failed } = await applyFillPlan(page, plan);

    await mkdir(SCREENSHOT_DIR, { recursive: true });
    const screenshotPath = join(SCREENSHOT_DIR, `${applicationId}-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    const unmappedFields: UnmappedField[] = [
      ...plan
        .filter((entry) => entry.value === null)
        .map((entry) => ({
          label: entry.field.label || "(unlabeled field)",
          classification:
            entry.classification.category === "red" ? ("red" as const) : ("unknown" as const),
        })),
      ...failed.map((entry) => ({
        label: entry.field.label || "(unlabeled field)",
        classification: "unknown" as const,
      })),
    ];

    await reportRunResult(applicationId, {
      status: "needs_review",
      atsDetected: ats,
      unmappedFields,
      screenshotPath,
      errorMessage: null,
    });
    // Tab stays open on success — that's the point of Copilot mode: review + submit yourself.
  } catch (err) {
    await page?.close().catch(() => undefined);
    await reportRunResult(applicationId, {
      status: "failed",
      atsDetected: null,
      unmappedFields: [],
      screenshotPath: null,
      errorMessage: (err as Error).message,
    });
  }
}
