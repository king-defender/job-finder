import { Controller, Get } from '@nestjs/common';
import { ApplicationAnalytics } from '@job-agent/shared';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  getAnalytics(): Promise<ApplicationAnalytics> {
    return this.analyticsService.getAnalytics();
  }
}
