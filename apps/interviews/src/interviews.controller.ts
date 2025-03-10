import { Controller, UseInterceptors } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { User } from 'apps/users/src/entities/users.entity';
import { CreateInterviewDto } from 'libs/common/dtos/create-interview.dto';
import { ProcessInterviewsDto } from 'libs/common/dtos/process-interviews.dto';
import { SearchInterviewsDto } from 'libs/common/dtos/search-interviews.dto';
import { UpdateInterviewDto } from 'libs/common/dtos/update-interview.dto';
import { InterviewsService } from './interviews.service';
import { CandidatesProcessInterviewsDto } from 'libs/common/dtos/candidates-process-interviews.dto';
import { ServicesExceptionInterceptor } from 'libs/common/interceptors';

@Controller()
@UseInterceptors(ServicesExceptionInterceptor)
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @MessagePattern({ cmd: 'create-interview' })
  async handleCreateInterview(
    @Payload('createInterviewDto') createInterviewDto: CreateInterviewDto,
    @Payload('user') user: User,
  ) {
    return await this.interviewsService.handleCreateInterview(
      createInterviewDto,
      user,
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
    @Payload('user') user: User,
  ) {
    return await this.interviewsService.handleUpdateInterview(
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
    return await this.interviewsService.handleDeleteInterview(
      interviewId,
      user,
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
