export type ApplicationStatus =
  | "discovered"
  | "matched"
  | "ready"
  | "applying"
  | "needs_review"
  | "applied"
  | "assessment"
  | "interview"
  | "offer"
  | "rejected"
  | "failed";

export interface ApplicationAnswer {
  question: string;
  answer: string;
  classification: QuestionClassification;
}

export type QuestionClassification = "green" | "yellow" | "red";

/**
 * A field the fill run didn't answer, with why. "red" means it matched a
 * known-sensitive category (work auth, legal, disability, ...) and was
 * deliberately left blank — never guessed, per PROJECT_PLAN.md's Red-question
 * policy. "unknown" means it didn't match anything in the classifier at all.
 */
export interface UnmappedField {
  label: string;
  classification: "red" | "unknown";
}

export interface Application {
  id: string;
  jobId: string;
  resumeVersionUsed: string;
  coverLetter: string | null;
  matchScore: number;
  answers: ApplicationAnswer[];
  status: ApplicationStatus;
  notes: string | null;
  /** Which ATS adapter handled the fill run ("greenhouse", "generic", ...); null until a run has started. */
  atsDetected: string | null;
  /** Fields the fill run couldn't or wouldn't answer — surfaced for manual completion before submit. */
  unmappedFields: UnmappedField[];
  /** Screenshot taken after filling, so review doesn't require hunting for the browser window. */
  screenshotPath: string | null;
  /** Set when a fill run throws (site structure changed, ATS unrecognized, etc). */
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApplicationInput {
  jobId: string;
}
