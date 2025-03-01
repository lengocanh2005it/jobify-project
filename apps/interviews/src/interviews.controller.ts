import { Controller, Get } from '@nestjs/common';
import { InterviewsService } from './interviews.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateInterviewDto } from 'libs/common/dtos/create-interview.dto';
import { ProcessInterviewsDto } from 'libs/common/dtos/process-interviews.dto';
import { UpdateInterviewDto } from 'libs/common/dtos/update-interview.dto';
import { SearchInterviewsDto } from 'libs/common/dtos/search-interviews.dto';
import { User } from 'apps/users/src/entities/users.entity';

@Controller()
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @MessagePattern({ cmd: 'create-interview' })
  async handleCreateInterview(
    @Payload('createInterviewDto') createInterviewDto: CreateInterviewDto,
    @Payload('recruiterId') recruiterId: string,
  ) {
    return await this.interviewsService.handleCreateInterview(
      createInterviewDto,
      recruiterId,
    );
  }

  @MessagePattern({ cmd: 'process-interviews' })
  async handleProcessInterviews(
    @Payload() processInterviewsDto: ProcessInterviewsDto,
  ) {
    return await this.interviewsService.handleProcessInterviews(
      processInterviewsDto,
    );
  }

  @MessagePattern({ cmd: 'update-interview' })
  async handleUpdateInterview(
    @Payload('updateInterviewDto') updateInterviewDto: UpdateInterviewDto,
    @Payload('interviewId') interviewId: string,
  ) {
    return await this.interviewsService.handleUpdateInterview(
      updateInterviewDto,
      interviewId,
    );
  }

  @MessagePattern({ cmd: 'delete-interview' })
  async handleDeleteInterview(@Payload() interviewId: string) {
    return await this.interviewsService.handleDeleteInterview(interviewId);
  }

  @MessagePattern({ cmd: 'get-interviews-recruiters' })
  async handleGetInterviewsOfRecruiters(@Payload() recruiterId: string) {
    return await this.interviewsService.handleGetInterviewsOfRecruiters(
      recruiterId,
    );
  }

  @MessagePattern({ cmd: 'get-interviews' })
  async handleGetInterviews(
    @Payload('user') user: User,
    @Payload('searchInterviewsDto') searchInterviewsDto?: SearchInterviewsDto,
  ) {
    return await this.interviewsService.handleGetReviews(
      user,
      searchInterviewsDto,
    );
  }
}
