import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes } from 'mongoose';

@Schema({ timestamps: true, collection: 'profile' })
export class ProfileDocumentClass {
  @Prop({ type: String, default: '' })
  name!: string;

  @Prop({ type: String, default: '' })
  email!: string;

  @Prop({ type: String, default: '' })
  phone!: string;

  @Prop({ type: String, default: '' })
  location!: string;

  @Prop({ type: SchemaTypes.Mixed, default: {} })
  links!: Record<string, string>;

  @Prop({ type: String, default: '' })
  currentRole!: string;

  @Prop({ type: String, default: '' })
  currentCompany!: string;

  @Prop({ type: Number, default: 0 })
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
