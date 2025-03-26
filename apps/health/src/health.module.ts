import { CommonModule } from '@app/common';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [CommonModule, TerminusModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
