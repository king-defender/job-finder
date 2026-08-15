import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes } from 'mongoose';

@Schema({ timestamps: true, collection: 'profile' })
export class ProfileDocumentClass {
  @Prop({ default: '' })
  name!: string;

  @Prop({ default: '' })
  email!: string;

  @Prop({ default: '' })
  phone!: string;

  @Prop({ default: '' })
  location!: string;

  @Prop({ type: SchemaTypes.Mixed, default: {} })
  links!: Record<string, string>;

  @Prop({ default: '' })
  currentRole!: string;

  @Prop({ default: '' })
  currentCompany!: string;

  @Prop({ default: 0 })
  experienceYears!: number;

  @Prop({ type: [String], default: [] })
  skills!: string[];

  @Prop({ type: [SchemaTypes.Mixed], default: [] })
  experience!: Record<string, unknown>[];

  @Prop({ type: [SchemaTypes.Mixed], default: [] })
  education!: Record<string, unknown>[];

  @Prop({ type: SchemaTypes.Mixed, default: {} })
  preferences!: Record<string, unknown>;

  @Prop({ type: [SchemaTypes.Mixed], default: [] })
  documents!: Record<string, unknown>[];
}

export type ProfileDocument = HydratedDocument<ProfileDocumentClass>;
export const ProfileSchema = SchemaFactory.createForClass(ProfileDocumentClass);
