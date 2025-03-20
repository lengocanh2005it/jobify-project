import { CommonModule } from '@app/common';
import { Module } from '@nestjs/common';
import { SseController } from 'apps/api-gateway/src/sse/sse.controller';
import { SseService } from 'apps/api-gateway/src/sse/sse.service';

@Module({
  imports: [CommonModule],
  controllers: [SseController],
  providers: [SseService],
  exports: [SseService],
})
export class SseModule {}
