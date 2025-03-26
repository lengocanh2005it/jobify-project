import { Controller, UseInterceptors } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { User } from 'apps/users/src/entities';
import { PREMIUM_PRICE } from 'libs/common/constants';
import { ServicesExceptionInterceptor } from 'libs/common/interceptors';
import { PaymentsService } from './payments.service';
import { SearchTransactionsDto } from 'libs/common/dtos';

@Controller()
@UseInterceptors(ServicesExceptionInterceptor)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @MessagePattern({ cmd: 'create-payment' })
  async handleCreateCheckoutSession(@Payload() user: User) {
    return this.paymentsService.handleCreateCheckoutSession(
      PREMIUM_PRICE,
      'usd',
      user,
    );
  }

  @EventPattern({ cmd: 'stripe-webhooks' })
  async handleStripeWebhooks(
    @Payload('sig') sig: string,
    @Payload('body') body: Buffer,
  ) {
    return this.paymentsService.handleStripeWebhook(sig, Buffer.from(body));
  }

  @MessagePattern({ cmd: 'get-payments' })
  async handleGetPayments(
    @Payload() searchTransactionsDto?: SearchTransactionsDto,
  ) {
    return this.paymentsService.handleGetPayments(searchTransactionsDto);
  }

  @MessagePattern({ cmd: 'calculate-revenue-statistics' })
  async handleCalculateStatisticsOfRevenue() {
    return this.paymentsService.handleCalculateStatisticsRevenue();
  }
}
