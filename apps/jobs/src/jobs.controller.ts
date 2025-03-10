import { Controller, UseInterceptors } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { User } from 'apps/users/src/entities/users.entity';
import { CreateJobDto } from 'libs/common/dtos';
import { CreateCompanyDto } from 'libs/common/dtos/create-company.dto';
import { ProcessJobsDto } from 'libs/common/dtos/process-jobs.dto';
import { SearchJobsDto } from 'libs/common/dtos/search-jobs.dto';
import { UpdateCompanyDto } from 'libs/common/dtos/update-company.dto';
import { UpdateJobDto } from 'libs/common/dtos/update-job.dto';
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
    return await this.jobsService.handleCreateCompany(userId, createCompanyDto);
  }

  @MessagePattern({ cmd: 'create-job' })
  async handleCreateJob(
    @Payload('createJobDto') createJobDto: CreateJobDto,
    @Payload('user') user: User,
  ) {
    return await this.jobsService.handleCreateJob(createJobDto, user);
  }

  @MessagePattern({ cmd: 'process-jobs' })
  async handleProcessJobs(@Payload() processJobsDto: ProcessJobsDto) {
    return await this.jobsService.handleProcessJobs(processJobsDto);
  }

  @MessagePattern({ cmd: 'get-jobs' })
  async handleGetJobs(
    @Payload('user') user: User,
    @Payload('filters') filters?: SearchJobsDto,
  ) {
    return await this.jobsService.handleGetJobs(user, filters);
  }

  @MessagePattern({ cmd: 'delete-job' })
  async handleDeleteJob(
    @Payload('jobId') jobId: string,
    @Payload('user') user: User,
  ) {
    return await this.jobsService.handleDeleteJob(jobId, user);
  }

  @MessagePattern({ cmd: 'update-job' })
  async handleUpdateJob(
    @Payload('updateJobDto') updateJobDto: UpdateJobDto,
    @Payload('jobId') jobId: string,
    @Payload('user') user: User,
  ) {
    return await this.jobsService.handleUpdateJob(updateJobDto, jobId, user);
  }

  @MessagePattern({ cmd: 'get-job' })
  async handleGetJob(
    @Payload('jobId') jobId: string,
    @Payload('user') user: User,
  ) {
    return await this.jobsService.handleGetJob(jobId, user);
  }

  @MessagePattern({ cmd: 'get-company' })
  async handleGetCompany(@Payload() companyId: string) {
    return await this.jobsService.handleGetCompany(companyId);
  }

  @MessagePattern({ cmd: 'saved-jobs' })
  async handleSavedJobs(
    @Payload('jobIds') jobIds: string[],
    @Payload('user') user: User,
  ) {
    return await this.jobsService.handleSavedJobs(jobIds, user);
  }

  @MessagePattern({ cmd: 'remove-saved-jobs' })
  async handleRemoveSavedJobs(
    @Payload('jobIds') jobIds: string[],
    @Payload('user') user: User,
  ) {
    return await this.jobsService.handleRemoveSavedJobs(jobIds, user);
  }

  @MessagePattern({ cmd: 'get-jobs-recruiter' })
  async handleGetAllApplicationsOfJobs(@Payload() recruiterId: string) {
    return await this.jobsService.handleGetAllApplicationsOfJobs(recruiterId);
  }

  @MessagePattern({ cmd: 'get-company-by-recruiter-id' })
  async handleGetCompanyByRecruiterId(@Payload() recruiterId: string) {
    return await this.jobsService.handleGetCompanyByRecruiterId(recruiterId);
  }

  @EventPattern('update-company')
  async handleUpdateCompanyOfRecruiter(
    @Payload('updateCompanyDto') updateCompanyDto: UpdateCompanyDto,
    @Payload('recruiterId') recruiterId: string,
  ) {
    return await this.jobsService.handleUpdateCompanyOfRecruiter(
      updateCompanyDto,
      recruiterId,
    );
  }

  @MessagePattern({ cmd: 'verify-job' })
  async handleVerifyJob(@Payload() jobId: string) {
    return await this.jobsService.handleVerifyJob(jobId);
  }
}
