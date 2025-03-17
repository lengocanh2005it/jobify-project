import { Module } from '@nestjs/common';
import { InterviewsController } from 'apps/api-gateway/src/interviews/interviews.controller';
import { InterviewsService } from 'apps/api-gateway/src/interviews/interviews.service';

@Module({
  controllers: [InterviewsController],
  providers: [InterviewsService],
})
export class InterviewsModule {}
