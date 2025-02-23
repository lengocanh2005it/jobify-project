import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JobsController } from 'apps/api-gateway/src/jobs/jobs.controller';
import { JobsService } from 'apps/api-gateway/src/jobs/jobs.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'JOBS_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'jobs_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),
  ],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
