import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { User } from 'apps/users/src/entities/users.entity';
import { CreateJobDto } from 'libs/common/dtos';
import { ProcessJobsDto } from 'libs/common/dtos/process-jobs.dto';
import { SavedJobsDto } from 'libs/common/dtos/saved-jobs.dto';
import { SearchJobsDto } from 'libs/common/dtos/search-jobs.dto';
import { UpdateJobDto } from 'libs/common/dtos/update-job.dto';

@Injectable()
export class JobsService {
  constructor(
    @Inject('JOBS_SERVICE') private readonly rabbitMqJobsClient: ClientProxy,
  ) {}

  public handleCreateJob = (createJobDto: CreateJobDto, user: User) => {
    return this.rabbitMqJobsClient.send(
      { cmd: 'create-job' },
      { createJobDto, user },
    );
  };

  public handleProcessJobs = (processJobsDto: ProcessJobsDto) => {
    return this.rabbitMqJobsClient.send(
      { cmd: 'process-jobs' },
      processJobsDto,
    );
  };

  public handleGetJobs = (user: User, filters?: SearchJobsDto) => {
    return this.rabbitMqJobsClient.send({ cmd: 'get-jobs' }, { filters, user });
  };

  public handleDeleteJob = (jobId: string, user: User) => {
    return this.rabbitMqJobsClient.send(
      { cmd: 'delete-job' },
      {
        jobId,
        user,
      },
    );
  };

  public handleUpdateJob = (
    updateJobDto: UpdateJobDto,
    jobId: string,
    user: User,
  ) => {
    return this.rabbitMqJobsClient.send(
      { cmd: 'update-job' },
      { updateJobDto, jobId, user },
    );
  };

  public handleGetJob = (jobId: string, user: User) => {
    return this.rabbitMqJobsClient.send({ cmd: 'get-job' }, { jobId, user });
  };

  public handleSavedJobs = (savedJobsDto: SavedJobsDto, user: User) => {
    return this.rabbitMqJobsClient.send(
      { cmd: 'saved-jobs' },
      {
        jobIds: savedJobsDto.jobIds,
        user,
      },
    );
  };

  public handleRemoveSavedJobs = (
    removeSavedJobsDto: SavedJobsDto,
    user: User,
  ) => {
    return this.rabbitMqJobsClient.send(
      { cmd: 'remove-saved-jobs' },
      {
        jobIds: removeSavedJobsDto.jobIds,
        user,
      },
    );
  };

  public handleGetAllApplicationsOfJobs = (recruiterId: string) => {
    return this.rabbitMqJobsClient.send(
      { cmd: 'get-jobs-recruiter' },
      recruiterId,
    );
  };
}
