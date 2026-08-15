import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { parseJobDescription } from '@job-agent/jd-parser';
import { scoreJob } from '@job-agent/job-matcher';
import { computeDedupKey, CreateJobResult, Job, JobWithScore } from '@job-agent/shared';
import { ProfileService } from '../profile/profile.service';
import { JobDocument, JobDocumentClass } from './schemas/job.schema';
import { CreateJobDto } from './dto/create-job.dto';

export type { CreateJobResult, JobWithScore };

function toJob(doc: JobDocument): Job {
  const obj = doc.toObject();
  return {
    id: doc._id.toString(),
    title: obj.title,
    company: obj.company,
    location: obj.location,
    remote: obj.remote,
    salaryRange: obj.salaryRange,
    description: obj.description,
    requirements: obj.requirements as unknown as Job['requirements'],
    source: obj.source,
    url: obj.url,
    applicationUrl: obj.applicationUrl,
    postedDate: obj.postedDate,
    dedupKey: obj.dedupKey,
    discoveredAt: obj.discoveredAt,
  };
}

@Injectable()
export class JobsService {
  constructor(
    @InjectModel(JobDocumentClass.name)
    private readonly jobModel: Model<JobDocumentClass>,
    private readonly profileService: ProfileService,
  ) {}

  async createJob(dto: CreateJobDto): Promise<CreateJobResult> {
    const location = dto.location ?? '';
    const dedupKey = computeDedupKey(dto.title, dto.company, location);

    const existing = await this.jobModel.findOne({ dedupKey });
    if (existing) {
      const job = toJob(existing);
      const profile = await this.profileService.getProfile();
      return { job, score: scoreJob(profile, job), duplicate: true };
    }

    const requirements = await parseJobDescription(dto.description);

    const created = await this.jobModel.create({
      title: dto.title,
      company: dto.company,
      location,
      remote: dto.remote ?? false,
      salaryRange: dto.salaryRange ?? null,
      description: dto.description,
      requirements,
      source: dto.source ?? 'manual',
      url: dto.url ?? '',
      applicationUrl: dto.applicationUrl ?? '',
      postedDate: dto.postedDate ?? null,
      dedupKey,
      discoveredAt: new Date().toISOString(),
    });

    const job = toJob(created);
    const profile = await this.profileService.getProfile();
    return { job, score: scoreJob(profile, job), duplicate: false };
  }

  /** Scores are computed fresh on every read, not cached, so they always reflect the current profile. */
  async listJobsRanked(): Promise<JobWithScore[]> {
    const [docs, profile] = await Promise.all([
      this.jobModel.find(),
      this.profileService.getProfile(),
    ]);

    return docs
      .map((doc) => {
        const job = toJob(doc);
        return { job, score: scoreJob(profile, job) };
      })
      .sort((a, b) => b.score.overall - a.score.overall);
  }
}
