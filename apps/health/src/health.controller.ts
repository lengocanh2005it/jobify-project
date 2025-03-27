import { Controller, UseInterceptors } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ServicesExceptionInterceptor } from 'libs/common/interceptors';
import { HealthService } from './health.service';

@Controller()
@UseInterceptors(ServicesExceptionInterceptor)
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @MessagePattern({ cmd: 'health-check' })
  async healthCheck() {
    return await this.healthService.handleHealthCheck();
  }
}
