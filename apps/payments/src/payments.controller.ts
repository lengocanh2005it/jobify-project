import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PREMIUM_PRICE } from 'libs/common/constants';
import { PaymentsService } from './payments.service';

@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @MessagePattern({ cmd: 'create-payment' })
  async handleCreateCheckoutSession(@Payload() userId: string) {
    return await this.paymentsService.handleCreateCheckoutSession(
      PREMIUM_PRICE,
      'usd',
      userId,
    );
  }

  @MessagePattern({ cmd: 'stripe-webhooks' })
  handleStripeWebhooks(
    @Payload('sig') sig: string,
    @Payload('body') body: string,
  ) {
    const bodyBuffer = Buffer.from(body, 'utf-8');

    return this.paymentsService.handleStripeWebhook(sig, bodyBuffer);
  }
}
