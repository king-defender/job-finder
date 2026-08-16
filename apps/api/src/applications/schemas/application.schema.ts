import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes } from 'mongoose';

@Schema({ timestamps: true, collection: 'applications' })
export class ApplicationDocumentClass {
  @Prop({ type: String, required: true, index: true })
  jobId!: string;

  @Prop({ type: String, default: '' })
  resumeVersionUsed!: string;

  @Prop({ type: String, default: null })
  coverLetter!: string | null;

  @Prop({ type: Number, default: 0 })
  matchScore!: number;

  @Prop({ type: [SchemaTypes.Mixed], default: [] })
  answers!: Record<string, unknown>[];

  @Prop({ type: String, default: 'ready' })
  status!: string;

  @Prop({ type: String, default: null })
  notes!: string | null;

  @Prop({ type: String, default: null })
  atsDetected!: string | null;

  @Prop({ type: [SchemaTypes.Mixed], default: [] })
  unmappedFields!: Record<string, unknown>[];

  @Prop({ type: String, default: null })
  screenshotPath!: string | null;

  @Prop({ type: String, default: null })
  errorMessage!: string | null;

  @Prop({ type: Boolean, default: false })
  captchaDetected!: boolean;
}

export type ApplicationDocument = HydratedDocument<ApplicationDocumentClass>;
export const ApplicationSchema = SchemaFactory.createForClass(ApplicationDocumentClass);
