import { CommonModule } from '@app/common';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { EmailProcessor } from 'apps/emails/src/processors';
import { EmailsProducer } from 'apps/emails/src/producers';
import { ServicesExceptionInterceptor } from 'libs/common/interceptors';
import { EmailsController } from './emails.controller';
import { EmailsService } from './emails.service';

@Module({
  imports: [
    CommonModule,
    BullModule.registerQueue({
      name: 'emails-queue',
    }),
  ],
  controllers: [EmailsController],
  providers: [
    EmailsService,
    {
      provide: 'SERVICE_NAME',
      useValue: 'Uploads Service',
    },
    ServicesExceptionInterceptor,
    EmailsProducer,
    EmailProcessor,
  ],
})
export class EmailsModule {}
