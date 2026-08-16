import { BadRequestException, Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { Job } from '@job-agent/shared';
import { JobsService, CreateJobResult, JobWithScore } from './jobs.service';
import type { CreateJobDto } from './dto/create-job.dto';

export interface DiscoverJobsBody {
  keywords: string;
  location?: string;
  remoteOnly?: boolean;
  limit?: number;
}

@Controller('jobs')
export class JobsController {
  constructor(@Inject(JobsService) private readonly jobsService: JobsService) {}

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

  @Post('discover')
  discoverJobs(@Body() body: DiscoverJobsBody): Promise<CreateJobResult[]> {
    if (!body.keywords?.trim()) {
      throw new BadRequestException('keywords string is required for job discovery.');
    }
    if (body.keywords.length > 500) {
      throw new BadRequestException('keywords string is too long (max 500 characters).');
    }
    if (body.location && body.location.length > 200) {
      throw new BadRequestException('location string is too long (max 200 characters).');
    }

    const limit = Math.min(Math.max(body.limit ?? 10, 1), 50);

    return this.jobsService.discoverJobs({
      keywords: body.keywords.trim(),
      location: body.location?.trim(),
      remoteOnly: body.remoteOnly ?? false,
      limit,
    });
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
