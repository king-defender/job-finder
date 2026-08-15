import { CandidateProfile, Job, MatchScore } from "@job-agent/shared";
import { parseSalaryFigure } from "./salary";

/**
 * Weighted dimensions, summing to 100. Skill and experience fit dominate
 * because they're the strongest predictors of whether an application is
 * worth the human's review time; location/salary are softer preferences.
 */
const WEIGHTS = {
  skill: 0.4,
  experience: 0.25,
  location: 0.2,
  salary: 0.15,
};

/**
 * Threshold for the *display* recommendation in the Phase 2 dashboard — not
 * the same as the >=85% threshold Controlled auto-apply mode will require
 * once submission automation exists (see PROJECT_PLAN.md §9). This one only
 * decides what gets labeled "worth a look" for a human reviewing a list.
 */
const APPLY_THRESHOLD = 70;

function normalizeSkill(skill: string): string {
  return skill.toLowerCase().trim();
}

function scoreSkillMatch(candidate: CandidateProfile, job: Job): { score: number; note: string } {
  const required = job.requirements?.requiredSkills ?? [];
  if (required.length === 0) {
    return { score: 50, note: "no explicit skills extracted from the JD" };
  }

  const candidateSkills = new Set(candidate.skills.map(normalizeSkill));
  const matched = required.filter((skill) => candidateSkills.has(normalizeSkill(skill)));
  const score = Math.round((matched.length / required.length) * 100);
  return {
    score,
    note: `${matched.length}/${required.length} required skills matched`,
  };
}

function scoreExperienceMatch(
  candidate: CandidateProfile,
  job: Job,
): { score: number; note: string } {
  const { minExperienceYears, maxExperienceYears } = job.requirements ?? {
    minExperienceYears: null,
    maxExperienceYears: null,
  };
  const years = candidate.experienceYears;

  if (minExperienceYears === null && maxExperienceYears === null) {
    return { score: 50, note: "no experience range stated in the JD" };
  }

  if (minExperienceYears !== null && years < minExperienceYears) {
    const score = Math.max(0, Math.round((years / minExperienceYears) * 100));
    return { score, note: `${years} yrs vs ${minExperienceYears}+ required` };
  }

  if (maxExperienceYears !== null && years > maxExperienceYears) {
    const over = years - maxExperienceYears;
    const score = Math.max(60, 100 - over * 5);
    return { score, note: `${years} yrs is above the stated max of ${maxExperienceYears}` };
  }

  return { score: 100, note: `${years} yrs fits the stated range` };
}

function scoreLocationMatch(candidate: CandidateProfile, job: Job): { score: number; note: string } {
  if (job.remote) {
    return { score: 100, note: "role is remote" };
  }

  const preferred = candidate.preferences?.preferredLocations;
  if (!preferred || !Array.isArray(preferred) || preferred.length === 0) {
    return { score: 50, note: "no location preference set" };
  }

  const jobLocation = job.location.toLowerCase();
  const isPreferred = preferred.some(
    (loc) => jobLocation.includes(loc.toLowerCase()) || loc.toLowerCase().includes(jobLocation),
  );
  return isPreferred
    ? { score: 100, note: `${job.location} is a preferred location` }
    : { score: 20, note: `${job.location} is not in preferred locations` };
}

function scoreSalaryMatch(candidate: CandidateProfile, job: Job): { score: number; note: string } {
  const expectedMin = candidate.preferences.expectedSalaryMin;
  if (expectedMin === null || !job.salaryRange) {
    return { score: 50, note: "salary not comparable (missing on one side)" };
  }

  const offered = parseSalaryFigure(job.salaryRange);
  if (offered === null) {
    return { score: 50, note: "could not parse a figure from the job's salary text" };
  }

  if (offered >= expectedMin) {
    return { score: 100, note: "offered salary meets expectation" };
  }

  const score = Math.max(0, Math.round((offered / expectedMin) * 100));
  return { score, note: "offered salary is below expectation" };
}

export function scoreJob(candidate: CandidateProfile, job: Job): MatchScore {
  const skill = scoreSkillMatch(candidate, job);
  const experience = scoreExperienceMatch(candidate, job);
  const location = scoreLocationMatch(candidate, job);
  const salary = scoreSalaryMatch(candidate, job);

  const overall = Math.round(
    skill.score * WEIGHTS.skill +
      experience.score * WEIGHTS.experience +
      location.score * WEIGHTS.location +
      salary.score * WEIGHTS.salary,
  );

  return {
    overall,
    skillMatch: skill.score,
    experienceMatch: experience.score,
    locationMatch: location.score,
    salaryMatch: salary.score,
    recommendation: overall >= APPLY_THRESHOLD ? "APPLY" : "SKIP",
    reason: [skill.note, experience.note, location.note, salary.note].join("; "),
  };
}
