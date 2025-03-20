import { Controller, UseInterceptors } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { User } from 'apps/users/src/entities';
import {
  CreateCompanyDto,
  CreateJobDto,
  DeleteJobDto,
  ProcessJobsDto,
  RemoveSavedJobsDto,
  SearchJobsDto,
  UpdateCompanyDto,
  UpdateJobDto,
} from 'libs/common/dtos';
import { ServicesExceptionInterceptor } from 'libs/common/interceptors';
import { JobsService } from './jobs.service';

@Controller()
@UseInterceptors(ServicesExceptionInterceptor)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @MessagePattern({ cmd: 'create-company' })
  async handleCreateCompany(
    @Payload('createCompanyDto') createCompanyDto: CreateCompanyDto,
    @Payload('userId') userId: string,
  ) {
    return this.jobsService.handleCreateCompany(userId, createCompanyDto);
  }

  @MessagePattern({ cmd: 'create-job' })
  async handleCreateJob(
    @Payload('createJobDto') createJobDto: CreateJobDto,
    @Payload('user') user: User,
  ) {
    return this.jobsService.handleCreateJob(createJobDto, user);
  }

  @MessagePattern({ cmd: 'process-jobs' })
  async handleProcessJobs(@Payload() processJobsDto: ProcessJobsDto) {
    return this.jobsService.handleProcessJobs(processJobsDto);
  }

  @MessagePattern({ cmd: 'get-jobs' })
  async handleGetJobs(
    @Payload('user') user: User,
    @Payload('filters') filters?: SearchJobsDto,
  ) {
    return this.jobsService.handleGetJobs(user, filters);
  }

  @MessagePattern({ cmd: 'delete-job' })
  async handleDeleteJob(
    @Payload('jobId') jobId: string,
    @Payload('user') user: User,
    @Payload('query') query: DeleteJobDto,
  ) {
    return this.jobsService.handleDeleteJob(jobId, user, query);
  }

  @MessagePattern({ cmd: 'update-job' })
  async handleUpdateJob(
    @Payload('updateJobDto') updateJobDto: UpdateJobDto,
    @Payload('jobId') jobId: string,
    @Payload('user') user: User,
  ) {
    return this.jobsService.handleUpdateJob(updateJobDto, jobId, user);
  }

  @MessagePattern({ cmd: 'get-job' })
  async handleGetJob(
    @Payload('jobId') jobId: string,
    @Payload('user') user: User,
  ) {
    return this.jobsService.handleGetJob(jobId, user);
  }

  @MessagePattern({ cmd: 'get-company' })
  async handleGetCompany(@Payload() companyId: string) {
    return this.jobsService.handleGetCompany(companyId);
  }

  @MessagePattern({ cmd: 'saved-jobs' })
  async handleSavedJobs(
    @Payload('jobIds') jobIds: string[],
    @Payload('user') user: User,
  ) {
    return this.jobsService.handleSavedJobs(jobIds, user);
  }

  @MessagePattern({ cmd: 'remove-saved-jobs' })
  async handleRemoveSavedJobs(
    @Payload('removeSavedJobsDto') removeSavedJobsDto: RemoveSavedJobsDto,
    @Payload('user') user: User,
  ) {
    return this.jobsService.handleRemoveSavedJobs(removeSavedJobsDto, user);
  }

  @MessagePattern({ cmd: 'get-jobs-recruiter' })
  async handleGetAllApplicationsOfJobs(@Payload() recruiterId: string) {
    return this.jobsService.handleGetAllApplicationsOfJobs(recruiterId);
  }

  @MessagePattern({ cmd: 'get-company-by-recruiter-id' })
  async handleGetCompanyByRecruiterId(@Payload() recruiterId: string) {
    return this.jobsService.handleGetCompanyByRecruiterId(recruiterId);
  }

  @EventPattern('update-company')
  async handleUpdateCompanyOfRecruiter(
    @Payload('updateCompanyDto') updateCompanyDto: UpdateCompanyDto,
    @Payload('recruiterId') recruiterId: string,
  ) {
    return this.jobsService.handleUpdateCompanyOfRecruiter(
      updateCompanyDto,
      recruiterId,
    );
  }

  @MessagePattern({ cmd: 'verify-job' })
  async handleVerifyJob(@Payload() jobId: string) {
    return this.jobsService.handleVerifyJob(jobId);
  }

  @MessagePattern({ cmd: 'get-report-data' })
  async handleGetReportData() {
    return this.jobsService.handleGenerateJobReportData();
  }

  @MessagePattern({ cmd: 'search-jobs-by-title' })
  async handleSearchJobsByTitle(@Payload() title: string) {
    return this.jobsService.handleSearchJobsByTitle(title);
  }
}
