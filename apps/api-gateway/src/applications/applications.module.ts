import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ApplicationsController } from 'apps/api-gateway/src/applications/applications.controller';
import { ApplicationsService } from 'apps/api-gateway/src/applications/applications.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'APPLICATIONS_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'applications_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
})
export class ApplicationsModule {}
