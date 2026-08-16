import IORedis from "ioredis";

/**
 * Single source of truth for the queue name — apps/api (producer) and
 * apps/worker (consumer) both import this rather than typing the string
 * separately, since a typo in either place would silently break the whole
 * pipeline (jobs enqueued nobody ever consumes).
 */
export const APPLY_RUNS_QUEUE = "apply-runs";

/**
 * Off by default — see apps/worker/src/index.ts. Only registered as a
 * repeatable job if ENABLE_DAILY_DIGEST=true is explicitly set.
 */
export const DAILY_DIGEST_QUEUE = "daily-digest";

/**
 * BullMQ requires maxRetriesPerRequest: null on the underlying Redis
 * connection for its blocking commands (used internally for waiting on
 * jobs) to work — omitting it causes BullMQ to throw at startup.
 */
export function createRedisConnection(): IORedis {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  return new IORedis(url, { maxRetriesPerRequest: null });
}
