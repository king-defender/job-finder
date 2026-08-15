import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Queue } from 'bullmq';
import { APPLY_RUNS_QUEUE, createRedisConnection } from '@job-agent/queue';
import { scoreJob } from '@job-agent/job-matcher';
import { Application, ApplicationStatus, UnmappedField } from '@job-agent/shared';
import { JobsService } from '../jobs/jobs.service';
import { ProfileService } from '../profile/profile.service';
import { ApplicationDocument, ApplicationDocumentClass } from './schemas/application.schema';
import { CreateApplicationDto } from './dto/create-application.dto';

export interface ApplicationPatch {
  status?: ApplicationStatus;
  atsDetected?: string | null;
  unmappedFields?: UnmappedField[];
  screenshotPath?: string | null;
  errorMessage?: string | null;
  notes?: string | null;
}

function toApplication(doc: ApplicationDocument): Application {
  const obj = doc.toObject();
  return {
    id: doc._id.toString(),
    jobId: obj.jobId,
    resumeVersionUsed: obj.resumeVersionUsed,
    coverLetter: obj.coverLetter,
    matchScore: obj.matchScore,
    answers: obj.answers as unknown as Application['answers'],
    status: obj.status as ApplicationStatus,
    notes: obj.notes,
    atsDetected: obj.atsDetected,
    unmappedFields: obj.unmappedFields as unknown as UnmappedField[],
    screenshotPath: obj.screenshotPath,
    errorMessage: obj.errorMessage,
    createdAt: (obj as { createdAt?: Date }).createdAt?.toISOString() ?? '',
    updatedAt: (obj as { updatedAt?: Date }).updatedAt?.toISOString() ?? '',
  };
}

@Injectable()
export class ApplicationsService {
  private readonly queue: Queue;

  constructor(
    @InjectModel(ApplicationDocumentClass.name)
    private readonly applicationModel: Model<ApplicationDocumentClass>,
    private readonly jobsService: JobsService,
    private readonly profileService: ProfileService,
  ) {
    this.queue = new Queue(APPLY_RUNS_QUEUE, { connection: createRedisConnection() });
  }

  async createApplication(dto: CreateApplicationDto): Promise<Application> {
    const job = await this.jobsService.getJobById(dto.jobId);
    const profile = await this.profileService.getProfile();
    const score = scoreJob(profile, job);
    const latestResume = [...profile.documents].reverse().find((d) => d.label === 'resume');

    const created = await this.applicationModel.create({
      jobId: job.id,
      resumeVersionUsed: latestResume?.fileName ?? '',
      matchScore: score.overall,
      status: 'ready',
    });

    await this.queue.add(
      'apply',
      { applicationId: created._id.toString(), jobId: job.id },
      { removeOnComplete: true, removeOnFail: 50 },
    );

    return toApplication(created);
  }

  async listApplications(): Promise<Application[]> {
    const docs = await this.applicationModel.find().sort({ createdAt: -1 });
    return docs.map(toApplication);
  }

  async getApplicationById(id: string): Promise<Application> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException(`Application ${id} not found.`);
    }
    const doc = await this.applicationModel.findById(id);
    if (!doc) {
      throw new NotFoundException(`Application ${id} not found.`);
    }
    return toApplication(doc);
  }

  async patchApplication(id: string, patch: ApplicationPatch): Promise<Application> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException(`Application ${id} not found.`);
    }
    const doc = await this.applicationModel.findById(id);
    if (!doc) {
      throw new NotFoundException(`Application ${id} not found.`);
    }
    Object.assign(doc, patch);
    await doc.save();
    return toApplication(doc);
  }
}
