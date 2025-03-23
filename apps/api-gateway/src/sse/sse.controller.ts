import { Controller, Get, Sse, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SseService } from 'apps/api-gateway/src/sse/sse.service';
import { API_TAGS, Role } from 'libs/common/constants';
import { Roles } from 'libs/common/decorators';
import { JwtAuthGuard, RoleAuthGuard } from 'libs/common/guards';
import { map, Observable } from 'rxjs';

@Controller('sse')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleAuthGuard)
@Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
@ApiTags(API_TAGS.SSE)
export class SseController {
  constructor(private readonly sseService: SseService) {}

  @Get('jobs')
  @Sse()
  @ApiOperation({
    summary: 'Sse Controller',
    description: 'SSE (Server Sent Event) for searching real-time.',
  })
  streamJobs(): Observable<MessageEvent> {
    return this.sseService
      .handleGetJobUpdates()
      .pipe(map((jobs) => new MessageEvent('job-update', { data: jobs })));
  }
}
