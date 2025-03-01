import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { InterviewsController } from 'apps/api-gateway/src/interviews/interviews.controller';
import { InterviewsService } from 'apps/api-gateway/src/interviews/interviews.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'INTERVIEWS_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'interviews_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),
  ],
  controllers: [InterviewsController],
  providers: [InterviewsService],
})
export class InterviewsModule {}
