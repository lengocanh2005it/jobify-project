import { Injectable } from '@nestjs/common';
import { ApplicationsService } from 'apps/applications/src/applications.service';
import { JobsService } from 'apps/jobs/src/jobs.service';
import { PaymentsService } from 'apps/payments/src/payments.service';
import { UsersService } from 'apps/users/src/users.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jobsService: JobsService,
    private readonly applicationsService: ApplicationsService,
    private readonly paymentsService: PaymentsService,
  ) {}

  public handleGetStatisticsOfUsers = async () => {
    return this.usersService.handleCalculateStatisticsOfUsers();
  };

  public handleGetStatisticsOfJobs = async (days?: number) => {
    return this.jobsService.handleCalculateStatisticsOfJobs(days);
  };

  public handleGetStatisticsOfApplications = async () => {
    return this.applicationsService.handleCalculateStatisticsOfApplications();
  };

  public handleGetStatisticsJobsOfCompanies = async (
    top?: number,
    isDetailed?: boolean,
  ) => {
    return this.jobsService.handleGetStatisticsJobsOfCompanies(top, isDetailed);
  };

  public handleGetStatisticsRevenue = async () => {
    return this.paymentsService.handleCalculateStatisticsRevenue();
  };

  public handleGetStatisticsSalariesOfPositions = async () => {
    return this.jobsService.handleGetStatisticsSalariesOfPositions();
  };

  public handleGetStatisticsOfJobTypes = async () => {
    return this.jobsService.handleGetStatisticsOfJobTypes();
  };
}
