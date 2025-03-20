import { Controller, Get, Sse } from '@nestjs/common';
import { SseService } from 'apps/api-gateway/src/sse/sse.service';
import { map, Observable } from 'rxjs';

@Controller('sse')
export class SseController {
  constructor(private readonly sseService: SseService) {}

  @Get('jobs')
  @Sse()
  streamJobs(): Observable<MessageEvent> {
    return this.sseService
      .handleGetJobUpdates()
      .pipe(map((jobs) => new MessageEvent('job-update', { data: jobs })));
  }
}
