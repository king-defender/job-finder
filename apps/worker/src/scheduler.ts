import { Queue } from "bullmq";
import { APPLY_RUNS_QUEUE, createRedisConnection } from "@job-agent/queue";

export interface SchedulerConfig {
  cronExpression?: string;
  enabled?: boolean;
}

export class JobScheduler {
  private readonly queue: Queue;

  constructor() {
    this.queue = new Queue(APPLY_RUNS_QUEUE, { connection: createRedisConnection() });
  }

  async setupRepeatableJobs(config: SchedulerConfig = {}): Promise<void> {
    const cron = config.cronExpression ?? "0 7 * * *"; // Daily at 7:00 AM by default

    try {
      // Cast queue to any to handle version differences in BullMQ repeatable job methods
      const q = this.queue as any;
      if (typeof q.getRepeatableJobs === "function") {
        const existing = await q.getRepeatableJobs();
        for (const job of existing) {
          if (job?.key && typeof q.removeRepeatableByKey === "function") {
            await q.removeRepeatableByKey(job.key);
          }
        }
      }

      if (config.enabled !== false) {
        await q.add(
          "scheduled-sweep",
          { timestamp: Date.now(), scheduled: true },
          {
            repeat: {
              pattern: cron,
            },
          },
        );
        console.log(`[Scheduler] Repeatable sweep scheduled with CRON: "${cron}".`);
      } else {
        console.log("[Scheduler] Scheduled sweeps disabled.");
      }
    } catch (err) {
      console.warn("[Scheduler] Repeatable job setup notice:", (err as Error).message);
    }
  }

  async triggerManualSweep(): Promise<void> {
    await this.queue.add("manual-sweep", { timestamp: Date.now(), manual: true } as any);
    console.log("[Scheduler] Manual sweep triggered.");
  }
}
