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
import { User } from 'apps/users/src/entities';
import { Request } from 'express';
import { Role } from 'libs/common/constants';
import { ResponseMessage, Roles } from 'libs/common/decorators';
import {
  CreateJobDto,
  ProcessJobsDto,
  SavedJobsDto,
  SearchJobsDto,
  UpdateJobDto,
} from 'libs/common/dtos';
import { RemoveSavedJobsDto } from 'libs/common/dtos';
import { JwtAuthGuard, RoleAuthGuard } from 'libs/common/guards';

@Controller('jobs')
@UseGuards(JwtAuthGuard, RoleAuthGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @ResponseMessage('New job created successfully.')
  @Roles(Role.RECRUITER, Role.ADMIN)
  async createJob(@Body() createJobDto: CreateJobDto, @Req() request: Request) {
    const user = request.user as User;

    return this.jobsService.handleCreateJob(createJobDto, user);
  }

  @Patch('process')
  @ResponseMessage('Jobs has been processed successfully.')
  @Roles(Role.ADMIN)
  async processJobs(@Body() processJobsDto: ProcessJobsDto) {
    return this.jobsService.handleProcessJobs(processJobsDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.RECRUITER, Role.CANDIDATE)
  @ResponseMessage('Job fetched successfully.')
  async getJobs(@Query() filters: SearchJobsDto, @Req() request: Request) {
    const user = request.user as User;

    return this.jobsService.handleGetJobs(user, filters);
  }

  @Delete(':id')
  @ResponseMessage('Job deleted successfully.')
  @Roles(Role.ADMIN, Role.RECRUITER)
  async deleteJob(@Param('id') id: string, @Req() request: Request) {
    const user = request.user as User;

    return this.jobsService.handleDeleteJob(id, user);
  }

  @Patch(':id')
  @ResponseMessage('Job updated successfully.')
  @Roles(Role.ADMIN, Role.RECRUITER)
  async updateJob(
    @Body() updateJobDto: UpdateJobDto,
    @Param('id') id: string,
    @Req() request: Request,
  ) {
    const user = request.user as User;

    return this.jobsService.handleUpdateJob(updateJobDto, id, user);
  }

  @Get(':id')
  @ResponseMessage('Job fetched successfully.')
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  async getJob(@Param('id') jobId: string, @Req() request: Request) {
    const user = request.user as User;

    return this.jobsService.handleGetJob(jobId, user);
  }

  @Post('saved')
  @ResponseMessage('Job has been saved successfully.')
  @Roles(Role.CANDIDATE, Role.ADMIN)
  async savedJobs(@Body() savedJobDtos: SavedJobsDto, @Req() request: Request) {
    const user = request.user as User;

    return this.jobsService.handleSavedJobs(savedJobDtos, user);
  }

  @Delete('candidates/saved')
  @ResponseMessage('Saved jobs removed successfully.')
  @Roles(Role.ADMIN, Role.CANDIDATE)
  async removeSavedJobs(
    @Query() removeSavedJobs: RemoveSavedJobsDto,
    @Req() request: Request,
  ) {
    const user = request.user as User;

    return this.jobsService.handleRemoveSavedJobs(removeSavedJobs, user);
  }

  @Get('/recruiters/me')
  @Roles(Role.ADMIN, Role.RECRUITER)
  @ResponseMessage('All application of jobs fetched successfully.')
  async getAllApplicationsOfJobs(@Req() request: Request) {
    const userId = request.user?.id as string;

    return this.jobsService.handleGetAllApplicationsOfJobs(userId);
  }
}
