import type {
  AnswerMemoryEntry,
  Application,
  ApplicationAnalytics,
  ApplicationStatus,
  AutoApplyStatus,
  CandidateProfile,
  CreateAnswerMemoryInput,
  CreateJobInput,
  CreateJobResult,
  CreateOutreachDraftInput,
  JobWithScore,
  OutreachDraft,
} from '@job-agent/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export function getProfile(): Promise<CandidateProfile> {
  return fetch(`${API_URL}/profile`).then((res) => handle<CandidateProfile>(res));
}

export function updateProfile(
  patch: Partial<Omit<CandidateProfile, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<CandidateProfile> {
  return fetch(`${API_URL}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  }).then((res) => handle<CandidateProfile>(res));
}

export function uploadResume(file: File): Promise<CandidateProfile> {
  const formData = new FormData();
  formData.append('resume', file);
  return fetch(`${API_URL}/profile/resume`, {
    method: 'POST',
    body: formData,
  }).then((res) => handle<CandidateProfile>(res));
}

export function listJobs(): Promise<JobWithScore[]> {
  return fetch(`${API_URL}/jobs`).then((res) => handle<JobWithScore[]>(res));
}

export function createJob(input: CreateJobInput): Promise<CreateJobResult> {
  return fetch(`${API_URL}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).then((res) => handle<CreateJobResult>(res));
}

export function listApplications(): Promise<Application[]> {
  return fetch(`${API_URL}/applications`).then((res) => handle<Application[]>(res));
}

export function createApplication(jobId: string): Promise<Application> {
  return fetch(`${API_URL}/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId }),
  }).then((res) => handle<Application>(res));
}

export function saveAnswerMemory(input: CreateAnswerMemoryInput): Promise<AnswerMemoryEntry> {
  return fetch(`${API_URL}/answer-memory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).then((res) => handle<AnswerMemoryEntry>(res));
}

export function getAutoApplyStatus(): Promise<AutoApplyStatus> {
  return fetch(`${API_URL}/applications/auto-apply/status`).then((res) => handle<AutoApplyStatus>(res));
}

export function generateCoverLetter(applicationId: string): Promise<Application> {
  return fetch(`${API_URL}/applications/${applicationId}/cover-letter`, { method: 'POST' }).then((res) =>
    handle<Application>(res),
  );
}

export function updateApplicationStatus(applicationId: string, status: ApplicationStatus): Promise<Application> {
  return fetch(`${API_URL}/applications/${applicationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  }).then((res) => handle<Application>(res));
}

export function getAnalytics(): Promise<ApplicationAnalytics> {
  return fetch(`${API_URL}/analytics`).then((res) => handle<ApplicationAnalytics>(res));
}

export function listOutreachDrafts(): Promise<OutreachDraft[]> {
  return fetch(`${API_URL}/outreach`).then((res) => handle<OutreachDraft[]>(res));
}

export function createOutreachDraft(input: CreateOutreachDraftInput): Promise<OutreachDraft> {
  return fetch(`${API_URL}/outreach`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).then((res) => handle<OutreachDraft>(res));
}

/** Only ever called after the human has already sent the email themselves via mailto: — records that fact, doesn't cause it. */
export function markOutreachStatus(id: string, status: 'approved' | 'sent'): Promise<OutreachDraft> {
  return fetch(`${API_URL}/outreach/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  }).then((res) => handle<OutreachDraft>(res));
}
