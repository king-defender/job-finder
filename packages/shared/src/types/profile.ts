export interface CandidateExperience {
  company: string;
  role: string;
  startDate: string;
  endDate: string | null;
  description: string;
}

export interface CandidateEducation {
  institution: string;
  degree: string;
  field: string;
  graduationYear: number | null;
}

export interface CandidatePreferences {
  preferredLocations: string[];
  remoteOnly: boolean;
  expectedSalaryMin: number | null;
  expectedSalaryCurrency: string;
  noticePeriodDays: number | null;
}

export interface CandidateDocument {
  label: string;
  fileName: string;
  storagePath: string;
  uploadedAt: string;
}

export interface CandidateProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  links: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  currentRole: string;
  currentCompany: string;
  experienceYears: number;
  skills: string[];
  experience: CandidateExperience[];
  education: CandidateEducation[];
  preferences: CandidatePreferences;
  documents: CandidateDocument[];
  createdAt: string;
  updatedAt: string;
}
