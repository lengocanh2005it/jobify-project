import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { User } from 'apps/users/src/entities/users.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @Inject('PAYMENTS_SERVICE')
    private readonly rabbitMqPaymentClient: ClientProxy,
  ) {}

  public handleCreatePayment = (user: User) => {
    return this.rabbitMqPaymentClient.send({ cmd: 'create-payment' }, user);
  };

  public handleStripeWebhooks = (sig: string, body: string) => {
    const rawBody = Buffer.isBuffer(body)
      ? body.toString()
      : JSON.stringify(body);

    return this.rabbitMqPaymentClient.emit(
      { cmd: 'stripe-webhooks' },
      { sig, body: rawBody },
    );
  };

  public handleGetPayments = () => {
    return this.rabbitMqPaymentClient.send({ cmd: 'get-payments' }, {});
  };
}
