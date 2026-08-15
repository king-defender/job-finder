import { ChatMessage, OllamaClient } from "@job-agent/ai-engine";
import { CandidateProfile, Job } from "@job-agent/shared";

const SYSTEM_PROMPT = `You write short, specific cover letters for job applications. Rules:
- Use ONLY the candidate's real experience, skills, and education provided below. Never invent a
  skill, employer, project, or achievement that isn't given to you.
- Reorder and emphasize what's genuinely relevant to this job; do not pad with generic filler.
- 3 short paragraphs max. No "Dear Hiring Manager" boilerplate beyond a plain greeting.
- Output the letter text only — no markdown, no commentary, no subject line.`;

function buildProfileSummary(profile: CandidateProfile): string {
  const experience = profile.experience
    .map((e) => `- ${e.role} at ${e.company} (${e.startDate} to ${e.endDate ?? "present"}): ${e.description}`)
    .join("\n");
  return `Name: ${profile.name}
Current role: ${profile.currentRole} at ${profile.currentCompany}
Total experience: ${profile.experienceYears} years
Skills: ${profile.skills.join(", ")}
Experience:
${experience || "(none on file)"}`;
}

export async function generateCoverLetter(
  profile: CandidateProfile,
  job: Job,
  client: OllamaClient = new OllamaClient(),
): Promise<string> {
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Candidate:\n${buildProfileSummary(profile)}\n\nJob: ${job.title} at ${job.company}\n${job.description}`,
    },
  ];

  return client.chat(messages);
}

export { buildProfileSummary };
