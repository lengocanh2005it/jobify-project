import { CommonModule } from '@app/common';
import { Module } from '@nestjs/common';
import { UsersModule } from 'apps/users/src/users.module';
import { UsersService } from 'apps/users/src/users.service';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { JobsModule } from 'apps/jobs/src/jobs.module';
import { JobsService } from 'apps/jobs/src/jobs.service';
import { ApplicationsModule } from 'apps/applications/src/applications.module';
import { ApplicationsService } from 'apps/applications/src/applications.service';
import { PaymentsModule } from 'apps/payments/src/payments.module';
import { PaymentsService } from 'apps/payments/src/payments.service';

@Module({
  imports: [
    CommonModule,
    UsersModule,
    JobsModule,
    ApplicationsModule,
    PaymentsModule,
  ],
  controllers: [AdminController],
  providers: [
    AdminService,
    UsersService,
    JobsService,
    ApplicationsService,
    PaymentsService,
  ],
})
export class AdminModule {}
