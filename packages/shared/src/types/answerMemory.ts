import { QuestionClassification } from "./application";

export interface AnswerMemoryEntry {
  id: string;
  normalizedQuestion: string;
  answer: string;
  classification: QuestionClassification;
  lastConfirmedAt: string;
}

export interface OutreachDraft {
  id: string;
  recipientEmail: string;
  jobId: string | null;
  applicationId: string | null;
  message: string;
  status: "drafted" | "approved" | "sent";
  createdAt: string;
}
