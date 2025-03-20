import { Module } from '@nestjs/common';
import { JobsController } from 'apps/api-gateway/src/jobs/jobs.controller';
import { JobsService } from 'apps/api-gateway/src/jobs/jobs.service';
import { SseModule } from 'apps/api-gateway/src/sse/sse.module';
import { SseService } from 'apps/api-gateway/src/sse/sse.service';

@Module({
  imports: [SseModule],
  controllers: [JobsController],
  providers: [JobsService, SseService],
})
export class JobsModule {}
