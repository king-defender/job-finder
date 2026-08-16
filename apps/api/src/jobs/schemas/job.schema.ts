import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes } from 'mongoose';

@Schema({ timestamps: false, collection: 'jobs' })
export class JobDocumentClass {
  @Prop({ type: String, required: true })
  title!: string;

  @Prop({ type: String, required: true })
  company!: string;

  @Prop({ type: String, default: '' })
  location!: string;

  @Prop({ type: Boolean, default: false })
  remote!: boolean;

  @Prop({ type: String, default: null })
  salaryRange!: string | null;

  @Prop({ type: String, required: true })
  description!: string;

  @Prop({ type: SchemaTypes.Mixed, default: null })
  requirements!: Record<string, unknown> | null;

  @Prop({ type: String, default: 'manual' })
  source!: string;

  @Prop({ type: String, default: '' })
  url!: string;

  @Prop({ type: String, default: '' })
  applicationUrl!: string;

  @Prop({ type: String, default: null })
  postedDate!: string | null;

  @Prop({ type: String, required: true, index: true, unique: true })
  dedupKey!: string;

  @Prop({ type: String, required: true })
  discoveredAt!: string;
}

export type JobDocument = HydratedDocument<JobDocumentClass>;
export const JobSchema = SchemaFactory.createForClass(JobDocumentClass);
