import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { User } from 'apps/users/src/entities';
import {
  CandidatesProcessInterviewsDto,
  CreateInterviewDto,
  ProcessInterviewsDto,
  SearchInterviewsDto,
  UpdateInterviewDto,
} from 'libs/common/dtos';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class InterviewsService {
  constructor(
    @Inject('INTERVIEWS_SERVICE')
    private readonly rabbitMqInterviewClient: ClientProxy,
  ) {}

  public handleCreateInterview = async (
    createInterviewDto: CreateInterviewDto,
    user: User,
  ) => {
    return await lastValueFrom(
      this.rabbitMqInterviewClient.send(
        { cmd: 'create-interview' },
        { createInterviewDto, user },
      ),
    );
  };

  public async handleProcessInterviews(
    processInterviewsDto: ProcessInterviewsDto,
  ) {
    return await lastValueFrom(
      this.rabbitMqInterviewClient.send(
        { cmd: 'process-interviews' },
        processInterviewsDto,
      ),
    );
  }

  public handleUpdateInterview = async (
    updateInterviewDto: UpdateInterviewDto,
    interviewId: string,
    user: User,
  ) => {
    return await lastValueFrom(
      this.rabbitMqInterviewClient.send(
        { cmd: 'update-interview' },
        {
          updateInterviewDto,
          interviewId,
          user,
        },
      ),
    );
  };

  public handleDeleteInterview = async (interviewId: string, user: User) => {
    return await lastValueFrom(
      this.rabbitMqInterviewClient.send(
        { cmd: 'delete-interview' },
        {
          interviewId,
          user,
        },
      ),
    );
  };

  public async handleGetInterviews(
    user: User,
    searchInterviewsDto?: SearchInterviewsDto,
  ) {
    return await lastValueFrom(
      this.rabbitMqInterviewClient.send(
        { cmd: 'get-interviews' },
        {
          user,
          searchInterviewsDto,
        },
      ),
    );
  }

  public handleGetInterview = async (interviewId: string, user: User) => {
    return await lastValueFrom(
      this.rabbitMqInterviewClient.send(
        { cmd: 'get-interview' },
        {
          interviewId,
          user,
        },
      ),
    );
  };

  public handleProcessInterviewsOfCandidate = async (
    user: User,
    candidatesProcessInterviewsDto: CandidatesProcessInterviewsDto,
  ) => {
    return await lastValueFrom(
      this.rabbitMqInterviewClient.send(
        { cmd: 'process-interviews-candidates' },
        {
          user,
          candidatesProcessInterviewsDto,
        },
      ),
    );
  };
}
