import { CommonModule } from '@app/common';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { EmailProcessor } from 'apps/emails/src/emails.processor';
import { EmailsProducer } from 'apps/emails/src/emails.producer';
import { RedisService } from 'apps/redis/src/redis.service';
import { ServicesExceptionInterceptor } from 'libs/common/interceptors';
import { EmailsController } from './emails.controller';
import { EmailsService } from './emails.service';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    CommonModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('redis.host', 'localhost'),
          port: configService.get<number>('redis.port', 6379),
        },
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
