import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Queue } from 'bullmq';
import { APPLY_RUNS_QUEUE, createRedisConnection } from '@job-agent/queue';
import { scoreJob } from '@job-agent/job-matcher';
import { DEFAULT_MAX_ELIGIBLE_PER_DAY, evaluateEligibility, isCircuitBreakerTripped } from '@job-agent/auto-apply-policy';
import { generateCoverLetter as generateCoverLetterText } from '@job-agent/tailoring';
import { Application, ApplicationStatus, AutoApplyStatus, UnmappedField } from '@job-agent/shared';
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
  captchaDetected?: boolean;
  coverLetter?: string | null;
}

function toApplication(doc: ApplicationDocument): Application {
  const obj = doc.toObject();
  const status = obj.status as ApplicationStatus;
  const matchScore = obj.matchScore;
  const unmappedFields = obj.unmappedFields as unknown as UnmappedField[];
  const captchaDetected = obj.captchaDetected;

  const { eligible, reasons } = evaluateEligibility({ status, matchScore, unmappedFields, captchaDetected });

  return {
    id: doc._id.toString(),
    jobId: obj.jobId,
    resumeVersionUsed: obj.resumeVersionUsed,
    coverLetter: obj.coverLetter,
    matchScore,
    answers: obj.answers as unknown as Application['answers'],
    status,
    notes: obj.notes,
    atsDetected: obj.atsDetected,
    unmappedFields,
    screenshotPath: obj.screenshotPath,
    errorMessage: obj.errorMessage,
    captchaDetected,
    autoApplyEligible: eligible,
    autoApplyReasons: reasons,
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
    const doc = await this.findDocOrThrow(id);
    return toApplication(doc);
  }

  /**
   * Ollama-generated, reordering/emphasizing only what's already in the
   * profile — never fabricates skills or history. The letter is saved but
   * never sent anywhere; it's an artifact for you to use during the manual
   * submit, same as the resume already is.
   */
  async generateCoverLetter(id: string): Promise<Application> {
    const doc = await this.findDocOrThrow(id);
    const [job, profile] = await Promise.all([
      this.jobsService.getJobById(doc.jobId),
      this.profileService.getProfile(),
    ]);
    const coverLetter = await generateCoverLetterText(profile, job);
    doc.coverLetter = coverLetter;
    await doc.save();
    return toApplication(doc);
  }

  private async findDocOrThrow(id: string): Promise<ApplicationDocument> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException(`Application ${id} not found.`);
    }
    const doc = await this.applicationModel.findById(id);
    if (!doc) {
      throw new NotFoundException(`Application ${id} not found.`);
    }
    return doc;
  }

  async getAutoApplyStatus(): Promise<AutoApplyStatus> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const docs = await this.applicationModel.find({
      createdAt: { $gte: startOfToday },
    });
    const eligibleToday = docs.map(toApplication).filter((app) => app.autoApplyEligible).length;

    return {
      eligibleToday,
      maxPerDay: DEFAULT_MAX_ELIGIBLE_PER_DAY,
      tripped: isCircuitBreakerTripped(eligibleToday),
    };
  }

  async patchApplication(id: string, patch: ApplicationPatch): Promise<Application> {
    const doc = await this.findDocOrThrow(id);
    Object.assign(doc, patch);
    await doc.save();
    return toApplication(doc);
  }
}
