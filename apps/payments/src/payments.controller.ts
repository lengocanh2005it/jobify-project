import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { PREMIUM_PRICE } from 'libs/common/constants';
import { PaymentsService } from './payments.service';
import { User } from 'apps/users/src/entities/users.entity';

@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @MessagePattern({ cmd: 'create-payment' })
  async handleCreateCheckoutSession(@Payload() user: User) {
    return await this.paymentsService.handleCreateCheckoutSession(
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

    return await this.paymentsService.handleStripeWebhook(sig, bodyBuffer);
  }

  @MessagePattern({ cmd: 'get-payments' })
  async handleGetPayments() {
    return await this.paymentsService.handleGetPayments();
  }
}
