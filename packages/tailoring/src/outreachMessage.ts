import { ChatMessage, OllamaClient } from "@job-agent/ai-engine";
import { CandidateProfile, Job } from "@job-agent/shared";
import { buildProfileSummary } from "./coverLetter";

const SYSTEM_PROMPT = `You draft short, specific outreach messages a job candidate can send a recruiter
or hiring contact. Rules:
- Use ONLY the candidate's real experience/skills given below — never invent anything.
- 3-5 sentences. Direct, not salesy. No "I hope this finds you well" filler.
- Reference the specific role and one or two genuinely relevant qualifications.
- Output the message text only — no subject line, no markdown, no commentary.
- This is a DRAFT for the candidate to review and send themselves — never write as if it has
  already been sent, and never include placeholder text like "[Recipient Name]" if a name was
  given; use it directly.`;

export async function generateOutreachMessage(
  profile: CandidateProfile,
  job: Job,
  recipientName: string | null,
  client: OllamaClient = new OllamaClient(),
): Promise<string> {
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Candidate:\n${buildProfileSummary(profile)}\n\nJob: ${job.title} at ${job.company}\n${job.description}\n\nRecipient name: ${recipientName ?? "(unknown — use a neutral greeting)"}`,
    },
  ];

  return client.chat(messages);
}
