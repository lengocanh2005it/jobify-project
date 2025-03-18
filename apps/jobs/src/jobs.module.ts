import { CommonModule } from '@app/common';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company, Job, Requirement, SavedJob } from 'apps/jobs/src/entities';
import { Notification } from 'apps/notifications/src/entities';
import { User } from 'apps/users/src/entities';
import { ServicesExceptionInterceptor } from 'libs/common/interceptors';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [
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
  exports: [JobsService],
})
export class JobsModule {}
