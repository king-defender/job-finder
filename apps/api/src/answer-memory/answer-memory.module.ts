import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnswerMemoryController } from './answer-memory.controller';
import { AnswerMemoryService } from './answer-memory.service';
import { AnswerMemoryDocumentClass, AnswerMemorySchema } from './schemas/answer-memory.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AnswerMemoryDocumentClass.name, schema: AnswerMemorySchema },
    ]),
  ],
  controllers: [AnswerMemoryController],
  providers: [AnswerMemoryService],
})
export class AnswerMemoryModule {}
