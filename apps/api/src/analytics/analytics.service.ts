import { Injectable } from '@nestjs/common';
import { AnalyticsBucket, ApplicationAnalytics, ApplicationStatus, Job } from '@job-agent/shared';
import { ApplicationsService } from '../applications/applications.service';
import { JobsService } from '../jobs/jobs.service';

/** A rejection is still a response — only these count as "no response yet." */
const NOT_YET_RESPONDED: ApplicationStatus[] = ['ready', 'applying', 'needs_review', 'failed', 'applied'];

function hasResponded(status: ApplicationStatus): boolean {
  return !NOT_YET_RESPONDED.includes(status);
}

function buildBuckets(entries: { key: string; responded: boolean }[]): AnalyticsBucket[] {
  const byKey = new Map<string, { total: number; responded: number }>();
  for (const entry of entries) {
    const bucket = byKey.get(entry.key) ?? { total: 0, responded: 0 };
    bucket.total += 1;
    if (entry.responded) bucket.responded += 1;
    byKey.set(entry.key, bucket);
  }

  return Array.from(byKey.entries())
    .map(([key, { total, responded }]) => ({
      key,
      total,
      responded,
      responseRate: total > 0 ? Math.round((responded / total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly applicationsService: ApplicationsService,
    private readonly jobsService: JobsService,
  ) {}

  async getAnalytics(): Promise<ApplicationAnalytics> {
    const applications = await this.applicationsService.listApplications();
    const jobs = await this.jobsService.getJobsByIds(applications.map((app) => app.jobId));
    const jobById = new Map<string, Job>(jobs.map((job) => [job.id, job]));

    const roleEntries: { key: string; responded: boolean }[] = [];
    const skillEntries: { key: string; responded: boolean }[] = [];
    const locationEntries: { key: string; responded: boolean }[] = [];

    for (const app of applications) {
      const job = jobById.get(app.jobId);
      if (!job) continue;
      const responded = hasResponded(app.status);

      roleEntries.push({ key: job.title, responded });
      locationEntries.push({ key: job.remote ? 'Remote' : job.location || 'Unspecified', responded });
      for (const skill of job.requirements?.requiredSkills ?? []) {
        skillEntries.push({ key: skill, responded });
      }
    }

    const totalResponded = applications.filter((app) => hasResponded(app.status)).length;

    return {
      totalApplications: applications.length,
      totalResponded,
      overallResponseRate: applications.length > 0 ? Math.round((totalResponded / applications.length) * 100) : 0,
      byRole: buildBuckets(roleEntries),
      bySkill: buildBuckets(skillEntries),
      byLocation: buildBuckets(locationEntries),
    };
  }
}
