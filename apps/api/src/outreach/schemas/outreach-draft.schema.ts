import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: 'outreach_drafts' })
export class OutreachDraftDocumentClass {
  @Prop({ type: String, required: true })
  recipientEmail!: string;

  @Prop({ type: String, default: null })
  recipientName!: string | null;

  @Prop({ type: String, default: null })
  jobId!: string | null;

  @Prop({ type: String, default: null })
  applicationId!: string | null;

  @Prop({ type: String, required: true })
  message!: string;

  @Prop({ type: String, default: 'drafted' })
  status!: string;
}

export type OutreachDraftDocument = HydratedDocument<OutreachDraftDocumentClass>;
export const OutreachDraftSchema = SchemaFactory.createForClass(OutreachDraftDocumentClass);
