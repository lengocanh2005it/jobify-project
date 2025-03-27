import { Module } from '@nestjs/common';
import { SmsController } from 'apps/api-gateway/src/sms/sms.controller';
import { SmsService } from 'apps/api-gateway/src/sms/sms.service';

@Module({
  controllers: [SmsController],
  providers: [SmsService],
})
export class SmsModule {}
