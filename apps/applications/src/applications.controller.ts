import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateApplicationDto } from 'libs/common/dtos/create-application.dto';
import { UpdateApplicationDto } from 'libs/common/dtos/update-application.dto';
import { ApplicationsService } from './applications.service';

@Controller()
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @MessagePattern({ cmd: 'create-application' })
  async createApplication(
    @Payload('createApplicationDto') createApplicationDto: CreateApplicationDto,
    @Payload('userId') userId: string,
  ) {
    return await this.applicationsService.handleCreateApplication(
      createApplicationDto,
      userId,
    );
  }

  @MessagePattern({ cmd: 'get-applications' })
  async getApplications() {
    return this.applicationsService.handleGetApplications();
  }

  @MessagePattern({ cmd: 'get-application' })
  async getApplication(@Payload() applicationId: string) {
    return await this.applicationsService.handleGetApplication(applicationId);
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
}
