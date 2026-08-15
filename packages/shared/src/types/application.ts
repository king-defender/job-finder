export type ApplicationStatus =
  | "discovered"
  | "matched"
  | "ready"
  | "applying"
  | "applied"
  | "assessment"
  | "interview"
  | "offer"
  | "rejected";

export interface ApplicationAnswer {
  question: string;
  answer: string;
  classification: QuestionClassification;
}

export type QuestionClassification = "green" | "yellow" | "red";

export interface Application {
  id: string;
  jobId: string;
  resumeVersionUsed: string;
  coverLetter: string | null;
  matchScore: number;
  answers: ApplicationAnswer[];
  status: ApplicationStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
