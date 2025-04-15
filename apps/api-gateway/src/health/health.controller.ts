import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthCheck } from '@nestjs/terminus';
import { HealthService } from 'apps/api-gateway/src/health/health.service';
import { Role } from 'libs/common/constants';
import { ResponseMessage, Roles } from 'libs/common/decorators';
import { JwtAuthGuard, RoleAuthGuard } from 'libs/common/guards';
import { RBAcGuard, RBAcPermissions } from 'nestjs-rbac';

@Controller('health')
@UseGuards(JwtAuthGuard, RoleAuthGuard, RBAcGuard)
@Roles(Role.ADMIN)
@RBAcPermissions('admin@check_health')
@ApiBearerAuth()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Health Check',
    description:
      'This endpoint checks the health status of the application, including database connectivity and other essential services.',
  })
  @ApiResponse({
    status: 200,
    description: 'Health check completed successfully.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'ok',
              description: 'Overall system health status.',
            },
            checks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'database' },
                  status: { type: 'string', example: 'up' },
                },
              },
              description: 'Detailed health status of various components.',
            },
          },
        },
      },
    },
  })
  @HealthCheck({ noCache: true, swaggerDocumentation: true })
  @ResponseMessage('Health check completed successfully.')
  async handleHealthCheck() {
    return this.healthService.handleCheckHealthy();
  }
}
