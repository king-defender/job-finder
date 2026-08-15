import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProfileModule } from '../profile/profile.module';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { JobDocumentClass, JobSchema } from './schemas/job.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: JobDocumentClass.name, schema: JobSchema }]),
    ProfileModule,
  ],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
