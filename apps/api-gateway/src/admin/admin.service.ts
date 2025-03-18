import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class AdminService {
  constructor(
    @Inject('ADMIN_SERVICE') private readonly rabbitMqAdminClient: ClientProxy,
  ) {}

  public handleGetStatisticsOfUsers = async () => {
    return await lastValueFrom(
      this.rabbitMqAdminClient.send({ cmd: 'get-statistics-users' }, {}),
    );
  };

  public handleGetStatisticsOfJobs = async (days?: number) => {
    return await lastValueFrom(
      this.rabbitMqAdminClient.send({ cmd: 'get-statistics-jobs' }, days),
    );
  };

  public handleGetStatisticsOfApplications = async () => {
    return await lastValueFrom(
      this.rabbitMqAdminClient.send({ cmd: 'get-statistics-applications' }, {}),
    );
  };

  public handleGetStatisticsJobsOfCompanies = async (
    top?: string,
    isDetailed?: boolean,
  ) => {
    return await lastValueFrom(
      this.rabbitMqAdminClient.send(
        { cmd: 'get-statistics-jobs-companies' },
        top ? { top: parseInt(top), isDetailed } : { isDetailed },
      ),
    );
  };

  public handleGetStatisticsRevenue = async () => {
    return await lastValueFrom(
      this.rabbitMqAdminClient.send({ cmd: 'get-statistics-revenue' }, {}),
    );
  };

  public handleGetStatisticsSalariesOfPositions = async () => {
    return await lastValueFrom(
      this.rabbitMqAdminClient.send(
        { cmd: 'get-statistics-salaries-positions' },
        {},
      ),
    );
  };

  public handleGetStatisticOfJobTypes = async () => {
    return await lastValueFrom(
      this.rabbitMqAdminClient.send({ cmd: 'get-statistics-job-types' }, {}),
    );
  };
}
