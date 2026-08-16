import { AnswerMemoryEntry, Application, ApplicationRunResult, CandidateProfile, Job } from "@job-agent/shared";

const API_URL = process.env.API_URL ?? "http://localhost:3001";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export function getJob(jobId: string): Promise<Job> {
  return fetch(`${API_URL}/jobs/${jobId}`).then((res) => handle<Job>(res));
}

export function getProfile(): Promise<CandidateProfile> {
  return fetch(`${API_URL}/profile`).then((res) => handle<CandidateProfile>(res));
}

/** Returns null on no-match — a lookup miss is a normal outcome, not an error. */
export async function lookupAnswer(question: string): Promise<AnswerMemoryEntry | null> {
  const res = await fetch(`${API_URL}/answer-memory/lookup?question=${encodeURIComponent(question)}`);
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  const body = (await res.json()) as AnswerMemoryEntry | null;
  return body ?? null;
}

function patchApplication(applicationId: string, patch: unknown): Promise<Application> {
  return fetch(`${API_URL}/applications/${applicationId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  }).then((res) => handle<Application>(res));
}

export function markApplying(applicationId: string): Promise<Application> {
  return patchApplication(applicationId, { status: "applying" });
}

export function reportRunResult(
  applicationId: string,
  result: ApplicationRunResult,
): Promise<Application> {
  return patchApplication(applicationId, result);
}
