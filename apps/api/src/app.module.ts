import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ProfileModule } from './profile/profile.module';
import { JobsModule } from './jobs/jobs.module';
import { ApplicationsModule } from './applications/applications.module';
import { AnswerMemoryModule } from './answer-memory/answer-memory.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { OutreachModule } from './outreach/outreach.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI ?? 'mongodb://localhost:27017/job_agent',
    ),
    ProfileModule,
    JobsModule,
    ApplicationsModule,
    AnswerMemoryModule,
    AnalyticsModule,
    OutreachModule,
  ],
})
export class AppModule {}
