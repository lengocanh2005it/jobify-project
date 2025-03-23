import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class AdminService {
  constructor(
    @Inject('USERS_SERVICE') private readonly rabbitMqUserClient: ClientProxy,
    @Inject('JOBS_SERVICE') private readonly rabbitMqJobClient: ClientProxy,
    @Inject('APPLICATIONS_SERVICE')
    private readonly rabbitMqApplicationClient: ClientProxy,
    @Inject('PAYMENTS_SERVICE')
    private readonly rabbitMqPaymentClient: ClientProxy,
  ) {}

  public handleGetStatisticsOfUsers = async () => {
    return lastValueFrom(
      this.rabbitMqUserClient.send({ cmd: 'calculate-statistics-users' }, {}),
    );
  };

  public handleGetStatisticsOfJobs = async (days?: number) => {
    return lastValueFrom(
      this.rabbitMqJobClient.send({ cmd: 'calculate-statistics-jobs' }, days),
    );
  };

  public handleGetStatisticsOfApplications = async () => {
    return lastValueFrom(
      this.rabbitMqApplicationClient.send(
        { cmd: 'calculate-statistics-applications' },
        {},
      ),
    );
  };

  public handleGetStatisticsJobsOfCompanies = async (
    top?: number,
    isDetailed?: boolean,
  ) => {
    return lastValueFrom(
      this.rabbitMqJobClient.send(
        { cmd: 'calculate-jobs-companies' },
        { top, isDetailed },
      ),
    );
  };

  public handleGetStatisticsRevenue = async () => {
    return lastValueFrom(
      this.rabbitMqPaymentClient.send(
        { cmd: 'calculate-revenue-statistics' },
        {},
      ),
    );
  };

  public handleGetStatisticsSalariesOfPositions = async () => {
    return lastValueFrom(
      this.rabbitMqJobClient.send(
        {
          cmd: 'calculate-statistics-salaries-positions',
        },
        {},
      ),
    );
  };

  public handleGetStatisticsOfJobTypes = async () => {
    return lastValueFrom(
      this.rabbitMqJobClient.send(
        { cmd: 'calculate-statistics-job-types' },
        {},
      ),
    );
  };
}
