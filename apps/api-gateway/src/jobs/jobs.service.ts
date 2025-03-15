import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { User } from 'apps/users/src/entities';
import {
  CreateJobDto,
  DeleteJobDto,
  ProcessJobsDto,
  RemoveSavedJobsDto,
  SavedJobsDto,
  SearchJobsDto,
  UpdateJobDto,
} from 'libs/common/dtos';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class JobsService {
  constructor(
    @Inject('JOBS_SERVICE') private readonly rabbitMqJobsClient: ClientProxy,
  ) {}

  public handleCreateJob = async (createJobDto: CreateJobDto, user: User) => {
    return await lastValueFrom(
      this.rabbitMqJobsClient.send(
        { cmd: 'create-job' },
        { createJobDto, user },
      ),
    );
  };

  public handleProcessJobs = async (processJobsDto: ProcessJobsDto) => {
    return await lastValueFrom(
      this.rabbitMqJobsClient.send({ cmd: 'process-jobs' }, processJobsDto),
    );
  };

  public handleGetJobs = async (user: User, filters?: SearchJobsDto) => {
    return await lastValueFrom(
      this.rabbitMqJobsClient.send({ cmd: 'get-jobs' }, { filters, user }),
    );
  };

  public handleDeleteJob = async (
    jobId: string,
    user: User,
    query?: DeleteJobDto,
  ) => {
    return await lastValueFrom(
      this.rabbitMqJobsClient.send(
        { cmd: 'delete-job' },
        {
          jobId,
          user,
          query,
        },
      ),
    );
  };

  public handleUpdateJob = async (
    updateJobDto: UpdateJobDto,
    jobId: string,
    user: User,
  ) => {
    return await lastValueFrom(
      this.rabbitMqJobsClient.send(
        { cmd: 'update-job' },
        { updateJobDto, jobId, user },
      ),
    );
  };

  public handleGetJob = async (jobId: string, user: User) => {
    return await lastValueFrom(
      this.rabbitMqJobsClient.send({ cmd: 'get-job' }, { jobId, user }),
    );
  };

  public handleSavedJobs = async (savedJobsDto: SavedJobsDto, user: User) => {
    return await lastValueFrom(
      this.rabbitMqJobsClient.send(
        { cmd: 'saved-jobs' },
        {
          jobIds: savedJobsDto.jobIds,
          user,
        },
      ),
    );
  };

  public handleRemoveSavedJobs = async (
    removeSavedJobsDto: RemoveSavedJobsDto,
    user: User,
  ) => {
    return await lastValueFrom(
      this.rabbitMqJobsClient.send(
        { cmd: 'remove-saved-jobs' },
        {
          removeSavedJobsDto,
          user,
        },
      ),
    );
  };

  public handleGetAllApplicationsOfJobs = async (recruiterId: string) => {
    return await lastValueFrom(
      this.rabbitMqJobsClient.send({ cmd: 'get-jobs-recruiter' }, recruiterId),
    );
  };
}
