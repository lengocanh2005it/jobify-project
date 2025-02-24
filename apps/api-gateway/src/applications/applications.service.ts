import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateApplicationDto } from 'libs/common/dtos/create-application.dto';
import { UpdateApplicationDto } from 'libs/common/dtos/update-application.dto';

@Injectable()
export class ApplicationsService {
  constructor(
    @Inject('APPLICATIONS_SERVICE')
    private readonly rabbitMqApplicationClient: ClientProxy,
  ) {}

  public createApplication = (
    createApplicationDto: CreateApplicationDto,
    userId: string,
  ) => {
    return this.rabbitMqApplicationClient.send(
      { cmd: 'create-application' },
      { createApplicationDto, userId },
    );
  };

  public getApplications = () => {
    return this.rabbitMqApplicationClient.send({ cmd: 'get-applications' }, {});
  };

  public getApplication = (applicationId: string) => {
    return this.rabbitMqApplicationClient.send(
      { cmd: 'get-application' },
      applicationId,
    );
  };

  public deleteApplication = (applicationId: string) => {
    return this.rabbitMqApplicationClient.send(
      { cmd: 'delete-application' },
      applicationId,
    );
  };

  public updateApplication = (
    applicationId: string,
    updateApplicationDto: UpdateApplicationDto,
  ) => {
    return this.rabbitMqApplicationClient.send(
      { cmd: 'update-application' },
      { updateApplicationDto, applicationId },
    );
  };
}
