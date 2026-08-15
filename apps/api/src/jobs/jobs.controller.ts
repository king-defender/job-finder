import { BadRequestException, Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Job } from '@job-agent/shared';
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
    if (dto.description.length > 20000) {
      throw new BadRequestException('description is too long (max 20000 characters).');
    }
    return this.jobsService.createJob(dto);
  }

  @Get()
  listJobs(): Promise<JobWithScore[]> {
    return this.jobsService.listJobsRanked();
  }

  @Get(':id')
  getJob(@Param('id') id: string): Promise<Job> {
    return this.jobsService.getJobById(id);
  }
}
