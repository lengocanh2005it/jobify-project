import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class PaymentsService {
  constructor(
    @Inject('PAYMENTS_SERVICE')
    private readonly rabbitMqPaymentClient: ClientProxy,
  ) {}

  public handleCreatePayment = (userId: string) => {
    return this.rabbitMqPaymentClient.send({ cmd: 'create-payment' }, userId);
  };

  public handleStripeWebhooks = (sig: string, body: string) => {
    const rawBody = Buffer.isBuffer(body)
      ? body.toString()
      : JSON.stringify(body);

    return this.rabbitMqPaymentClient.send(
      { cmd: 'stripe-webhooks' },
      { sig, body: rawBody },
    );
  };
}
