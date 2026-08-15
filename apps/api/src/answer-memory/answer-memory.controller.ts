import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AnswerMemoryEntry } from '@job-agent/shared';
import { AnswerMemoryService } from './answer-memory.service';
import type { CreateAnswerMemoryInput } from '@job-agent/shared';

@Controller('answer-memory')
export class AnswerMemoryController {
  constructor(private readonly answerMemoryService: AnswerMemoryService) {}

  @Post()
  save(@Body() input: CreateAnswerMemoryInput): Promise<AnswerMemoryEntry> {
    return this.answerMemoryService.upsert(input);
  }

  @Get()
  list(): Promise<AnswerMemoryEntry[]> {
    return this.answerMemoryService.list();
  }

  /** Used by apps/worker to check for a stored answer before leaving a field unmapped. */
  @Get('lookup')
  lookup(@Query('question') question: string): Promise<AnswerMemoryEntry | null> {
    return this.answerMemoryService.lookup(question ?? '');
  }
}
