import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateApplicationDto } from 'libs/common/dtos/create-application.dto';
import { UpdateApplicationDto } from 'libs/common/dtos/update-application.dto';
import { ApplicationsService } from './applications.service';
import { ProcessApplicationsDto } from 'libs/common/dtos/process-applications.dto';
import { CreateApplication } from 'libs/common/utils/types';

@Controller()
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @MessagePattern({ cmd: 'create-application' })
  async createApplication(@Payload() createApplication: CreateApplication) {
    return await this.applicationsService.handleCreateApplication(
      createApplication,
    );
  }

  @MessagePattern({ cmd: 'get-applications' })
  async getApplications() {
    return this.applicationsService.handleGetApplications();
  }

  @MessagePattern({ cmd: 'get-application' })
  async getApplication(
    @Payload('applicationId') applicationId: string,
    @Payload('role') role: string,
  ) {
    return await this.applicationsService.handleGetApplication(
      applicationId,
      role,
    );
  }

  @MessagePattern({ cmd: 'delete-application' })
  async deleteApplication(@Payload() applicationId: string) {
    return await this.applicationsService.handleDeleteApplication(
      applicationId,
    );
  }

  @MessagePattern({ cmd: 'update-application' })
  async updateApplication(
    @Payload('applicationId') applicationId: string,
    @Payload('updateApplicationDto') updateApplicationDto: UpdateApplicationDto,
  ) {
    return await this.applicationsService.handleUpdateApplication(
      applicationId,
      updateApplicationDto,
    );
  }

  @MessagePattern({ cmd: 'approve-applications' })
  async approveApplications(
    @Payload('applicationIds') applicationIds: string[],
  ) {
    return await this.applicationsService.handleApproveApplications(
      applicationIds,
    );
  }

  @MessagePattern({ cmd: 'reject-applications' })
  async rejectApplications(
    @Payload('applicationIds') applicationIds: string[],
  ) {
    return await this.applicationsService.handleRejectApplications(
      applicationIds,
    );
  }

  @MessagePattern({ cmd: 'process-applications' })
  async handleProcessApplications(
    @Payload() processApplicationsDto: ProcessApplicationsDto,
  ) {
    return await this.applicationsService.handleProcessApplications(
      processApplicationsDto,
    );
  }
}
