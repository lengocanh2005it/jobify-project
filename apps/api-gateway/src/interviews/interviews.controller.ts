import { Cache, CACHE_MANAGER, CacheInterceptor } from '@nestjs/cache-manager';
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
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
import { InterviewsService } from 'apps/api-gateway/src/interviews/interviews.service';
import { User } from 'apps/users/src/entities';
import { Request } from 'express';
import { API_TAGS, Role } from 'libs/common/constants';
import { ResponseMessage, Roles } from 'libs/common/decorators';
import {
  CandidatesProcessInterviewsDto,
  CreateInterviewDto,
  ProcessInterviewsDto,
  SearchInterviewsDto,
  UpdateInterviewDto,
} from 'libs/common/dtos';
import { JwtAuthGuard, RoleAuthGuard } from 'libs/common/guards';
import { RBAcAnyPermissions, RBAcGuard, RBAcPermissions } from 'nestjs-rbac';

@Controller('interviews')
@UseGuards(JwtAuthGuard, RoleAuthGuard, RBAcGuard)
@ApiBearerAuth()
@ApiTags(API_TAGS.INTERVIEWS)
export class InterviewsController {
  constructor(
    private readonly interviewsService: InterviewsService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Get()
  @ResponseMessage('Interviews fetch successfully!')
  @Roles(Role.ADMIN, Role.RECRUITER, Role.CANDIDATE)
  @RBAcPermissions('interview@read')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({
    summary: 'Get interviews',
    description:
      'Retrieves a list of interviews. Admins can access all interviews, while candidates and recruiters can only access their relevant interviews.',
  })
  @ApiResponse({
    status: 200,
    description: 'A list of interviews retrieved successfully.',
    schema: {
      example: [
        {
          id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
          title: 'Interview for Fullstack Developer',
          description:
            'This is an interview has been used for Fullstack Developer.',
          interview_type: 'online',
          interview_link: 'https://...',
          interview_address: 'Ha Noi',
          cancel_reason: null,
          cancelled_by: null,
          interview_date: '2025-03-20Z12:34:12T',
          status: 'scheduled',
          note: null,
          approval_status: 'pending',
          result: 'pending',
          result_note: null,
          score: null,
          candidate: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'john.doe@example.com',
            full_name: 'John Doe',
            address: '123 Main St, City, Country',
          },
          recruiter: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'john.doe@example.com',
            full_name: 'John Doe',
            address: '123 Main St, City, Country',
          },
          job: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            title: 'Fullstack Developer',
            description: 'We are looking for passion fullstack developer.',
          },
        },
      ],
    },
  })
  async getInterviews(
    @Req() request: Request,
    @Query() searchInterviewsDto?: SearchInterviewsDto,
  ) {
    const user = request.user as User;

    return this.interviewsService.handleGetInterviews(
      user,
      searchInterviewsDto,
    );
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  @RBAcPermissions('interview@read')
  @ResponseMessage('Interviews fetched successfully!')
  @ApiOperation({
    summary: 'Get details information of interview',
    description: 'An interview has retrieved successfully.',
  })
  @ApiResponse({
    status: 200,
    description: 'An interview has retrieved successfully.',
    schema: {
      example: {
        id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
        title: 'Interview for Fullstack Developer',
        description:
          'This is an interview has been used for Fullstack Developer.',
        interview_type: 'online',
        interview_link: 'https://...',
        interview_address: 'Ha Noi',
        cancel_reason: null,
        cancelled_by: null,
        interview_date: '2025-03-20Z12:34:12T',
        status: 'scheduled',
        note: null,
        approval_status: 'pending',
        result: 'pending',
        result_note: null,
        score: null,
        candidate: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'john.doe@example.com',
          full_name: 'John Doe',
          address: '123 Main St, City, Country',
        },
        recruiter: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'john.doe@example.com',
          full_name: 'John Doe',
          address: '123 Main St, City, Country',
        },
        job: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          title: 'Fullstack Developer',
          description: 'We are looking for passion fullstack developer.',
        },
      },
    },
  })
  @ApiParam({
    name: 'id',
    description: 'Id of the interview',
    example: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
    type: String,
    required: true,
  })
  async getInterview(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ) {
    const user = request.user as User;

    const cacheKey = `interviews:${id}`;

    const cachedInterview = await this.cacheManager.get(cacheKey);

    if (cachedInterview) return cachedInterview;

    const interview = await this.interviewsService.handleGetInterview(id, user);

    await this.cacheManager.set(cacheKey, interview);

    return interview;
  }

  @Post()
  @ResponseMessage('New interview created successfully!')
  @Roles(Role.ADMIN, Role.RECRUITER)
  @RBAcPermissions('interview@create')
  @ApiOperation({
    summary: 'Create new interview',
    description: 'New interview created successfully.',
  })
  @ApiBody({
    type: CreateInterviewDto,
    description: 'Data has been used for creating interview',
  })
  @ApiResponse({
    status: 201,
    description: 'New interview created successfully.',
    schema: {
      example: {
        id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
        title: 'Interview for Fullstack Developer',
        description:
          'This is an interview has been used for Fullstack Developer.',
        interview_type: 'online',
        interview_link: 'https://...',
        interview_address: 'Ha Noi',
        cancel_reason: null,
        cancelled_by: null,
        interview_date: '2025-03-20Z12:34:12T',
        status: 'scheduled',
        note: null,
        approval_status: 'pending',
        result: 'pending',
        result_note: null,
        score: null,
        candidate: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'john.doe@example.com',
          full_name: 'John Doe',
          address: '123 Main St, City, Country',
        },
        recruiter: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'john.doe@example.com',
          full_name: 'John Doe',
          address: '123 Main St, City, Country',
        },
        job: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          title: 'Fullstack Developer',
          description: 'We are looking for passion fullstack developer.',
        },
      },
    },
  })
  async createInterview(
    @Body() createInterviewDto: CreateInterviewDto,
    @Req() request: Request,
  ) {
    const user = request.user as User;

    return this.interviewsService.handleCreateInterview(
      createInterviewDto,
      user,
    );
  }

  @Patch('admin/process')
  @ResponseMessage('Processed interviews successfully!')
  @Roles(Role.ADMIN)
  @RBAcPermissions('interview@accept', 'interview@reject')
  @ApiOperation({
    summary: 'Process interviews by admin',
    description: 'Admin can have permission to process the interviews.',
  })
  @ApiBody({
    type: ProcessInterviewsDto,
    description: 'Data has been used for admin to process the interviews.',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        approvedInterviews: [
          {
            id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
            title: 'Interview for Fullstack Developer',
            description:
              'This is an interview has been used for Fullstack Developer.',
            interview_type: 'online',
            interview_link: 'https://...',
            interview_address: 'Ha Noi',
            cancel_reason: null,
            cancelled_by: null,
            interview_date: '2025-03-20Z12:34:12T',
            status: 'scheduled',
            note: null,
            approval_status: 'pending',
            result: 'pending',
            result_note: null,
            score: null,
            candidate: {
              id: '550e8400-e29b-41d4-a716-446655440000',
              email: 'john.doe@example.com',
              full_name: 'John Doe',
              address: '123 Main St, City, Country',
            },
            recruiter: {
              id: '550e8400-e29b-41d4-a716-446655440000',
              email: 'john.doe@example.com',
              full_name: 'John Doe',
              address: '123 Main St, City, Country',
            },
            job: {
              id: '550e8400-e29b-41d4-a716-446655440000',
              title: 'Fullstack Developer',
              description: 'We are looking for passion fullstack developer.',
            },
          },
        ],
        rejectedInterviews: [
          {
            id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
            title: 'Interview for Fullstack Developer',
            description:
              'This is an interview has been used for Fullstack Developer.',
            interview_type: 'online',
            interview_link: 'https://...',
            interview_address: 'Ha Noi',
            cancel_reason: null,
            cancelled_by: null,
            interview_date: '2025-03-20Z12:34:12T',
            status: 'scheduled',
            note: null,
            approval_status: 'pending',
            result: 'pending',
            result_note: null,
            score: null,
            candidate: {
              id: '550e8400-e29b-41d4-a716-446655440000',
              email: 'john.doe@example.com',
              full_name: 'John Doe',
              address: '123 Main St, City, Country',
            },
            recruiter: {
              id: '550e8400-e29b-41d4-a716-446655440000',
              email: 'john.doe@example.com',
              full_name: 'John Doe',
              address: '123 Main St, City, Country',
            },
            job: {
              id: '550e8400-e29b-41d4-a716-446655440000',
              title: 'Fullstack Developer',
              description: 'We are looking for passion fullstack developer.',
            },
          },
        ],
      },
    },
  })
  async processInterviews(@Body() processInterviewDto: ProcessInterviewsDto) {
    return this.interviewsService.handleProcessInterviews(processInterviewDto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.RECRUITER, Role.SUPERADMIN)
  @RBAcPermissions('interview@update')
  @ResponseMessage('Interview updated successfully!')
  @ApiOperation({
    summary: 'Update Interview',
    description: 'Update some information of existing interview.',
  })
  @ApiResponse({
    status: 200,
    description: 'Updated interview successfully.',
    schema: {
      example: {
        id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
        title: 'Interview for Fullstack Developer',
        description:
          'This is an interview has been used for Fullstack Developer.',
        interview_type: 'online',
        interview_link: 'https://...',
        interview_address: 'Ha Noi',
        cancel_reason: null,
        cancelled_by: null,
        interview_date: '2025-03-20Z12:34:12T',
        status: 'scheduled',
        note: null,
        approval_status: 'pending',
        result: 'pending',
        result_note: null,
        score: null,
        candidate: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'john.doe@example.com',
          full_name: 'John Doe',
          address: '123 Main St, City, Country',
        },
        recruiter: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'john.doe@example.com',
          full_name: 'John Doe',
          address: '123 Main St, City, Country',
        },
        job: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          title: 'Fullstack Developer',
          description: 'We are looking for passion fullstack developer.',
        },
      },
    },
  })
  @ApiBody({
    type: UpdateInterviewDto,
    description: 'Some given data to be update the interview.',
  })
  @ApiParam({
    name: 'id',
    description: 'The id of interview',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  async updateInterview(
    @Body() updateInterviewDto: UpdateInterviewDto,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ) {
    const user = request.user as User;

    return this.interviewsService.handleUpdateInterview(
      updateInterviewDto,
      id,
      user,
    );
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.RECRUITER)
  @RBAcPermissions('interview@delete')
  @ResponseMessage('Interview deleted successfully.')
  @ApiOperation({
    summary: 'Delete Interview',
    description: 'Delete an existing interview',
  })
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
    description: 'The id of interview',
  })
  @ApiResponse({
    status: 200,
    description: 'A list of interviews retrieved successfully.',
    schema: {
      example: [
        {
          id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
          title: 'Interview for Fullstack Developer',
          description:
            'This is an interview has been used for Fullstack Developer.',
          interview_type: 'online',
          interview_link: 'https://...',
          interview_address: 'Ha Noi',
          cancel_reason: null,
          cancelled_by: null,
          interview_date: '2025-03-20Z12:34:12T',
          status: 'scheduled',
          note: null,
          approval_status: 'pending',
          result: 'pending',
          result_note: null,
          score: null,
          candidate: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'john.doe@example.com',
            full_name: 'John Doe',
            address: '123 Main St, City, Country',
          },
          recruiter: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'john.doe@example.com',
            full_name: 'John Doe',
            address: '123 Main St, City, Country',
          },
          job: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            title: 'Fullstack Developer',
            description: 'We are looking for passion fullstack developer.',
          },
        },
      ],
    },
  })
  async deleteInterview(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ) {
    const user = request.user as User;

    return this.interviewsService.handleDeleteInterview(id, user);
  }

  @Patch('candidates/process')
  @Roles(Role.ADMIN, Role.CANDIDATE)
  @RBAcPermissions('interview@accept', 'interview@reject')
  @ResponseMessage('Processed interviews successfully.')
  @ApiOperation({
    summary: 'Process interviews of candidates',
    description: 'Process interviews of candidates.',
  })
  @ApiBody({
    type: CandidatesProcessInterviewsDto,
    description: 'Data has been used for candidates to process the interviews.',
  })
  async candidatesProcessInterviews(
    @Req() request: Request,
    @Body() candidatesProcessInterviewsDto: CandidatesProcessInterviewsDto,
  ) {
    const user = request.user as User;

    return this.interviewsService.handleProcessInterviewsOfCandidate(
      user,
      candidatesProcessInterviewsDto,
    );
  }
}
