import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { ApplyRunPayload, UnmappedField } from "@job-agent/shared";
import {
  BrowserSession,
  FILLABLE_TYPES,
  FillPlanEntry,
  applyFillPlan,
  buildFillPlan,
  detectCaptcha,
  detectFormFields,
} from "@job-agent/browser-agent";
import { detectAts } from "@job-agent/ats-adapters";
import { Notifier } from "@job-agent/notifications";
import { getJob, getProfile, lookupAnswer, markApplying, reportRunResult } from "./apiClient";

const SCREENSHOT_DIR = join(process.cwd(), "uploads", "screenshots");

/**
 * For fields the profile couldn't answer, check Answer Memory before giving
 * up on them — same green/yellow-only, never-red rule as everywhere else.
 * Only fillable input types are attempted, same restriction as the profile
 * pass (a stored answer for a dropdown still isn't safe to blind-fill).
 */
async function fillFromMemory(plan: FillPlanEntry[]): Promise<FillPlanEntry[]> {
  const candidates = plan.filter(
    (entry) =>
      entry.value === null &&
      entry.classification.category !== "red" &&
      FILLABLE_TYPES.has(entry.field.inputType),
  );

  const resolved: FillPlanEntry[] = [];
  for (const entry of candidates) {
    const remembered = await lookupAnswer(entry.field.label);
    if (remembered) {
      resolved.push({ ...entry, value: remembered.answer });
    }
  }
  return resolved;
}

/**
 * `session` is shared across every run in this process (see index.ts) rather
 * than one per run — a Playwright persistent context locks its user-data-dir,
 * so a second context on the same dir would fail to launch while a prior
 * run's browser is still sitting open for review. Each run gets its own tab
 * (session.newPage()) in the one long-lived context instead.
 */
export async function runApply(
  payload: ApplyRunPayload,
  session: BrowserSession,
  notifier: Notifier,
): Promise<void> {
  const { applicationId, jobId } = payload;
  await markApplying(applicationId);

  let page;
  let jobTitle = applicationId;
  try {
    const [job, profile] = await Promise.all([getJob(jobId), getProfile()]);
    jobTitle = `${job.title} @ ${job.company}`;
    const targetUrl = job.applicationUrl || job.url;
    if (!targetUrl) {
      throw new Error("Job has no application URL or posting URL to open.");
    }

    const ats = detectAts(targetUrl);
    page = await session.newPage();
    await page.goto(targetUrl, { waitUntil: "domcontentloaded" });

    const fields = await detectFormFields(page);
    const plan = buildFillPlan(fields, profile);
    const { failed: profileFillFailed } = await applyFillPlan(page, plan);

    const memoryPlan = await fillFromMemory(plan);
    const { failed: memoryFillFailed } = await applyFillPlan(page, memoryPlan);
    const filledFromMemoryLabels = new Set(memoryPlan.map((e) => e.field.selector));

    const captchaDetected = await detectCaptcha(page);

    await mkdir(SCREENSHOT_DIR, { recursive: true });
    const screenshotPath = join(SCREENSHOT_DIR, `${applicationId}-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    const unmappedFields: UnmappedField[] = [
      ...plan
        .filter((entry) => entry.value === null && !filledFromMemoryLabels.has(entry.field.selector))
        .map((entry) => ({
          label: entry.field.label || "(unlabeled field)",
          classification:
            entry.classification.category === "red" ? ("red" as const) : ("unknown" as const),
        })),
      ...profileFillFailed.map((entry) => ({
        label: entry.field.label || "(unlabeled field)",
        classification: "unknown" as const,
      })),
      ...memoryFillFailed.map((entry) => ({
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
      captchaDetected,
    });
    // Tab stays open on success — that's the point of Copilot mode: review + submit yourself.
    await notifier
      .notify(
        `Ready for review: ${jobTitle}`,
        `${unmappedFields.length} field(s) need your attention` +
          (captchaDetected ? " (including a CAPTCHA)" : "") +
          `. Check the open browser tab or /applications.`,
      )
      .catch((err) => console.error("Notification failed (run itself succeeded):", (err as Error).message));
  } catch (err) {
    await page?.close().catch(() => undefined);
    await reportRunResult(applicationId, {
      status: "failed",
      atsDetected: null,
      unmappedFields: [],
      screenshotPath: null,
      errorMessage: (err as Error).message,
      captchaDetected: false,
    });
    await notifier
      .notify(`Apply run failed: ${jobTitle}`, (err as Error).message)
      .catch((notifyErr) => console.error("Notification failed:", (notifyErr as Error).message));
  }
}
