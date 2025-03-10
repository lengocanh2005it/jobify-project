import { CommonModule } from '@app/common';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company, Job, Requirement, SavedJob } from 'apps/jobs/src/entities';
import { Notification } from 'apps/notifications/src/entities';
import { User } from 'apps/users/src/entities';
import { ServicesExceptionInterceptor } from 'libs/common/interceptors';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [
    ClientsModule.register([
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
    ]),
    CommonModule,
    TypeOrmModule.forFeature([
      Company,
      Job,
      Requirement,
      User,
      Notification,
      SavedJob,
    ]),
  ],
  controllers: [JobsController],
  providers: [
    JobsService,
    {
      provide: 'SERVICE_NAME',
      useValue: 'Jobs Service',
    },
    ServicesExceptionInterceptor,
  ],
})
export class JobsModule {}
