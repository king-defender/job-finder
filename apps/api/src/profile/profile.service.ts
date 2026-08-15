import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { parseResume } from '@job-agent/profile-engine';
import { CandidatePreferences, CandidateProfile } from '@job-agent/shared';
import { ProfileDocument, ProfileDocumentClass } from './schemas/profile.schema';
import { UpdateProfileDto } from './dto/update-profile.dto';

const SINGLETON_FILTER = {};

/**
 * Mongoose stores `preferences` as Mixed with a `{}` default, so an untouched
 * profile has every sub-field `undefined` at runtime even though the
 * CandidateProfile type promises they're always present. Consumers (job-matcher
 * in particular) rely on that promise — e.g. comparing expectedSalaryMin against
 * `null` breaks silently (produces NaN, not a crash) if it's actually
 * `undefined`. Normalize once here rather than defending every call site.
 */
function normalizePreferences(raw: Record<string, unknown> | null | undefined): CandidatePreferences {
  const p = raw ?? {};
  return {
    preferredLocations: Array.isArray(p.preferredLocations) ? (p.preferredLocations as string[]) : [],
    remoteOnly: typeof p.remoteOnly === 'boolean' ? p.remoteOnly : false,
    expectedSalaryMin: typeof p.expectedSalaryMin === 'number' ? p.expectedSalaryMin : null,
    expectedSalaryCurrency: typeof p.expectedSalaryCurrency === 'string' ? p.expectedSalaryCurrency : 'INR',
    noticePeriodDays: typeof p.noticePeriodDays === 'number' ? p.noticePeriodDays : null,
  };
}

function toCandidateProfile(doc: ProfileDocument): CandidateProfile {
  const obj = doc.toObject({ virtuals: false });
  return {
    id: doc._id.toString(),
    name: obj.name,
    email: obj.email,
    phone: obj.phone,
    location: obj.location,
    links: obj.links ?? {},
    currentRole: obj.currentRole,
    currentCompany: obj.currentCompany,
    experienceYears: obj.experienceYears,
    skills: obj.skills ?? [],
    experience: (obj.experience ?? []) as unknown as CandidateProfile['experience'],
    education: (obj.education ?? []) as unknown as CandidateProfile['education'],
    preferences: normalizePreferences(obj.preferences),
    documents: (obj.documents ?? []) as unknown as CandidateProfile['documents'],
    createdAt: (obj as { createdAt?: Date }).createdAt?.toISOString() ?? '',
    updatedAt: (obj as { updatedAt?: Date }).updatedAt?.toISOString() ?? '',
  };
}

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel(ProfileDocumentClass.name)
    private readonly profileModel: Model<ProfileDocumentClass>,
  ) {}

  /**
   * Personal single-user tool — there is exactly one profile document,
   * created on first write. No multi-user/auth scoping needed here.
   */
  private async getOrCreateDoc(): Promise<ProfileDocument> {
    const existing = await this.profileModel.findOne(SINGLETON_FILTER);
    if (existing) return existing;
    return this.profileModel.create({});
  }

  async getProfile(): Promise<CandidateProfile> {
    const doc = await this.getOrCreateDoc();
    return toCandidateProfile(doc);
  }

  async updateProfile(patch: UpdateProfileDto): Promise<CandidateProfile> {
    const doc = await this.getOrCreateDoc();
    Object.assign(doc, patch);
    await doc.save();
    return toCandidateProfile(doc);
  }

  /**
   * Parses the uploaded resume via the local Ollama model and merges the
   * result into the profile. The model's output is a starting point, not
   * ground truth — the dashboard lets the user correct anything wrong
   * before it's relied on elsewhere (matching, form-filling).
   */
  async uploadResume(
    file: Buffer,
    fileName: string,
    storagePath: string,
  ): Promise<CandidateProfile> {
    const parsed = await parseResume(file);
    const doc = await this.getOrCreateDoc();

    Object.assign(doc, parsed);
    doc.documents = [
      ...(doc.documents ?? []),
      {
        label: 'resume',
        fileName,
        storagePath,
        uploadedAt: new Date().toISOString(),
      },
    ];
    await doc.save();
    return toCandidateProfile(doc);
  }
}
