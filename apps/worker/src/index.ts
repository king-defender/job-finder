import "dotenv/config";
import { Worker, Job as BullJob } from "bullmq";
import { APPLY_RUNS_QUEUE, createRedisConnection } from "@job-agent/queue";
import { BrowserSession } from "@job-agent/browser-agent";
import { createNotifier } from "@job-agent/notifications";
import { ApplyRunPayload } from "@job-agent/shared";
import { runApply } from "./runApply";
import { JobScheduler } from "./scheduler";

// One persistent context for the whole process lifetime — see runApply.ts for why.
const session = new BrowserSession();
const notifier = createNotifier();
const scheduler = new JobScheduler();

// Initialize repeatable job schedule on boot
scheduler.setupRepeatableJobs().catch((err) => {
  console.error("Failed to setup scheduler:", err.message);
});

const worker = new Worker<ApplyRunPayload>(
  APPLY_RUNS_QUEUE,
  (job: BullJob<ApplyRunPayload>) => {
    if ("scheduled" in job.data || "manual" in job.data) {
      console.log(`[Worker] Running scheduled sweep...`);
      return Promise.resolve();
    }
    return runApply(job.data, session, notifier);
  },
  { connection: createRedisConnection(), concurrency: 1 },
);

worker.on("failed", (job, err) => {
  console.error(`Apply run failed for application ${job?.data.applicationId}:`, err.message);
});

worker.on("completed", (job) => {
  console.log(`Apply run finished for application ${job.data.applicationId} — check the browser to review and submit.`);
});

console.log(`Worker listening on queue "${APPLY_RUNS_QUEUE}"...`);
