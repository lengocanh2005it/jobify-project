import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JobsService } from 'apps/api-gateway/src/jobs/jobs.service';
import { User } from 'apps/users/src/entities/users.entity';
import { Request } from 'express';
import { Role } from 'libs/common/constants';
import { ResponseMessage, Roles } from 'libs/common/decorators';
import { CreateJobDto } from 'libs/common/dtos';
import { ApproveJobsDto } from 'libs/common/dtos/approve-jobs.dto';
import { SavedJobsDto } from 'libs/common/dtos/saved-jobs.dto';
import { SearchJobsDto } from 'libs/common/dtos/search-jobs.dto';
import { UpdateJobDto } from 'libs/common/dtos/update-job.dto';
import { JwtAuthGuard, RoleAuthGuard } from 'libs/common/guards';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @ResponseMessage('New job created successfully.')
  @Roles(Role.RECRUITER, Role.ADMIN)
  createJob(@Body() createJobDto: CreateJobDto, @Req() request: Request) {
    const user = request.user as User;

    return this.jobsService.handleCreateJob(createJobDto, user);
  }

  @Patch('approve')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @ResponseMessage('Jobs has been approved successfully.')
  @Roles(Role.ADMIN)
  approveJobs(@Body() { jobIds }: ApproveJobsDto) {
    return this.jobsService.handleApproveJobs(jobIds);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.RECRUITER)
  @ResponseMessage('Job fetched successfully.')
  getJobs(@Query() filters: SearchJobsDto, @Req() request: Request) {
    const user = request.user as User;

    return this.jobsService.handleGetJobs(user, filters);
  }

  @Delete(':id')
  @ResponseMessage('Job deleted successfully.')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.RECRUITER)
  deleteJob(@Param('id') id: string, @Req() request: Request) {
    const user = request.user as User;

    return this.jobsService.handleDeleteJob(id, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @ResponseMessage('Job updated successfully.')
  @Roles(Role.ADMIN, Role.RECRUITER)
  updateJob(
    @Body() updateJobDto: UpdateJobDto,
    @Param('id') id: string,
    @Req() request: Request,
  ) {
    const user = request.user as User;

    return this.jobsService.handleUpdateJob(updateJobDto, id, user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @ResponseMessage('Job fetched successfully.')
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  getJob(@Param('id') jobId: string, @Req() request: Request) {
    const user = request.user as User;

    return this.jobsService.handleGetJob(jobId, user);
  }

  @Post('saved')
  @ResponseMessage('Job has been saved successfully.')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.CANDIDATE, Role.ADMIN)
  savedJobs(@Body() savedJobDtos: SavedJobsDto, @Req() request: Request) {
    const user = request.user as User;

    return this.jobsService.handleSavedJobs(savedJobDtos, user);
  }

  @Patch('saved/remove')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  removeSavedJobs(
    @Body() removeSavedJobsDto: SavedJobsDto,
    @Req() request: Request,
  ) {
    const user = request.user as User;

    return this.jobsService.handleRemoveSavedJobs(removeSavedJobsDto, user);
  }

  @Get('/recruiters/me')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.RECRUITER)
  getAllApplicationsOfJobs(@Req() request: Request) {
    const userId = request.user?.id as string;

    return this.jobsService.handleGetAllApplicationsOfJobs(userId);
  }
}
