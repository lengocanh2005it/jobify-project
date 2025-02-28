import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { UploadsController } from 'apps/api-gateway/src/uploads/uploads.controller';
import { UploadsService } from 'apps/api-gateway/src/uploads/uploads.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'UPLOADS_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'uploads_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),
  ],
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}
