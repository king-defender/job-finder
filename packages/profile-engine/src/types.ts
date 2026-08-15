/**
 * Subset of CandidateProfile derivable from resume text alone. The caller
 * (apps/api) merges this into a full CandidateProfile with id/timestamps and
 * lets the user correct anything the model got wrong before it's saved.
 */
export interface ParsedResumeData {
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
  experience: Array<{
    company: string;
    role: string;
    startDate: string;
    endDate: string | null;
    description: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    graduationYear: number | null;
  }>;
}
