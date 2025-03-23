import { CacheInterceptor } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminService } from 'apps/api-gateway/src/admin/admin.service';
import { API_TAGS, Role } from 'libs/common/constants';
import { Roles } from 'libs/common/decorators';
import { JwtAuthGuard, RoleAuthGuard } from 'libs/common/guards';

@Controller('admin')
@UseGuards(JwtAuthGuard, RoleAuthGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
@ApiForbiddenResponse({
  description: 'Only admin can have permission to access this route.',
})
@ApiTags(API_TAGS.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('statistics/users')
  @ApiOperation({
    summary: 'Retrieve user statistics',
    description:
      'Fetch statistical data about users, including total users, total candidates, total recruiters and other relevant metrics.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved user statistics.',
    schema: {
      example: {
        totalUsers: 30,
        candidates: 10,
        recruiters: 9,
        admins: 1,
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Only admin can have permission to access this route.',
  })
  @UseInterceptors(CacheInterceptor)
  async handleGetStatisticsOfUsers() {
    return this.adminService.handleGetStatisticsOfUsers();
  }

  @Get('statistics/jobs')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({
    summary: 'Retrieve job statistics',
    description:
      'Fetch statistical data about jobs, including total jobs, total opened jobs, total closed jobs and other relevant metrics.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved job statistics.',
    schema: {
      example: {
        totalJobs: 30,
        openedJobs: 10,
        closedJobs: 9,
        newJobsLast7Days: 5,
      },
    },
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description:
      'Number of past days to filter new jobs. If not provided, defaults to all jobs.',
    example: 7,
  })
  async handleGetStatisticsOfJobs(@Query('days') days?: string) {
    if (days && isNaN(parseInt(days)))
      throw new BadRequestException('Days must be a number.');

    return this.adminService.handleGetStatisticsOfJobs(
      days ? parseInt(days) : 7,
    );
  }

  @Get('statistics/applications')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({
    summary: 'Retrieve application statistics',
    description:
      'Fetch statistical data about applications, including total applications, total approved applications, total rejected applications and other relevant metrics.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved application statistics.',
    schema: {
      example: {
        totalApplications: 120,
        approvedApplications: 50,
        rejectedApplications: 20,
        pendingApplications: 20,
      },
    },
  })
  async handleGetStatisticsOfApplications() {
    return this.adminService.handleGetStatisticsOfApplications();
  }

  @Get('statistics/companies/jobs')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({
    summary: 'Retrieved jobs of company statistics.',
    description:
      'Fetch statistical data about jobs overview of companies, including total applications, total approved applications, total rejected applications and other relevant metrics.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved jobs overview of companies.',
    schema: {
      example: [
        {
          company: 'FPT Software',
          jobCount: 100,
        },
        {
          company: 'TMA Solution',
          jobCount: 200,
        },
      ],
    },
  })
  @ApiQuery({
    name: 'top',
    required: false,
    type: Number,
    description:
      'The number of companies with the most jobs, sorted in descending order. This value must be a number.',
  })
  @ApiQuery({
    name: 'details',
    required: false,
    type: String,
    description:
      'If set to "true", the response will include details of each job within the selected companies.',
  })
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
  @ApiOperation({
    summary: 'Retrieved revenue statistics.',
    description:
      'Fetch statistical data about revenue, including total revenue, revenueLast7Days, premiumUserCount and other relevant metrics.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved revenue statistics.',
    schema: {
      example: {
        totalRevenue: 4245.2,
        revenueLast7Days: 150.2,
        totalUsers: 50,
        premiumUserCount: 150,
        newPremiumUserCount: 50,
        conversionRate: 56.78,
        monthlyRevenue: {
          '2025-03': 145.2,
          '2025-04': 100.2,
        },
      },
    },
  })
  async handleGetStatisticsRevenue() {
    return this.adminService.handleGetStatisticsRevenue();
  }

  @Get('statistics/positions/salaries')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({
    summary: 'Retrieved salaries of positions statistics.',
    description:
      'Fetch statistical data about salaries of positions statistics, including positions, average salary of positions and other relevant metrics.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved salaries of positions statistics.',
    schema: {
      example: [
        {
          position: 'fullstack',
          average_salary: '2022.2 ($)',
        },
        {
          position: 'frontend',
          average_salary: '1524.2 ($)',
        },
        { position: 'backend', average_salary: '1200.45 ($)' },
      ],
    },
  })
  async handleGetStatisticsOfSalariesOfPositions() {
    return this.adminService.handleGetStatisticsSalariesOfPositions();
  }

  @Get('statistics/job-types')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({
    summary: 'Get job type distribution statistics.',
    description:
      'Retrieves the percentage distribution of job types (full-time, part-time, remote, freelance) in the system.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved of job type distribution statistics.',
    schema: {
      example: [
        {
          contract_type: 'Full-time',
          percentage: 70.56,
        },
        {
          contract_type: 'Part-time',
          percentage: 80.24,
        },
        {
          contract_type: 'Other',
          percentage: 2.56,
        },
      ],
    },
  })
  async handleGetStatisticsOfJobTypes() {
    return this.adminService.handleGetStatisticOfJobTypes();
  }
}
