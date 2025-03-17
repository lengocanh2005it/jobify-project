import { Module } from '@nestjs/common';
import { PaymentsController } from 'apps/api-gateway/src/payments/payments.controller';
import { PaymentsService } from 'apps/api-gateway/src/payments/payments.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
