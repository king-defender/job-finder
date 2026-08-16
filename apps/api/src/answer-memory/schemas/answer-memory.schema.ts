import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: false, collection: 'answer_memory' })
export class AnswerMemoryDocumentClass {
  @Prop({ type: String, required: true, unique: true, index: true })
  normalizedQuestion!: string;

  @Prop({ type: String, required: true })
  answer!: string;

  @Prop({ type: String, required: true })
  classification!: string;

  @Prop({ type: String, required: true })
  lastConfirmedAt!: string;
}

export type AnswerMemoryDocument = HydratedDocument<AnswerMemoryDocumentClass>;
export const AnswerMemorySchema = SchemaFactory.createForClass(AnswerMemoryDocumentClass);
