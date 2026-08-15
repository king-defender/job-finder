import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes } from 'mongoose';

@Schema({ timestamps: false, collection: 'jobs' })
export class JobDocumentClass {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  company!: string;

  @Prop({ default: '' })
  location!: string;

  @Prop({ default: false })
  remote!: boolean;

  @Prop({ default: null })
  salaryRange!: string | null;

  @Prop({ required: true })
  description!: string;

  @Prop({ type: SchemaTypes.Mixed, default: null })
  requirements!: Record<string, unknown> | null;

  @Prop({ default: 'manual' })
  source!: string;

  @Prop({ default: '' })
  url!: string;

  @Prop({ default: '' })
  applicationUrl!: string;

  @Prop({ default: null })
  postedDate!: string | null;

  @Prop({ required: true, index: true, unique: true })
  dedupKey!: string;

  @Prop({ required: true })
  discoveredAt!: string;
}

export type JobDocument = HydratedDocument<JobDocumentClass>;
export const JobSchema = SchemaFactory.createForClass(JobDocumentClass);
