import type {
  Application,
  CandidateProfile,
  CreateJobInput,
  CreateJobResult,
  JobWithScore,
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
