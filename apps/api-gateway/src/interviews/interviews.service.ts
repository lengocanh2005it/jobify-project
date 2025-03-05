import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { User } from 'apps/users/src/entities/users.entity';
import { CandidatesProcessInterviewsDto } from 'libs/common/dtos/candidates-process-interviews.dto';
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
    user: User,
  ) => {
    return this.rabbitMqInterviewClient.send(
      { cmd: 'create-interview' },
      { createInterviewDto, user },
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
    user: User,
  ) => {
    return this.rabbitMqInterviewClient.send(
      { cmd: 'update-interview' },
      {
        updateInterviewDto,
        interviewId,
        user,
      },
    );
  };

  public handleDeleteInterview = (interviewId: string, user: User) => {
    return this.rabbitMqInterviewClient.send(
      { cmd: 'delete-interview' },
      {
        interviewId,
        user,
      },
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

  public handleGetInterview = (interviewId: string, user: User) => {
    return this.rabbitMqInterviewClient.send(
      { cmd: 'get-interview' },
      {
        interviewId,
        user,
      },
    );
  };

  public handleProcessInterviewsOfCandidate = (
    user: User,
    candidatesProcessInterviewsDto: CandidatesProcessInterviewsDto,
  ) => {
    return this.rabbitMqInterviewClient.send(
      { cmd: 'process-interviews-candidates' },
      {
        user,
        candidatesProcessInterviewsDto,
      },
    );
  };
}
