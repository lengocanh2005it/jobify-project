import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ReportsService } from 'apps/api-gateway/src/reports/reports.service';
import { User } from 'apps/users/src/entities';
import { Request } from 'express';
import { Role } from 'libs/common/constants';
import { Roles } from 'libs/common/decorators';
import { GenerateReportDto } from 'libs/common/dtos';
import { JwtAuthGuard, RoleAuthGuard } from 'libs/common/guards';

@Controller('reports')
@UseGuards(JwtAuthGuard, RoleAuthGuard)
@Roles(Role.ADMIN)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @Throttle({ default: { limit: 3, ttl: 5000 } })
  async handleGenerateReport(
    @Body() generateReportDto: GenerateReportDto,
    @Req() request: Request,
  ) {
    const user = request.user as User;

    return this.reportsService.handleGenerateReport(generateReportDto, user);
  }
}
