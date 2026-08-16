import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Application, AutoApplyStatus } from '@job-agent/shared';
import { ApplicationsService } from './applications.service';
import type { ApplicationPatch } from './applications.service';
import type { CreateApplicationDto } from './dto/create-application.dto';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  createApplication(@Body() dto: CreateApplicationDto): Promise<Application> {
    return this.applicationsService.createApplication(dto);
  }

  @Get()
  listApplications(): Promise<Application[]> {
    return this.applicationsService.listApplications();
  }

  /** Circuit-breaker status — informational only, nothing consumes this to actually submit anything. */
  @Get('auto-apply/status')
  getAutoApplyStatus(): Promise<AutoApplyStatus> {
    return this.applicationsService.getAutoApplyStatus();
  }

  @Get(':id')
  getApplication(@Param('id') id: string): Promise<Application> {
    return this.applicationsService.getApplicationById(id);
  }

  /** Called by apps/worker to report fill-run progress/results — not a general-purpose edit endpoint. */
  @Patch(':id')
  patchApplication(
    @Param('id') id: string,
    @Body() patch: ApplicationPatch,
  ): Promise<Application> {
    return this.applicationsService.patchApplication(id, patch);
  }

  @Post(':id/cover-letter')
  generateCoverLetter(@Param('id') id: string): Promise<Application> {
    return this.applicationsService.generateCoverLetter(id);
  }
}
