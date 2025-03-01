import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { User } from 'apps/users/src/entities/users.entity';
import { ProcessApplicationsDto } from 'libs/common/dtos/process-applications.dto';
import { SearchApplicationsDto } from 'libs/common/dtos/search-applications.dto';
import { CreateApplication, UpdateApplication } from 'libs/common/utils/types';

@Injectable()
export class ApplicationsService {
  constructor(
    @Inject('APPLICATIONS_SERVICE')
    private readonly rabbitMqApplicationClient: ClientProxy,
  ) {}

  public createApplication = (createApplication: CreateApplication) => {
    return this.rabbitMqApplicationClient.send(
      { cmd: 'create-application' },
      createApplication,
    );
  };

  public getApplications = (
    user: User,
    searchApplicationsDto?: SearchApplicationsDto,
  ) => {
    return this.rabbitMqApplicationClient.send(
      { cmd: 'get-applications' },
      {
        user,
        searchApplicationsDto,
      },
    );
  };

  public getApplication = (applicationId: string, user: User) => {
    return this.rabbitMqApplicationClient.send(
      { cmd: 'get-application' },
      {
        applicationId,
        user,
      },
    );
  };

  public deleteApplication = (applicationId: string, user: User) => {
    return this.rabbitMqApplicationClient.send(
      { cmd: 'delete-application' },
      { applicationId, user },
    );
  };

  public updateApplication = (
    updateApplication: UpdateApplication,
    user: User,
  ) => {
    return this.rabbitMqApplicationClient.send(
      { cmd: 'update-application' },
      { updateApplication, user },
    );
  };

  public handleProcessApplications = (
    processApplicationsDto: ProcessApplicationsDto,
    user: User,
  ) => {
    return this.rabbitMqApplicationClient.send(
      { cmd: 'process-applications' },
      { processApplicationsDto, user },
    );
  };
}
