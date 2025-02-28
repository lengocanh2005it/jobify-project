import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApproveApplicationsDto } from 'libs/common/dtos/approve-applications.dto';
import { ProcessApplicationsDto } from 'libs/common/dtos/process-applications.dto';
import { RejectApplicationsDto } from 'libs/common/dtos/reject-applications.dto';
import { UpdateApplicationDto } from 'libs/common/dtos/update-application.dto';
import { CreateApplication } from 'libs/common/utils/types';

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

  public updateApplication = (
    applicationId: string,
    updateApplicationDto: UpdateApplicationDto,
  ) => {
    return this.rabbitMqApplicationClient.send(
      { cmd: 'update-application' },
      { updateApplicationDto, applicationId },
    );
  };

  public handleApproveApplications = (
    approveApplicationsDto: ApproveApplicationsDto,
  ) => {
    return this.rabbitMqApplicationClient.send(
      { cmd: 'approve-applications' },
      approveApplicationsDto,
    );
  };

  public handleRejectApplications = (
    rejectApplicationsDto: RejectApplicationsDto,
  ) => {
    return this.rabbitMqApplicationClient.send(
      { cmd: 'reject-applications' },
      rejectApplicationsDto,
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
}
