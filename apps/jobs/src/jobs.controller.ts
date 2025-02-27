import { Controller } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateCompanyDto } from 'libs/common/dtos/create-company.dto';
import { CreateJobDto } from 'libs/common/dtos';
import { UpdateJobDto } from 'libs/common/dtos/update-job.dto';
import { SearchJobsDto } from 'libs/common/dtos/search-jobs.dto';

@Controller()
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @MessagePattern({ cmd: 'create-company' })
  async handleCreateCompany(
    @Payload('createCompanyDto') createCompanyDto: CreateCompanyDto,
    @Payload('userId') userId: string,
  ) {
    return await this.jobsService.handleCreateCompany(userId, createCompanyDto);
  }

  @MessagePattern({ cmd: 'create-job' })
  async handleCreateJob(
    @Payload('createJobDto') createJobDto: CreateJobDto,
    @Payload('userId') userId: string,
  ) {
    return await this.jobsService.handleCreateJob(createJobDto, userId);
  }

  @MessagePattern({ cmd: 'approve-jobs' })
  async handleApproveJobs(@Payload() jobIds: string[]) {
    return await this.jobsService.handleApproveJobs(jobIds);
  }

  @MessagePattern({ cmd: 'get-jobs' })
  async handleGetJobs(@Payload() filters?: SearchJobsDto) {
    return await this.jobsService.handleGetJobs(filters);
  }

  @MessagePattern({ cmd: 'delete-job' })
  async handleDeleteJob(@Payload() jobId: string) {
    return await this.jobsService.handleDeleteJob(jobId);
  }

  @MessagePattern({ cmd: 'update-job' })
  async handleUpdateJob(
    @Payload('updateJobDto') updateJobDto: UpdateJobDto,
    @Payload('jobId') jobId: string,
  ) {
    return await this.jobsService.handleUpdateJob(updateJobDto, jobId);
  }

  @MessagePattern({ cmd: 'get-job' })
  async handleGetJob(@Payload() jobId: string) {
    return await this.jobsService.handleGetJob(jobId);
  }

  @MessagePattern({ cmd: 'get-company' })
  async handleGetCompany(@Payload() companyId: string) {
    return await this.jobsService.handleGetCompany(companyId);
  }

  @MessagePattern({ cmd: 'saved-jobs' })
  async handleSavedJobs(
    @Payload('jobIds') jobIds: string[],
    @Payload('userId') userId: string,
  ) {
    return await this.jobsService.handleSavedJobs(jobIds, userId);
  }

  @MessagePattern({ cmd: 'remove-saved-jobs' })
  async handleRemoveSavedJobs(
    @Payload('jobIds') jobIds: string[],
    @Payload('userId') userId: string,
  ) {
    return await this.jobsService.handleRemoveSavedJobs(jobIds, userId);
  }

  @MessagePattern({ cmd: 'get-jobs-recruiter' })
  async handleGetAllApplicationsOfJobs(@Payload() recruiterId: string) {
    return await this.jobsService.handleGetAllApplicationsOfJobs(recruiterId);
  }
}
