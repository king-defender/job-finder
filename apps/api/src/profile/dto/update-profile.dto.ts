import { CandidateProfile } from '@job-agent/shared';

/**
 * Phase 1: accepts a partial profile patch as-is. Field-level validation
 * (class-validator decorators) can be added once the dashboard's edit form
 * settles on which fields actually need constraints.
 */
export type UpdateProfileDto = Partial<
  Omit<CandidateProfile, 'id' | 'createdAt' | 'updatedAt'>
>;
