import { CommonModule } from '@app/common';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EmailProcessor } from 'apps/emails/src/emails.processor';
import { EmailsProducer } from 'apps/emails/src/emails.producer';
import { ServicesExceptionInterceptor } from 'libs/common/interceptors';
import { EmailsController } from './emails.controller';
import { EmailsService } from './emails.service';
import { RedisService } from 'apps/redis/src/redis.service';
import { RedisModule } from 'apps/redis/src/redis.module';

@Module({
  imports: [
    CommonModule,
    ClientsModule.register([
      {
        name: 'REDIS_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'redis_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),
    BullModule.forRootAsync({
      inject: [RedisService],
      useFactory: (redisService: RedisService) => ({
        connection: redisService.getRedisStore(),
      }),
    }),
    BullModule.registerQueue({
      name: 'emails-queue',
    }),
  ],
  controllers: [EmailsController],
  providers: [
    EmailsService,
    {
      provide: 'SERVICE_NAME',
      useValue: 'Uploads Service',
    },
    ServicesExceptionInterceptor,
    EmailsProducer,
    EmailProcessor,
  ],
})
export class EmailsModule {}
