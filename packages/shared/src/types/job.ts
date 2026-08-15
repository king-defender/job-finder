export interface JobRequirements {
  requiredSkills: string[];
  minExperienceYears: number | null;
  maxExperienceYears: number | null;
  seniority: string | null;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  salaryRange: string | null;
  description: string;
  requirements: JobRequirements | null;
  source: string;
  url: string;
  applicationUrl: string;
  postedDate: string | null;
  dedupKey: string;
  discoveredAt: string;
}

export interface MatchScore {
  overall: number;
  skillMatch: number;
  experienceMatch: number;
  locationMatch: number;
  salaryMatch: number;
  recommendation: "APPLY" | "SKIP";
  reason: string;
}

export interface JobWithScore {
  job: Job;
  score: MatchScore;
}

export interface CreateJobResult extends JobWithScore {
  duplicate: boolean;
}

export interface CreateJobInput {
  title: string;
  company: string;
  location?: string;
  remote?: boolean;
  salaryRange?: string | null;
  description: string;
  source?: string;
  url?: string;
  applicationUrl?: string;
  postedDate?: string | null;
}
