import { Controller, Post } from '@nestjs/common';
import { JobsService } from 'apps/api-gateway/src/jobs/jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  createPost() {}
}
