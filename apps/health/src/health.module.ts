import { CommonModule } from '@app/common';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { ServicesExceptionInterceptor } from 'libs/common/interceptors';

@Module({
  imports: [CommonModule, TerminusModule],
  controllers: [HealthController],
  providers: [
    HealthService,
    {
      provide: 'SERVICE_NAME',
      useValue: 'Health Service',
    },
    ServicesExceptionInterceptor,
  ],
})
export class HealthModule {}
