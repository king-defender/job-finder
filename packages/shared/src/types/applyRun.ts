import { UnmappedField } from "./application";

/** BullMQ job payload for the "apply-runs" queue — kept minimal, worker re-fetches current data via the API rather than trusting a stale snapshot. */
export interface ApplyRunPayload {
  applicationId: string;
  jobId: string;
}

/** What the worker is allowed to update on an Application after a fill run. */
export interface ApplicationRunResult {
  status: "needs_review" | "failed";
  atsDetected: string | null;
  unmappedFields: UnmappedField[];
  screenshotPath: string | null;
  errorMessage: string | null;
}
