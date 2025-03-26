import { Controller, Get, UseGuards } from '@nestjs/common';
import { HealthCheck } from '@nestjs/terminus';
import { HealthService } from 'apps/api-gateway/src/health/health.service';
import { Role } from 'libs/common/constants';
import { ResponseMessage, Roles } from 'libs/common/decorators';
import { JwtAuthGuard, RoleAuthGuard } from 'libs/common/guards';

@Controller('health')
@UseGuards(JwtAuthGuard, RoleAuthGuard)
@Roles(Role.ADMIN)
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @HealthCheck({ noCache: true, swaggerDocumentation: true })
  @ResponseMessage('Health check completed successfully.')
  async handleHealthCheck() {
    return this.healthService.handleCheckHealthy();
  }
}
