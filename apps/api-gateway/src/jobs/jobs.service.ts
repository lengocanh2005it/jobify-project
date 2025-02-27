import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateJobDto } from 'libs/common/dtos';
import { SavedJobsDto } from 'libs/common/dtos/saved-jobs.dto';
import { SearchJobsDto } from 'libs/common/dtos/search-jobs.dto';
import { UpdateJobDto } from 'libs/common/dtos/update-job.dto';

@Injectable()
export class JobsService {
  constructor(
    @Inject('JOBS_SERVICE') private readonly rabbitMqJobsClient: ClientProxy,
  ) {}

  public handleCreateJob = (createJobDto: CreateJobDto, userId: string) => {
    return this.rabbitMqJobsClient.send(
      { cmd: 'create-job' },
      { createJobDto, userId },
    );
  };

  public handleApproveJobs = (jobIds: string[]) => {
    return this.rabbitMqJobsClient.send({ cmd: 'approve-jobs' }, jobIds);
  };

  public handleGetJobs = (filters?: SearchJobsDto) => {
    return this.rabbitMqJobsClient.send(
      { cmd: 'get-jobs' },
      filters ? filters : {},
    );
  };

  public handleDeleteJob = (jobId: string) => {
    return this.rabbitMqJobsClient.send({ cmd: 'delete-job' }, jobId);
  };

  public handleUpdateJob = (updateJobDto: UpdateJobDto, jobId: string) => {
    return this.rabbitMqJobsClient.send(
      { cmd: 'update-job' },
      { updateJobDto, jobId },
    );
  };

  public handleGetJob = (jobId: string) => {
    return this.rabbitMqJobsClient.send({ cmd: 'get-job' }, jobId);
  };

  public handleSavedJobs = (savedJobsDto: SavedJobsDto, userId: string) => {
    return this.rabbitMqJobsClient.send(
      { cmd: 'saved-jobs' },
      {
        jobIds: savedJobsDto.jobIds,
        userId,
      },
    );
  };

  public handleRemoveSavedJobs = (
    removeSavedJobsDto: SavedJobsDto,
    userId: string,
  ) => {
    return this.rabbitMqJobsClient.send(
      { cmd: 'remove-saved-jobs' },
      {
        jobIds: removeSavedJobsDto.jobIds,
        userId,
      },
    );
  };
}
