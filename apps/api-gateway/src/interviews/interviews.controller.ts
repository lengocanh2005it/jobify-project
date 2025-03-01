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
  @Roles(Role.ADMIN, Role.RECRUITER)
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

  @Post()
  @ResponseMessage('New interview created successfully!')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.RECRUITER)
  createInterview(
    @Body() createInterviewDto: CreateInterviewDto,
    @Req() request: Request,
  ) {
    const recruiter = request.user as User;

    return this.interviewsService.handleCreateInterview(
      createInterviewDto,
      recruiter.id,
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
  ) {
    return this.interviewsService.handleUpdateInterview(updateInterviewDto, id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.RECRUITER)
  deleteInterview(@Param('id', ParseUUIDPipe) id: string) {
    return this.interviewsService.handleDeleteInterview(id);
  }

  @Get('recruiters/me')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.RECRUITER)
  getInterviewsOfRecruiter(@Req() request: Request) {
    const user = request.user as User;

    return this.interviewsService.handleGetInterviewsOfRecruiter(user.id);
  }
}
