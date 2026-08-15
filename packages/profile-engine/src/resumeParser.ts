import { ChatMessage, OllamaClient } from "@job-agent/ai-engine";
import { extractTextFromPdf } from "./pdfText";
import { ParsedResumeData } from "./types";

const SYSTEM_PROMPT = `You extract structured data from resumes. Return ONLY a JSON object
matching this exact shape, no commentary, no markdown fences:

{
  "name": string,
  "email": string,
  "phone": string,
  "location": string,
  "links": { "linkedin"?: string, "github"?: string, "portfolio"?: string },
  "currentRole": string,
  "currentCompany": string,
  "experienceYears": number,
  "skills": string[],
  "experience": [{ "company": string, "role": string, "startDate": string, "endDate": string | null, "description": string }],
  "education": [{ "institution": string, "degree": string, "field": string, "graduationYear": number | null }]
}

If a field cannot be determined from the resume text, use an empty string, empty array, or null
as appropriate — never fabricate information that isn't in the text.`;

/** Fills in safe defaults for anything the model omitted or got the wrong shape for. */
function normalize(raw: Partial<ParsedResumeData>): ParsedResumeData {
  return {
    name: raw.name ?? "",
    email: raw.email ?? "",
    phone: raw.phone ?? "",
    location: raw.location ?? "",
    links: raw.links ?? {},
    currentRole: raw.currentRole ?? "",
    currentCompany: raw.currentCompany ?? "",
    experienceYears: typeof raw.experienceYears === "number" ? raw.experienceYears : 0,
    skills: Array.isArray(raw.skills) ? raw.skills : [],
    experience: Array.isArray(raw.experience) ? raw.experience : [],
    education: Array.isArray(raw.education) ? raw.education : [],
  };
}

export async function parseResume(
  fileBuffer: Buffer,
  client: OllamaClient = new OllamaClient(),
): Promise<ParsedResumeData> {
  const resumeText = await extractTextFromPdf(fileBuffer);

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: resumeText },
  ];

  const raw = await client.generateJson<Partial<ParsedResumeData>>(messages);
  return normalize(raw);
}

export { extractTextFromPdf };
export type { ParsedResumeData };
