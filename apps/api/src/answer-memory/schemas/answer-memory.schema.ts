import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: false, collection: 'answer_memory' })
export class AnswerMemoryDocumentClass {
  @Prop({ required: true, unique: true, index: true })
  normalizedQuestion!: string;

  @Prop({ required: true })
  answer!: string;

  /** Only "green" | "yellow" is ever written here — enforced in the service, not just the type. */
  @Prop({ required: true })
  classification!: string;

  @Prop({ required: true })
  lastConfirmedAt!: string;
}

export type AnswerMemoryDocument = HydratedDocument<AnswerMemoryDocumentClass>;
export const AnswerMemorySchema = SchemaFactory.createForClass(AnswerMemoryDocumentClass);
