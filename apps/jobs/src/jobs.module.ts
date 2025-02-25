import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { CommonModule } from '@app/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from 'apps/jobs/src/entities/companies.entity';
import { Job } from 'apps/jobs/src/entities/jobs.entity';
import { Requirement } from 'apps/jobs/src/entities/requirements.entity';
import { User } from 'apps/users/src/entities/users.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';

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
    ]),
    CommonModule,
    TypeOrmModule.forFeature([Company, Job, Requirement, User]),
  ],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
