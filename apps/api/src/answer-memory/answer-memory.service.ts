import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { normalizeQuestion } from '@job-agent/shared';
import { AnswerMemoryEntry, CreateAnswerMemoryInput } from '@job-agent/shared';
import { AnswerMemoryDocument, AnswerMemoryDocumentClass } from './schemas/answer-memory.schema';

function toEntry(doc: AnswerMemoryDocument): AnswerMemoryEntry {
  const obj = doc.toObject();
  return {
    id: doc._id.toString(),
    normalizedQuestion: obj.normalizedQuestion,
    answer: obj.answer,
    classification: obj.classification as AnswerMemoryEntry['classification'],
    lastConfirmedAt: obj.lastConfirmedAt,
  };
}

@Injectable()
export class AnswerMemoryService {
  constructor(
    @InjectModel(AnswerMemoryDocumentClass.name)
    private readonly answerMemoryModel: Model<AnswerMemoryDocumentClass>,
  ) {}

  /**
   * Runtime-enforced, not just type-enforced: a request body isn't guaranteed
   * to respect CreateAnswerMemoryInput's green|yellow restriction just
   * because TS says so at compile time. Red questions are never cached —
   * see PROJECT_PLAN.md's Red-question policy.
   */
  async upsert(input: CreateAnswerMemoryInput): Promise<AnswerMemoryEntry> {
    if (input.classification !== 'green' && input.classification !== 'yellow') {
      throw new BadRequestException('Only green or yellow answers may be saved to memory.');
    }

    const normalizedQuestion = normalizeQuestion(input.question);
    const doc = await this.answerMemoryModel.findOneAndUpdate(
      { normalizedQuestion },
      {
        normalizedQuestion,
        answer: input.answer,
        classification: input.classification,
        lastConfirmedAt: new Date().toISOString(),
      },
      { upsert: true, new: true },
    );
    return toEntry(doc);
  }

  async list(): Promise<AnswerMemoryEntry[]> {
    const docs = await this.answerMemoryModel.find();
    return docs.map(toEntry);
  }

  async lookup(question: string): Promise<AnswerMemoryEntry | null> {
    const normalizedQuestion = normalizeQuestion(question);
    const doc = await this.answerMemoryModel.findOne({ normalizedQuestion });
    if (!doc) return null;
    // Defensive — classification should never be "red" here since upsert() rejects it, but never trust and reuse a red answer regardless of how it got in.
    if (doc.classification === 'red') return null;
    return toEntry(doc);
  }
}
