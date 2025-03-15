import { Controller, UseInterceptors } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { User } from 'apps/users/src/entities';
import { PREMIUM_PRICE } from 'libs/common/constants';
import { ServicesExceptionInterceptor } from 'libs/common/interceptors';
import { PaymentsService } from './payments.service';

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
    @Payload('body') body: string,
  ) {
    const bodyBuffer = Buffer.from(body, 'utf-8');

    return this.paymentsService.handleStripeWebhook(sig, bodyBuffer);
  }

  @MessagePattern({ cmd: 'get-payments' })
  async handleGetPayments() {
    return this.paymentsService.handleGetPayments();
  }

  @MessagePattern({ cmd: 'create-vnpay-payment' })
  handleCreateVnPayPayment(
    @Payload('amount') amount: number,
    @Payload('ip') ip: string,
  ) {
    return this.paymentsService.handleCreatePaymentUrl(amount, ip);
  }
}
