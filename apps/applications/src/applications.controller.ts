import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { User } from 'apps/users/src/entities/users.entity';
import { ProcessApplicationsDto } from 'libs/common/dtos/process-applications.dto';
import { SearchApplicationsDto } from 'libs/common/dtos/search-applications.dto';
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
  async getApplications(
    @Payload('user') user: User,
    @Payload('searchApplicationsDto') filters?: SearchApplicationsDto,
  ) {
    return this.applicationsService.handleGetApplications(user, filters);
  }

  @MessagePattern({ cmd: 'get-application' })
  async getApplication(
    @Payload('applicationId') applicationId: string,
    @Payload('user') user: User,
  ) {
    return await this.applicationsService.handleGetApplication(
      applicationId,
      user,
    );
  }

  @MessagePattern({ cmd: 'delete-application' })
  async deleteApplication(
    @Payload('applicationId') applicationId: string,
    user: User,
  ) {
    return await this.applicationsService.handleDeleteApplication(
      applicationId,
      user,
    );
  }

  @MessagePattern({ cmd: 'update-application' })
  async updateApplication(
    @Payload('updateApplication') updateApplication: UpdateApplication,
    @Payload('user') user: User,
  ) {
    return await this.applicationsService.handleUpdateApplication(
      updateApplication,
      user,
    );
  }

  @MessagePattern({ cmd: 'process-applications' })
  async handleProcessApplications(
    @Payload('processApplicationDto')
    processApplicationsDto: ProcessApplicationsDto,
    @Payload('user') user: User,
  ) {
    return await this.applicationsService.handleProcessApplications(
      processApplicationsDto,
      user,
    );
  }
}
