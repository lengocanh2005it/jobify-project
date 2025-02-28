import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ProcessApplicationsDto } from 'libs/common/dtos/process-applications.dto';
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

  public getApplications = () => {
    return this.rabbitMqApplicationClient.send({ cmd: 'get-applications' }, {});
  };

  public getApplication = (applicationId: string, role: string) => {
    return this.rabbitMqApplicationClient.send(
      { cmd: 'get-application' },
      {
        applicationId,
        role,
      },
    );
  };

  public deleteApplication = (applicationId: string) => {
    return this.rabbitMqApplicationClient.send(
      { cmd: 'delete-application' },
      applicationId,
    );
  };

  public updateApplication = (updateApplication: UpdateApplication) => {
    return this.rabbitMqApplicationClient.send(
      { cmd: 'update-application' },
      updateApplication,
    );
  };

  public handleProcessApplications = (
    processApplicationsDto: ProcessApplicationsDto,
  ) => {
    return this.rabbitMqApplicationClient.send(
      { cmd: 'process-applications' },
      processApplicationsDto,
    );
  };

  public handleGetApplicationsOfCandidate = (candidateId: string) => {
    return this.rabbitMqApplicationClient.send(
      { cmd: 'get-applications-candidate' },
      candidateId,
    );
  };
}
