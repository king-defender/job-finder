import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes } from 'mongoose';

@Schema({ timestamps: true, collection: 'applications' })
export class ApplicationDocumentClass {
  @Prop({ required: true, index: true })
  jobId!: string;

  @Prop({ default: '' })
  resumeVersionUsed!: string;

  @Prop({ default: null })
  coverLetter!: string | null;

  @Prop({ default: 0 })
  matchScore!: number;

  @Prop({ type: [SchemaTypes.Mixed], default: [] })
  answers!: Record<string, unknown>[];

  @Prop({ default: 'ready' })
  status!: string;

  @Prop({ default: null })
  notes!: string | null;

  @Prop({ default: null })
  atsDetected!: string | null;

  @Prop({ type: [SchemaTypes.Mixed], default: [] })
  unmappedFields!: Record<string, unknown>[];

  @Prop({ default: null })
  screenshotPath!: string | null;

  @Prop({ default: null })
  errorMessage!: string | null;
}

export type ApplicationDocument = HydratedDocument<ApplicationDocumentClass>;
export const ApplicationSchema = SchemaFactory.createForClass(ApplicationDocumentClass);
