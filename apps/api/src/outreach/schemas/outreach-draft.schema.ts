import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: 'outreach_drafts' })
export class OutreachDraftDocumentClass {
  @Prop({ required: true })
  recipientEmail!: string;

  @Prop({ default: null })
  recipientName!: string | null;

  @Prop({ default: null })
  jobId!: string | null;

  @Prop({ default: null })
  applicationId!: string | null;

  @Prop({ required: true })
  message!: string;

  /**
   * "sent" is only ever set by the human clicking a button after they've
   * actually sent the email themselves (via mailto:, in their own client) —
   * nothing in this codebase transmits email on the candidate's behalf. See
   * outreach.controller.ts.
   */
  @Prop({ default: 'drafted' })
  status!: string;
}

export type OutreachDraftDocument = HydratedDocument<OutreachDraftDocumentClass>;
export const OutreachDraftSchema = SchemaFactory.createForClass(OutreachDraftDocumentClass);
