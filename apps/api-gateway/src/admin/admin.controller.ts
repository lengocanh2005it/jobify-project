import { CacheInterceptor } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AdminService } from 'apps/api-gateway/src/admin/admin.service';
import { Role } from 'libs/common/constants';
import { Roles } from 'libs/common/decorators';
import { JwtAuthGuard, RoleAuthGuard } from 'libs/common/guards';

@Controller('admin')
@UseGuards(JwtAuthGuard, RoleAuthGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('statistics/users')
  @UseInterceptors(CacheInterceptor)
  async handleGetStatisticsOfUsers() {
    return this.adminService.handleGetStatisticsOfUsers();
  }

  @Get('statistics/jobs')
  @UseInterceptors(CacheInterceptor)
  async handleGetStatisticsOfJobs(@Query('days') days?: string) {
    if (days && isNaN(parseInt(days)))
      throw new BadRequestException('Days must be a number.');

    return this.adminService.handleGetStatisticsOfJobs(
      days ? parseInt(days) : 7,
    );
  }

  @Get('statistics/applications')
  @UseInterceptors(CacheInterceptor)
  async handleGetStatisticsOfApplications() {
    return this.adminService.handleGetStatisticsOfApplications();
  }

  @Get('statistics/companies/jobs')
  @UseInterceptors(CacheInterceptor)
  async handleGetStatisticsJobsOfCompanies(
    @Query('top') top?: string,
    @Query('details') details?: string,
  ) {
    if (top && isNaN(parseInt(top)))
      throw new BadRequestException('Top value must be a number.');

    const isDetailed = details === 'true';

    return this.adminService.handleGetStatisticsJobsOfCompanies(
      top,
      isDetailed,
    );
  }

  @Get('statistics/revenue')
  @UseInterceptors(CacheInterceptor)
  async handleGetStatisticsRevenue() {
    return this.adminService.handleGetStatisticsRevenue();
  }

  @Get('statistics/positions/salaries')
  @UseInterceptors(CacheInterceptor)
  async handleGetStatisticsOfSalariesOfPositions() {
    return this.adminService.handleGetStatisticsSalariesOfPositions();
  }

  @Get('statistics/job-types')
  @UseInterceptors(CacheInterceptor)
  async handleGetStatisticsOfJobTypes() {
    return this.adminService.handleGetStatisticOfJobTypes();
  }
}
