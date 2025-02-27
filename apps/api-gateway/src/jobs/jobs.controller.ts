import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JobsService } from 'apps/api-gateway/src/jobs/jobs.service';
import { Request } from 'express';
import { Role } from 'libs/common/constants';
import { Roles } from 'libs/common/decorators';
import { CreateJobDto } from 'libs/common/dtos';
import { ApproveJobsDto } from 'libs/common/dtos/approve-jobs.dto';
import { SavedJobsDto } from 'libs/common/dtos/saved-jobs.dto';
import { UpdateJobDto } from 'libs/common/dtos/update-job.dto';
import { JwtAuthGuard, RoleAuthGuard } from 'libs/common/guards';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.RECRUITER, Role.ADMIN)
  createJob(@Body() createJobDto: CreateJobDto, @Req() request: Request) {
    const userId = request.user?.id as string;

    return this.jobsService.handleCreateJob(createJobDto, userId);
  }

  @Patch('approve')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN)
  approveJobs(@Body() { jobIds }: ApproveJobsDto) {
    return this.jobsService.handleApproveJobs(jobIds);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.RECRUITER)
  getJobs() {
    return this.jobsService.handleGetJobs();
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.RECRUITER)
  deleteJob(@Param('id') id: string) {
    return this.jobsService.handleDeleteJob(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.RECRUITER)
  updateJob(@Body() updateJobDto: UpdateJobDto, @Param('id') id: string) {
    return this.jobsService.handleUpdateJob(updateJobDto, id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.CANDIDATE)
  getJob(@Param('id') jobId: string) {
    return this.jobsService.handleGetJob(jobId);
  }

  @Post('saved')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  savedJobs(@Body() savedJobDtos: SavedJobsDto, @Req() request: Request) {
    const userId = request.user?.id as string;

    return this.jobsService.handleSavedJobs(savedJobDtos, userId);
  }

  @Patch('saved/remove')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  removeSavedJobs(
    @Body() removeSavedJobsDto: SavedJobsDto,
    @Req() request: Request,
  ) {
    const userId = request.user?.id as string;

    return this.jobsService.handleRemoveSavedJobs(removeSavedJobsDto, userId);
  }
}
