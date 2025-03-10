import { CommonModule } from '@app/common';
import { Module } from '@nestjs/common';
import { ServicesExceptionInterceptor } from 'libs/common/interceptors';
import { RedisController } from './redis.controller';
import { RedisService } from './redis.service';

@Module({
  imports: [CommonModule],
  controllers: [RedisController],
  providers: [
    RedisService,
    {
      provide: 'SERVICE_NAME',
      useValue: 'Redis Service',
    },
    ServicesExceptionInterceptor,
  ],
})
export class RedisModule {}
