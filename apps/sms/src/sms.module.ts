import { Module } from '@nestjs/common';
import { SmsController } from './sms.controller';
import { SmsService } from './sms.service';
import { BullModule } from '@nestjs/bullmq';
import { ServicesExceptionInterceptor } from 'libs/common/interceptors';
import { CommonModule } from '@app/common';
import { SmsProducer } from 'apps/sms/src/producers';
import { SmsProcessor } from 'apps/sms/src/processors';

@Module({
  imports: [
    CommonModule,
    BullModule.registerQueue({
      name: 'sms-queue',
    }),
  ],
  controllers: [SmsController],
  providers: [
    SmsService,
    {
      provide: 'SERVICE_NAME',
      useValue: 'SMS Service',
    },
    ServicesExceptionInterceptor,
    SmsProducer,
    SmsProcessor,
  ],
})
export class SmsModule {}
