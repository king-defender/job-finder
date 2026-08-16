import { Module } from '@nestjs/common';
import { ApplicationsModule } from '../applications/applications.module';
import { JobsModule } from '../jobs/jobs.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [ApplicationsModule, JobsModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
