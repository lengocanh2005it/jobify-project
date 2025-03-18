import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AdminService } from './admin.service';

@Controller()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @MessagePattern({ cmd: 'get-statistics-users' })
  async handleGetStatisticsOfUsers() {
    return this.adminService.handleGetStatisticsOfUsers();
  }

  @MessagePattern({ cmd: 'get-statistics-jobs' })
  async handleGetStatisticsOfJobs(@Payload() days?: number) {
    return this.adminService.handleGetStatisticsOfJobs(days);
  }

  @MessagePattern({ cmd: 'get-statistics-applications' })
  async handleGetStatisticsOfApplications() {
    return this.adminService.handleGetStatisticsOfApplications();
  }

  @MessagePattern({ cmd: 'get-statistics-jobs-companies' })
  async handleGetStatisticsJobsOfCompanies(
    @Payload('top') top?: number,
    @Payload('isDetailed') isDetailed?: boolean,
  ) {
    return this.adminService.handleGetStatisticsJobsOfCompanies(
      top,
      isDetailed,
    );
  }

  @MessagePattern({ cmd: 'get-statistics-revenue' })
  async handleGetStatisticsRevenue() {
    return this.adminService.handleGetStatisticsRevenue();
  }

  @MessagePattern({ cmd: 'get-statistics-salaries-positions' })
  async handleGetStatisticsSalariesOfPositions() {
    return this.adminService.handleGetStatisticsSalariesOfPositions();
  }

  @MessagePattern({ cmd: 'get-statistics-job-types' })
  async handleGetStatisticsOfJobTypes() {
    return this.adminService.handleGetStatisticsOfJobTypes();
  }
}
