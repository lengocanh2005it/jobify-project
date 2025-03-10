import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { User } from 'apps/users/src/entities';
import {
  ProcessApplicationsDto,
  SearchApplicationsDto,
} from 'libs/common/dtos';
import { CreateApplication, UpdateApplication } from 'libs/common/utils';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class ApplicationsService {
  constructor(
    @Inject('APPLICATIONS_SERVICE')
    private readonly rabbitMqApplicationClient: ClientProxy,
  ) {}

  public createApplication = async (createApplication: CreateApplication) => {
    return await lastValueFrom(
      this.rabbitMqApplicationClient.send(
        { cmd: 'create-application' },
        createApplication,
      ),
    );
  };

  public getApplications = async (
    user: User,
    searchApplicationsDto?: SearchApplicationsDto,
  ) => {
    return await lastValueFrom(
      this.rabbitMqApplicationClient.send(
        { cmd: 'get-applications' },
        {
          user,
          searchApplicationsDto,
        },
      ),
    );
  };

  public getApplication = async (applicationId: string, user: User) => {
    return await lastValueFrom(
      this.rabbitMqApplicationClient.send(
        { cmd: 'get-application' },
        {
          applicationId,
          user,
        },
      ),
    );
  };

  public deleteApplication = async (applicationId: string, user: User) => {
    return await lastValueFrom(
      this.rabbitMqApplicationClient.send(
        { cmd: 'delete-application' },
        { applicationId, user },
      ),
    );
  };

  public updateApplication = async (
    updateApplication: UpdateApplication,
    user: User,
  ) => {
    return await lastValueFrom(
      this.rabbitMqApplicationClient.send(
        { cmd: 'update-application' },
        { updateApplication, user },
      ),
    );
  };

  public handleProcessApplications = async (
    processApplicationsDto: ProcessApplicationsDto,
    user: User,
  ) => {
    return await lastValueFrom(
      this.rabbitMqApplicationClient.send(
        { cmd: 'process-applications' },
        { processApplicationsDto, user },
      ),
    );
  };
}
