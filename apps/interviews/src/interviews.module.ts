import { CommonModule } from '@app/common';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Interview } from 'apps/interviews/src/entities/interviews.entity';
import { InterviewsController } from './interviews.controller';
import { InterviewsService } from './interviews.service';
import { ServicesExceptionInterceptor } from 'libs/common/interceptors';

@Module({
  imports: [
    TypeOrmModule.forFeature([Interview]),
    CommonModule,
    ClientsModule.register([
      {
        name: 'USERS_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'users_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
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
      {
        name: 'NOTIFICATIONS_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'notifications_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),
  ],
  controllers: [InterviewsController],
  providers: [
    InterviewsService,
    {
      provide: 'SERVICE_NAME',
      useValue: 'Interviews Service',
    },
    ServicesExceptionInterceptor,
  ],
})
export class InterviewsModule {}
