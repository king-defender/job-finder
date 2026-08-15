import { BadRequestException, Body, Controller, Get, Post } from '@nestjs/common';
import { JobsService, CreateJobResult, JobWithScore } from './jobs.service';
import type { CreateJobDto } from './dto/create-job.dto';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  createJob(@Body() dto: CreateJobDto): Promise<CreateJobResult> {
    if (!dto.title?.trim() || !dto.company?.trim() || !dto.description?.trim()) {
      throw new BadRequestException('title, company, and description are required.');
    }
    return this.jobsService.createJob(dto);
  }

  @Get()
  listJobs(): Promise<JobWithScore[]> {
    return this.jobsService.listJobsRanked();
  }
}
