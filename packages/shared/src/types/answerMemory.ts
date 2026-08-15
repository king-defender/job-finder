import { QuestionClassification } from "./application";

export interface AnswerMemoryEntry {
  id: string;
  normalizedQuestion: string;
  answer: string;
  classification: QuestionClassification;
  lastConfirmedAt: string;
}

/**
 * Classification is restricted to green/yellow at the type level — red
 * questions are never written to memory, never reused, always re-asked. See
 * PROJECT_PLAN.md's Red-question policy.
 */
export interface CreateAnswerMemoryInput {
  question: string;
  answer: string;
  classification: "green" | "yellow";
}

export interface OutreachDraft {
  id: string;
  recipientEmail: string;
  recipientName: string | null;
  jobId: string | null;
  applicationId: string | null;
  message: string;
  status: "drafted" | "approved" | "sent";
  createdAt: string;
}

export interface CreateOutreachDraftInput {
  recipientEmail: string;
  recipientName?: string | null;
  jobId?: string | null;
  applicationId?: string | null;
}
