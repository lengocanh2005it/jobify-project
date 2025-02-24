import { Body, Controller } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateApplicationDto } from 'libs/common/dtos/create-application.dto';
import { UpdateApplicationDto } from 'libs/common/dtos/update-application.dto';

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
  ) {}
}
