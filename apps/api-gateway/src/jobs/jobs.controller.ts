import { Cache, CACHE_MANAGER, CacheInterceptor } from '@nestjs/cache-manager';
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JobsService } from 'apps/api-gateway/src/jobs/jobs.service';
import { User } from 'apps/users/src/entities';
import { Request } from 'express';
import { API_TAGS, Role } from 'libs/common/constants';
import { ResponseMessage, Roles } from 'libs/common/decorators';
import {
  CreateJobDto,
  DeleteJobDto,
  ProcessJobsDto,
  RemoveSavedJobsDto,
  SavedJobsDto,
  SearchJobsDto,
  UpdateJobDto,
} from 'libs/common/dtos';
import { JwtAuthGuard, RoleAuthGuard } from 'libs/common/guards';

@Controller('jobs')
@UseGuards(JwtAuthGuard, RoleAuthGuard)
@ApiTags(API_TAGS.JOBS)
@ApiBearerAuth()
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Post()
  @ResponseMessage('New job created successfully.')
  @Roles(Role.RECRUITER, Role.ADMIN)
  @ApiOperation({
    summary: 'Create a new job',
    description: 'Create a new job with some given data.',
  })
  @ApiForbiddenResponse({
    description:
      'Only ADMINS and RECRUITERS can have permission to create a new job.',
  })
  @ApiBody({
    type: CreateJobDto,
    description: 'Data has been used for creating a new job.',
  })
  @ApiResponse({
    status: 200,
    description: 'Data of the new job.',
    schema: {
      example: {
        id: '17118ca1-a8a7-4fd3-9d3d-08f23cf1cf55',
        title: 'Software Engineer Intern',
        description: 'This job suitable for SE intern.',
        address: 'Ha Noi',
        job_type: 'full_time',
        salary_min: 1200,
        salary_max: 2000,
        posted_at: '2025-03-20T12:12:12Z',
        expire_at: '2025-03-30T12:12:12Z',
        recruiter: {
          id: '17118ca1-a8a7-4fd3-9d3d-08f23cf1cf55',
          full_name: 'John Doe',
          email: 'john01@gmail.com',
          phone_number: '+123435464',
          company: 'FPT Software',
        },
        requirements: [
          'Familiarity with Docker and containerized applications',
          'Proficiency in React.js, Vue.js, or Angular',
          'Strong understanding of state management (Redux, Zustand, or Vuex)',
        ],
      },
    },
  })
  async createJob(@Body() createJobDto: CreateJobDto, @Req() request: Request) {
    const user = request.user as User;

    return this.jobsService.handleCreateJob(createJobDto, user);
  }

  @Patch('process')
  @ResponseMessage('Jobs has been processed successfully.')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Admin process jobs',
    description: 'Admin can have permission to process jobs.',
  })
  @ApiBody({
    type: ProcessJobsDto,
    description: 'Data for admin to process jobs.',
  })
  @ApiForbiddenResponse({
    description: 'Only ADMINS can have permissions to process jobs.',
  })
  @ApiResponse({
    status: 200,
    description: 'Response data',
    schema: {
      example: {
        jobs: {
          approved_jobs: [
            {
              id: '17118ca1-a8a7-4fd3-9d3d-08f23cf1cf55',
              title: 'Software Engineer Intern',
              description: 'This job suitable for SE intern.',
              address: 'Ha Noi',
              job_type: 'full_time',
              salary_min: 1200,
              salary_max: 2000,
              posted_at: '2025-03-20T12:12:12Z',
              expire_at: '2025-03-30T12:12:12Z',
              recruiter: {
                id: '17118ca1-a8a7-4fd3-9d3d-08f23cf1cf55',
                full_name: 'John Doe',
                email: 'john01@gmail.com',
                phone_number: '+123435464',
                company: 'FPT Software',
              },
              requirements: [
                'Familiarity with Docker and containerized applications',
                'Proficiency in React.js, Vue.js, or Angular',
                'Strong understanding of state management (Redux, Zustand, or Vuex)',
              ],
              is_approved: true,
            },
          ],
          rejected_jobs: [
            {
              id: '17118ca1-a8a7-4fd3-9d3d-08f23cf1cf55',
              title: 'Software Engineer Intern',
              description: 'This job suitable for SE intern.',
              address: 'Ha Noi',
              job_type: 'full_time',
              salary_min: 1200,
              salary_max: 2000,
              posted_at: '2025-03-20T12:12:12Z',
              expire_at: '2025-03-30T12:12:12Z',
              recruiter: {
                id: '17118ca1-a8a7-4fd3-9d3d-08f23cf1cf55',
                full_name: 'John Doe',
                email: 'john01@gmail.com',
                phone_number: '+123435464',
                company: 'FPT Software',
              },
              requirements: [
                'Familiarity with Docker and containerized applications',
                'Proficiency in React.js, Vue.js, or Angular',
                'Strong understanding of state management (Redux, Zustand, or Vuex)',
              ],
              is_approved: false,
            },
          ],
        },
      },
    },
  })
  async processJobs(@Body() processJobsDto: ProcessJobsDto) {
    return this.jobsService.handleProcessJobs(processJobsDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.RECRUITER, Role.CANDIDATE)
  @ResponseMessage('Job fetched successfully.')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({
    summary: 'Get jobs',
    description: 'List of jobs has retrieved successfully.',
  })
  @ApiForbiddenResponse({
    description:
      'Only ADMINS, RECRUITERS and CANDIDATES can have permissions to get jobs.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of jobs has retrieved successfully.',
    schema: {
      example: [
        {
          id: '17118ca1-a8a7-4fd3-9d3d-08f23cf1cf55',
          title: 'Software Engineer Intern',
          description: 'This job suitable for SE intern.',
          address: 'Ha Noi',
          job_type: 'full_time',
          salary_min: 1200,
          salary_max: 2000,
          posted_at: '2025-03-20T12:12:12Z',
          expire_at: '2025-03-30T12:12:12Z',
          recruiter: {
            id: '17118ca1-a8a7-4fd3-9d3d-08f23cf1cf55',
            full_name: 'John Doe',
            email: 'john01@gmail.com',
            phone_number: '+123435464',
            company: 'FPT Software',
          },
          requirements: [
            'Familiarity with Docker and containerized applications',
            'Proficiency in React.js, Vue.js, or Angular',
            'Strong understanding of state management (Redux, Zustand, or Vuex)',
          ],
          is_approved: true,
        },
        {
          id: '17118ca1-a8a7-4fd3-9d3d-08f23cf1cf55',
          title: 'Software Engineer Intern',
          description: 'This job suitable for SE intern.',
          address: 'Ha Noi',
          job_type: 'full_time',
          salary_min: 1200,
          salary_max: 2000,
          posted_at: '2025-03-20T12:12:12Z',
          expire_at: '2025-03-30T12:12:12Z',
          recruiter: {
            id: '17118ca1-a8a7-4fd3-9d3d-08f23cf1cf55',
            full_name: 'John Doe',
            email: 'john01@gmail.com',
            phone_number: '+123435464',
            company: 'FPT Software',
          },
          requirements: [
            'Familiarity with Docker and containerized applications',
            'Proficiency in React.js, Vue.js, or Angular',
            'Strong understanding of state management (Redux, Zustand, or Vuex)',
          ],
          is_approved: true,
        },
      ],
    },
  })
  async getJobs(@Query() filters: SearchJobsDto, @Req() request: Request) {
    const user = request.user as User;

    return this.jobsService.handleGetJobs(user, filters);
  }

  @Delete(':id')
  @ResponseMessage('Job deleted successfully.')
  @Roles(Role.ADMIN, Role.RECRUITER)
  @ApiOperation({
    summary: 'Delete job',
    description: 'Delete job by id',
  })
  @ApiParam({
    name: 'id',
    description: 'The id of job.',
    example: '17118ca1-a8a7-4fd3-9d3d-08f23cf1cf55',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        message: 'Job deleted successfully.',
      },
    },
  })
  async deleteJob(
    @Param('id') id: string,
    @Req() request: Request,
    @Query() query?: DeleteJobDto,
  ) {
    const user = request.user as User;

    return this.jobsService.handleDeleteJob(id, user, query);
  }

  @Patch(':id')
  @ResponseMessage('Job updated successfully.')
  @Roles(Role.ADMIN, Role.RECRUITER)
  @ApiOperation({
    summary: 'Update job',
    description: 'Update existing job with some provided data.',
  })
  @ApiResponse({
    status: 200,
    description: 'Job data after updating.',
    schema: {
      example: {
        id: '17118ca1-a8a7-4fd3-9d3d-08f23cf1cf55',
        title: 'Software Engineer Intern',
        description: 'This job suitable for SE intern.',
        address: 'Ha Noi',
        job_type: 'full_time',
        salary_min: 1200,
        salary_max: 2000,
        posted_at: '2025-03-20T12:12:12Z',
        expire_at: '2025-03-30T12:12:12Z',
        recruiter: {
          id: '17118ca1-a8a7-4fd3-9d3d-08f23cf1cf55',
          full_name: 'John Doe',
          email: 'john01@gmail.com',
          phone_number: '+123435464',
          company: 'FPT Software',
        },
        requirements: [
          'Familiarity with Docker and containerized applications',
          'Proficiency in React.js, Vue.js, or Angular',
          'Strong understanding of state management (Redux, Zustand, or Vuex)',
        ],
        is_approved: true,
      },
    },
  })
  @ApiParam({
    name: 'id',
    description: 'The id of job',
    example: '17118ca1-a8a7-4fd3-9d3d-08f23cf1cf55',
  })
  @ApiBody({
    type: UpdateJobDto,
    description: 'Data has been used for updating job.',
  })
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
  @ApiOperation({
    summary: 'Get job details',
    description: 'Get job details by job id',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The id of job',
    example: '17118ca1-a8a7-4fd3-9d3d-08f23cf1cf55',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        id: '17118ca1-a8a7-4fd3-9d3d-08f23cf1cf55',
        title: 'Software Engineer Intern',
        description: 'This job suitable for SE intern.',
        address: 'Ha Noi',
        job_type: 'full_time',
        salary_min: 1200,
        salary_max: 2000,
        posted_at: '2025-03-20T12:12:12Z',
        expire_at: '2025-03-30T12:12:12Z',
        recruiter: {
          id: '17118ca1-a8a7-4fd3-9d3d-08f23cf1cf55',
          full_name: 'John Doe',
          email: 'john01@gmail.com',
          phone_number: '+123435464',
          company: 'FPT Software',
        },
        requirements: [
          'Familiarity with Docker and containerized applications',
          'Proficiency in React.js, Vue.js, or Angular',
          'Strong understanding of state management (Redux, Zustand, or Vuex)',
        ],
        is_approved: true,
      },
    },
  })
  async getJob(@Param('id') jobId: string, @Req() request: Request) {
    const user = request.user as User;

    const cacheKey = `jobs:${jobId}`;

    const cachedJob = await this.cacheManager.get(cacheKey);

    if (cachedJob) return cachedJob;

    const job = await this.jobsService.handleGetJob(jobId, user);

    await this.cacheManager.set(cacheKey, job);

    return job;
  }

  @Post('saved')
  @ResponseMessage('Job has been saved successfully.')
  @Roles(Role.CANDIDATE, Role.ADMIN)
  @ApiOperation({
    summary: 'Saved job favorites',
    description: 'Saved job favorites of candidates.',
  })
  @ApiBody({
    type: SavedJobsDto,
    description: 'Data has been used for save jobs.',
    schema: {
      example: {
        savedJobs: [
          {
            id: '17118ca1-a8a7-4fd3-9d3d-08f23cf1cf55',
            user_id: '17118ca1-a8a7-4fd3-9d3d-08f23cf1cf55',
            job_id: '17118ca1-a8a7-4fd3-9d3d-08f23cf1cf55',
          },
          {
            id: '17118ca1-a8a7-4fd3-9d3d-08f23cf1cf55',
            user_id: '17118ca1-a8a7-4fd3-9d3d-08f23cf1cf55',
            job_id: '17118ca1-a8a7-4fd3-9d3d-08f23cf1cf55',
          },
        ],
      },
    },
  })
  async savedJobs(@Body() savedJobDtos: SavedJobsDto, @Req() request: Request) {
    const user = request.user as User;

    return this.jobsService.handleSavedJobs(savedJobDtos, user);
  }

  @Delete('candidates/saved')
  @ResponseMessage('Saved jobs removed successfully.')
  @Roles(Role.ADMIN, Role.CANDIDATE)
  @ApiOperation({
    summary: 'Remove job favorites',
    description: 'Remove job favorites by id',
  })
  @ApiResponse({
    status: 200,
    description: 'Remove these job favorites successfully.',
  })
  async removeSavedJobs(
    @Query() removeSavedJobs: RemoveSavedJobsDto,
    @Req() request: Request,
  ) {
    const user = request.user as User;

    return this.jobsService.handleRemoveSavedJobs(removeSavedJobs, user);
  }
}
