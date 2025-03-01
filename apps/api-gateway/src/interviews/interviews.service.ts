import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { User } from 'apps/users/src/entities/users.entity';
import { CreateInterviewDto } from 'libs/common/dtos/create-interview.dto';
import { ProcessInterviewsDto } from 'libs/common/dtos/process-interviews.dto';
import { SearchInterviewsDto } from 'libs/common/dtos/search-interviews.dto';
import { UpdateInterviewDto } from 'libs/common/dtos/update-interview.dto';

@Injectable()
export class InterviewsService {
  constructor(
    @Inject('INTERVIEWS_SERVICE')
    private readonly rabbitMqInterviewClient: ClientProxy,
  ) {}

  public handleCreateInterview = (
    createInterviewDto: CreateInterviewDto,
    recruiterId: string,
  ) => {
    return this.rabbitMqInterviewClient.send(
      { cmd: 'create-interview' },
      { createInterviewDto, recruiterId },
    );
  };

  public handleProcessInterviews(processInterviewsDto: ProcessInterviewsDto) {
    return this.rabbitMqInterviewClient.send(
      { cmd: 'process-interviews' },
      processInterviewsDto,
    );
  }

  public handleUpdateInterview = (
    updateInterviewDto: UpdateInterviewDto,
    interviewId: string,
  ) => {
    return this.rabbitMqInterviewClient.send(
      { cmd: 'update-interview' },
      {
        updateInterviewDto,
        interviewId,
      },
    );
  };

  public handleDeleteInterview = (interviewId: string) => {
    return this.rabbitMqInterviewClient.send(
      { cmd: 'delete-interview' },
      interviewId,
    );
  };

  public handleGetInterviewsOfRecruiter = (recruiterId: string) => {
    return this.rabbitMqInterviewClient.send(
      { cmd: 'get-interviews-recruiters' },
      recruiterId,
    );
  };

  public handleGetInterviews(
    user: User,
    searchInterviewsDto?: SearchInterviewsDto,
  ) {
    return this.rabbitMqInterviewClient.send(
      { cmd: 'get-interviews' },
      {
        user,
        searchInterviewsDto,
      },
    );
  }
}
