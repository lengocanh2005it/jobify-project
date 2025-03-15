import { Controller, UseInterceptors } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { User } from 'apps/users/src/entities';
import {
  ProcessApplicationsDto,
  SearchApplicationsDto,
} from 'libs/common/dtos';
import { ServicesExceptionInterceptor } from 'libs/common/interceptors';
import { CreateApplication, UpdateApplication } from 'libs/common/utils';
import { ApplicationsService } from './applications.service';

@Controller()
@UseInterceptors(ServicesExceptionInterceptor)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @MessagePattern({ cmd: 'create-application' })
  async createApplication(@Payload() createApplication: CreateApplication) {
    return this.applicationsService.handleCreateApplication(createApplication);
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
    return this.applicationsService.handleGetApplication(applicationId, user);
  }

  @MessagePattern({ cmd: 'delete-application' })
  async deleteApplication(
    @Payload('applicationId') applicationId: string,
    user: User,
  ) {
    return this.applicationsService.handleDeleteApplication(
      applicationId,
      user,
    );
  }

  @MessagePattern({ cmd: 'update-application' })
  async updateApplication(
    @Payload('updateApplication') updateApplication: UpdateApplication,
    @Payload('user') user: User,
  ) {
    return this.applicationsService.handleUpdateApplication(
      updateApplication,
      user,
    );
  }

  @MessagePattern({ cmd: 'process-applications' })
  async handleProcessApplications(
    @Payload('processApplicationsDto')
    processApplicationsDto: ProcessApplicationsDto,
    @Payload('user') user: User,
  ) {
    return this.applicationsService.handleProcessApplications(
      processApplicationsDto,
      user,
    );
  }

  @MessagePattern({ cmd: 'delete-user-from-application' })
  async handleDeleteUserFromApplication(
    @Payload('userId') userId: string,
    @Payload('applicationId') applicationId: string,
  ) {
    return this.applicationsService.handleDeleteUserFromApplication(
      userId,
      applicationId,
    );
  }
}
