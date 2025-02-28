import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProcessApplicationsDto } from 'libs/common/dtos/process-applications.dto';
import { CreateApplication, UpdateApplication } from 'libs/common/utils/types';
import { ApplicationsService } from './applications.service';

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
  async updateApplication(@Payload() updateApplication: UpdateApplication) {
    return await this.applicationsService.handleUpdateApplication(
      updateApplication,
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

  @MessagePattern({ cmd: 'get-applications-candidate' })
  async handleGetApplicationsOfCandidate(@Payload() candidateId: string) {
    return await this.applicationsService.handleGetApplicationsOfCandidate(
      candidateId,
    );
  }
}
