import { Module } from '@nestjs/common';
import { JobsController } from 'apps/api-gateway/src/jobs/jobs.controller';
import { JobsService } from 'apps/api-gateway/src/jobs/jobs.service';

@Module({
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
