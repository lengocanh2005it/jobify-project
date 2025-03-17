import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InterviewsService } from 'apps/api-gateway/src/interviews/interviews.service';
import { User } from 'apps/users/src/entities';
import { Request } from 'express';
import { Role } from 'libs/common/constants';
import { ResponseMessage, Roles } from 'libs/common/decorators';
import {
  CandidatesProcessInterviewsDto,
  CreateInterviewDto,
  ProcessInterviewsDto,
  SearchInterviewsDto,
  UpdateInterviewDto,
} from 'libs/common/dtos';
import { JwtAuthGuard, RoleAuthGuard } from 'libs/common/guards';

@Controller('interviews')
@UseGuards(JwtAuthGuard, RoleAuthGuard)
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Get()
  @ResponseMessage('Interviews fetch successfully!')
  @Roles(Role.ADMIN, Role.RECRUITER, Role.CANDIDATE)
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
  @ResponseMessage('Interviews fetched successfully!')
  async getInterview(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ) {
    const user = request.user as User;

    return this.interviewsService.handleGetInterview(id, user);
  }

  @Post()
  @ResponseMessage('New interview created successfully!')
  @Roles(Role.ADMIN, Role.RECRUITER)
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
  async processInterviews(@Body() processInterviewDto: ProcessInterviewsDto) {
    return this.interviewsService.handleProcessInterviews(processInterviewDto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.RECRUITER)
  @ResponseMessage('Interview updated successfully!')
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
  @ResponseMessage('Interview deleted successfully.')
  async deleteInterview(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ) {
    const user = request.user as User;

    return this.interviewsService.handleDeleteInterview(id, user);
  }

  @Patch('candidates/process')
  @Roles(Role.ADMIN, Role.CANDIDATE)
  @ResponseMessage('Processed interviews successfully.')
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
