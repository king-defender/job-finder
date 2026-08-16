import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JobsModule } from '../jobs/jobs.module';
import { ProfileModule } from '../profile/profile.module';
import { OutreachController } from './outreach.controller';
import { OutreachService } from './outreach.service';
import { OutreachDraftDocumentClass, OutreachDraftSchema } from './schemas/outreach-draft.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OutreachDraftDocumentClass.name, schema: OutreachDraftSchema },
    ]),
    JobsModule,
    ProfileModule,
  ],
  controllers: [OutreachController],
  providers: [OutreachService],
})
export class OutreachModule {}
