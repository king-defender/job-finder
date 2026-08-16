import { scoreJob } from "./index";
import { CandidateProfile, Job } from "@job-agent/shared";

describe("scoreJob Engine", () => {
  const mockProfile: CandidateProfile = {
    id: "p1",
    name: "Jane Doe",
    email: "jane@example.com",
    phone: "555-0199",
    location: "San Francisco, CA",
    links: { linkedin: "https://linkedin.com/in/janedoe" },
    currentRole: "Senior Full Stack Engineer",
    currentCompany: "Tech Corp",
    experienceYears: 6,
    skills: ["React", "Node.js", "TypeScript", "MongoDB", "Redis", "Docker"],
    experience: [],
    education: [],
    preferences: {
      preferredLocations: ["San Francisco, CA"],
      remoteOnly: true,
      expectedSalaryMin: 120000,
      expectedSalaryCurrency: "USD",
      noticePeriodDays: 30,
    },
    documents: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockJob: Job = {
    id: "j1",
    title: "Senior Full Stack Engineer",
    company: "Innovate AI",
    location: "San Francisco, CA",
    remote: true,
    salaryRange: "$130,000 - $160,000",
    description: "Looking for a Senior Full Stack Engineer proficient in React, Node.js, and TypeScript.",
    requirements: {
      requiredSkills: ["React", "Node.js", "TypeScript"],
      minExperienceYears: 5,
      maxExperienceYears: 10,
      seniority: "senior",
    },
    source: "automated",
    url: "https://example.com/job/1",
    applicationUrl: "https://example.com/job/1/apply",
    postedDate: null,
    dedupKey: "innovate-ai-senior-full-stack-engineer",
    discoveredAt: new Date().toISOString(),
  };

  it("should calculate a high match score for well-matched candidate profiles", () => {
    const result = scoreJob(mockProfile, mockJob);

    expect(result.overall).toBeGreaterThanOrEqual(70);
    expect(result.recommendation).toBe("APPLY");
    expect(result.skillMatch).toBeGreaterThan(50);
  });

  it("should recommend SKIP when skill and experience overlap are low", () => {
    const lowMatchJob: Job = {
      ...mockJob,
      title: "Senior Embedded C++ Developer",
      description: "Requires 12+ years of low-level C++, assembly, and hardware firmware design.",
      requirements: {
        requiredSkills: ["C++", "Assembly", "Firmware", "RTOS"],
        minExperienceYears: 12,
        maxExperienceYears: 20,
        seniority: "senior",
      },
    };

    const result = scoreJob(mockProfile, lowMatchJob);
    expect(result.recommendation).toBe("SKIP");
    expect(result.overall).toBeLessThan(70);
  });
});
