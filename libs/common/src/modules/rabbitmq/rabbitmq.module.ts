import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SERVICES } from 'libs/common/constants';

@Module({
  imports: [
    ClientsModule.registerAsync(
      SERVICES.map(({ serviceName, queueName }) => ({
        name: serviceName,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('rabbitmq.url', '')],
            queue: queueName,
            queueOptions: {
              durable: false,
            },
          },
        }),
      })),
    ),
  ],
  exports: [ClientsModule],
})
export class RabbitMqModule {}
