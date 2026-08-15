import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { generateOutreachMessage } from '@job-agent/tailoring';
import { CreateOutreachDraftInput, OutreachDraft } from '@job-agent/shared';
import { JobsService } from '../jobs/jobs.service';
import { ProfileService } from '../profile/profile.service';
import { OutreachDraftDocument, OutreachDraftDocumentClass } from './schemas/outreach-draft.schema';

function toOutreachDraft(doc: OutreachDraftDocument): OutreachDraft {
  const obj = doc.toObject();
  return {
    id: doc._id.toString(),
    recipientEmail: obj.recipientEmail,
    recipientName: obj.recipientName,
    jobId: obj.jobId,
    applicationId: obj.applicationId,
    message: obj.message,
    status: obj.status as OutreachDraft['status'],
    createdAt: (obj as { createdAt?: Date }).createdAt?.toISOString() ?? '',
  };
}

@Injectable()
export class OutreachService {
  constructor(
    @InjectModel(OutreachDraftDocumentClass.name)
    private readonly outreachModel: Model<OutreachDraftDocumentClass>,
    private readonly jobsService: JobsService,
    private readonly profileService: ProfileService,
  ) {}

  async createDraft(input: CreateOutreachDraftInput): Promise<OutreachDraft> {
    if (!input.jobId) {
      throw new BadRequestException('jobId is required — outreach drafts are tied to a specific posting.');
    }
    if (!input.recipientEmail?.trim()) {
      throw new BadRequestException('recipientEmail is required.');
    }

    const [job, profile] = await Promise.all([
      this.jobsService.getJobById(input.jobId),
      this.profileService.getProfile(),
    ]);
    const message = await generateOutreachMessage(profile, job, input.recipientName ?? null);

    const created = await this.outreachModel.create({
      recipientEmail: input.recipientEmail,
      recipientName: input.recipientName ?? null,
      jobId: input.jobId,
      applicationId: input.applicationId ?? null,
      message,
      status: 'drafted',
    });

    return toOutreachDraft(created);
  }

  async list(): Promise<OutreachDraft[]> {
    const docs = await this.outreachModel.find().sort({ createdAt: -1 });
    return docs.map(toOutreachDraft);
  }

  /**
   * "sent" is only ever set here because the human clicked a button in the
   * dashboard after sending the email themselves — this method never causes
   * an email to go out, it only records that one already did.
   */
  async updateStatus(id: string, status: 'approved' | 'sent'): Promise<OutreachDraft> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException(`Outreach draft ${id} not found.`);
    }
    const doc = await this.outreachModel.findById(id);
    if (!doc) {
      throw new NotFoundException(`Outreach draft ${id} not found.`);
    }
    doc.status = status;
    await doc.save();
    return toOutreachDraft(doc);
  }
}
