import { ChatMessage, OllamaClient } from "@job-agent/ai-engine";
import { JobRequirements } from "@job-agent/shared";

const SYSTEM_PROMPT = `You extract structured requirements from a job description. Return ONLY a
JSON object matching this exact shape, no commentary, no markdown fences:

{
  "requiredSkills": string[],
  "minExperienceYears": number | null,
  "maxExperienceYears": number | null,
  "seniority": string | null
}

requiredSkills should be concrete technologies/skills actually named in the text (e.g. "React",
"TypeScript"), not generic phrases like "strong communication". minExperienceYears/
maxExperienceYears come from an explicit range in the text (e.g. "3-5 years" -> 3 and 5); if
only a floor is stated (e.g. "5+ years"), set minExperienceYears and leave maxExperienceYears
null. seniority is a short label like "Junior", "Mid-level", "Senior", "Staff" if statable,
otherwise null. If a field cannot be determined from the text, use an empty array or null —
never fabricate a skill or number that isn't in the text.`;

/** Fills in safe defaults for anything the model omitted or got the wrong shape for. */
function normalize(raw: Partial<JobRequirements>): JobRequirements {
  return {
    requiredSkills: Array.isArray(raw.requiredSkills) ? raw.requiredSkills : [],
    minExperienceYears:
      typeof raw.minExperienceYears === "number" ? raw.minExperienceYears : null,
    maxExperienceYears:
      typeof raw.maxExperienceYears === "number" ? raw.maxExperienceYears : null,
    seniority: typeof raw.seniority === "string" ? raw.seniority : null,
  };
}

export async function parseJobDescription(
  description: string,
  client: OllamaClient = new OllamaClient(),
): Promise<JobRequirements> {
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: description },
  ];

  const raw = await client.generateJson<Partial<JobRequirements>>(messages);
  return normalize(raw);
}
