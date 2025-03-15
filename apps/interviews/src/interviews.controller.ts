import { Controller, UseInterceptors } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { User } from 'apps/users/src/entities';
import {
  CandidatesProcessInterviewsDto,
  CreateInterviewDto,
  ProcessInterviewsDto,
  SearchInterviewsDto,
  UpdateInterviewDto,
} from 'libs/common/dtos';
import { ServicesExceptionInterceptor } from 'libs/common/interceptors';
import { InterviewsService } from './interviews.service';

@Controller()
@UseInterceptors(ServicesExceptionInterceptor)
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @MessagePattern({ cmd: 'create-interview' })
  async handleCreateInterview(
    @Payload('createInterviewDto') createInterviewDto: CreateInterviewDto,
    @Payload('user') user: User,
  ) {
    return this.interviewsService.handleCreateInterview(
      createInterviewDto,
      user,
    );
  }

  @MessagePattern({ cmd: 'process-interviews' })
  async handleProcessInterviews(
    @Payload() processInterviewsDto: ProcessInterviewsDto,
  ) {
    return this.interviewsService.handleProcessInterviews(processInterviewsDto);
  }

  @MessagePattern({ cmd: 'update-interview' })
  async handleUpdateInterview(
    @Payload('updateInterviewDto') updateInterviewDto: UpdateInterviewDto,
    @Payload('interviewId') interviewId: string,
    @Payload('user') user: User,
  ) {
    return this.interviewsService.handleUpdateInterview(
      updateInterviewDto,
      interviewId,
      user,
    );
  }

  @MessagePattern({ cmd: 'delete-interview' })
  async handleDeleteInterview(
    @Payload('interviewId') interviewId: string,
    @Payload('user') user: User,
  ) {
    return this.interviewsService.handleDeleteInterview(interviewId, user);
  }

  @MessagePattern({ cmd: 'get-interviews' })
  async handleGetInterviews(
    @Payload('user') user: User,
    @Payload('searchInterviewsDto') searchInterviewsDto?: SearchInterviewsDto,
  ) {
    return this.interviewsService.handleGetReviews(user, searchInterviewsDto);
  }

  @MessagePattern({ cmd: 'get-interview' })
  async handleGetInterview(
    @Payload('interviewId') interviewId: string,
    @Payload('user') user: User,
  ) {
    return this.interviewsService.handleGetInterview(interviewId, user);
  }

  @MessagePattern({ cmd: 'process-interviews-candidates' })
  async processInterviewsOfCandidates(
    @Payload('user') user: User,
    @Payload('candidatesProcessInterviewsDto')
    candidatesProcessInterviewsDto: CandidatesProcessInterviewsDto,
  ) {
    return this.interviewsService.handleProcessInterviewsOfCandidates(
      user,
      candidatesProcessInterviewsDto,
    );
  }
}
