import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ReportsService } from 'apps/api-gateway/src/reports/reports.service';
import { User } from 'apps/users/src/entities';
import { Request } from 'express';
import { API_TAGS, Role } from 'libs/common/constants';
import { Roles } from 'libs/common/decorators';
import { GenerateReportDto } from 'libs/common/dtos';
import { JwtAuthGuard, RoleAuthGuard } from 'libs/common/guards';
import { RBAcGuard, RBAcPermissions } from 'nestjs-rbac';

@Controller('reports')
@UseGuards(JwtAuthGuard, RoleAuthGuard, RBAcGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
@RBAcPermissions('admin@view_reports')
@ApiTags(API_TAGS.REPORTS)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @Throttle({ default: { limit: 3, ttl: 5000 } })
  @ApiOperation({
    summary: 'Generate Report',
    description: 'Generate Report for Admin.',
  })
  @ApiBody({
    type: GenerateReportDto,
    description: 'Given data used for generate report.',
  })
  async handleGenerateReport(
    @Body() generateReportDto: GenerateReportDto,
    @Req() request: Request,
  ) {
    const user = request.user as User;

    return this.reportsService.handleGenerateReport(generateReportDto, user);
  }
}
