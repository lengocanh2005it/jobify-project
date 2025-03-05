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
import { User } from 'apps/users/src/entities/users.entity';
import { Request } from 'express';
import { Role } from 'libs/common/constants';
import { ResponseMessage, Roles } from 'libs/common/decorators';
import { CandidatesProcessInterviewsDto } from 'libs/common/dtos/candidates-process-interviews.dto';
import { CreateInterviewDto } from 'libs/common/dtos/create-interview.dto';
import { ProcessInterviewsDto } from 'libs/common/dtos/process-interviews.dto';
import { SearchInterviewsDto } from 'libs/common/dtos/search-interviews.dto';
import { UpdateInterviewDto } from 'libs/common/dtos/update-interview.dto';
import { JwtAuthGuard, RoleAuthGuard } from 'libs/common/guards';

@Controller('interviews')
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Get()
  @ResponseMessage('Interviews fetch successfully!')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.RECRUITER, Role.CANDIDATE)
  getInterviews(
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
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  @ResponseMessage('Interviews fetched successfully!')
  getInterview(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ) {
    const user = request.user as User;

    return this.interviewsService.handleGetInterview(id, user);
  }

  @Post()
  @ResponseMessage('New interview created successfully!')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.RECRUITER)
  createInterview(
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
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN)
  processInterviews(@Body() processInterviewDto: ProcessInterviewsDto) {
    return this.interviewsService.handleProcessInterviews(processInterviewDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.RECRUITER)
  @ResponseMessage('Interview updated successfully!')
  updateInterview(
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
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.RECRUITER)
  deleteInterview(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ) {
    const user = request.user as User;

    return this.interviewsService.handleDeleteInterview(id, user);
  }

  @Patch('candidates/process')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.CANDIDATE)
  candidatesProcessInterviews(
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
