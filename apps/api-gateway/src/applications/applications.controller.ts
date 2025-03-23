import {
  Cache,
  CACHE_MANAGER,
  CacheInterceptor,
  CacheKey,
  CacheTTL,
} from '@nestjs/cache-manager';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiForbiddenResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApplicationsService } from 'apps/api-gateway/src/applications/applications.service';
import { User } from 'apps/users/src/entities';
import { Request } from 'express';
import { API_TAGS, Role } from 'libs/common/constants';
import { ResponseMessage, Roles } from 'libs/common/decorators';
import {
  CreateApplicationDto,
  ProcessApplicationsDto,
  SearchApplicationsDto,
} from 'libs/common/dtos';
import { JwtAuthGuard, RoleAuthGuard } from 'libs/common/guards';
import {
  CreateApplication,
  generateRpcExceptionResponse,
  UpdateApplication,
} from 'libs/common/utils';

@Controller('applications')
@ApiTags(API_TAGS.APPLICATIONS)
@UseGuards(JwtAuthGuard, RoleAuthGuard)
@ApiBearerAuth()
export class ApplicationsController {
  constructor(
    private readonly applicationsService: ApplicationsService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Post()
  @Roles(Role.CANDIDATE)
  @ResponseMessage('New application created successfully!')
  @UseInterceptors(AnyFilesInterceptor())
  @ApiOperation({
    summary: 'Submit a job application',
    description:
      'Allows a candidate to submit a job application by providing a resume (CV) file and an optional cover letter. The request must include the job ID.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description:
      'Submit a job application with a resume, an optional cover letter, and the job ID.',
    schema: {
      type: 'object',
      properties: {
        resume: {
          type: 'string',
          format: 'binary',
          description: 'Resume (CV) file (required)',
        },
        cover_letter: {
          type: 'string',
          format: 'binary',
          description: 'Cover letter file (optional)',
        },
        job_id: {
          type: 'string',
          description:
            'The unique identifier of the job for which the application is being submitted.',
          example: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
        },
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Only CANDIDATE can have permission to access this route.',
  })
  async createApplication(
    @Body() createApplicationDto: CreateApplicationDto,
    @Req() request: Request,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    const resumeFile = files.find((file) => file.fieldname === 'resume');

    if (!resumeFile)
      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.BAD_GATEWAY,
          `You must provide Resume (CV) File.`,
        ),
      );

    const coverLetterFile = files.find(
      (file) => file.fieldname === 'cover_letter',
    );

    const userId = request.user?.id as string;

    const createApplication: CreateApplication = {
      userId,
      resumeFile,
      coverLetterFile,
      jobId: createApplicationDto.job_id,
    };

    return this.applicationsService.createApplication(createApplication);
  }

  @Get()
  @ResponseMessage('Applications fetched successfully!')
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({
    summary: 'Get job applications',
    description:
      'Retrieves a list of job applications. Admins can access all applications, while candidates and recruiters can only access their relevant applications.',
  })
  @ApiResponse({
    status: 200,
    description: 'A list of job applications retrieved successfully.',
    schema: {
      example: [
        {
          id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
          resume_link: 'https://example.com/resume.pdf',
          cover_letter_link: 'https://example.com/cover_letter.pdf',
          status: 'pending',
          applied_at: '2024-03-22T12:00:00Z',
          candidate: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'john.doe@example.com',
            full_name: 'John Doe',
            bio: 'Software engineer with 5 years of experience in web development.',
            phone_number: '+1 234 567 890',
            address: '123 Main St, City, Country',
            certifications: [
              'AWS Certified Developer',
              'Google Cloud Associate',
            ],
          },
          job: {
            id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
            title: 'Frontend Developer',
            description:
              'Seeking a skilled frontend developer to join our team.',
            salary_min: 1200.2,
            salary_max: 1500.67,
            job_type: 'full_time',
            status: 'open',
            posted_at: '2024-03-15T08:30:00Z',
          },
          recruiter: {
            id: '330e8400-e29b-41d4-a716-446655440333',
            email: 'recruiter@example.com',
            full_name: 'Jane Smith',
            bio: 'HR Manager with expertise in IT recruitment.',
            phone_number: '+1 987 654 321',
            address: '789 HR Ave, City, Country',
          },
        },
        {
          id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
          resume_link: 'https://example.com/resume.pdf',
          cover_letter_link: 'https://example.com/cover_letter.pdf',
          status: 'pending',
          applied_at: '2024-03-22T12:00:00Z',
          candidate: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'john.doe@example.com',
            full_name: 'John Doe',
            bio: 'Software engineer with 5 years of experience in web development.',
            phone_number: '+1 234 567 890',
            address: '123 Main St, City, Country',
            certifications: [
              'AWS Certified Developer',
              'Google Cloud Associate',
            ],
          },
          job: {
            id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
            title: 'Frontend Developer',
            description:
              'Seeking a skilled frontend developer to join our team.',
            salary_min: 1200.2,
            salary_max: 1500.67,
            job_type: 'full_time',
            status: 'open',
            posted_at: '2024-03-15T08:30:00Z',
          },
          recruiter: {
            id: '330e8400-e29b-41d4-a716-446655440333',
            email: 'recruiter@example.com',
            full_name: 'Jane Smith',
            bio: 'HR Manager with expertise in IT recruitment.',
            phone_number: '+1 987 654 321',
            address: '789 HR Ave, City, Country',
          },
        },
      ],
    },
  })
  @ApiForbiddenResponse({
    description:
      'Only ADMIN, RECRUITER and CANDIDATE can have permission to access this route.',
  })
  async getApplications(
    @Req() request: Request,
    @Query() searchApplicationsDto: SearchApplicationsDto,
  ) {
    const user = request.user as User;

    return this.applicationsService.getApplications(
      user,
      searchApplicationsDto,
    );
  }

  @Get(':id')
  @ResponseMessage('Application fetched successfully!')
  @Roles(Role.RECRUITER, Role.ADMIN, Role.CANDIDATE)
  @ApiOperation({
    summary: 'Get application details',
    description:
      'Retrieve the details of a specific job application by its unique ID. Only recruiters, admins, and the candidate who submitted the application have access to this information.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the job application.',
    example: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved application details.',
    schema: {
      example: {
        id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
        resume_link: 'https://example.com/resumes/resume.pdf',
        cover_letter_link: 'https://example.com/cover_letters/cover.pdf',
        status: 'pending',
        applied_at: '2024-03-20T14:30:00Z',
        candidate: {
          id: 'e54a7b2c-3b9a-4e72-9c77-b88b2789b5d2',
          email: 'john.doe@example.com',
          full_name: 'John Doe',
          bio: 'Experienced software developer specializing in full-stack applications.',
          phone_number: '+1234567890',
          address: '123 Main St, New York, NY',
          certifications: ['AWS Certified Developer', 'Scrum Master'],
        },
        job: {
          id: 'c819aeb4-7c29-4e33-85d5-8e5c78b8898f',
          title: 'Fullstack Developer',
          description:
            'Develop and maintain web applications using modern technologies.',
          salary_min: 1200.2,
          salary_max: 1500.67,
          job_type: 'full_time',
          status: 'open',
          address: '456 Tech Street, San Francisco, CA',
          posted_at: '2024-03-10T10:00:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Application not found or access denied.',
  })
  @ApiForbiddenResponse({
    description:
      'Only recruiters, admins, and the candidate who submitted the application have access to this information.',
  })
  async getApplication(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ) {
    const user = request.user as User;

    const cacheKey = `applications:${id}`;

    const cachedApplication = await this.cacheManager.get(cacheKey);

    if (cachedApplication) return cachedApplication;

    const application = await this.applicationsService.getApplication(id, user);

    await this.cacheManager.set(cacheKey, application);

    return application;
  }

  @Delete(':id')
  @ResponseMessage('Application deleted successfully!')
  @Roles(Role.ADMIN, Role.RECRUITER, Role.CANDIDATE)
  @ApiOperation({
    summary: 'Delete a job application',
    description:
      'Allows an admin, recruiter, or the candidate who submitted the application to delete it.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the job application to be deleted.',
    example: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
  })
  @ApiResponse({
    status: 200,
    description: 'Application deleted successfully.',
    schema: {
      example: {
        message: 'Application deleted successfully!',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden: User is not authorized to delete this application.',
  })
  @ApiResponse({
    status: 404,
    description: 'Application not found.',
  })
  async deleteApplication(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ) {
    const user = request.user as User;

    return this.applicationsService.deleteApplication(id, user);
  }

  @Patch(':id')
  @ResponseMessage('Application updated successfully!')
  @UseInterceptors(AnyFilesInterceptor())
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  @ApiOperation({
    summary: 'Update a job application',
    description:
      'Allows an admin, recruiter, or the candidate who submitted the application to update the resume and cover letter.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the job application to be updated.',
    example: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description:
      'Upload a new resume or cover letter to update the application.',
    schema: {
      type: 'object',
      properties: {
        resume: {
          type: 'string',
          format: 'binary',
          description: 'Updated Resume (CV) file (optional)',
        },
        cover_letter: {
          type: 'string',
          format: 'binary',
          description: 'Updated Cover Letter file (optional)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Application updated successfully.',
    schema: {
      example: {
        id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
        resume_link: 'https://example.com/resumes/resume.pdf',
        cover_letter_link: 'https://example.com/cover_letters/cover.pdf',
        status: 'pending',
        applied_at: '2024-03-20T14:30:00Z',
        candidate: {
          id: 'e54a7b2c-3b9a-4e72-9c77-b88b2789b5d2',
          email: 'john.doe@example.com',
          full_name: 'John Doe',
          bio: 'Experienced software developer specializing in full-stack applications.',
          phone_number: '+1234567890',
          address: '123 Main St, New York, NY',
          certifications: ['AWS Certified Developer', 'Scrum Master'],
        },
        job: {
          id: 'c819aeb4-7c29-4e33-85d5-8e5c78b8898f',
          title: 'Fullstack Developer',
          description:
            'Develop and maintain web applications using modern technologies.',
          salary_min: 1200.2,
          salary_max: 1500.67,
          job_type: 'full_time',
          status: 'open',
          address: '456 Tech Street, San Francisco, CA',
          posted_at: '2024-03-10T10:00:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request: Invalid file format or missing required fields.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden: User is not authorized to update this application.',
  })
  @ApiResponse({
    status: 404,
    description: 'Application not found.',
  })
  async updateApplication(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Req() request: Request,
  ) {
    const user = request.user as User;

    const resumeFile = files.find(
      (file) => file.fieldname === 'resume',
    ) as Express.Multer.File;

    const coverLetterFile = files.find(
      (file) => file.fieldname === 'cover_letter',
    );

    const updateApplication: UpdateApplication = {
      applicationId: id,
      resumeFile,
      coverLetterFile,
    };

    return this.applicationsService.updateApplication(updateApplication, user);
  }

  @Patch('recruiters/process')
  @ResponseMessage('Processed applications successfully!')
  @Roles(Role.RECRUITER, Role.ADMIN)
  @ApiOperation({
    summary: 'Process multiple job applications',
    description:
      'Allows recruiters and admins to approve or reject multiple job applications at once.',
  })
  @ApiBody({
    description:
      'The list of application IDs to process and their new statuses.',
    type: ProcessApplicationsDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Applications processed successfully.',
    schema: {
      example: {
        applications: {
          approvedApplications: [
            {
              id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
              resume_link: 'https://example.com/resumes/resume.pdf',
              cover_letter_link: 'https://example.com/cover_letters/cover.pdf',
              status: 'approved',
              applied_at: '2024-03-20T14:30:00Z',
              candidate: {
                id: 'e54a7b2c-3b9a-4e72-9c77-b88b2789b5d2',
                email: 'john.doe@example.com',
                full_name: 'John Doe',
                bio: 'Experienced software developer specializing in full-stack applications.',
                phone_number: '+1234567890',
                address: '123 Main St, New York, NY',
                certifications: ['AWS Certified Developer', 'Scrum Master'],
              },
              job: {
                id: 'c819aeb4-7c29-4e33-85d5-8e5c78b8898f',
                title: 'Fullstack Developer',
                description:
                  'Develop and maintain web applications using modern technologies.',
                salary_min: 1200.2,
                salary_max: 1500.67,
                job_type: 'full_time',
                status: 'open',
                address: '456 Tech Street, San Francisco, CA',
                posted_at: '2024-03-10T10:00:00Z',
              },
            },
          ],
          rejectedApplications: [
            {
              id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
              resume_link: 'https://example.com/resumes/resume.pdf',
              cover_letter_link: 'https://example.com/cover_letters/cover.pdf',
              status: 'rejected',
              applied_at: '2024-03-20T14:30:00Z',
              candidate: {
                id: 'e54a7b2c-3b9a-4e72-9c77-b88b2789b5d2',
                email: 'john.doe@example.com',
                full_name: 'John Doe',
                bio: 'Experienced software developer specializing in full-stack applications.',
                phone_number: '+1234567890',
                address: '123 Main St, New York, NY',
                certifications: ['AWS Certified Developer', 'Scrum Master'],
              },
              job: {
                id: 'c819aeb4-7c29-4e33-85d5-8e5c78b8898f',
                title: 'Fullstack Developer',
                description:
                  'Develop and maintain web applications using modern technologies.',
                salary_min: 1200.2,
                salary_max: 1500.67,
                job_type: 'full_time',
                status: 'open',
                address: '456 Tech Street, San Francisco, CA',
                posted_at: '2024-03-10T10:00:00Z',
              },
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request: Invalid input data.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: User is not authorized to process applications.',
  })
  @ApiResponse({
    status: 404,
    description: 'One or more applications not found.',
  })
  async processApplications(
    @Body() processApplicationsDto: ProcessApplicationsDto,
    @Req() request: Request,
  ) {
    const user = request.user as User;

    return this.applicationsService.handleProcessApplications(
      processApplicationsDto,
      user,
    );
  }
}
