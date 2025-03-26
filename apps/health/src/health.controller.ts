import { Controller } from '@nestjs/common';
import { HealthService } from './health.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @MessagePattern({ cmd: 'health-check' })
  async healthCheck() {
    return await this.healthService.handleHealthCheck();
  }
}
