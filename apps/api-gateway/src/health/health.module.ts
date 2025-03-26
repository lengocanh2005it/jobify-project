import { Module } from '@nestjs/common';
import { HealthController } from 'apps/api-gateway/src/health/health.controller';
import { HealthService } from 'apps/api-gateway/src/health/health.service';

@Module({
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
